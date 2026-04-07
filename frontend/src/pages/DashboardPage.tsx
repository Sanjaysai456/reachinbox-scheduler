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
    <main className="dashboard-page">
      <TopBar user={user} onCompose={() => setComposeOpen(true)} onLogout={logout} />

      {banner ? <div className="banner success">{banner}</div> : null}
      {error ? <div className="banner error">{error}</div> : null}

      <SummaryCards summary={summary} />

      <section className="panel tabs-panel">
        <div className="tabs-header">
          <div className="tab-buttons">
            <button
              className={activeTab === "scheduled" ? "tab-button active" : "tab-button"}
              onClick={() => setActiveTab("scheduled")}
              type="button"
            >
              Scheduled Emails
            </button>
            <button
              className={activeTab === "history" ? "tab-button active" : "tab-button"}
              onClick={() => setActiveTab("history")}
              type="button"
            >
              Sent Emails
            </button>
          </div>

          <button className="ghost-button" onClick={() => void loadDashboard()} type="button">
            Refresh
          </button>
        </div>

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
      </section>

      <ComposeModal
        open={composeOpen}
        token={token}
        onClose={() => setComposeOpen(false)}
        onScheduled={async (message) => {
          setBanner(message);
          await loadDashboard();
        }}
      />
    </main>
  );
};
