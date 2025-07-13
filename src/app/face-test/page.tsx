import { BiometricTest } from "@/components/debug/BiometricTest";

export default function FaceTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <BiometricTest />
      </div>
    </div>
  );
}
