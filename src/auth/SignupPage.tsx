import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { AuthPageLayout } from "./AuthPageLayout";
import { SignupFormWithGooglePrimary } from "./SignupFormWithGooglePrimary";
import { useRedirectIfLoggedIn } from "./hooks/useRedirectIfLoggedIn";

export function SignupPage() {
  useRedirectIfLoggedIn();

  return (
    <AuthPageLayout>
      <SignupFormWithGooglePrimary />
      <p className="mt-6 text-center text-sm font-medium text-gray-700">
        Already have an account?{" "}
        <WaspRouterLink to={routes.LoginRoute.to} className="underline">
          Log in
        </WaspRouterLink>
      </p>
    </AuthPageLayout>
  );
}
