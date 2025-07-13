import { AuthTestPageSimple } from "@/components/debug/AuthTestPageSimple";

export default function AuthTestPageRoute() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <AuthTestPageSimple />
      </div>
    </div>
  );
}
