import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/useLanguage";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getAuthUser, canSeeIdentity, isReadOnly } from "@/lib/auth";
import { useTheme } from "@/hooks/useTheme";

// ─── Status colours ────────────────────────────────────────────────────────────
const statusColorsDark: Record<string, string> = {
  draft: "bg-slate-500/15 text-slate-400 border border-slate-500/20",
  received: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20",
  pending: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  under_review: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  pending_information: "bg-orange-500/15 text-orange-400 border border-orange-500/20",
  ready_for_jury: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  jury_form_under_review: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20",
  sent_to_jury: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  jury_assigned: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  under_jury_review: "bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/20",
  evaluated: "bg-teal-500/15 text-teal-400 border border-teal-500/20",
  jury_review_closed: "bg-teal-600/15 text-teal-300 border border-teal-600/20",
  under_consolidation: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  final_form_under_review: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
  sent_for_final_decision: "bg-amber-600/15 text-amber-300 border border-amber-600/20",
  approved: "bg-green-500/15 text-green-400 border border-green-500/20",
  rejected: "bg-red-500/15 text-red-400 border border-red-500/20",
  returned_for_clarification: "bg-orange-600/15 text-orange-300 border border-orange-600/20",
  archived: "bg-gray-500/15 text-gray-400 border border-gray-500/20",
};
const statusColorsLight: Record<string, string> = {
  draft: "bg-slate-200 text-slate-800 border border-slate-300",
  received: "bg-cyan-100 text-cyan-800 border border-cyan-300",
  pending: "bg-amber-100 text-amber-900 border border-amber-300",
  under_review: "bg-blue-100 text-blue-900 border border-blue-300",
  pending_information: "bg-orange-100 text-orange-900 border border-orange-300",
  ready_for_jury: "bg-violet-100 text-violet-900 border border-violet-300",
  jury_form_under_review: "bg-indigo-100 text-indigo-900 border border-indigo-300",
  sent_to_jury: "bg-purple-100 text-purple-900 border border-purple-300",
  jury_assigned: "bg-purple-100 text-purple-900 border border-purple-300",
  under_jury_review: "bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-300",
  evaluated: "bg-teal-100 text-teal-900 border border-teal-300",
  jury_review_closed: "bg-teal-200 text-teal-900 border border-teal-300",
  under_consolidation: "bg-emerald-100 text-emerald-900 border border-emerald-300",
  final_form_under_review: "bg-yellow-100 text-yellow-900 border border-yellow-300",
  sent_for_final_decision: "bg-amber-200 text-amber-900 border border-amber-400",
  approved: "bg-green-100 text-green-900 border border-green-300",
  rejected: "bg-red-100 text-red-900 border border-red-300",
  returned_for_clarification: "bg-orange-200 text-orange-900 border border-orange-400",
  archived: "bg-gray-100 text-gray-800 border border-gray-300",
};

// ─── All 15 BRD statuses (excluding draft) ─────────────────────────────────────
const ALL_STATUSES = [
  "received",
  "under_review",
  "pending_information",
  "ready_for_jury",
  "jury_form_under_review",
  "sent_to_jury",
  "under_jury_review",
  "jury_review_closed",
  "under_consolidation",
  "final_form_under_review",
  "sent_for_final_decision",
  "approved",
  "rejected",
  "returned_for_clarification",
  "archived",
];

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    received: "Received",
    under_review: "Under Review",
    pending_information: "Pending Update",
    ready_for_jury: "Ready for Jury",
    jury_form_under_review: "Jury Form Under Review",
    sent_to_jury: "Sent to Jury",
    under_jury_review: "Under Jury Review",
    jury_review_closed: "Jury Review Closed",
    under_consolidation: "Under Consolidation",
    final_form_under_review: "Final Form Under Review",
    sent_for_final_decision: "Sent for Final Decision",
    approved: "Approved",
    rejected: "Rejected",
    returned_for_clarification: "Returned for Clarification",
    archived: "Archived",
  };
  return labels[status] ?? status.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Submission {
  id: number;
  referenceNumber: string;
  poetName: string;
  poetNameAr: string;
  poetNationality: string;
  poemTitle: string;
  poemTitleAr: string;
  poemType: string;
  status: string;
  submittedAt: string;
  finalScore: number | null;
  channel?: string;
}

interface JuryAssignment {
  submissionId: number;
  assignedAt: string;
  deadlineAt: string;
  status: "pending" | "submitted" | "expired";
}

