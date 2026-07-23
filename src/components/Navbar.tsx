import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Compass, Menu, X } from "lucide-react";

const NAV_LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: "/", label: "Search", end: true },
  { to: "/everywhere", label: "Everywhere" },
  { to: "/hotels", label: "Hotels" },
  { to: "/cabs", label: "Cabs" },
  { to: "/explore", label: "Explore" },
  { to: "/forex", label: "Forex Card" },
  { to: "/insurance", label: "Insurance" },
  { to: "/trip", label: "My Trip" },
  { to: "/alerts", label: "Price alerts" },
  { to: "/admin", label: "Admin" },
];

export default function Navbar() {
  // Eight links no longer fit in a single row below ~1024px — collapses into
  // a hamburger-triggered stacked menu under the `lg` breakpoint instead.
  // Deliberately `lg`, not `md`: at exactly 768px (standard iPad portrait —
  // a very common real device, not an edge case) the `md` row fit but was
  // visibly cramped, with the logo touching "Search" and two-word items
  // ("My Trip", "Price alerts") wrapping onto a second line. Confirmed via
  // a real 768px-viewport browser pass that `lg` clears that up; landscape
  // tablets (1024px+) already had comfortable room either way.
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-900/10 bg-ink-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-white" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-coral-500 to-coral-400">
            <Compass className="h-5 w-5 text-ink-950" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight">FareCompass</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? "text-white" : "hover:text-white")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:text-white lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-6 py-4 text-sm font-medium text-white/80 lg:hidden">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `rounded-lg px-2 py-2.5 ${isActive ? "text-white" : "hover:text-white"}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
