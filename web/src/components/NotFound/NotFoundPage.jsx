import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <section className="not-found-hero glass-card">
        <div>
          <p className="not-found-pill">404</p>
          <h1>Page not found</h1>
          <p>
            We could not find that page. Try a new search or jump to a
            frequently used area.
          </p>
        </div>
        <div className="not-found-actions">
          <Link className="btn btn-primary" to="/">
            Go to search
          </Link>
          <Link className="btn btn-soft" to="/planner">
            Planner
          </Link>
        </div>
      </section>

      <section className="not-found-panel glass-card">
        <div>
          <h3>Helpful links</h3>
          <p className="not-found-meta">
            Build your week with these shortcuts.
          </p>
        </div>
        <div className="not-found-links">
          <Link className="not-found-link" to="/shopping-list">
            Shopping list
          </Link>
          <Link className="not-found-link" to="/prep-plan">
            Prep plans
          </Link>
          <Link className="not-found-link" to="/my-recipes">
            My recipes
          </Link>
          <Link className="not-found-link" to="/favourites">
            Favourites
          </Link>
        </div>
      </section>
    </div>
  );
}
