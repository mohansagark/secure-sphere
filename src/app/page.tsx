"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AuthenticationPage } from "@/components/auth/AuthenticationPage";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {user ? <Dashboard /> : <AuthenticationPage />}
    </main>
  );
}
