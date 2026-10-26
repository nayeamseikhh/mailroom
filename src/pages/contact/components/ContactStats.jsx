/**
 * Stats bar: Total contacts · Subscribed · Unsubscribed · Contact folders.
 *
 * Props
 * -----
 * @param {{ total: number, subscribed: number, unsubscribed: number, bounced: number }} stats
 * @param {number} folderCount
 */
export default function ContactStats({ stats, folderCount }) {
  const cards = [
    {
      label: "Total contacts",
      value: stats.total ?? 0,
      description: "All contact records",
      icon: "👥",
    },
    {
      label: "Subscribed",
      value: stats.subscribed ?? 0,
      description: "Eligible for campaigns",
      icon: "✉️",
    },
    {
      label: "Unsubscribed",
      value: stats.unsubscribed ?? 0,
      description: "Do not send campaigns",
      icon: "⛔",
    },
    {
      label: "Suppressed / bounced",
      value: (stats.suppressed ?? 0) + (stats.bounced ?? 0),
      description: "Excluded from campaigns",
      icon: "🚫",
    },
    {
      label: "Contact folders",
      value: folderCount ?? 0,
      description: "Organized contact lists",
      icon: "📁",
    },
  ];

  return (
    <section
      className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      aria-label="Contact statistics"
    >
      {cards.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              {item.label}
            </span>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200/20 bg-emerald-400/10 text-xl"
              aria-hidden="true"
            >
              {item.icon}
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold text-gray-900">{item.value}</p>

          <p className="mt-1 text-xs text-gray-500">{item.description}</p>
        </article>
      ))}
    </section>
  );
}
