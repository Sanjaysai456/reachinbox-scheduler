import { formatDateTime } from "../lib/format";
import type { ScheduledEmail, SentEmail } from "../types/api";

type EmailTableProps =
  | {
      mode: "scheduled";
      rows: ScheduledEmail[];
    }
  | {
      mode: "history";
      rows: SentEmail[];
    };

const statusStyles: Record<string, string> = {
  SCHEDULED: "bg-amber-50 text-amber-700 ring-amber-200",
  SENT: "bg-green-50 text-green-700 ring-green-200",
  FAILED: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const EmailTable = (props: EmailTableProps) => {
  const rows =
    props.mode === "scheduled"
      ? props.rows.map((row) => (
          <article
            className="flex flex-col gap-4 px-5 py-5 transition hover:bg-gray-50 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.4fr)_auto] lg:items-start"
            key={row.id}
          >
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-gray-900">{row.recipientEmail}</p>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                    statusStyles[row.status] ?? "bg-gray-100 text-gray-700 ring-gray-200"
                  }`}
                >
                  {row.status}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                <p className="font-medium text-gray-700">{row.campaign.sender.name}</p>
                <p className="truncate">{row.campaign.sender.email}</p>
              </div>
            </div>

            <div className="min-w-0 space-y-2">
              <p className="truncate text-sm font-semibold text-gray-900">{row.subject}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Scheduled delivery</p>
            </div>

            <div className="space-y-2 lg:text-right">
              <p className="text-sm font-semibold text-gray-700">{formatDateTime(row.scheduledAt)}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Scheduled time</p>
            </div>
          </article>
        ))
      : props.rows.map((row) => (
          <article
            className="flex flex-col gap-4 px-5 py-5 transition hover:bg-gray-50 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.4fr)_auto] lg:items-start"
            key={row.id}
          >
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-gray-900">{row.recipientEmail}</p>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                    statusStyles[row.status] ?? "bg-gray-100 text-gray-700 ring-gray-200"
                  }`}
                >
                  {row.status}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                <p className="font-medium text-gray-700">{row.campaign.sender.name}</p>
                <p className="truncate">{row.campaign.sender.email}</p>
              </div>
            </div>

            <div className="min-w-0 space-y-2">
              <p className="truncate text-sm font-semibold text-gray-900">{row.subject}</p>
              {row.status === "SENT" && row.etherealPreviewUrl ? (
                <a
                  className="inline-flex items-center rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-700"
                  href={row.etherealPreviewUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open preview
                </a>
              ) : (
                <p className="text-xs text-gray-500">{row.errorMessage ?? "No preview available"}</p>
              )}
            </div>

            <div className="space-y-2 lg:text-right">
              <p className="text-sm font-semibold text-gray-700">
                {formatDateTime(row.sentAt ?? row.failedAt)}
              </p>
              <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Latest event</p>
            </div>
          </article>
        ));

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="hidden grid-cols-[minmax(0,1.25fr)_minmax(0,1.4fr)_auto] gap-4 border-b border-gray-100 bg-gray-50/80 px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400 lg:grid">
        <span>{props.mode === "scheduled" ? "Recipient" : "Email activity"}</span>
        <span>Details</span>
        <span className="text-right">{props.mode === "scheduled" ? "Scheduled" : "Processed"}</span>
      </div>

      <div className="divide-y divide-gray-100">{rows}</div>
    </div>
  );
};
