export default function FormComponent({ onSubmit, error, type }) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {error && (
        <p
          data-testid={`${type}_error`}
          role="alert"
          aria-live="assertive"
          className="text-red-600 text-sm mt-2"
        >
          {error}
        </p>
      )}
      <div>
        <label className="block mb-1" htmlFor="email-signup">
          Email
        </label>
        <input
          data-testid={`${type}_email`}
          className="w-full border px-3 py-2 rounded"
          type="email"
          id={`email-${type}`}
          name={`email-${type}`}
          required
        />
      </div>
      <div>
        <label className="block mb-1" htmlFor="password-signup">
          Password
        </label>
        <input
          data-testid={`${type}_password`}
          className="w-full border px-3 py-2 rounded"
          type="password"
          id={`password-${type}`}
          name={`password-${type}`}
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-green-500 text-white py-2 rounded cursor-pointer"
      >
        {type === "signup" ? "Create Account" : "Log In"}
      </button>
    </form>
  );
}
