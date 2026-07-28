import { signup } from "wasp/client/auth";
import { useState, type FormEvent } from "react";
import { Button } from "../client/components/ui/button";
import { Input } from "../client/components/ui/input";
import { Label } from "../client/components/ui/label";
import {
  AuthMethodDivider,
  GoogleContinueButton,
} from "./GoogleContinueButton";
import logo from "../client/static/mixwaspnobg.png";

export function SignupFormWithGooglePrimary() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await signup({ email, password } as Parameters<typeof signup>[0]);
      setEmail("");
      setPassword("");
      setSuccess(
        "Account created - check your email for a verification link.",
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not sign up. Try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col items-center text-center">
        <img src={logo} alt="MixWasp" className="mb-3 size-12" />
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          Create your MixWasp account
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Sign up with Google in one click.
        </p>
      </div>

      <GoogleContinueButton label="Continue with Google" />

      <AuthMethodDivider />

      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="signup-email">
            Email
          </Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">
            Password
          </Label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account…" : "Sign up with email"}
        </Button>
      </form>
    </div>
  );
}
