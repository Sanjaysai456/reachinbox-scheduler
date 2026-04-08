import type { EmailSummary } from "../types/api";

const cards = [
  {
    key: "scheduled",
    label: "Scheduled",
    description: "Waiting to send",
  },
  {
    key: "sent",
    label: "Delivered",
    description: "Successfully processed",
  },
  {
    key: "failed",
    label: "Failed",
    description: "Needs attention",
  },
  {
    key: "totalCampaigns",
    label: "Campaigns",
    description: "Created so far",
  },
] as const;

export const SummaryCards = ({ summary }: { summary: EmailSummary }) => (
  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {cards.map((card) => (
      <article
        className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        key={card.key}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{card.label}</span>
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
              Live
            </span>
          </div>
          <div>
            <p className="text-3xl font-semibold tracking-tight text-gray-900">{summary[card.key]}</p>
            <p className="mt-1 text-sm text-gray-500">{card.description}</p>
          </div>
        </div>
      </article>
    ))}
  </section>
);
