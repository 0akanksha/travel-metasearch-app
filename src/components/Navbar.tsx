import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Compass, Menu, X } from "lucide-react";

const PRIMARY_LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: "/", label: "Search", end: true },
  { to: "/everywhere", label: "Everywhere" },
];

// The five booking verticals — grouped under a "Book" dropdown on desktop
// (see BookMenu below) once they stopped fitting in a single row even at
// 1024px (confirmed via a real-viewport check: at 11 flat top-level items,
// "Search" overlapped the logo and two labels wrapped onto a second line —
// not just tight, genuinely broken). Still rendered flat in the mobile
// stacked menu below, where vertical space isn't a constraint.
const BOOK_LINKS: { to: string; label: string }[] = [
  { to: "/hotels", label: "Hotels" },
  { to: "/cabs", label: "Cabs" },
  { to: "/forex", label: "Forex Card" },
  { to: "/insurance", label: "Insurance" },
  { to: "/cruises", label: "Cruises" },
  { to: "/visas", label: "Visa" },
];

const SECONDARY_LINKS: { to: string; label: string }[] = [
  { to: "/explore", label: "Explore" },
  { to: "/trip", label: "My Trip" },
  { to: "/alerts", label: "Price alerts" },
  { to: "/admin", label: "Admin" },
];

const MOBILE_LINKS: { to: string; label: string; end?: boolean }[] = [...PRIMARY_LINKS, ...BOOK_LINKS, ...SECONDARY_LINKS];

function BookMenu() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = BOOK_LINKS.some((l) => location.pathname.startsWith(l.to));

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 ${isActive ? "text-white" : "hover:text-white"}`}
      >
        Book <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-3 w-44 rounded-lg border border-ink-900/10 bg-white py-1.5 text-ink-900 shadow-lg">
          {BOOK_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive: linkActive }) =>
                `block px-4 py-2 text-sm font-medium ${linkActive ? "text-pine-700" : "text-ink-900/80 hover:bg-ink-950/5"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  // Below `lg` (1024px), the desktop row collapses into a hamburger-triggered
  // stacked menu instead. Deliberately `lg`, not `md`: at exactly 768px
  // (standard iPad portrait — a very common real device, not an edge case)
  // the `md` row fit but was visibly cramped, with the logo touching "Search"
  // and two-word items ("My Trip", "Price alerts") wrapping onto a second
  // line. Confirmed via a real 768px-viewport browser pass that `lg` clears
  // that up; landscape tablets (1024px+) already had comfortable room either
  // way — at least for the top-level item count at the time (see BookMenu's
  // comment for what happened once that count kept growing).
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
          {PRIMARY_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? "text-white" : "hover:text-white")}
            >
              {link.label}
            </NavLink>
          ))}
          <BookMenu />
          {SECONDARY_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? "text-white" : "hover:text-white")}>
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
          {MOBILE_LINKS.map((link) => (
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
