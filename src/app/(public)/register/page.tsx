"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Cloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: { username, email, password },
      });
      setMessage("Account created. You can now sign in.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-icon">
            <Cloud color="white" />
          </span>
          New-DhanushGuard
        </div>
        <h1 className="auth-heading">Create your account</h1>
        <p className="auth-description">
          Set up a secure account to manage client AWS workspaces.
        </p>
        {error && <div className="alert danger mb-3">{error}</div>}
        {message && <div className="alert mb-3">{message}</div>}
        <form onSubmit={(e) => void submit(e)}>
          {[
            {
              id: "username",
              label: "Username",
              value: username,
              set: setUsername,
              type: "text",
              auto: "username",
            },
            {
              id: "email",
              label: "Email",
              value: email,
              set: setEmail,
              type: "email",
              auto: "email",
            },
            {
              id: "password",
              label: "Password (8+ characters)",
              value: password,
              set: setPassword,
              type: "password",
              auto: "new-password",
            },
            {
              id: "confirm",
              label: "Confirm password",
              value: confirm,
              set: setConfirm,
              type: "password",
              auto: "new-password",
            },
          ].map((f) => (
            <div className="form-row" key={f.id}>
              <label className="form-label" htmlFor={f.id}>
                {f.label}
              </label>
              <Input
                id={f.id}
                required
                type={f.type}
                autoComplete={f.auto}
                minLength={f.id === "password" ? 8 : undefined}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
              />
            </div>
          ))}
          <Button
            type="submit"
            className="w-full"
            variant="primary"
            disabled={busy}
          >
            {busy ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="small-note mt-6 text-center">
          <Link href="/login" className="text-blue-600 font-bold">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
