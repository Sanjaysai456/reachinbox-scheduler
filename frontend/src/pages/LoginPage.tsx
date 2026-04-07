import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import heroImage from "../assets/hero.png";
import { useAuth } from "../context/AuthContext";
import { appConfig } from "../lib/config";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { user, loginWithGoogleToken } = useAuth();
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const missingConfig = !appConfig.googleClientId;

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="login-copy">
          <p className="eyebrow">ReachInbox Scheduler</p>
          <h1>Reliable bulk email scheduling with restart-safe delivery.</h1>
          <p className="subtle-copy">
            Sign in with Google to schedule campaigns, inspect queued sends, and review
            Ethereal previews from a production-style dashboard.
          </p>

          <div className="feature-list">
            <span>BullMQ + Redis delayed execution</span>
            <span>Postgres persistence</span>
            <span>Google OAuth session flow</span>
          </div>
        </div>

        <div className="hero-art-card">
          <img src={heroImage} alt="Scheduler platform visual" />
        </div>
      </section>

      <section className="login-panel">
        <p className="eyebrow">Authentication</p>
        <h2>Continue with Google</h2>
        <p className="subtle-copy">
          Use a real Google identity to unlock the dashboard and API-backed scheduler.
        </p>

        {missingConfig ? (
          <p className="error-copy">
            Set <code>VITE_GOOGLE_CLIENT_ID</code> in the frontend environment first.
          </p>
        ) : (
          <GoogleLogin
            onError={() => setError("Google login failed. Please try again.")}
            onSuccess={async (credentialResponse) => {
              if (!credentialResponse.credential) {
                setError("Google did not return an identity token.");
                return;
              }

              try {
                setError("");
                await loginWithGoogleToken(credentialResponse.credential);
                navigate("/dashboard", { replace: true });
              } catch (loginError) {
                setError(loginError instanceof Error ? loginError.message : "Login failed.");
              }
            }}
            shape="pill"
            size="large"
            theme="outline"
            width="320"
          />
        )}

        {error ? <p className="error-copy">{error}</p> : null}
      </section>
    </main>
  );
};
