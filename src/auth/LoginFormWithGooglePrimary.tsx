import { login } from "wasp/client/auth";
import { useNavigate } from "react-router";
import { useState, type FormEvent } from "react";
import { Button } from "../client/components/ui/button";
import { Input } from "../client/components/ui/input";
import { Label } from "../client/components/ui/label";
import {
  AuthMethodDivider,
  GoogleContinueButton,
} from "./GoogleContinueButton";
import logo from "../client/static/mixwaspnobg.png";

export function LoginFormWithGooglePrimary() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login({ email, password });
      navigate("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not log in. Try again.";
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
          Log in to MixWasp
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          The fastest way in is with Google.
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
        <div className="space-y-2">
          <Label htmlFor="login-email">
            Email
          </Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">
            Password
          </Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logging in…" : "Log in with email"}
        </Button>
      </form>
    </div>
  );
}
