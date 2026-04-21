import { Link } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function AccessDenied() {
  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto mt-20 glass-panel rounded-xl border border-gold/15 p-8 text-center">
        <h1 className="text-2xl font-display font-bold mb-2">Access Denied</h1>
        <p className="text-foreground/60 mb-6">
          You do not have permission to open this section.
        </p>
        <Link href="/dashboard" className="inline-flex px-4 py-2 rounded-lg gold-gradient text-navy font-semibold">
          Go to dashboard
        </Link>
      </div>
    </DashboardLayout>
  );
}
