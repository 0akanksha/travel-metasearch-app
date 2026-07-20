export default function Footer() {
  return (
    <footer className="border-t border-ink-900/10 bg-white py-8 text-sm text-ink-900/60">
      <div className="mx-auto max-w-6xl px-6">
        <p>&copy; {new Date().getFullYear()} FareCompass. Demo flight search app — not a real travel agency.</p>
      </div>
    </footer>
  );
}
