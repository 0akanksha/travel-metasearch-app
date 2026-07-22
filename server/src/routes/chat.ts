import { Router } from "express";
import type { ChatCompletionMessageParam, ChatCompletionMessageToolCall } from "groq-sdk/resources/chat/completions";
import { groq, GROQ_MODEL } from "../lib/groq.js";
import { chatTools, executeTool } from "../lib/chatTools.js";

export const chatRouter = Router();

const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_TOOL_TURNS = 6;

// A function, not a constant — the model has no other way to know today's
// date, and without it relative dates ("next Friday", "Aug 15-17" with no
// year) resolve unpredictably (observed: silently landing in the past).
function buildSystemPrompt(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `You are FareCompass's 24/7 virtual travel assistant, embedded as a chat widget on the site.

Today's date is ${today}. Resolve any relative or year-less date the traveler gives ("next Friday", "Aug 15-17", "tomorrow") against this before calling a tool — always pass full YYYY-MM-DD dates, and never a date before today.

FareCompass has three verticals with different booking models — be precise about which applies:
- Flights: metasearch only. FareCompass never sells the ticket — search_flights results link to the airline's own site to complete booking. When you find a flight the user wants, include a link in the exact form [Continue to this flight](/redirect/OFFER_ID), substituting the offer's real id.
- Hotels: real bookings, made directly on FareCompass. search_hotels results should include a link in the exact form [View this hotel](/hotels/HOTEL_ID?searchId=SEARCH_ID), substituting the real hotel id and the searchId the tool returned — the traveler finishes booking there with their name and email.
- Cabs: real bookings, made directly on FareCompass. estimate_cab_fare returns a bookingLink field — pass it through verbatim as [Book this ride](bookingLink) — the traveler finishes booking there with their name, email, and phone.

You can also look up a traveler's existing hotel or cab bookings by email (find_hotel_bookings, find_cab_bookings) — flights have no local booking record to look up, since FareCompass doesn't process flight bookings itself.

You cannot complete any booking yourself, cancel one, or handle payment — always hand off to the linked page, which collects the details needed safely.

Reply in plain text only — the chat widget does not render markdown. Do not use **bold**, bullet points, headers, or any other markdown syntax; write normal sentences and use line breaks or "1.", "2." for lists instead. The one exception is the three link formats above, which the widget does render.

Be concise, friendly, and concrete. Quote prices with their currency exactly as returned by a tool — don't convert currencies. Dates are ISO (YYYY-MM-DD). If a tool call fails or returns nothing found, say so plainly rather than guessing or making up flight, hotel, cab, or booking details.`;
}

function statusLabel(toolName: string): string {
  switch (toolName) {
    case "search_airports":
      return "Looking up airports…";
    case "search_flights":
      return "Searching flights…";
    case "search_hotel_destinations":
      return "Looking up destinations…";
    case "search_hotels":
      return "Searching hotels…";
    case "estimate_cab_fare":
      return "Estimating cab fare…";
    case "find_hotel_bookings":
      return "Looking up your hotel bookings…";
    case "find_cab_bookings":
      return "Looking up your cab bookings…";
    default:
      return "Working…";
  }
}

interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

chatRouter.post("/", async (req, res) => {
  const { messages } = req.body as { messages?: ChatMessageInput[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages is required" });
  }
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || typeof last.content !== "string" || !last.content.trim()) {
    return res.status(400).json({ error: "The last message must be a non-empty user message" });
  }
  if (messages.some((m) => typeof m.content !== "string" || m.content.length > MAX_MESSAGE_LENGTH)) {
    return res.status(400).json({ error: "A message is too long" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event: object) => res.write(`data: ${JSON.stringify(event)}\n\n`);

  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt() },
    ...messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const MAX_ATTEMPTS_PER_TURN = 2;

    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      let content = "";
      let toolCalls: ChatCompletionMessageToolCall[] = [];

      for (let attempt = 1; ; attempt++) {
        let emittedText = false;
        let attemptContent = "";
        // Streamed tool calls arrive as partial fragments keyed by index — the id
        // and function name land in the first fragment for that index, and
        // `arguments` accumulates as a JSON string across subsequent chunks.
        const toolCallsByIndex = new Map<number, { id: string; name: string; args: string }>();

        try {
          const stream = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: chatMessages,
            tools: chatTools,
            // Lower temperature makes malformed/hallucinated tool-call JSON
            // (an occasional Groq/Llama flakiness) noticeably less frequent.
            temperature: 0.3,
            stream: true,
          });

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            if (delta?.content) {
              attemptContent += delta.content;
              emittedText = true;
              send({ type: "text", text: delta.content });
            }
            for (const fragment of delta?.tool_calls ?? []) {
              const entry = toolCallsByIndex.get(fragment.index) ?? { id: "", name: "", args: "" };
              if (fragment.id) entry.id = fragment.id;
              if (fragment.function?.name) entry.name += fragment.function.name;
              if (fragment.function?.arguments) entry.args += fragment.function.arguments;
              toolCallsByIndex.set(fragment.index, entry);
            }
          }

          content = attemptContent;
          toolCalls = [...toolCallsByIndex.values()].map((t, i) => ({
            id: t.id || `call_${i}`,
            type: "function" as const,
            function: { name: t.name, arguments: t.args },
          }));
          break; // success
        } catch (streamErr) {
          // The model occasionally produces an invalid tool call mid-stream; Groq
          // surfaces that as an error on the stream itself. Safe to silently retry
          // once, but only if nothing has reached the user yet for this attempt —
          // otherwise a retry would duplicate or contradict what they already saw.
          if (!emittedText && attempt < MAX_ATTEMPTS_PER_TURN) {
            console.error("chat: retrying turn after stream error:", streamErr);
            continue;
          }
          throw streamErr;
        }
      }

      chatMessages.push({
        role: "assistant",
        content: content || null,
        tool_calls: toolCalls.length ? toolCalls : undefined,
      });

      if (toolCalls.length === 0) break;

      for (const call of toolCalls) {
        send({ type: "status", label: statusLabel(call.function.name) });
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          // fall through with empty args — executeTool reports the resulting error
        }
        const result = await executeTool(call.function.name, args);
        chatMessages.push({ role: "tool", tool_call_id: call.id, content: result });
      }
    }

    send({ type: "done" });
  } catch (err) {
    console.error("chat error:", err);
    const status = (err as { status?: number } | undefined)?.status;
    const message = err instanceof Error ? err.message : "Chat request failed";
    const hint = status === 401 ? "The chatbot isn't configured correctly (missing or invalid GROQ_API_KEY)." : message;
    send({ type: "error", error: hint });
  } finally {
    res.end();
  }
});
