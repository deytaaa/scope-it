"use client";

// HTTP Basic Auth has no real server-side logout — the browser caches the
// credentials itself. The accepted workaround is to overwrite that cache with
// deliberately invalid credentials so a future visit to /admin gets a fresh
// 401 prompt instead of being silently re-authenticated.
//
// Crucially, we don't wait for that request to resolve before navigating
// away: sitting on the page while a deliberately-failing 401 request is in
// flight is what let the browser's native "sign in" dialog surface. Firing
// it with `keepalive` and redirecting immediately avoids that entirely.
export function LogoutButton() {
  function handleLogout() {
    fetch("/admin", {
      headers: { Authorization: "Basic " + btoa("logout:logout") },
      keepalive: true,
    }).catch(() => {});

    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="cursor-pointer rounded-card border-[0.5px] border-border px-3 py-1.5 text-sm text-secondary transition-colors duration-150 hover:text-primary"
    >
      Log out
    </button>
  );
}