// ─── Fake data ─────────────────────────────────────────────────────────────────
const fakeSubmissions: Submission[] = [
  { id: 1,  referenceNumber: "AHA-2026-001", poetName: "Mohammed Al Mansoori",  poetNameAr: "محمد المنصوري",   poetNationality: "UAE",          poemTitle: "Desert Song",           poemTitleAr: "أغنية الصحراء",       poemType: "nabati",    status: "approved",                  submittedAt: "2026-01-20T10:00:00Z", finalScore: 9.2, channel: "Email" },
  { id: 2,  referenceNumber: "AHA-2026-002", poetName: "Fatima Al Hashimi",      poetNameAr: "فاطمة الهاشمي",   poetNationality: "UAE",          poemTitle: "Voice of the Palm",     poemTitleAr: "صوت النخيل",          poemType: "classical", status: "under_review",              submittedAt: "2026-01-30T10:00:00Z", finalScore: null, channel: "WhatsApp" },
  { id: 3,  referenceNumber: "AHA-2026-003", poetName: "Khalid Al Rashidi",      poetNameAr: "خالد الراشدي",   poetNationality: "UAE",          poemTitle: "Pearl of the Gulf",     poemTitleAr: "لؤلؤة الخليج",        poemType: "nabati",    status: "jury_form_under_review",    submittedAt: "2026-02-08T10:00:00Z", finalScore: null, channel: "Internal Referral" },
  { id: 4,  referenceNumber: "AHA-2026-004", poetName: "Aisha Al Marzouqi",      poetNameAr: "عائشة المرزوقي", poetNationality: "UAE",          poemTitle: "Sunset over Abu Dhabi", poemTitleAr: "غروب أبوظبي",         poemType: "modern",    status: "under_review",              submittedAt: "2026-02-18T10:00:00Z", finalScore: null, channel: "Email" },
  { id: 5,  referenceNumber: "AHA-2026-005", poetName: "Omar Al Shamsi",         poetNameAr: "عمر الشمسي",     poetNationality: "UAE",          poemTitle: "The Brave Falcon",      poemTitleAr: "الصقر الشجاع",        poemType: "nabati",    status: "sent_for_final_decision",   submittedAt: "2026-01-10T10:00:00Z", finalScore: null, channel: "Direct Submission" },
  { id: 6,  referenceNumber: "AHA-2026-006", poetName: "Mariam Al Nuaimi",       poetNameAr: "مريم النعيمي",   poetNationality: "UAE",          poemTitle: "Tears of the Moon",     poemTitleAr: "دموع القمر",          poemType: "modern",    status: "received",                  submittedAt: "2026-04-10T10:00:00Z", finalScore: null, channel: "WhatsApp" },
  { id: 7,  referenceNumber: "AHA-2026-007", poetName: "Rashid Al Ketbi",        poetNameAr: "راشد الكتبي",    poetNationality: "Saudi Arabia", poemTitle: "Mountains of Hejaz",    poemTitleAr: "جبال الحجاز",         poemType: "classical", status: "pending_information",       submittedAt: "2026-02-08T10:00:00Z", finalScore: null, channel: "Email" },
  { id: 8,  referenceNumber: "AHA-2026-008", poetName: "Noura Al Dosari",        poetNameAr: "نورة الدوسري",   poetNationality: "Qatar",        poemTitle: "Blue Waters",           poemTitleAr: "المياه الزرقاء",      poemType: "nabati",    status: "pending_information",       submittedAt: "2026-04-15T10:00:00Z", finalScore: null, channel: "Internal Referral" },
  { id: 9,  referenceNumber: "AHA-2026-009", poetName: "Yousef Al Hammadi",      poetNameAr: "يوسف الحمادي",   poetNationality: "UAE",          poemTitle: "The Brave Camel",       poemTitleAr: "الجمل الشجاع",        poemType: "nabati",    status: "rejected",                  submittedAt: "2026-02-05T10:00:00Z", finalScore: 4.2,  channel: "Email" },
  { id: 10, referenceNumber: "AHA-2026-010", poetName: "Hessa Al Falasi",        poetNameAr: "حصة الفلاسي",    poetNationality: "UAE",          poemTitle: "Whisper of the Wind",   poemTitleAr: "همس الريح",           poemType: "modern",    status: "under_jury_review",         submittedAt: "2026-02-25T10:00:00Z", finalScore: null, channel: "WhatsApp" },
  { id: 11, referenceNumber: "AHA-2026-011", poetName: "Abdullah Al Muhairi",    poetNameAr: "عبدالله المهيري", poetNationality: "UAE",         poemTitle: "Heritage of the Ancestors", poemTitleAr: "إرث الأجداد",     poemType: "classical", status: "ready_for_jury",            submittedAt: "2026-03-21T10:00:00Z", finalScore: null, channel: "Direct Submission" },
  { id: 12, referenceNumber: "AHA-2026-012", poetName: "Sheikha Al Qasimi",      poetNameAr: "شيخة القاسمي",   poetNationality: "UAE",          poemTitle: "The Golden Dunes",      poemTitleAr: "الكثبان الذهبية",     poemType: "nabati",    status: "approved",                  submittedAt: "2026-01-15T10:00:00Z", finalScore: 8.9, channel: "Email" },
  { id: 13, referenceNumber: "AHA-2026-013", poetName: "Ibrahim Al Dhaheri",     poetNameAr: "إبراهيم الظاهري", poetNationality: "UAE",         poemTitle: "Song of the Sailors",   poemTitleAr: "أغنية البحارة",       poemType: "classical", status: "jury_review_closed",        submittedAt: "2026-02-05T10:00:00Z", finalScore: null, channel: "Internal Referral" },
  { id: 14, referenceNumber: "AHA-2026-014", poetName: "Maitha Al Suwaidi",      poetNameAr: "ميثاء السويدي",  poetNationality: "UAE",          poemTitle: "The Last Bedouin",      poemTitleAr: "آخر البدو",           poemType: "modern",    status: "received",                  submittedAt: "2026-04-17T10:00:00Z", finalScore: null, channel: "WhatsApp" },
  { id: 15, referenceNumber: "AHA-2026-015", poetName: "Saeed Al Ameri",         poetNameAr: "سعيد العامري",   poetNationality: "UAE",          poemTitle: "Spirit of the Nation",  poemTitleAr: "روح الأمة",           poemType: "nabati",    status: "final_form_under_review",   submittedAt: "2026-01-22T10:00:00Z", finalScore: null, channel: "Email" },
];

