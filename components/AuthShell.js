export default function AuthShell({ title, children, aside }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:items-center">
      <section className="rounded-3xl bg-ink p-8 text-white">
        <p className="kicker text-lime">OppWise</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">Never miss an opportunity worth taking.</h1>
        <p className="mt-4 text-white/75">Capture opportunities from WhatsApp forwards, posters and college mail. OppWise checks them for scams, knows your exam calendar, and tells you whether to apply.</p>
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <span className="chip bg-go-bg text-go">Go for it</span>
          <span className="chip bg-tight-bg text-tight">Tight</span>
          <span className="chip bg-skip-bg text-skip">Skip</span>
        </div>
        {aside}
      </section>
      <section className="card p-6 sm:p-8">
        <h2 className="mb-6 text-2xl font-bold">{title}</h2>
        {children}
      </section>
    </div>
  );
}
