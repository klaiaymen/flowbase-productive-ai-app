/**
 * Shared error types used across server actions and client pages.
 *
 * AuthError is thrown by any server action that requires authentication.
 * The client can detect it via the `code` field and redirect to /sign-in.
 */
export class AuthError extends Error {
  readonly code = "UNAUTHORIZED" as const;

  constructor(message = "You must be signed in to perform this action.") {
    super(message);
    this.name = "AuthError";
  }
}

/** Narrow-check: returns true when the thrown value is an AuthError */
export function isAuthError(err: unknown): err is AuthError {
  return (
    err instanceof Error &&
    (err as any).code === "UNAUTHORIZED"
  );
}
