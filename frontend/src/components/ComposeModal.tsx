import { useMemo, useState, useRef } from "react";
import Papa from "papaparse";
import { apiRequest } from "../lib/api";
import { extractEmailsFromText } from "../lib/extract-emails";
import { formatForDateTimeLocal } from "../lib/format";

type ComposeModalProps = {
  open: boolean;
  token: string;
  onClose: () => void;
  onScheduled: (message: string) => Promise<void>;
};

const fieldClassName =
  "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10";

const subtleFieldClassName =
  "mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10";

const BackIcon = () => (
  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
    <path
      d="M10.25 6.75 5 12m0 0 5.25 5.25M5 12h14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </svg>
);

const SendIcon = () => (
  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
    <path
      d="m4.75 11.75 13.5-6.25c.59-.273 1.247.194 1.182.837l-1.31 12.968c-.058.584-.719.845-1.151.456L12 15.25l-4.842 2.87c-.53.315-1.194-.086-1.163-.701l.22-4.572-1.96-1.1c-.633-.355-.59-1.28.072-1.597Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </svg>
);

export const ComposeModal = ({ open, token, onClose, onScheduled }: ComposeModalProps) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [startTime, setStartTime] = useState(formatForDateTimeLocal(new Date(Date.now() + 60_000)));
  const [delayBetweenMs, setDelayBetweenMs] = useState(2000);
  const [hourlyLimit, setHourlyLimit] = useState(120);
  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewRecipients = useMemo(() => recipients.slice(0, 5), [recipients]);

  if (!open) {
    return null;
  }

  const updateRecipientsFromText = (text: string) => {
    const foundEmails = extractEmailsFromText(text);
    setRecipientInput(text);
    setRecipients(foundEmails);
    setError(foundEmails.length > 0 || text.trim().length === 0 ? "" : "Enter at least one valid recipient email.");
  };

  const handleRecipientsChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateRecipientsFromText(event.target.value);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const processText = (text: string) => {
      const newText = recipientInput ? recipientInput + " " + text : text;
      updateRecipientsFromText(newText);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (file.name.endsWith(".csv")) {
      Papa.parse(file, {
        complete: (results) => {
          const text = results.data.map((row: any) => Object.values(row).join(" ")).join("\n");
          processText(text);
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        processText(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (recipients.length === 0) {
      setError("Enter at least one valid recipient email.");
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
          startTime: new Date(startTime).toISOString(),
          delayBetweenMs,
          hourlyLimit,
        }),
      });

      setSubject("");
      setBody("");
      setRecipientInput("");
      setRecipients([]);
      await onScheduled(response.message);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Scheduling failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
            onClick={onClose}
            type="button"
          >
            <BackIcon />
            Back to dashboard
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-green-600">
              Compose Page
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              Compose New Email
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Add recipients, write the message once, and schedule the rollout with controlled
              pacing.
            </p>
          </div>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
          disabled={submitting}
          form="compose-email-form"
          type="submit"
        >
          <SendIcon />
          {submitting ? "Scheduling..." : "Send Campaign"}
        </button>
      </div>

      <form
        className="grid gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1.6fr)_360px]"
        id="compose-email-form"
        onSubmit={handleSubmit}
      >
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
            <div className="grid gap-5">
              <div className="grid gap-5 md:grid-cols-[140px_minmax(0,1fr)] md:items-start">
                <div className="pt-3">
                  <label className="block text-sm font-medium text-gray-500">Recipients</label>
                  <input
                    type="file"
                    accept=".txt,.csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-xs font-semibold text-green-600 hover:text-green-700 underline underline-offset-2"
                  >
                    Upload CSV/TXT
                  </button>
                </div>
                <div>
                  <textarea
                    className={`${fieldClassName} mt-0 min-h-[120px] resize-none`}
                    placeholder="Type or paste emails separated by commas, spaces, or new lines"
                    rows={5}
                    value={recipientInput}
                    onChange={handleRecipientsChange}
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    Example: `alex@example.com`, `sam@example.com` or one email per line.
                  </p>
                  <div className="mt-3 min-h-[56px] rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm">
                    {previewRecipients.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {previewRecipients.map((recipient) => (
                          <span
                            className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                            key={recipient}
                          >
                            {recipient}
                          </span>
                        ))}
                        {recipients.length > previewRecipients.length ? (
                          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                            +{recipients.length - previewRecipients.length} more
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Recipient chips will appear here as you type.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-[140px_minmax(0,1fr)] md:items-start">
                <label className="pt-3 text-sm font-medium text-gray-500" htmlFor="subject">
                  Subject
                </label>
                <input
                  className={fieldClassName}
                  id="subject"
                  placeholder="Quarterly outreach follow-up"
                  required
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-[140px_minmax(0,1fr)] md:items-start">
                <label className="pt-3 text-sm font-medium text-gray-500" htmlFor="body">
                  Message
                </label>
                <textarea
                  className={`${fieldClassName} min-h-[360px] resize-none`}
                  id="body"
                  placeholder="Write the message you want every lead to receive."
                  required
                  rows={12}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-400">
              Delivery settings
            </h3>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-gray-600">
                Schedule send
                <input
                  className={subtleFieldClassName}
                  required
                  type="datetime-local"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <label className="block text-sm font-medium text-gray-600">
                  Delay between emails (ms)
                  <input
                    className={subtleFieldClassName}
                    min={1000}
                    required
                    step={500}
                    type="number"
                    value={delayBetweenMs}
                    onChange={(event) => setDelayBetweenMs(Number(event.target.value))}
                  />
                </label>

                <label className="block text-sm font-medium text-gray-600">
                  Hourly limit
                  <input
                    className={subtleFieldClassName}
                    min={1}
                    required
                    type="number"
                    value={hourlyLimit}
                    onChange={(event) => setHourlyLimit(Number(event.target.value))}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-400">
              Recipient list
            </h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4">
                <p className="text-sm font-semibold text-gray-900">{recipients.length} recipient(s)</p>
                <p className="mt-1 text-sm text-gray-500">
                  {recipientInput.trim().length > 0 ? "Parsed from typed recipients." : "No recipients entered yet."}
                </p>
              </div>
              {previewRecipients.length > 0 ? (
                <div className="space-y-2">
                  {previewRecipients.map((recipient) => (
                    <div
                      className="truncate rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                      key={recipient}
                    >
                      {recipient}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  The first few typed recipients will appear here for quick verification.
                </p>
              )}
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          ) : null}

          <div className="flex gap-3">
            <button
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Scheduling..." : "Send"}
            </button>
          </div>
        </aside>
      </form>
    </section>
  );
};
