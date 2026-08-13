import { useEffect } from "react";
import { Link } from "react-router-dom";
import { clearHowItWorksPending } from "../../lib/howItWorks";

export default function HowItWorksPage() {
  useEffect(() => {
    clearHowItWorksPending();
  }, []);

  return (
    <div className="how-it-works-page">
      <section className="how-it-works-hero glass-card">
        <div className="how-it-works-hero-copy">
          <span className="how-it-works-pill">How it works</span>
          <h1>Build a meal plan in minutes</h1>
          <p>
            Start with ingredients you have, pick recipes you love, and let the
            app shape your planner, prep steps, and shopping list.
          </p>
        </div>
        <div className="how-it-works-actions">
          <Link className="btn btn-primary" to="/">
            Start searching
          </Link>
        </div>
      </section>

      <section className="how-it-works-steps glass-card">
        <div className="how-it-works-steps-header">
          <h2>Your workflow</h2>
          <p>Follow these steps to go from idea to prep-ready plan.</p>
        </div>
        <div className="how-it-works-steps-grid">
          <article className="how-it-works-step">
            <h3>1. Search and save</h3>
            <p>
              Add ingredients, browse results, and save recipes to your planner
              or favourites.
            </p>
          </article>
          <article className="how-it-works-step">
            <h3>2. Shape your planner</h3>
            <p>
              Review the planner list, remove meals, and decide what you want to
              cook this week.
            </p>
          </article>
          <article className="how-it-works-step">
            <h3>3. Generate a prep plan</h3>
            <p>
              Create a guided prep plan so you know exactly what to cook, chop,
              and store.
            </p>
          </article>
          <article className="how-it-works-step">
            <h3>4. Shop with confidence</h3>
            <p>
              Your shopping list updates automatically with the ingredients
              needed across all planned meals.
            </p>
          </article>
          <article className="how-it-works-step">
            <h3>5. Personalize everything</h3>
            <p>
              Add your own recipes, notes, and swaps to keep the plan aligned
              with your taste.
            </p>
          </article>
        </div>
      </section>

      <section className="how-it-works-tips glass-card">
        <h2>Good to know</h2>
        <ul className="how-it-works-list">
          <li>Your planner drives both prep plans and shopping lists.</li>
          <li>Custom recipes can be edited, saved, and added to plans.</li>
          <li>Use favourites to keep a short list of repeat meals.</li>
        </ul>
      </section>
    </div>
  );
}
