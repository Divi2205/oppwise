"use client";
export default function LogoutButton() {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }
  return <button onClick={logout} className="rounded-lg border border-white/25 px-3 py-1.5 text-white/90 hover:bg-white/10">Log out</button>;
}
