import {
  page,
  route,
  type Auth,
  type AuthMethods,
  type Spec,
} from "@wasp.sh/spec";

import { LoginPage } from "./LoginPage" with { type: "ref" };
import { SignupPage } from "./SignupPage" with { type: "ref" };
import { EmailVerificationPage } from "./email-and-pass/EmailVerificationPage" with { type: "ref" };
import { PasswordResetPage } from "./email-and-pass/PasswordResetPage" with { type: "ref" };
import { RequestPasswordResetPage } from "./email-and-pass/RequestPasswordResetPage" with { type: "ref" };
import {
  getPasswordResetEmailContent,
  getVerificationEmailContent,
} from "./email-and-pass/emails" with { type: "ref" };
import {
  getEmailUserFields,
  getGoogleAuthConfig,
  getGoogleUserFields,
} from "./userSignupFields" with { type: "ref" };

const emailAuthMethod: NonNullable<AuthMethods["email"]> = {
  fromField: {
    name: "MixWasp",
    email: "me@example.com",
  },
  emailVerification: {
    clientRoute: "EmailVerificationRoute",
    getEmailContentFn: getVerificationEmailContent,
  },
  passwordReset: {
    clientRoute: "PasswordResetRoute",
    getEmailContentFn: getPasswordResetEmailContent,
  },
  userSignupFields: getEmailUserFields,
};

const googleAuthMethod: NonNullable<AuthMethods["google"]> = {
  userSignupFields: getGoogleUserFields,
  configFn: getGoogleAuthConfig,
};

// 🔐 Auth out of the box! https://wasp.sh/docs/auth/overview
export const authConfig: Auth = {
  userEntity: "User",
  methods: {
    // NOTE: If you decide to not use email auth, make sure to also delete the related routes below.
    //       (RequestPasswordResetRoute, PasswordResetRoute, EmailVerificationRoute)
    email: emailAuthMethod,
    google: googleAuthMethod,
  },
  onAuthFailedRedirectTo: "/login",
  onAuthSucceededRedirectTo: "/",
};

export const authSpec: Spec = [
  route("LoginRoute", "/login", page(LoginPage)),
  route("SignupRoute", "/signup", page(SignupPage)),
  route(
    "RequestPasswordResetRoute",
    "/request-password-reset",
    page(RequestPasswordResetPage),
  ),
  route("PasswordResetRoute", "/password-reset", page(PasswordResetPage)),
  route(
    "EmailVerificationRoute",
    "/email-verification",
    page(EmailVerificationPage),
  ),
];
