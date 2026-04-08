import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import heroImage from "../assets/hero.png";
import { useAuth } from "../context/AuthContext";
import { appConfig } from "../lib/config";

const features = [
  "Inbox-style campaign monitoring",
  "Google OAuth access",
  "Queued scheduling with Redis",
];

export const LoginPage = () => {
  const navigate = useNavigate();
  const { user, loginWithGoogleToken } = useAuth();
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const missingConfig = !appConfig.googleClientId;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_440px] lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-sm">
          <div className="grid gap-8 p-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:p-12">
            <div className="flex flex-col justify-center">
              <span className="text-xs font-semibold uppercase tracking-[0.32em] text-green-600">
                ReachInbox Scheduler
              </span>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                Manage bulk outreach from a clean, modern email dashboard.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-gray-500">
                Sign in with Google to schedule campaigns, inspect delivery history, and monitor
                queue health from a calm SaaS-style workspace.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {features.map((feature) => (
                  <span
                    className="rounded-full border border-green-100 bg-green-50 px-4 py-2 text-sm font-medium text-green-700"
                    key={feature}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 via-white to-gray-100 p-6">
              <div className="absolute inset-x-10 top-6 h-24 rounded-full bg-green-200/40 blur-3xl" />
              <div className="relative rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-lg backdrop-blur">
                <img
                  alt="Scheduler platform visual"
                  className="w-full rounded-2xl object-cover"
                  src={heroImage}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-[28px] border border-gray-100 bg-white p-8 shadow-sm sm:p-10">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-green-600">
              Login
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
              Continue with Google
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Use your Google account to unlock the dashboard and keep your scheduler sessions in
              sync.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {missingConfig ? (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Set <code className="rounded bg-white px-1.5 py-0.5 text-xs">VITE_GOOGLE_CLIENT_ID</code>{" "}
                in the frontend environment first.
              </div>
            ) : (
              <div className="flex justify-center">
                <GoogleLogin
                  onError={() => setError("Google login failed. Please try again.")}
                  onSuccess={async (credentialResponse: CredentialResponse) => {
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
              </div>
            )}

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-gray-300">
              <div className="h-px flex-1 bg-gray-200" />
              Secure access
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="rounded-2xl bg-gray-50 p-5">
              <div className="grid gap-4 text-sm text-gray-500">
                <div className="flex items-center justify-between">
                  <span>Session provider</span>
                  <span className="font-medium text-gray-700">Google OAuth</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dashboard style</span>
                  <span className="font-medium text-gray-700">Modern inbox UI</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery backend</span>
                  <span className="font-medium text-gray-700">API-backed scheduler</span>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
};
