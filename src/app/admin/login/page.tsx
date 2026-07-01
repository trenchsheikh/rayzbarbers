"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RayzLogo } from "@/components/rayz-logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoldButton } from "@/components/ui/gold-button";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });
      if (authError) throw authError;
      setSent(true);
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
          Sign in with your admin email to manage bookings.
        </p>

        {sent ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Check your email for a magic link to sign in.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ray@rayzbarbers.com"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <GoldButton
              type="submit"
              className="w-full py-3 text-sm"
              disabled={loading}
            >
              {loading ? "Sending…" : "Send magic link"}
            </GoldButton>
          </form>
        )}
      </div>
    </div>
  );
}
