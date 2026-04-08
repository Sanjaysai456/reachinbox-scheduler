import { useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
import { extractEmailsFromFile } from "../lib/extract-emails";
import { formatForDateTimeLocal } from "../lib/format";

type ComposeModalProps = {
  open: boolean;
  token: string;
  onClose: () => void;
  onScheduled: (message: string) => Promise<void>;
};

export const ComposeModal = ({
  open,
  token,
  onClose,
  onScheduled,
}: ComposeModalProps) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [startTime, setStartTime] = useState(formatForDateTimeLocal(new Date(Date.now() + 60_000)));
  const [delayBetweenMs, setDelayBetweenMs] = useState(2000);
  const [hourlyLimit, setHourlyLimit] = useState(120);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const previewRecipients = useMemo(() => recipients.slice(0, 5), [recipients]);

  if (!open) {
    return null;
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const foundEmails = await extractEmailsFromFile(file);
      setRecipients(foundEmails);
      setSelectedFileName(file.name);
      setError(foundEmails.length > 0 ? "" : "No valid email addresses were found in that file.");
    } catch {
      setError("Could not read that file. Please try a CSV or text file.");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (recipients.length === 0) {
      setError("Upload a CSV or text file with at least one valid recipient email.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await apiRequest<{ message: string }>("/api/emails/schedule", {
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
      });

      setSubject("");
      setBody("");
      setRecipients([]);
      setSelectedFileName("");
      await onScheduled(response.message);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Scheduling failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Compose Batch</p>
            <h2>Schedule a new email campaign</h2>
          </div>
          <button className="ghost-button" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <form className="compose-form" onSubmit={handleSubmit}>
          <label>
            Subject
            <input
              required
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Quarterly outreach follow-up"
            />
          </label>

          <label>
            Body
            <textarea
              required
              rows={7}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write the message you want every lead to receive."
            />
          </label>

          <div className="form-grid">
            <label>
              Start time
              <input
                required
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </label>

            <label>
              Delay between emails (ms)
              <input
                required
                min={1000}
                step={500}
                type="number"
                value={delayBetweenMs}
                onChange={(event) => setDelayBetweenMs(Number(event.target.value))}
              />
            </label>

            <label>
              Hourly limit
              <input
                required
                min={1}
                type="number"
                value={hourlyLimit}
                onChange={(event) => setHourlyLimit(Number(event.target.value))}
              />
            </label>

            <label>
              Leads file
              <input accept=".csv,.txt" type="file" onChange={handleFileChange} />
            </label>
          </div>

          <div className="upload-summary">
            <strong>{recipients.length} recipient(s) detected</strong>
            <span>{selectedFileName || "No file selected yet."}</span>
            {previewRecipients.length > 0 ? <p>{previewRecipients.join(", ")}</p> : null}
          </div>

          {error ? <p className="error-copy">{error}</p> : null}

          <div className="modal-actions">
            <button className="ghost-button" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? "Scheduling..." : "Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
