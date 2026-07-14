// Posts directly to Substack's public subscribe endpoint — the same
// mechanism Substack's own "custom embed" option uses — rather than
// their /embed iframe, since the iframe's input/button can't be
// restyled from the parent page (cross-origin).
export default function SubstackSignup() {
  return (
    <div className="substack-signup">
      <span className="substack-signup-heading">Join the List</span>
      <p className="substack-signup-desc">
        New articles every Monday
      </p>
      <form
        className="substack-signup-form"
        action="https://nanospherex.substack.com/api/v1/free"
        method="post"
        target="_blank"
        rel="noopener noreferrer"
      >
        <input
          className="substack-signup-input"
          type="email"
          name="email"
          placeholder="Enter your email"
          aria-label="Email address"
          required
        />
        <button type="submit" className="substack-signup-button">
          Subscribe
        </button>
      </form>
    </div>
  )
}
