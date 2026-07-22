import { Link, NavLink } from "react-router-dom";
import { Compass } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-900/10 bg-ink-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-coral-500 to-coral-400">
            <Compass className="h-5 w-5 text-ink-950" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight">FareCompass</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-white/80">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "text-white" : "hover:text-white")}>
            Search
          </NavLink>
          <NavLink to="/everywhere" className={({ isActive }) => (isActive ? "text-white" : "hover:text-white")}>
            Everywhere
          </NavLink>
          <NavLink to="/hotels" className={({ isActive }) => (isActive ? "text-white" : "hover:text-white")}>
            Hotels
          </NavLink>
          <NavLink to="/cabs" className={({ isActive }) => (isActive ? "text-white" : "hover:text-white")}>
            Cabs
          </NavLink>
          <NavLink to="/alerts" className={({ isActive }) => (isActive ? "text-white" : "hover:text-white")}>
            Price alerts
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => (isActive ? "text-white" : "hover:text-white")}>
            Admin
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
