"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cloud, ArrowRight, LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: { username, password },
      });
      router.replace("/overview");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-icon">
            <Cloud size={21} color="white" />
          </span>{" "}
          CloudGuard
        </div>
        <div className="auth-heading">Welcome back</div>
        <p className="auth-description">
          Sign in to your secure cloud audit workspace.
        </p>
        {error && <div className="alert danger mb-4">{error}</div>}
        <form onSubmit={(e) => void submit(e)}>
          <div className="form-row">
            <label className="form-label" htmlFor="username">
              Username or email
            </label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              required
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            className="w-full"
            disabled={busy}
            type="submit"
          >
            <LockKeyhole size={15} />
            {busy ? "Signing in…" : "Sign in"}
            <ArrowRight size={15} />
          </Button>
        </form>
        <p className="small-note mt-6 text-center">
          New to the platform?{" "}
          <Link href="/register" className="text-blue-600 font-bold">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}
