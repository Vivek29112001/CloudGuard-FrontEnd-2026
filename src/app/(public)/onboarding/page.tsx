"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Cloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { backend } from "@/lib/api/client";
export default function Onboarding() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await backend("/workspaces", {
        method: "POST",
        body: { name: name.trim() },
      });
      router.replace("/overview");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Workspace creation failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <Cloud color="#2865f4" />
          CloudGuard
        </div>
        <h1 className="auth-heading">Create your client workspace</h1>
        <p className="auth-description">
          Each client workspace isolates cloud connections, discovery snapshots,
          inventory revisions and AI chat context.
        </p>
        {error && <div className="alert danger mb-3">{error}</div>}
        <form onSubmit={(e) => void submit(e)}>
          <div className="form-row">
            <label className="form-label" htmlFor="workspace">
              Workspace name
            </label>
            <Input
              id="workspace"
              placeholder="Example: Acme Pvt Ltd"
              value={name}
              minLength={2}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            className="w-full"
            type="submit"
            disabled={busy}
          >
            Create workspace
          </Button>
        </form>
      </div>
    </main>
  );
}
