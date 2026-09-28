import Link from "next/link";
import { getUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function Nav() {
  const user = await getUser();
  const links = user
    ? [
        ["/feed", "Feed"],
        ["/import", "+ Import"],
        ["/dashboard", "My pipeline"],
        ["/calendar", "Calendar"],
        ...(user.role === "admin" ? [["/admin", "Admin"]] : []),
        ["/profile", "Profile"],
      ]
    : [];
  return (
    <header className="sticky top-0 z-20 bg-ink text-white shadow">
      <div className="container-app flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
        <Link href={user ? "/feed" : "/login"} className="text-xl font-extrabold tracking-tight">
          Opp<span className="text-lime">Wise</span>
        </Link>
        <nav className="order-3 flex w-full gap-1 overflow-x-auto text-sm sm:order-2 sm:w-auto" aria-label="Main">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-white/85 hover:bg-white/10 hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
        <div className="order-2 ml-auto flex items-center gap-3 text-sm sm:order-3">
          {user ? (
            <>
              <span className="hidden text-white/70 md:inline">{user.name}{user.role === "admin" ? " · admin" : ""}</span>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="rounded-lg bg-lime px-3 py-1.5 font-semibold text-ink">Log in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
