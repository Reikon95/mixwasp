import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { AuthPageLayout } from "./AuthPageLayout";
import { SignupFormWithGooglePrimary } from "./SignupFormWithGooglePrimary";
import { useRedirectIfLoggedIn } from "./hooks/useRedirectIfLoggedIn";

export function SignupPage() {
  useRedirectIfLoggedIn();

  return (
    <AuthPageLayout>
      <SignupFormWithGooglePrimary />
      <p className="text-muted-foreground mt-6 text-center text-sm font-medium">
        Already have an account?{" "}
        <WaspRouterLink
          to={routes.LoginRoute.to}
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Log in
        </WaspRouterLink>
      </p>
    </AuthPageLayout>
  );
}
