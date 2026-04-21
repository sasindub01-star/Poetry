import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useGetDashboardStats, useGetRecentActivity, useGetSubmissionTrends } from "@workspace/api-client-react";
import { getAuthUser } from "@/lib/auth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Link } from "wouter";

const COLORS = ["#C8A96E", "#1A7A6B", "#B85C5C", "#4F7CBF", "#8B6DB5"];

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/20",
  under_review: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  jury_assigned: "bg-purple-500/20 text-purple-400 border-purple-500/20",
  evaluated: "bg-teal-500/20 text-teal-400 border-teal-500/20",
  approved: "bg-green-500/20 text-green-400 border-green-500/20",
  rejected: "bg-red-500/20 text-red-400 border-red-500/20",
  archived: "bg-gray-500/20 text-gray-400 border-gray-500/20",
};

function StatCard({ label, value, icon, sub, color = "gold" }: { label: string; value: number | string; icon: React.ReactNode; sub?: string; color?: string }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-panel rounded-xl p-5 border border-gold/10 hover:border-gold/20 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-foreground/40 font-medium uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-display font-bold gold-gradient-text mb-1">{value}</div>
      {sub && <div className="text-xs text-foreground/40">{sub}</div>}
    </motion.div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    submission: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    evaluation: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    status_change: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    user_created: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
    jury_assigned: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  };
  const iconColors: Record<string, string> = {
    submission: "bg-blue-500/10 text-blue-400",
    evaluation: "bg-gold/10 text-gold",
    status_change: "bg-purple-500/10 text-purple-400",
    user_created: "bg-teal-500/10 text-teal-400",
    jury_assigned: "bg-amber-500/10 text-amber-400",
  };
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconColors[type] || "bg-gray-500/10 text-gray-400"}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icons[type] || icons.submission} />
      </svg>
    </div>
  );
}

const fallbackStats = {
  totalSubmissions: 247,
  pendingReview: 43,
  juryAssigned: 38,
  evaluated: 62,
  approved: 86,
  rejected: 18,
  totalPoets: 189,
  totalJuryMembers: 12,
  averageScore: 7.8,
  submissionsThisMonth: 47,
  approvalRate: 35,
  statusBreakdown: [
    { status: "pending", count: 43, percentage: 17 },
    { status: "under_review", count: 41, percentage: 17 },
    { status: "jury_assigned", count: 38, percentage: 15 },
    { status: "evaluated", count: 62, percentage: 25 },
    { status: "approved", count: 86, percentage: 35 },
    { status: "rejected", count: 18, percentage: 7 },
  ],
  poemTypeBreakdown: [
    { type: "nabati", count: 112 },
    { type: "classical", count: 78 },
    { type: "modern", count: 57 },
  ],
  nationalityBreakdown: [
    { nationality: "UAE", count: 99 },
    { nationality: "Saudi Arabia", count: 62 },
    { nationality: "Kuwait", count: 25 },
    { nationality: "Bahrain", count: 20 },
    { nationality: "Qatar", count: 17 },
  ],
};

const fallbackTrends = [
  { month: "Jan", submissions: 12, approved: 4, rejected: 3 },
  { month: "Feb", submissions: 18, approved: 6, rejected: 5 },
  { month: "Mar", submissions: 25, approved: 9, rejected: 6 },
  { month: "Apr", submissions: 31, approved: 11, rejected: 8 },
  { month: "May", submissions: 28, approved: 10, rejected: 7 },
  { month: "Jun", submissions: 42, approved: 15, rejected: 11 },
  { month: "Jul", submissions: 38, approved: 13, rejected: 10 },
  { month: "Aug", submissions: 55, approved: 19, rejected: 14 },
  { month: "Sep", submissions: 47, approved: 16, rejected: 12 },
  { month: "Oct", submissions: 63, approved: 22, rejected: 16 },
  { month: "Nov", submissions: 58, approved: 20, rejected: 15 },
  { month: "Dec", submissions: 72, approved: 25, rejected: 18 },
];

const fallbackActivity = [
  { id: 1, type: "submission", title: "New poem submitted", description: "Saeed Al Ameri submitted 'Spirit of the Nation'", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), actor: "Saeed Al Ameri" },
  { id: 2, type: "status_change", title: "Submission approved", description: "Omar Al Shamsi - 'The Brave Falcon' approved", timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), actor: "Dr. Sultan" },
  { id: 3, type: "evaluation", title: "Evaluation submitted", description: "Score 9.2 — Exceptional quality", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), actor: "Prof. Ahmad" },
  { id: 4, type: "jury_assigned", title: "Jury assigned", description: "3 jury members assigned to Pearl of the Gulf", timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), actor: "Fatima Al Rashidi" },
  { id: 5, type: "submission", title: "New poem submitted", description: "Noura Al Dosari submitted 'Blue Waters'", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), actor: "Noura Al Dosari" },
];

