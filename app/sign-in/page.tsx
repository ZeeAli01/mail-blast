import { AuthForm } from "@/components/AuthForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string | string[] }>;
}) {
  const requested = (await searchParams).callbackURL;
  const candidate = Array.isArray(requested) ? requested[0] : requested;
  const callbackURL =
    candidate?.startsWith("/") && !candidate.startsWith("//")
      ? candidate
      : "/dashboard";
  return <AuthForm mode="sign-in" callbackURL={callbackURL} />;
}
