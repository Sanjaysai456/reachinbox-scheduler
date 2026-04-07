import type { EmailSummary } from "../types/api";

const cards = [
  { key: "scheduled", label: "Scheduled Emails" },
  { key: "sent", label: "Sent Emails" },
  { key: "failed", label: "Failed Emails" },
  { key: "totalCampaigns", label: "Campaigns" },
] as const;

export const SummaryCards = ({ summary }: { summary: EmailSummary }) => (
  <section className="summary-grid">
    {cards.map((card) => (
      <article className="summary-card" key={card.key}>
        <span>{card.label}</span>
        <strong>{summary[card.key]}</strong>
      </article>
    ))}
  </section>
);
