import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { AuthPageLayout } from "./AuthPageLayout";
import { LoginFormWithGooglePrimary } from "./LoginFormWithGooglePrimary";
import { useRedirectIfLoggedIn } from "./hooks/useRedirectIfLoggedIn";

export function LoginPage() {
  useRedirectIfLoggedIn();

  return (
    <AuthPageLayout>
      <LoginFormWithGooglePrimary />
      <p className="text-muted-foreground mt-6 text-center text-sm font-medium">
        Don&apos;t have an account yet?{" "}
        <WaspRouterLink
          to={routes.SignupRoute.to}
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Sign up
        </WaspRouterLink>
      </p>
      <p className="text-muted-foreground mt-2 text-center text-sm font-medium">
        Forgot your password?{" "}
        <WaspRouterLink
          to={routes.RequestPasswordResetRoute.to}
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Reset it
        </WaspRouterLink>
      </p>
    </AuthPageLayout>
  );
}
