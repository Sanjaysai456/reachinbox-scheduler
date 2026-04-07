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

export const EmailTable = (props: EmailTableProps) => {
  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Subject</th>
            <th>{props.mode === "scheduled" ? "Scheduled Time" : "Sent Time"}</th>
            <th>Status</th>
            <th>Sender</th>
            {props.mode === "history" ? <th>Preview</th> : null}
          </tr>
        </thead>
        <tbody>
          {props.mode === "scheduled"
            ? props.rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.recipientEmail}</td>
                  <td>{row.subject}</td>
                  <td>{formatDateTime(row.scheduledAt)}</td>
                  <td>
                    <span className={`status-pill ${row.status.toLowerCase()}`}>{row.status}</span>
                  </td>
                  <td>
                    {row.campaign.sender.name}
                    <span className="cell-secondary">{row.campaign.sender.email}</span>
                  </td>
                </tr>
              ))
            : props.rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.recipientEmail}</td>
                  <td>{row.subject}</td>
                  <td>{formatDateTime(row.sentAt ?? row.failedAt)}</td>
                  <td>
                    <span className={`status-pill ${row.status.toLowerCase()}`}>{row.status}</span>
                  </td>
                  <td>
                    {row.campaign.sender.name}
                    <span className="cell-secondary">{row.campaign.sender.email}</span>
                  </td>
                  <td>
                    {row.status === "SENT" && row.etherealPreviewUrl ? (
                      <a href={row.etherealPreviewUrl} rel="noreferrer" target="_blank">
                        Open preview
                      </a>
                    ) : (
                      <span className="cell-secondary">{row.errorMessage ?? "No preview"}</span>
                    )}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
};
