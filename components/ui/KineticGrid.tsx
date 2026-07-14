// Pure CSS background — no client-side JS, no state, so it never re-renders
// and costs nothing beyond GPU-composited transforms. See .kinetic-grid rules
// in styles/globals.css for the actual animation.
export function KineticGrid() {
  return (
    <div className="kinetic-grid" aria-hidden="true">
      <div className="kinetic-grid__layer kinetic-grid__layer--fine" />
      <div className="kinetic-grid__layer kinetic-grid__layer--bold" />
      <div className="kinetic-grid__vignette" />
    </div>
  );
}
