"use client";
import { useState } from "react";
import Link from "next/link";
import { loginSchema, registerSchema, fieldErrors, BRANCHES } from "@/lib/validation";

export default function AuthForm({ mode }) {
  const isLogin = mode === "login";
  const [form, setForm] = useState({ name: "", email: "", password: "", year: "3", branch: "CSE" });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    const schema = isLogin ? loginSchema : registerSchema;
    const check = schema.safeParse(form);
    if (!check.success) return setErrors(fieldErrors(check.error)); // same rules as the server
    setErrors({});
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(check.data) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.fields || {});
        setMsg(data.error || "Something went wrong");
        return;
      }
      window.location.href = "/feed";
    } catch {
      setMsg("Can't reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  const Field = ({ k, label, type = "text", ...rest }) => (
    <div>
      <label className="label" htmlFor={k}>{label}</label>
      <input id={k} type={type} className="input" value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...rest} />
      {errors[k] && <p className="field-error">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {!isLogin && Field({ k: "name", label: "Full name", autoComplete: "name" })}
      {Field({ k: "email", label: "College email", type: "email", autoComplete: "email", placeholder: "you@srmist.edu.in" })}
      {Field({ k: "password", label: "Password", type: "password", autoComplete: isLogin ? "current-password" : "new-password" })}
      {!isLogin && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="year">Year</label>
            <select id="year" className="input" value={form.year} onChange={set("year")}>
              {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="branch">Branch</label>
            <select id="branch" className="input" value={form.branch} onChange={set("branch")}>
              {BRANCHES.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
        </div>
      )}
      {msg && <p role="alert" className="rounded-xl bg-skip-bg px-3 py-2 text-sm font-medium text-skip">{msg}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Please wait…" : isLogin ? "Log in" : "Create account"}</button>
      <p className="text-center text-sm text-slate-600">
        {isLogin ? <>New here? <Link className="font-semibold text-brand" href="/register">Create an account</Link></> : <>Already registered? <Link className="font-semibold text-brand" href="/login">Log in</Link></>}
      </p>
    </form>
  );
}
