import { useEffect, useState } from "react";
import { ComposeModal } from "../components/ComposeModal";
import { EmailTable } from "../components/EmailTable";
import { StateBlock } from "../components/StateBlock";
import { SummaryCards } from "../components/SummaryCards";
import { TopBar } from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import type { EmailSummary, ScheduledEmail, SentEmail } from "../types/api";

const emptySummary: EmailSummary = {
  scheduled: 0,
  sent: 0,
  failed: 0,
  totalCampaigns: 0,
};

export const DashboardPage = () => {
  const { token, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"scheduled" | "history">("scheduled");
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [summary, setSummary] = useState<EmailSummary>(emptySummary);
  const [composeOpen, setComposeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");

  const loadDashboard = async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [scheduledResponse, historyResponse, summaryResponse] = await Promise.all([
        apiRequest<{ items: ScheduledEmail[] }>("/api/emails/scheduled", {
          method: "GET",
          token,
        }),
        apiRequest<{ items: SentEmail[] }>("/api/emails/history", {
          method: "GET",
          token,
        }),
        apiRequest<EmailSummary>("/api/emails/summary", {
          method: "GET",
          token,
        }),
      ]);

      setScheduledEmails(scheduledResponse.items);
      setSentEmails(historyResponse.items);
      setSummary(summaryResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [token]);

  if (!user || !token) {
    return null;
  }

  const activeRows = activeTab === "scheduled" ? scheduledEmails : sentEmails;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <TopBar
          composeActive={composeOpen}
          user={user}
          onCompose={() => setComposeOpen((current) => !current)}
          onLogout={logout}
        />

        {banner ? (
          <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 shadow-sm">
            {banner}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
            {error}
          </div>
        ) : null}

        {composeOpen ? (
          <ComposeModal
            open={composeOpen}
            token={token}
            onClose={() => setComposeOpen(false)}
            onScheduled={async (message) => {
              setBanner(message);
              setComposeOpen(false);
              await loadDashboard();
            }}
          />
        ) : (
          <>
            <SummaryCards summary={summary} />

            <section className="rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Campaign Activity</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Review every scheduled and processed email in a clean inbox-style list.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="inline-flex rounded-xl bg-gray-100 p-1">
                    <button
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        activeTab === "scheduled"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                      onClick={() => setActiveTab("scheduled")}
                      type="button"
                    >
                      Scheduled
                    </button>
                    <button
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        activeTab === "history"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                      onClick={() => setActiveTab("history")}
                      type="button"
                    >
                      Sent
                    </button>
                  </div>

                  <button
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                    onClick={() => void loadDashboard()}
                    type="button"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {loading ? (
                  <StateBlock
                    title="Loading dashboard"
                    description="Pulling the latest scheduled and delivered email activity from the backend."
                  />
                ) : activeRows.length === 0 ? (
                  <StateBlock
                    title={activeTab === "scheduled" ? "No scheduled emails yet" : "No email history yet"}
                    description={
                      activeTab === "scheduled"
                        ? "Create a new batch to see queued emails appear here."
                        : "Sent and failed emails will show up here once the worker starts processing."
                    }
                  />
                ) : activeTab === "scheduled" ? (
                  <EmailTable mode="scheduled" rows={scheduledEmails} />
                ) : (
                  <EmailTable mode="history" rows={sentEmails} />
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};
