// Central helper to retrieve the current Firebase ID token.
// Implementation depends on AuthContext.
// To avoid circular dependencies, AuthContext sets this function reference.

let tokenGetter = null;

export function setAuthTokenGetter(fn) {
  tokenGetter = fn;
}

export async function getAuthToken() {
  if (!tokenGetter) return null;
  return tokenGetter();
}

