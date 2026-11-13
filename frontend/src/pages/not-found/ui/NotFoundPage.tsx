import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="min-w-0 p-5 pr-32 sm:p-8 sm:pr-36">
      <h1 className="text-display text-text-primary">Page not found</h1>
      <p className="mt-3 text-text-secondary">This address is not part of Rivnova.</p>
      <Link
        to="/"
        className="mt-5 inline-block rounded-control font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Return to Field Explorer
      </Link>
    </section>
  );
}
