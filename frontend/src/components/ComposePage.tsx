import { useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
import { extractEmailsFromFile } from "../lib/extract-emails";
import { formatForDateTimeLocal } from "../lib/format";

type Props = {
  token: string;
  onScheduled: (message: string) => Promise<void>;
};

export const ComposePage = ({ token, onScheduled }: Props) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [startTime, setStartTime] = useState(
    formatForDateTimeLocal(new Date(Date.now() + 60_000))
  );
  const [delayBetweenMs, setDelayBetweenMs] = useState(2000);
  const [hourlyLimit, setHourlyLimit] = useState(120);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const previewRecipients = useMemo(() => recipients.slice(0, 5), [recipients]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const emails = await extractEmailsFromFile(file);
      setRecipients(emails);
      setError(emails.length ? "" : "No emails found");
    } catch {
      setError("File error");
    }
  };

  const handleSubmit = async () => {
    if (recipients.length === 0) {
      setError("Add recipients");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest<{ message: string }>(
        "/api/emails/schedule",
        {
          method: "POST",
          token,
          body: JSON.stringify({
            subject,
            body,
            recipients,
            startTime: new Date(startTime + ":00").toISOString(),
            delayBetweenMs,
            hourlyLimit,
          }),
        }
      );

      await onScheduled(res.message);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="compose-page">
      {/* HEADER */}
      <div className="compose-header">
        <h2>Compose New Email</h2>

        <div className="actions">
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="compose-body">
        {/* TO */}
        <div className="field">
          <label>To</label>
          <div className="chips">
            {previewRecipients.map((email, i) => (
              <span key={i} className="chip">
                {email}
              </span>
            ))}
          </div>
          <input type="file" onChange={handleFileChange} />
        </div>

        {/* SUBJECT */}
        <div className="field">
          <label>Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
          />
        </div>

        {/* SETTINGS */}
        <div className="inline-fields">
          <input
            type="number"
            value={delayBetweenMs}
            onChange={(e) => setDelayBetweenMs(Number(e.target.value))}
            placeholder="Delay (ms)"
          />
          <input
            type="number"
            value={hourlyLimit}
            onChange={(e) => setHourlyLimit(Number(e.target.value))}
            placeholder="Hourly limit"
          />
        </div>

        {/* EDITOR */}
        <div className="editor">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your message..."
          />
        </div>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};