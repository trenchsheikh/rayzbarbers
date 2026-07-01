"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RayzLogo } from "@/components/rayz-logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoldButton } from "@/components/ui/gold-button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Login failed");
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8">
        <RayzLogo size="lg" className="mb-2" />
        <h1 className="mt-2 text-xl font-bold">Barber Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to manage bookings.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ray"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <GoldButton
            type="submit"
            className="w-full py-3 text-sm"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </GoldButton>
        </form>
      </div>
    </div>
  );
}