export default function DashboardHome() {
  const { t } = useLanguage();
  const user = getAuthUser();
  const isJury = user?.role === "jury";
  const isReviewer = user?.role === "reviewer";
  const isSultan = user?.role === "sultan" || (user?.role as string) === "dr_sultan";
  const useJuryStyleDashboard = isJury || isReviewer || isSultan;
  const { data: stats } = useGetDashboardStats();
  const { data: activityData } = useGetRecentActivity({ limit: 8 });
  const { data: trendsData } = useGetSubmissionTrends();

  const s = stats || fallbackStats;
  const trends = trendsData?.trends || fallbackTrends;
  const activities = activityData?.activities || fallbackActivity;

  const juryAssigned = [
    { id: 1, referenceNumber: "AHA-2026-001", poemTitle: "Desert Song", assignedAt: "2026-01-20T08:00:00Z", deadlineAt: "2026-01-22T08:00:00Z", status: "pending" },
    { id: 2, referenceNumber: "AHA-2026-002", poemTitle: "Voice of the Palm", assignedAt: "2026-01-30T09:00:00Z", deadlineAt: "2026-02-01T09:00:00Z", status: "pending" },
    { id: 3, referenceNumber: "AHA-2026-003", poemTitle: "Pearl of the Gulf", assignedAt: "2026-02-08T12:00:00Z", deadlineAt: "2026-02-10T12:00:00Z", status: "pending" },
    { id: 5, referenceNumber: "AHA-2026-005", poemTitle: "The Brave Falcon", assignedAt: "2026-01-10T11:00:00Z", deadlineAt: "2026-01-12T11:00:00Z", status: "submitted" },
    { id: 9, referenceNumber: "AHA-2026-009", poemTitle: "The Brave Camel", assignedAt: "2026-02-05T10:00:00Z", deadlineAt: "2026-02-07T10:00:00Z", status: "submitted" },
    { id: 12, referenceNumber: "AHA-2026-012", poemTitle: "The Golden Dunes", assignedAt: "2026-01-15T14:00:00Z", deadlineAt: "2026-01-17T14:00:00Z", status: "submitted" },
    { id: 15, referenceNumber: "AHA-2026-015", poemTitle: "Spirit of the Nation", assignedAt: "2026-01-22T16:00:00Z", deadlineAt: "2026-01-24T16:00:00Z", status: "submitted" },
    { id: 10, referenceNumber: "AHA-2026-010", poemTitle: "Whisper of the Wind", assignedAt: "2026-02-25T09:00:00Z", deadlineAt: "2026-02-27T09:00:00Z", status: "expired" },
  ];

  const juryStatCards = [
    { label: "Total Submissions", value: juryAssigned.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
    { label: "Pending Reviews", value: juryAssigned.filter((s) => s.status === "pending").length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
    { label: "Approved", value: juryAssigned.filter((s) => s.status === "submitted").length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> },
    { label: "Rejected", value: juryAssigned.filter((s) => s.status === "expired").length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg> },
  ];

  const statCards = [
    { label: t("totalSubmissions"), value: s.totalSubmissions, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>, sub: `+${s.submissionsThisMonth} this month` },
    { label: t("pendingReview"), value: s.pendingReview, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, sub: "Awaiting initial review" },
    { label: t("approved"), value: s.approved, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, sub: `${s.approvalRate}% approval rate` },
    { label: "Avg Score", value: s.averageScore?.toFixed(1) || "7.8", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>, sub: "Average jury score" },
  ];

  const containerV = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
  const itemV = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <DashboardLayout>
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-display font-bold">
          {t("welcome")}, <span className="gold-gradient-text">{user?.name?.split(" ")[0]}</span>
        </h1>
        <p className="text-foreground/50 text-sm mt-1">National Poets Evaluation Service — {t("overview")}</p>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        variants={containerV}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {(useJuryStyleDashboard ? juryStatCards : statCards).map((card, i) => (
          <motion.div key={i} variants={itemV}>
            <StatCard {...card} />
          </motion.div>
        ))}
      </motion.div>

      {useJuryStyleDashboard ? (
        <div className="grid lg:grid-cols-5 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass-panel rounded-xl p-5 border border-gold/10"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Latest 10 Submissions</h3>
              <Link href="/dashboard/submissions" className="text-xs text-gold hover:underline">
                Open submissions
              </Link>
            </div>
            <div className="space-y-1">
              {juryAssigned.slice(0, 10).map((row, i) => (
                <Link key={row.id} href={`/dashboard/submissions?open=${row.id}`}>
                  <div className="px-3 py-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3 cursor-pointer">
                    <span className="w-6 text-xs text-gold font-semibold">{i + 1}.</span>
                    <span className="text-sm">{row.poemTitle}</span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-3 glass-panel rounded-xl p-5 border border-gold/10"
          >
            <h3 className="text-sm font-semibold mb-4">Submission Trends</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={isReviewer || isSultan ? trends : fallbackTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,169,110,0.08)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(200,169,110,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(200,169,110,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="submissions" stroke="#C8A96E" strokeWidth={2} dot={false} />
                {(isReviewer || isSultan) && <Line type="monotone" dataKey="approved" stroke="#1A7A6B" strokeWidth={2} dot={false} />}
                {(isReviewer || isSultan) && <Line type="monotone" dataKey="rejected" stroke="#B85C5C" strokeWidth={2} dot={false} />}
              </LineChart>
            </ResponsiveContainer>
            {(isReviewer || isSultan) && (
              <div className="flex gap-4 mt-3">
                {[{ label: "Submissions", color: "#C8A96E" }, { label: "Approved", color: "#1A7A6B" }, { label: "Rejected", color: "#B85C5C" }].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 text-xs text-foreground/50">
                    <div className="w-3 h-0.5 rounded" style={{ background: item.color }} />
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      ) : (
      <>
      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Trend chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-panel rounded-xl p-5 border border-gold/10"
        >
          <h3 className="text-sm font-semibold mb-4">{t("submissionTrends")}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,169,110,0.08)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(200,169,110,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(200,169,110,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#C8A96E" }}
              />
              <Line type="monotone" dataKey="submissions" stroke="#C8A96E" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="approved" stroke="#1A7A6B" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="rejected" stroke="#B85C5C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            {[{ label: "Submissions", color: "#C8A96E" }, { label: "Approved", color: "#1A7A6B" }, { label: "Rejected", color: "#B85C5C" }].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs text-foreground/50">
                <div className="w-3 h-0.5 rounded" style={{ background: item.color }} />
                {item.label}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Status pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel rounded-xl p-5 border border-gold/10"
        >
          <h3 className="text-sm font-semibold mb-4">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={s.statusBreakdown?.slice(0, 5)}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="count"
                nameKey="status"
              >
                {s.statusBreakdown?.slice(0, 5).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: 8, fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {s.statusBreakdown?.slice(0, 5).map((item, i) => (
              <div key={item.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-foreground/50 capitalize">{item.status.replace("_", " ")}</span>
                </div>
                <span className="text-foreground/70 font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      </>
      )}

      {!useJuryStyleDashboard && (
      <>
      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel rounded-xl p-5 border border-gold/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">{t("recentActivity")}</h3>
            <Link href="/dashboard/submissions" className="text-xs text-gold hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-3">
                <ActivityIcon type={activity.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <p className="text-xs text-foreground/40 truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-foreground/30 flex-shrink-0">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Poem types bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-panel rounded-xl p-5 border border-gold/10"
        >
          <h3 className="text-sm font-semibold mb-4">Poem Types</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={s.poemTypeBreakdown} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,169,110,0.08)" vertical={false} />
              <XAxis dataKey="type" tick={{ fill: "rgba(200,169,110,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(200,169,110,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#C8A96E" }}
              />
              <Bar dataKey="count" fill="#C8A96E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {/* Nationality mini-list */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-foreground/40 mb-2">Top Nationalities</p>
            <div className="space-y-1.5">
              {s.nationalityBreakdown?.slice(0, 3).map((item) => (
                <div key={item.nationality} className="flex items-center gap-2">
                  <div className="flex-1 bg-border/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full gold-gradient rounded-full"
                      style={{ width: `${Math.round((item.count / s.totalSubmissions) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-foreground/50 w-20 text-right">{item.nationality} ({item.count})</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      </>
      )}
    </DashboardLayout>
  );
}
