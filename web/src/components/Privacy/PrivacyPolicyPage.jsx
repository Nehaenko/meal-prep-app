export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-4 rounded-3xl bg-white/90 p-6 shadow-lg ring-1 ring-black/5">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--ink-900)]">Privacy Policy</h1>
        <p className="text-sm text-[var(--muted-400)]">
          Last updated: {new Date().toISOString().slice(0, 10)}
        </p>
      </header>

      <p className="text-sm text-[var(--ink-700)]">
        This app collects only the data needed to provide meal planning features.
      </p>

      <div className="space-y-2 text-sm text-[var(--ink-700)]">
        <h2 className="text-base font-semibold text-[var(--ink-900)]">What we store</h2>
        <ul className="list-disc pl-5">
          <li>Account email and a hashed password.</li>
          <li>Your meal plans, shopping lists, and custom recipes.</li>
        </ul>
      </div>

      <div className="space-y-2 text-sm text-[var(--ink-700)]">
        <h2 className="text-base font-semibold text-[var(--ink-900)]">What we don’t do</h2>
        <ul className="list-disc pl-5">
          <li>We don’t sell your data.</li>
          <li>We don’t use third-party ads.</li>
        </ul>
      </div>

      <div className="space-y-2 text-sm text-[var(--ink-700)]">
        <h2 className="text-base font-semibold text-[var(--ink-900)]">Contact</h2>
        <p>
          If you have questions, contact the app owner.
        </p>
      </div>
    </section>
  );
}