const juryAssignments: JuryAssignment[] = [
  { submissionId: 10, assignedAt: "2026-02-25T09:00:00Z", deadlineAt: "2026-02-27T09:00:00Z", status: "pending" },
  { submissionId: 1,  assignedAt: "2026-01-20T08:00:00Z", deadlineAt: "2026-01-22T08:00:00Z", status: "submitted" },
  { submissionId: 9,  assignedAt: "2026-02-05T10:00:00Z", deadlineAt: "2026-02-07T10:00:00Z", status: "submitted" },
  { submissionId: 12, assignedAt: "2026-01-15T14:00:00Z", deadlineAt: "2026-01-17T14:00:00Z", status: "submitted" },
];

// Jury-only data
const JURY_STATUSES = ["all", "pending", "submitted", "expired"];
const SULTAN_STATUSES = ["pending", "approved", "rejected"] as const;
const SULTAN_DECISIONS_KEY = "sultan-final-decisions";

export default function SubmissionsPage() {
  const { lang } = useLanguage();
  const { isDark } = useTheme();
  const user = getAuthUser();
  const role = user?.role;
  const showIdentity = canSeeIdentity(role);
  const readOnly = isReadOnly(role);
  const isJury = role === "jury";
  const isReviewer = role === "reviewer" || role === "sysadmin" || role === "admin";
  const isSultan = role === "sultan" || (role as string) === "dr_sultan";

  const [statusFilter, setStatusFilter] = useState(isSultan ? "pending" : "all");
  const [search, setSearch] = useState("");
  const [sultanDecisions, setSultanDecisions] = useState<Record<number, "approved" | "rejected">>({});

  // Jury-only modal state
  const [activeSub, setActiveSub] = useState<Submission | null>(null);
  const [decisionType, setDecisionType] = useState<"accept" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState<Record<number, "accept" | "reject">>({});
  const [selectedAssignmentStatus, setSelectedAssignmentStatus] = useState<"pending" | "submitted" | "expired" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const statusColors = isDark ? statusColorsDark : statusColorsLight;

  const statuses = isJury ? JURY_STATUSES : isSultan ? [...SULTAN_STATUSES] : ["all", ...ALL_STATUSES];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SULTAN_DECISIONS_KEY);
      setSultanDecisions(raw ? JSON.parse(raw) : {});
    } catch {
      setSultanDecisions({});
    }
  }, []);

  useEffect(() => {
    if (isSultan && !SULTAN_STATUSES.includes(statusFilter as (typeof SULTAN_STATUSES)[number])) {
      setStatusFilter("pending");
    }
  }, [isSultan, statusFilter]);

  const filtered = useMemo(() => {
    const getEffectiveStatus = (s: Submission) =>
      isSultan && sultanDecisions[s.id] ? sultanDecisions[s.id] : s.status;

    let list = fakeSubmissions.map((s) => ({ ...s, status: getEffectiveStatus(s) }));
    if (isJury) {
      const assignedIds = new Set(juryAssignments.map((a) => a.submissionId));
      list = list.filter((s) => assignedIds.has(s.id));
    } else if (isSultan) {
      list = list.filter(
        (s) => s.status === "sent_for_final_decision" || s.status === "approved" || s.status === "rejected"
      );
    }
    return list.filter((s) => {
      const assignment = juryAssignments.find((a) => a.submissionId === s.id);
      const juryStatus = assignment?.status;
      const matchStatus =
        statusFilter === "all" ||
        (isJury
          ? juryStatus === statusFilter
          : isSultan
            ? (statusFilter === "pending"
                ? s.status === "sent_for_final_decision"
                : s.status === statusFilter)
            : s.status === statusFilter);
      const matchSearch =
        !search ||
        (showIdentity && s.poetName.toLowerCase().includes(search.toLowerCase())) ||
        s.poemTitle.toLowerCase().includes(search.toLowerCase()) ||
        s.referenceNumber.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [statusFilter, search, isJury, isSultan, showIdentity, sultanDecisions]);

  // Reviewer "requests needing action" count = rows in Received status
  const needsAction = useMemo(() =>
    fakeSubmissions.filter((s) => s.status === "received"),
    []
  );

  // ── Jury modal helpers ──────────────────────────────────────────────────────
  const openModal = (sub: Submission, aStatus: "pending" | "submitted" | "expired" | null = null) => {
    if (aStatus === "expired") return;
    setActiveSub(sub);
    setSelectedAssignmentStatus(aStatus);
    setDecisionType(null);
    setComment("");
  };
  const closeModal = () => {
    setActiveSub(null);
    setSelectedAssignmentStatus(null);
    setDecisionType(null);
    setComment("");
  };
  const handleSubmitDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSub || !decisionType) return;
    if (selectedAssignmentStatus !== "pending") { closeModal(); return; }
    if (decisionType === "reject" && comment.trim().length < 10) {
      showToast(lang === "ar" ? "يرجى تقديم سبب مفصل للرفض" : "Please provide a detailed reason for rejection");
      return;
    }
    setSubmitted((s) => ({ ...s, [activeSub.id]: decisionType }));
    showToast(decisionType === "accept"
      ? (lang === "ar" ? "تم تسجيل التقييم بنجاح" : "Evaluation submitted successfully")
      : (lang === "ar" ? "تم تسجيل الرفض" : "Rejection recorded")
    );
    closeModal();
  };
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  return (
    <DashboardLayout>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">
            {isJury
              ? (lang === "ar" ? "الطلبات المخصصة لي" : "My Assigned Submissions")
              : (lang === "ar" ? "الطلبات" : "Submissions")}
          </h1>
          <p className="text-foreground/40 text-sm mt-0.5">
            {filtered.length} {lang === "ar" ? "سجل" : "records"}
            {isReviewer && !readOnly && (
              <span className="ms-3 inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 font-medium">
                  {lang === "ar" ? "الطلبات التي تحتاج إجراء" : "Requests needing action"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium border border-amber-500/20">
                  {needsAction.length}
                </span>
              </span>
            )}
            {isJury && (
              <span className="ms-2 text-gold/70">
                · {lang === "ar" ? "وضع المراجعة المغفلة (هوية الشاعر مخفية)" : "Blind review mode — poet identity hidden"}
              </span>
            )}
            {isSultan && (
              <span className="ms-2 text-gold/70">
                · {lang === "ar" ? "الطلبات المحالة للقرار النهائي" : "Submissions awaiting final decision"}
              </span>
            )}
            {readOnly && (
              <span className="ms-2 text-amber-400">
                · {lang === "ar" ? "للقراءة فقط" : "Read-only"}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div id="all-submissions" className="glass-panel rounded-xl p-4 border border-gold/10 mb-4">
        <div className="flex flex-col gap-3">
          <input
            type="search"
            placeholder={lang === "ar" ? "بحث برقم المرجع أو العنوان…" : "Search by reference, title or poet…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-gold/50 transition-all"
          />
          <div className="flex gap-2 flex-wrap">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  statusFilter === s
                    ? "gold-gradient text-navy"
                    : "border border-border text-foreground/50 hover:border-gold/30 hover:text-foreground"
                }`}
              >
                {isSultan
                  ? (s === "pending" ? "Pending" : s === "approved" ? "Approved" : "Rejected")
                  : s === "all"
                    ? (lang === "ar" ? "الكل" : "All")
                    : (isJury ? (s.charAt(0).toUpperCase() + s.slice(1)) : statusLabel(s))}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main table ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-xl border border-gold/10 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground/40 uppercase tracking-wider whitespace-nowrap">
                  {lang === "ar" ? "المرجع" : "Reference"}
                </th>
                {showIdentity && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-foreground/40 uppercase tracking-wider whitespace-nowrap">
                    {lang === "ar" ? "الشاعر" : "Poet"}
                  </th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground/40 uppercase tracking-wider whitespace-nowrap">
                  {lang === "ar" ? "العنوان" : "Poem Title"}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground/40 uppercase tracking-wider whitespace-nowrap">
                  {lang === "ar" ? "النوع" : "Type"}
                </th>
                {!isJury && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-foreground/40 uppercase tracking-wider whitespace-nowrap">
                    {lang === "ar" ? "القناة" : "Channel"}
                  </th>
                )}
                {isJury && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-foreground/40 uppercase tracking-wider whitespace-nowrap">
                    {lang === "ar" ? "الموعد النهائي" : "Deadline"}
                  </th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground/40 uppercase tracking-wider whitespace-nowrap">
                  {lang === "ar" ? "الحالة" : "Status"}
                </th>
                {!isJury && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-foreground/40 uppercase tracking-wider whitespace-nowrap">
                    {lang === "ar" ? "التاريخ" : "Date"}
                  </th>
                )}
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((sub, i) => {
                const assignment = juryAssignments.find((a) => a.submissionId === sub.id);
                const assignmentStatus: "pending" | "submitted" | "expired" | null =
                  submitted[sub.id] ? "submitted" : (assignment?.status ?? null);

                return (
                  <motion.tr
                    key={sub.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.4) }}
                    className="hover:bg-white/2 transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-foreground/60">{sub.referenceNumber}</td>
                    {showIdentity && (
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{lang === "ar" ? sub.poetNameAr : sub.poetName}</div>
                        <div className="text-xs text-foreground/40">{sub.poetNationality}</div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-medium">{lang === "ar" ? sub.poemTitleAr : sub.poemTitle}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize text-foreground/60">{sub.poemType}</span>
                    </td>
                    {!isJury && (
                      <td className="px-4 py-3 text-xs text-foreground/50 whitespace-nowrap">
                        {sub.channel ?? "—"}
                      </td>
                    )}
                    {isJury && (
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {assignmentStatus === "expired" ? (
                          <span className={isDark ? "text-red-400" : "text-red-800"}>Expired</span>
                        ) : assignment ? (
                          <span className={isDark ? "text-amber-300" : "text-amber-900"}>
                            {Math.max(0, Math.round((new Date(assignment.deadlineAt).getTime() - Date.now()) / 36e5))}h left
                          </span>
                        ) : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {isJury ? (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          assignmentStatus === "pending"
                            ? (isDark ? "bg-amber-500/15 text-amber-300 border border-amber-500/20" : "bg-amber-100 text-amber-900 border border-amber-300")
                            : assignmentStatus === "submitted"
                              ? (isDark ? "bg-green-500/15 text-green-300 border border-green-500/20" : "bg-green-100 text-green-900 border border-green-300")
                              : (isDark ? "bg-red-500/15 text-red-300 border border-red-500/20" : "bg-red-100 text-red-900 border border-red-300")
                        }`}>
                          {assignmentStatus === "pending" ? "Pending" : assignmentStatus === "submitted" ? "Submitted" : "Expired"}
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[sub.status] ?? ""}`}>
                          {isSultan && sub.status === "sent_for_final_decision" ? "Pending" : statusLabel(sub.status)}
                        </span>
                      )}
                    </td>
                    {!isJury && (
                      <td className="px-4 py-3 text-xs text-foreground/50 whitespace-nowrap">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {isJury ? (
                        <button
                          disabled={assignmentStatus === "expired"}
                          onClick={() => openModal(sub, assignmentStatus)}
                          className={`text-xs whitespace-nowrap font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                            assignmentStatus === "expired"
                              ? "opacity-60 cursor-not-allowed border-border text-foreground/40"
                              : "border-gold/30 text-gold hover:bg-gold/10"
                          }`}
                        >
                          {assignmentStatus === "pending" ? "Evaluate" : assignmentStatus === "submitted" ? "View" : "Locked"}
                        </button>
                      ) : (
                        <Link href={`/dashboard/submissions/${sub.id}`}>
                          <button
                            className="text-xs font-semibold text-gold border border-gold/30 hover:bg-gold/10 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                          >
                            {lang === "ar" ? "فتح" : "Open"}
                          </button>
                        </Link>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-foreground/30">
              {lang === "ar" ? "لا توجد طلبات" : "No submissions found"}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Jury blind-review modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {activeSub && isJury && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-2xl border border-gold/30 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto bg-card"
            >
              <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-gold/15 px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gold/70 font-semibold">
                    {lang === "ar" ? "مراجعة مغفلة الهوية" : "Blind Review"}
                  </p>
                  <h3 className="text-lg font-display font-bold mt-0.5">
                    {activeSub.referenceNumber} · {lang === "ar" ? activeSub.poemTitleAr : activeSub.poemTitle}
                  </h3>
                </div>
                <button
                  onClick={closeModal}
                  className="w-9 h-9 rounded-full hover:bg-foreground/10 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                <p className="text-xs text-amber-400/80 flex items-center gap-2 px-3 py-2 bg-amber-500/5 rounded-lg border border-amber-500/15">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {lang === "ar"
                    ? "هوية الشاعر مخفية لضمان حيادية التقييم"
                    : "Poet identity is intentionally hidden to ensure impartial evaluation"}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-foreground/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-foreground/40">{lang === "ar" ? "النوع" : "Type"}</p>
                    <p className="text-sm font-semibold capitalize mt-0.5">{activeSub.poemType}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gold/15 bg-gradient-to-br from-gold/5 to-transparent p-6 max-h-72 overflow-y-auto">
                  <p className="text-[10px] uppercase tracking-widest text-gold/60 mb-3 font-semibold">
                    {lang === "ar" ? "نص القصيدة" : "Poem Text"}
                  </p>
                  <pre dir="rtl" className="font-arabic text-lg leading-loose text-foreground/90 whitespace-pre-wrap text-right">
                    {"يا صحراء الوطن يا أرض الأجداد\nفي رمالك تاريخ وفي ترابك أمجاد"}
                  </pre>
                </div>

                <form onSubmit={handleSubmitDecision} className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold block mb-2">
                      {lang === "ar" ? "تعليق المُحكِّم" : "Jury Comment"}
                      {decisionType === "reject" && <span className="text-red-400 ms-1">*</span>}
                    </label>
                    <textarea
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={
                        decisionType === "reject"
                          ? (lang === "ar" ? "يرجى تقديم سبب مفصل للرفض (مطلوب)" : "Please provide a detailed reason for rejection (required)")
                          : (lang === "ar" ? "اكتب ملاحظاتك حول القصيدة…" : "Write your evaluation notes…")
                      }
                      className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold/50 resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border/50">
                    <button
                      disabled={selectedAssignmentStatus !== "pending"}
                      type="button"
                      onClick={() => setDecisionType("accept")}
                      className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                        decisionType === "accept"
                          ? "bg-green-500/20 border-green-500 text-green-400"
                          : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                      }`}
                    >
                      ✓ {lang === "ar" ? "قبول" : "Accept"}
                    </button>
                    <button
                      disabled={selectedAssignmentStatus !== "pending"}
                      type="button"
                      onClick={() => setDecisionType("reject")}
                      className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                        decisionType === "reject"
                          ? "bg-red-500/20 border-red-500 text-red-400"
                          : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                      }`}
                    >
                      ✗ {lang === "ar" ? "رفض" : "Reject"}
                    </button>
                  </div>

                  {decisionType && selectedAssignmentStatus === "pending" && (
                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      type="submit"
                      className="w-full py-3.5 rounded-xl gold-gradient text-navy font-bold text-base shadow-lg shadow-gold/20"
                    >
                      {lang === "ar" ? "إرسال التقييم" : "Submit Evaluation"}
                    </motion.button>
                  )}
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-[200] glass-panel border border-gold/30 px-5 py-3 rounded-xl shadow-2xl"
          >
            <p className="text-sm font-medium">{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
