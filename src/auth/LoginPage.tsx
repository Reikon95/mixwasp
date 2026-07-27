import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { AuthPageLayout } from "./AuthPageLayout";
import { LoginFormWithGooglePrimary } from "./LoginFormWithGooglePrimary";
import { useRedirectIfLoggedIn } from "./hooks/useRedirectIfLoggedIn";

export function LoginPage() {
  useRedirectIfLoggedIn();

  return (
    <AuthPageLayout>
      <LoginFormWithGooglePrimary />
      <p className="mt-6 text-center text-sm font-medium text-gray-700">
        Don&apos;t have an account yet?{" "}
        <WaspRouterLink to={routes.SignupRoute.to} className="underline">
          Sign up
        </WaspRouterLink>
      </p>
      <p className="mt-2 text-center text-sm font-medium text-gray-700">
        Forgot your password?{" "}
        <WaspRouterLink
          to={routes.RequestPasswordResetRoute.to}
          className="underline"
        >
          Reset it
        </WaspRouterLink>
      </p>
    </AuthPageLayout>
  );
}
