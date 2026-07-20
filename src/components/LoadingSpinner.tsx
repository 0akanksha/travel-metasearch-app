import { Compass } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-ink-900/50">
      <Compass className="h-8 w-8 animate-spin [animation-duration:2s]" />
      <p>Loading&hellip;</p>
    </div>
  );
}
