import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useParams } from "wouter";
import { useLanguage } from "@/hooks/useLanguage";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getAuthUser } from "@/lib/auth";
import { useTheme } from "@/hooks/useTheme";

// ─── Stage breadcrumb definition (matches BRD lifecycle) ──────────────────────
const STAGES = [
  { key: "received",                label: "Received" },
  { key: "under_review",            label: "Review" },
  { key: "jury_form_under_review",  label: "Jury Form" },
  { key: "sent_to_jury",            label: "Assign" },
  { key: "under_jury_review",       label: "Jury" },
  { key: "jury_review_closed",      label: "Monitor" },
  { key: "under_consolidation",     label: "Consol." },
  { key: "final_form_under_review", label: "Final Form" },
  { key: "sent_for_final_decision", label: "Decision" },
  { key: "approved",                label: "Notify" },
  { key: "archived",                label: "Archived" },
];

const STATUS_ORDER = STAGES.map((s) => s.key);
const SULTAN_DECISIONS_KEY = "sultan-final-decisions";
const ASSIGNED_JURY_KEY = "reviewer-assigned-jury";

function stageIndex(status: string) {
  const i = STATUS_ORDER.indexOf(status);
  return i === -1 ? 0 : i;
}

// ─── Status helpers ────────────────────────────────────────────────────────────
const statusColorsDark: Record<string, string> = {
  received: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20",
  under_review: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  pending_information: "bg-orange-500/15 text-orange-400 border border-orange-500/20",
  ready_for_jury: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  jury_form_under_review: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20",
  sent_to_jury: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  under_jury_review: "bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/20",
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
  received: "bg-cyan-100 text-cyan-800 border border-cyan-300",
  under_review: "bg-blue-100 text-blue-900 border border-blue-300",
  pending_information: "bg-orange-100 text-orange-900 border border-orange-300",
  ready_for_jury: "bg-violet-100 text-violet-900 border border-violet-300",
  jury_form_under_review: "bg-indigo-100 text-indigo-900 border border-indigo-300",
  sent_to_jury: "bg-purple-100 text-purple-900 border border-purple-300",
  under_jury_review: "bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-300",
  jury_review_closed: "bg-teal-200 text-teal-900 border border-teal-300",
  under_consolidation: "bg-emerald-100 text-emerald-900 border border-emerald-300",
  final_form_under_review: "bg-yellow-100 text-yellow-900 border border-yellow-300",
  sent_for_final_decision: "bg-amber-200 text-amber-900 border border-amber-400",
  approved: "bg-green-100 text-green-900 border border-green-300",
  rejected: "bg-red-100 text-red-900 border border-red-300",
  returned_for_clarification: "bg-orange-200 text-orange-900 border border-orange-400",
  archived: "bg-gray-100 text-gray-800 border border-gray-300",
};

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    received: "Received", under_review: "Under Review",
    pending_information: "Pending Information Update",
    ready_for_jury: "Ready for Jury", jury_form_under_review: "Jury Form Under Review",
    sent_to_jury: "Sent to Jury", under_jury_review: "Under Jury Review",
    jury_review_closed: "Jury Review Closed", under_consolidation: "Under Consolidation",
    final_form_under_review: "Final Form Under Review",
    sent_for_final_decision: "Sent for Final Decision",
    approved: "Approved", rejected: "Rejected",
    returned_for_clarification: "Returned for Clarification", archived: "Archived",
  };
  return labels[status] ?? status;
}

// ─── Fake jury members list ────────────────────────────────────────────────────
const JURY_MEMBERS = [
  { id: 3, name: "Prof. Ahmad Al Mazrouei",  nameAr: "أ.د. أحمد المزروعي",   specialization: "Classical Arabic Poetry" },
  { id: 4, name: "Dr. Layla Al Suwaidi",     nameAr: "د. ليلى السويدي",       specialization: "Nabati Poetry" },
  { id: 5, name: "Dr. Hamad Al Bloushi",     nameAr: "د. حمد البلوشي",        specialization: "Modern Arabic Poetry" },
  { id: 6, name: "Prof. Moza Al Ketbi",      nameAr: "أ.د. موزة الكتبي",      specialization: "Linguistic Analysis" },
];

// ─── Fake submission detail data ───────────────────────────────────────────────
const fakeDetails: Record<number, any> = {
  1: {
    id: 1, referenceNumber: "AHA-2026-001", status: "approved",
    poetName: "Mohammed Al Mansoori", poetNameAr: "محمد المنصوري",
    poetEmail: "m.almansoori@email.com", poetPhone: "+971 50 123 4567",
    poetNationality: "UAE", profileSource: "Auto-fetched from system",
    requesterName: "Salem Al Dhaheri", requesterNameAr: "سالم الظاهري",
    requesterRelationship: "Representative", channel: "Email",
    requestDate: "20 April 2026",
    poemTitle: "Desert Song", poemTitleAr: "أغنية الصحراء",
    poemType: "Nabati", openingLine: "يا صحراء الوطن يا أرض الأجداد",
    poemContent: "يا صحراء الوطن يا أرض الأجداد\nفي رمالك تاريخ وفي ترابك أمجاد\nيا موطن البطولات والكرم\nفيك يحلو السرى ويطيب الزاد",
    attachment: "desert_song.pdf", submittedAt: "2026-01-20T10:00:00Z",
    reviewerNotes: "Exceptional poem with perfect meter and profound imagery.",
    finalScore: 9.2, finalDecision: "Approved for National Heritage Collection",
    evaluations: [
      { id: 1, juryMemberName: "Prof. Ahmad Al Mazrouei", linguisticScore: 9.5, poeticScore: 9.2, originalityScore: 8.8, emotionalScore: 9.0, culturalScore: 9.5, totalScore: 9.2, recommendation: "approve", notes: "Masterful use of traditional Nabati forms." },
      { id: 2, juryMemberName: "Dr. Layla Al Suwaidi",    linguisticScore: 9.0, poeticScore: 9.3, originalityScore: 9.1, emotionalScore: 8.9, culturalScore: 9.2, totalScore: 9.1, recommendation: "approve", notes: "Exceptional cultural authenticity." },
    ],
  },
  2: {
    id: 2, referenceNumber: "AHA-2026-002", status: "under_review",
    poetName: "Fatima Al Hashimi", poetNameAr: "فاطمة الهاشمي",
    poetEmail: "f.hashimi@email.com", poetPhone: "+971 55 234 5678",
    poetNationality: "UAE", profileSource: "Auto-fetched from system",
    requesterName: "Fatima Al Hashimi", requesterNameAr: "فاطمة الهاشمي",
    requesterRelationship: "Self", channel: "WhatsApp",
    requestDate: "30 January 2026",
    poemTitle: "Voice of the Palm", poemTitleAr: "صوت النخيل",
    poemType: "Classical", openingLine: "صوت النخيل يهمس في الفجر",
    poemContent: "صوت النخيل يهمس في الفجر\nويرسم في السماء حكاية العمر\nيحكي حكايات أهل الصحراء\nويبقى شامخاً عبر الأزمان والدهر",
    attachment: "voice_of_the_palm.pdf", submittedAt: "2026-01-30T10:00:00Z",
    reviewerNotes: "", finalScore: null, finalDecision: null, evaluations: [],
  },
  3: {
    id: 3, referenceNumber: "AHA-2026-003", status: "jury_form_under_review",
    poetName: "Khalid Al Rashidi", poetNameAr: "خالد الراشدي",
    poetEmail: "k.rashidi@email.com", poetPhone: "+971 50 678 3344",
    poetNationality: "UAE", profileSource: "Auto-fetched from system",
    requesterName: "Khalid Al Rashidi", requesterNameAr: "خالد الراشدي",
    requesterRelationship: "Self", channel: "Internal Referral",
    requestDate: "08 February 2026",
    poemTitle: "Pearl of the Gulf", poemTitleAr: "لؤلؤة الخليج",
    poemType: "Nabati", openingLine: "يا لؤلؤة الخليج يا درة المكان",
    poemContent: "يا لؤلؤة الخليج يا درة المكان\nفي موجك الزاهي يطيب لنا الزمان\nوترتوي الأرواح من عطر البيان",
    attachment: "pearl_of_the_gulf.pdf", submittedAt: "2026-02-08T10:00:00Z",
    reviewerNotes: "Jury form prepared and under reviewer verification before final dispatch.",
    finalScore: null, finalDecision: null,
    evaluations: [
      { id: 31, juryMemberName: "Prof. Ahmad Al Mazrouei", linguisticScore: 0, poeticScore: 0, originalityScore: 0, emotionalScore: 0, culturalScore: 0, totalScore: 0, recommendation: "approve", notes: "Initial response submitted." },
      { id: 32, juryMemberName: "Dr. Layla Al Suwaidi", linguisticScore: 0, poeticScore: 0, originalityScore: 0, emotionalScore: 0, culturalScore: 0, totalScore: 0, recommendation: "no_decision", notes: "Pending response." },
    ],
  },
  5: {
    id: 5, referenceNumber: "AHA-2026-005", status: "sent_for_final_decision",
    poetName: "Omar Al Shamsi", poetNameAr: "عمر الشمسي",
    poetEmail: "o.shamsi@email.com", poetPhone: "+971 50 888 1122",
    poetNationality: "UAE", profileSource: "Auto-fetched from system",
    requesterName: "Omar Al Shamsi", requesterNameAr: "عمر الشمسي",
    requesterRelationship: "Self", channel: "Direct Submission",
    requestDate: "10 January 2026",
    poemTitle: "The Brave Falcon", poemTitleAr: "الصقر الشجاع",
    poemType: "Nabati", openingLine: "يا صقرنا الحر في العليا لك المجد",
    poemContent: "يا صقرنا الحر في العليا لك المجد\nترفرف في سما الأوطان كالعهد\nوفي جناحك عز ما له حد",
    attachment: "the_brave_falcon.pdf", submittedAt: "2026-01-10T10:00:00Z",
    reviewerNotes: "Consolidated and ready for final decision.",
    finalScore: null, finalDecision: null,
    evaluations: [
      { id: 21, juryMemberName: "Prof. Ahmad Al Mazrouei", linguisticScore: 0, poeticScore: 0, originalityScore: 0, emotionalScore: 0, culturalScore: 0, totalScore: 0, recommendation: "approve", notes: "Approve." },
      { id: 22, juryMemberName: "Dr. Layla Al Suwaidi", linguisticScore: 0, poeticScore: 0, originalityScore: 0, emotionalScore: 0, culturalScore: 0, totalScore: 0, recommendation: "reject", notes: "Reject due to structure issues." },
    ],
  },
  11: {
    id: 11, referenceNumber: "AHA-2026-011", status: "sent_for_final_decision",
    poetName: "Khalid Al Nuaimi", poetNameAr: "خالد النعيمي",
    poetEmail: "k.nuaimi@email.com", poetPhone: "+971 50 330 4400",
    poetNationality: "UAE", profileSource: "Auto-fetched from system",
    requesterName: "Khalid Al Nuaimi", requesterNameAr: "خالد النعيمي",
    requesterRelationship: "Self", channel: "Website",
    requestDate: "12 January 2026",
    poemTitle: "Silent Dunes", poemTitleAr: "كثبان صامتة",
    poemType: "Standard", openingLine: "على الرمل تمشي الحكايات بهدوء",
    poemContent: "على الرمل تمشي الحكايات بهدوء\nوفي الليل يعلو صدى القلب والضوء\nتغني الرياح نشيد البقاء",
    attachment: "silent_dunes.pdf", submittedAt: "2026-01-12T10:00:00Z",
    reviewerNotes: "Submitted to final decision stage.",
    finalScore: null, finalDecision: null,
    evaluations: [
      { id: 23, juryMemberName: "Dr. Hamad Al Bloushi", linguisticScore: 0, poeticScore: 0, originalityScore: 0, emotionalScore: 0, culturalScore: 0, totalScore: 0, recommendation: "approve", notes: "Approve." },
    ],
  },
  7: {
    id: 7, referenceNumber: "AHA-2026-007", status: "pending_information",
    poetName: "Rashid Al Ketbi", poetNameAr: "راشد الكتبي",
    poetEmail: "r.ketbi@email.com", poetPhone: "+966 50 345 6789",
    poetNationality: "Saudi Arabia", profileSource: "Auto-fetched from system",
    requesterName: "Salem Al Dhaheri", requesterNameAr: "سالم الظاهري",
    requesterRelationship: "Representative", channel: "Email",
    requestDate: "08 February 2026",
    poemTitle: "Mountains of Hejaz", poemTitleAr: "جبال الحجاز",
    poemType: "Classical", openingLine: "",
    poemContent: "في صحراء الوطن يهمس النسيم\nويحكي قصص الأجداد للقديم",
    attachment: "mountains_of_hejaz.pdf", submittedAt: "2026-02-08T10:00:00Z",
    reviewerNotes: "", finalScore: null, finalDecision: null, evaluations: [],
  },
  10: {
    id: 10, referenceNumber: "AHA-2026-010", status: "under_jury_review",
    poetName: "Hessa Al Falasi", poetNameAr: "حصة الفلاسي",
    poetEmail: "h.falasi@email.com", poetPhone: "+971 50 222 7788",
    poetNationality: "UAE", profileSource: "Auto-fetched from system",
    requesterName: "Hessa Al Falasi", requesterNameAr: "حصة الفلاسي",
    requesterRelationship: "Self", channel: "WhatsApp",
    requestDate: "25 February 2026",
    poemTitle: "Whisper of the Wind", poemTitleAr: "همس الريح",
    poemType: "Modern", openingLine: "يا ريح همسي خذي شوقي إلى الأفق",
    poemContent: "يا ريح همسي خذي شوقي إلى الأفق\nوانثري النور فوق الرمل والطرق\nواكتبي للعلا شعراً من الألق",
    attachment: "whisper_of_the_wind.pdf", submittedAt: "2026-02-25T10:00:00Z",
    reviewerNotes: "Jury review in progress. Waiting for remaining jury responses.",
    finalScore: null, finalDecision: null,
    evaluations: [
      { id: 40, juryMemberName: "Dr. Ahmed Al Nuaimi", linguisticScore: 0, poeticScore: 0, originalityScore: 0, emotionalScore: 0, culturalScore: 0, totalScore: 0, recommendation: "approve", notes: "Initial response submitted." },
      { id: 41, juryMemberName: "Prof. Fatima Al Hashimi", linguisticScore: 0, poeticScore: 0, originalityScore: 0, emotionalScore: 0, culturalScore: 0, totalScore: 0, recommendation: "no_decision", notes: "Pending response." },
      { id: 42, juryMemberName: "Dr. Mariam Al Suwaidi", linguisticScore: 0, poeticScore: 0, originalityScore: 0, emotionalScore: 0, culturalScore: 0, totalScore: 0, recommendation: "no_decision", notes: "Pending response." },
    ],
  },
  13: {
    id: 13, referenceNumber: "AHA-2026-013", status: "jury_review_closed",
    poetName: "Ibrahim Al Dhaheri", poetNameAr: "إبراهيم الظاهري",
    poetEmail: "i.dhaheri@email.com", poetPhone: "+971 50 567 8901",
    poetNationality: "UAE", profileSource: "Auto-fetched from system",
    requesterName: "Ibrahim Al Dhaheri", requesterNameAr: "إبراهيم الظاهري",
    requesterRelationship: "Self", channel: "Internal Referral",
    requestDate: "05 February 2026",
    poemTitle: "Song of the Sailors", poemTitleAr: "أغنية البحارة",
    poemType: "Classical", openingLine: "يا بحر الأمل يا سر الحياة",
    poemContent: "يا بحر الأمل يا سر الحياة\nفي أمواجك تسبح قصص الرجال\nيا شاهد على عزم البحارة\nوبطولات نسجت من خيوط الأجيال",
    attachment: "song_of_sailors.pdf", submittedAt: "2026-02-05T10:00:00Z",
    reviewerNotes: "Pending consolidation review.",
    finalScore: null, finalDecision: null,
    evaluations: [
      { id: 10, juryMemberName: "Prof. Ahmad Al Mazrouei", linguisticScore: 8.5, poeticScore: 8.2, originalityScore: 7.8, emotionalScore: 8.0, culturalScore: 8.5, totalScore: 8.2, recommendation: "approve", notes: "Good classical form." },
      { id: 11, juryMemberName: "Dr. Layla Al Suwaidi",    linguisticScore: 7.5, poeticScore: 7.8, originalityScore: 8.0, emotionalScore: 7.6, culturalScore: 7.9, totalScore: 7.76, recommendation: "approve", notes: "Solid work, recommend further polish." },
      { id: 12, juryMemberName: "Dr. Hamad Al Bloushi",    linguisticScore: 0,   poeticScore: 0,   originalityScore: 0,   emotionalScore: 0,   culturalScore: 0,   totalScore: 0,    recommendation: "no_decision", notes: "No response — evaluation closed." },
    ],
  },
  15: {
    id: 15, referenceNumber: "AHA-2026-015", status: "final_form_under_review",
    poetName: "Saeed Al Ameri", poetNameAr: "سعيد العامري",
    poetEmail: "s.ameri@email.com", poetPhone: "+971 50 678 9012",
    poetNationality: "UAE", profileSource: "Auto-fetched from system",
    requesterName: "Saeed Al Ameri", requesterNameAr: "سعيد العامري",
    requesterRelationship: "Self", channel: "Email",
    requestDate: "22 January 2026",
    poemTitle: "Spirit of the Nation", poemTitleAr: "روح الأمة",
    poemType: "Nabati", openingLine: "يا وطني يا عزيزي يا غالي القدر",
    poemContent: "يا وطني يا عزيزي يا غالي القدر\nفي صدري نار وشوق ما لها أثر\nترابك المسك والذهب في العمر",
    attachment: "spirit_of_nation.pdf", submittedAt: "2026-01-22T10:00:00Z",
    reviewerNotes: "All jury evaluations received. Consolidated summary prepared.",
    finalScore: null, finalDecision: null,
    evaluations: [
      { id: 20, juryMemberName: "Prof. Ahmad Al Mazrouei", linguisticScore: 9.0, poeticScore: 9.2, originalityScore: 8.9, emotionalScore: 9.1, culturalScore: 9.3, totalScore: 9.1, recommendation: "approve", notes: "Highly recommend." },
      { id: 21, juryMemberName: "Dr. Layla Al Suwaidi",    linguisticScore: 8.8, poeticScore: 9.0, originalityScore: 9.2, emotionalScore: 8.7, culturalScore: 9.0, totalScore: 8.94, recommendation: "approve", notes: "Exceptional spirit and form." },
    ],
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────────
function Field({ label, value, missing, editable, editValue, onEdit }: {
  label: string; value: string; missing?: boolean;
  editable?: boolean; editValue?: string; onEdit?: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-foreground/40">{label}</span>
      {editable && onEdit ? (
        <input
          value={editValue ?? value}
          onChange={(e) => onEdit(e.target.value)}
          className="bg-background/60 border border-gold/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/70 transition-all"
        />
      ) : (
        <div className={`rounded-lg px-3 py-2 text-sm border ${
          missing
            ? "bg-red-500/10 border-red-500/40 text-red-400"
            : "bg-background/30 border-border/30 text-foreground/80"
        }`}>
          {missing ? "Missing — please fill" : (value || "—")}
        </div>
      )}
    </div>
  );
}

type ReviewerAction =
  | "save_edits"
  | "mark_under_review"
  | "mark_ready_for_jury"
  | "mark_pending_info"
  | "confirm_jury_form"
  | "dispatch_to_jury"
  | "close_jury_stage"
  | "begin_consolidation"
  | "generate_final_form"
  | "send_to_sultan"
  | "send_notification";

// ─── Main component ────────────────────────────────────────────────────────────
export default function SubmissionDetail() {
  const { lang } = useLanguage();
  const { isDark } = useTheme();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const id = parseInt(params.id || "0", 10);
  const user = getAuthUser();
  const isReviewer = user?.role === "reviewer" || user?.role === "sysadmin" || user?.role === "admin";
  const isSultan = user?.role === "sultan" || (user?.role as string) === "dr_sultan";

  const initialSub = fakeDetails[id] ?? fakeDetails[2];
  const [submission, setSubmission] = useState<any>(initialSub);
  const [editMode, setEditMode] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [showJuryModal, setShowJuryModal] = useState(false);
  const [showJuryForm, setShowJuryForm] = useState(false);
  const [selectedJury, setSelectedJury] = useState<number[]>([]);
  const [deadline, setDeadline] = useState("48");
  const [consolidationNote, setConsolidationNote] = useState("");
  const [confirmDecision, setConfirmDecision] = useState<"approved" | "rejected" | null>(null);
  const [notifyChannels, setNotifyChannels] = useState({ email: true, sms: false, whatsapp: false });
  const [notifyMessage, setNotifyMessage] = useState("");
  const [reviewerConfirm, setReviewerConfirm] = useState<null | { action: ReviewerAction; title: string; message: string }>(null);
  const [reviewerSuccessMessage, setReviewerSuccessMessage] = useState<string | null>(null);

  const [assignedJuryBySubmission, setAssignedJuryBySubmission] = useState<Record<number, { id: number; name: string; responded: boolean }[]>>(() => {
    const seeded: Record<number, { id: number; name: string; responded: boolean }[]> = {
      3: [
        { id: 3, name: "Prof. Ahmad Al Mazrouei", responded: true },
        { id: 4, name: "Dr. Layla Al Suwaidi", responded: false },
      ],
      10: [
        { id: 1, name: "Dr. Khalid Al Mansoori", responded: false },
        { id: 2, name: "Prof. Fatima Al Hashimi", responded: false },
        { id: 3, name: "Dr. Ahmed Al Nuaimi", responded: true },
      ],
      13: [
        { id: 1, name: "Dr. Khalid Al Mansoori", responded: true },
        { id: 2, name: "Prof. Fatima Al Hashimi", responded: true },
        { id: 5, name: "Prof. Salem Al Dhaheri", responded: false },
      ],
    };
    try {
      const raw = localStorage.getItem(ASSIGNED_JURY_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return { ...seeded, ...parsed };
    } catch {
      return seeded;
    }
  });

  const statusColors = isDark ? statusColorsDark : statusColorsLight;
  const assignedJury = assignedJuryBySubmission[submission.id] ?? [];
  const hasAnyJuryResponse = assignedJury.some((member) => member.responded);
  const workflowStatus =
    submission.status === "sent_to_jury" || submission.status === "under_jury_review"
      ? (hasAnyJuryResponse ? "under_jury_review" : "sent_to_jury")
      : submission.status;
  const stageStatus =
    submission.status === "jury_form_under_review"
      ? "under_jury_review"
      : workflowStatus;
  const currentStageIdx = stageIndex(stageStatus);
  const isJuryEvaluationPhase = [
    "under_jury_review",
    "jury_review_closed",
    "under_consolidation",
    "final_form_under_review",
    "sent_for_final_decision",
    "approved",
    "rejected",
    "returned_for_clarification",
    "archived",
  ].includes(workflowStatus);
  const showAssignedJurySection = stageStatus === "sent_to_jury";

  // Missing field detection
  const missingFields: string[] = [];
  if (!submission.openingLine) missingFields.push("Opening line");
  if (!submission.poemContent) missingFields.push("Full poem content");

  const hasMissing = missingFields.length > 0;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  function applyEdit(field: string, val: string) {
    setEdits((prev) => ({ ...prev, [field]: val }));
  }

  function saveEdits() {
    setSubmission((prev: any) => ({ ...prev, ...edits }));
    setEdits({});
    setEditMode(false);
    showToast("Changes saved — logged to audit trail");
    return true;
  }

  function markPendingInfo() {
    setSubmission((prev: any) => ({ ...prev, status: "pending_information" }));
    showToast("Status set to Pending Information Update");
    return true;
  }

  function markUnderReview() {
    setSubmission((prev: any) => ({ ...prev, status: "under_review" }));
    showToast("Status set to Under Review");
    return true;
  }

  function markReadyForJury() {
    if (hasMissing) {
      showToast("Cannot mark ready — please fill missing fields first");
      return false;
    }
    setSubmission((prev: any) => ({ ...prev, status: "jury_form_under_review" }));
    setShowJuryForm(true);
    showToast("Jury form generated — please review before assigning");
    return true;
  }

  function confirmJuryForm() {
    setShowJuryForm(false);
    setSubmission((prev: any) => ({ ...prev, status: "jury_form_under_review" }));
    showToast("Jury form locked. Proceed to assign jury members.");
    return true;
  }

  function dispatchToJury() {
    if (selectedJury.length === 0) {
      showToast("Please select at least one jury member");
      return false;
    }
    setShowJuryModal(false);
    setSubmission((prev: any) => ({ ...prev, status: "sent_to_jury" }));
    const assignedMembers = selectedJury.map((juryId) => {
      const member = JURY_MEMBERS.find((j) => j.id === juryId);
      return { id: juryId, name: member?.name ?? `Jury ${juryId}`, responded: false };
    });
    setAssignedJuryBySubmission((prev) => {
      const next = { ...prev, [submission.id]: assignedMembers };
      localStorage.setItem(ASSIGNED_JURY_KEY, JSON.stringify(next));
      return next;
    });
    showToast(`Dispatched to ${selectedJury.length} jury member(s) — deadline: ${deadline}h`);
    return true;
  }

  function closeJuryStage() {
    setSubmission((prev: any) => ({ ...prev, status: "jury_review_closed" }));
    showToast("Jury stage closed manually");
    return true;
  }

  function proceedToConsolidation() {
    setSubmission((prev: any) => ({ ...prev, status: "under_consolidation" }));
    showToast("Moved to consolidation");
    return true;
  }

  function generateFinalForm() {
    setSubmission((prev: any) => ({ ...prev, status: "final_form_under_review" }));
    showToast("Final executive form generated — please review");
    return true;
  }

  function sendToSultan() {
    setSubmission((prev: any) => ({ ...prev, status: "sent_for_final_decision" }));
    showToast("Final form sent to Dr. Sultan for decision");
    return true;
  }

  function sultanDecision(decision: "approved" | "rejected") {
    setSubmission((prev: any) => ({
      ...prev,
      status: decision,
      finalDecision: decision === "approved" ? "Approved by Dr. Sultan" : "Rejected by Dr. Sultan",
    }));
    showToast(decision === "approved" ? "Final decision recorded: Approved" : "Final decision recorded: Rejected");
  }

  function requestSultanDecision(decision: "approved" | "rejected") {
    setConfirmDecision(decision);
  }

  function toggleNotifyChannel(channel: "email" | "sms" | "whatsapp") {
    setNotifyChannels((prev) => ({ ...prev, [channel]: !prev[channel] }));
  }

  function sendNotification() {
    if (!notifyChannels.email && !notifyChannels.sms && !notifyChannels.whatsapp) {
      showToast("Select at least one channel to notify");
      return false;
    }
    setSubmission((prev: any) => ({ ...prev, status: "archived" }));
    return true;
  }

  function confirmSultanDecision() {
    if (!confirmDecision) return;
    sultanDecision(confirmDecision);
    try {
      const raw = localStorage.getItem(SULTAN_DECISIONS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const next = { ...parsed, [submission.id]: confirmDecision };
      localStorage.setItem(SULTAN_DECISIONS_KEY, JSON.stringify(next));
    } catch {
      // no-op fallback for malformed storage values
    }
    setConfirmDecision(null);
    navigate("/dashboard/submissions");
  }

  const reviewerSuccessText: Record<ReviewerAction, string> = {
    save_edits: "Changes saved successfully.",
    mark_under_review: "Submission marked as Under Review.",
    mark_ready_for_jury: "Jury form generated successfully.",
    mark_pending_info: "Submission marked as Pending Information Update.",
    confirm_jury_form: "Jury form confirmed and locked.",
    dispatch_to_jury: "Jury members assigned and dispatch completed.",
    close_jury_stage: "Jury stage closed successfully.",
    begin_consolidation: "Moved to consolidation stage.",
    generate_final_form: "Final executive form generated.",
    send_to_sultan: "Final form sent to Dr. Sultan.",
    send_notification: "Notification sent successfully. Submission archived.",
  };

  function requestReviewerConfirmation(action: ReviewerAction, title: string, message: string) {
    setReviewerConfirm({ action, title, message });
  }

  function runReviewerAction(action: ReviewerAction): boolean {
    switch (action) {
      case "save_edits":
        return saveEdits();
      case "mark_under_review":
        return markUnderReview();
      case "mark_ready_for_jury":
        return markReadyForJury();
      case "mark_pending_info":
        return markPendingInfo();
      case "confirm_jury_form":
        return confirmJuryForm();
      case "dispatch_to_jury":
        return dispatchToJury();
      case "close_jury_stage":
        return closeJuryStage();
      case "begin_consolidation":
        return proceedToConsolidation();
      case "generate_final_form":
        return generateFinalForm();
      case "send_to_sultan":
        return sendToSultan();
      case "send_notification":
        return sendNotification();
      default:
        return false;
    }
  }

  function confirmReviewerAction() {
    if (!reviewerConfirm) return;
    const ok = runReviewerAction(reviewerConfirm.action);
    if (ok) {
      setReviewerSuccessMessage(reviewerSuccessText[reviewerConfirm.action]);
    }
    setReviewerConfirm(null);
  }

  // Reviewer action buttons based on current status
  function ReviewerActions() {
    const s = stageStatus;
    return (
      <div className="glass-panel rounded-xl border border-gold/15 p-5 space-y-3">
        <h3 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">
          Reviewer Actions
        </h3>

        <div className="flex flex-wrap gap-2">
          {/* Stage 2 – Initial Review */}
          {(s === "received" || s === "under_review" || s === "pending_information") && (
            <>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 rounded-lg border border-gold/30 text-gold hover:bg-gold/10 text-sm font-medium transition-all"
                >
                  Edit request data
                </button>
              ) : (
                <>
                  <button
                    onClick={() =>
                      requestReviewerConfirmation("save_edits", "Confirm Save Changes", "Save the edited submission details?")
                    }
                    className="px-4 py-2 rounded-lg gold-gradient text-navy text-sm font-semibold transition-all"
                  >
                    Save changes
                  </button>
                  <button
                    onClick={() => { setEdits({}); setEditMode(false); }}
                    className="px-4 py-2 rounded-lg border border-border text-foreground/50 hover:border-gold/20 text-sm transition-all"
                  >
                    Cancel
                  </button>
                </>
              )}
              {s !== "under_review" && (
                <button
                  onClick={() =>
                    requestReviewerConfirmation("mark_under_review", "Confirm Status Update", "Mark this submission as Under Review?")
                  }
                  className="px-4 py-2 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-sm font-medium transition-all"
                >
                  Mark as Under Review
                </button>
              )}
              <button
                onClick={() =>
                  requestReviewerConfirmation("mark_ready_for_jury", "Confirm Jury Preparation", "Generate jury form and move to jury preparation stage?")
                }
                disabled={hasMissing}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  hasMissing
                    ? "opacity-40 cursor-not-allowed border-border text-foreground/40"
                    : "border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                }`}
                title={hasMissing ? `Missing: ${missingFields.join(", ")}` : undefined}
              >
                Mark ready → generate jury form
              </button>
              {s !== "pending_information" && (
                <button
                  onClick={() =>
                    requestReviewerConfirmation("mark_pending_info", "Confirm Status Update", "Mark this submission as Pending Information Update?")
                  }
                  className="px-4 py-2 rounded-lg border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-sm font-medium transition-all"
                >
                  Mark pending information update
                </button>
              )}
            </>
          )}

          {/* Stage 3 – Jury form review */}
          {s === "jury_form_under_review" && (
            <>
              <button
                onClick={() => setShowJuryForm(true)}
                className="px-4 py-2 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-sm font-medium transition-all"
              >
                Preview jury form
              </button>
              <button
                onClick={() => setShowJuryModal(true)}
                className="px-4 py-2 rounded-lg gold-gradient text-navy text-sm font-semibold transition-all"
              >
                Confirm form → Assign jury
              </button>
            </>
          )}

          {/* Stage 4 – Already sent to jury / monitoring */}
          {(s === "sent_to_jury" || s === "under_jury_review") && (
            <button
              onClick={() =>
                requestReviewerConfirmation("close_jury_stage", "Confirm Jury Closure", "Close the jury stage for this submission?")
              }
              className="px-4 py-2 rounded-lg border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 text-sm font-medium transition-all"
            >
              Close jury stage manually
            </button>
          )}

          {/* Stage 6→7 – Jury closed → consolidation */}
          {s === "jury_review_closed" && (
            <button
              onClick={() =>
                requestReviewerConfirmation("begin_consolidation", "Confirm Consolidation", "Move this submission to consolidation stage?")
              }
              className="px-4 py-2 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-sm font-medium transition-all"
            >
              Begin consolidation
            </button>
          )}

          {/* Stage 7 – Consolidation */}
          {s === "under_consolidation" && (
            <button
              onClick={() =>
                requestReviewerConfirmation("generate_final_form", "Confirm Final Form", "Generate final executive form now?")
              }
              className="px-4 py-2 rounded-lg gold-gradient text-navy text-sm font-semibold transition-all"
            >
              Generate final executive form
            </button>
          )}

          {/* Stage 8 – Final form review */}
          {s === "final_form_under_review" && (
            <button
              onClick={() =>
                requestReviewerConfirmation("send_to_sultan", "Confirm Send to Dr. Sultan", "Send the final form to Dr. Sultan for decision?")
              }
              className="px-4 py-2 rounded-lg gold-gradient text-navy text-sm font-semibold transition-all"
            >
              Send to Dr. Sultan
            </button>
          )}

          {/* Terminal states */}
          {(s === "sent_for_final_decision" || s === "approved" || s === "rejected" || s === "archived") && (
            <p className="text-sm text-foreground/40 italic">
              {s === "sent_for_final_decision" ? "Awaiting Dr. Sultan's decision." : "This case is closed."}
            </p>
          )}
        </div>

        <p className="text-[10px] text-foreground/30">All edits are tracked in the audit log automatically.</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* ── Back ────────────────────────────────────────────────────────────── */}
      <Link href="/dashboard/submissions" className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-gold mb-5 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Submissions
      </Link>

      {/* ── Stage breadcrumb ─────────────────────────────────────────────────── */}
      {!isSultan ? (
        <div className="glass-panel rounded-xl border border-gold/10 p-3 mb-5 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max">
            {STAGES.map((stage, i) => {
              const done = i < currentStageIdx;
              const active = i === currentStageIdx;
              return (
                <div key={stage.key} className="flex items-center">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? "gold-gradient text-navy"
                      : done
                        ? "text-gold/60 bg-gold/5"
                        : "text-foreground/30"
                  }`}>
                    {i + 1}. {stage.label}
                  </div>
                  {i < STAGES.length - 1 && (
                    <svg className={`w-3 h-3 mx-0.5 flex-shrink-0 ${done ? "text-gold/40" : "text-foreground/15"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-xl border border-gold/10 p-3 mb-5">
          <p className="text-sm font-semibold text-gold">Final Decision</p>
        </div>
      )}

      {/* ── Reviewer identity bar ────────────────────────────────────────────── */}
      {isReviewer && (
        <div className="glass-panel rounded-xl border border-gold/10 px-5 py-3.5 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-navy font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0) ?? "R"}
            </div>
            <div>
              <p className="text-sm font-semibold">{user?.name ?? "Reviewer"}</p>
              <p className="text-xs text-foreground/40">Application Reviewer</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-foreground/40">AHA — National Poets Evaluation</p>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[submission.status] ?? ""}`}>
              {statusLabel(submission.status)}
            </span>
          </div>
        </div>
      )}

      {isSultan && (
        <div className="glass-panel rounded-xl border border-gold/10 px-5 py-3.5 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-navy font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0) ?? "S"}
            </div>
            <div>
              <p className="text-sm font-semibold">{user?.name ?? "Dr. Sultan"}</p>
              <p className="text-xs text-foreground/40">Final decision authority</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-foreground/40">AHA — National Poets Evaluation</p>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[submission.status] ?? ""}`}>
              {statusLabel(submission.status)}
            </span>
          </div>
        </div>
      )}

      {/* ── Missing data warning ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {hasMissing && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-5 px-5 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Missing data detected — {missingFields.join(", ")} {missingFields.length > 1 ? "are" : "is"} empty. Fill before marking Ready.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* ── Poet information ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl border border-gold/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">Poet information</h2>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[submission.status] ?? ""}`}>
              {statusLabel(submission.status)}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Poet name" value={lang === "ar" ? submission.poetNameAr : submission.poetName}
              editable={editMode} editValue={edits["poetName"]} onEdit={(v) => applyEdit("poetName", v)} />
            <Field label="Mobile" value={submission.poetPhone}
              editable={editMode} editValue={edits["poetPhone"]} onEdit={(v) => applyEdit("poetPhone", v)} />
            <Field label="Email" value={submission.poetEmail}
              editable={editMode} editValue={edits["poetEmail"]} onEdit={(v) => applyEdit("poetEmail", v)} />
            <Field label="Profile source" value={submission.profileSource} />
          </div>
        </motion.div>

        {/* ── Requester information ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-panel rounded-xl border border-gold/10 p-5">
          <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">Requester information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Requester name" value={lang === "ar" ? submission.requesterNameAr : submission.requesterName}
              editable={editMode} editValue={edits["requesterName"]} onEdit={(v) => applyEdit("requesterName", v)} />
            <Field label="Relationship to poet" value={submission.requesterRelationship}
              editable={editMode} editValue={edits["requesterRelationship"]} onEdit={(v) => applyEdit("requesterRelationship", v)} />
            <Field label="Channel / source" value={submission.channel}
              editable={editMode} editValue={edits["channel"]} onEdit={(v) => applyEdit("channel", v)} />
            <Field label="Request date" value={submission.requestDate} />
          </div>
        </motion.div>

        {/* ── Poem information ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-xl border border-gold/10 p-5">
          <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">Poem information</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Poem title" value={lang === "ar" ? submission.poemTitleAr : submission.poemTitle}
              editable={editMode} editValue={edits["poemTitle"]} onEdit={(v) => applyEdit("poemTitle", v)} />
            <Field label="Poem type" value={submission.poemType} />
            <div className="sm:col-span-2">
              <Field label="Opening line" value={edits["openingLine"] ?? submission.openingLine}
                missing={!submission.openingLine && !edits["openingLine"]}
                editable={editMode} editValue={edits["openingLine"]} onEdit={(v) => applyEdit("openingLine", v)} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-foreground/40">Full poem content</span>
            {editMode ? (
              <textarea
                rows={6}
                value={edits["poemContent"] ?? submission.poemContent}
                onChange={(e) => applyEdit("poemContent", e.target.value)}
                dir="rtl"
                className="bg-background/60 border border-gold/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/70 transition-all font-arabic leading-loose text-right"
              />
            ) : (
              <div className="rounded-xl border border-gold/15 bg-gradient-to-br from-gold/5 to-transparent p-5">
                <pre dir="rtl" className="font-arabic text-lg leading-loose text-foreground/90 whitespace-pre-wrap text-right">
                  {submission.poemContent || "Missing — please fill"}
                </pre>
              </div>
            )}
          </div>
          <div className="mt-4">
            <Field label="Attachment" value={submission.attachment ? `${submission.attachment} — uploaded` : "No attachment"} />
          </div>
        </motion.div>

        {/* ── Request metadata ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel rounded-xl border border-gold/10 p-5">
          <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">Request metadata</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Request ID" value={submission.referenceNumber} />
            <Field label="Date created" value={submission.requestDate} />
          </div>

          {showAssignedJurySection && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <h3 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-2">Assigned Jury</h3>
              {(assignedJuryBySubmission[submission.id] ?? []).length > 0 && (
                <div className="space-y-2">
                  {(assignedJuryBySubmission[submission.id] ?? []).map((member) => (
                    <div key={member.id} className="rounded-lg border border-border/50 bg-background/30 px-3 py-2 flex items-center justify-between">
                      <p className="text-sm">{member.name}</p>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          member.responded
                            ? "bg-green-500/15 text-green-400 border border-green-500/20"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {member.responded ? "Responded" : "Not Responded"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Jury evaluations (if any) ─────────────────────────────────────── */}
        {(submission.evaluations?.length > 0 || isJuryEvaluationPhase) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl border border-gold/10 p-5">
            <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">Jury Evaluations</h2>

            {(() => {
              const assigned = assignedJuryBySubmission[submission.id] ?? [];
              const respondedNames = new Set(
                (submission.evaluations ?? [])
                  .filter((e: any) => e.recommendation !== "no_decision")
                  .map((e: any) => e.juryMemberName)
              );
              const responseTracker = assigned.map((m) => ({
                ...m,
                responded: m.responded || respondedNames.has(m.name),
              }));
              const isJuryUnderReview = workflowStatus === "under_jury_review";
              const visibleEvaluations = isJuryUnderReview
                ? submission.evaluations.filter((e: any) => e.recommendation !== "no_decision")
                : submission.evaluations;

              if (isJuryUnderReview && visibleEvaluations.length === 0) {
                return (
                  <div className="rounded-lg border border-border/50 bg-background/30 p-4 text-sm text-foreground/50">
                    No jury responses received yet.
                  </div>
                );
              }

              const evs = visibleEvaluations;
              const accepted = evs.filter((e: any) => e.recommendation === "approve").length;
              const rejected = evs.filter((e: any) => e.recommendation === "reject").length;
              const noDecision = evs.filter((e: any) => e.recommendation === "no_decision").length;
              return (
                <>
                {responseTracker.length > 0 && (
                  <div className="mb-4 rounded-lg border border-border/50 bg-background/30 p-3">
                    <p className="text-xs text-foreground/40 mb-2 uppercase tracking-wider">Jury Response Status</p>
                    <div className="space-y-2">
                      {responseTracker.map((member) => (
                        <div key={member.id} className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2">
                          <p className="text-sm">{member.name}</p>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              member.responded
                                ? "bg-green-500/15 text-green-400 border border-green-500/20"
                                : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {member.responded ? "Responded" : "Not Responded"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
                    <p className="text-2xl font-display font-bold text-green-400">{accepted}</p>
                    <p className="text-xs text-foreground/40 mt-0.5">Accepted</p>
                  </div>
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
                    <p className="text-2xl font-display font-bold text-red-400">{rejected}</p>
                    <p className="text-xs text-foreground/40 mt-0.5">Rejected</p>
                  </div>
                  <div className="rounded-lg bg-gray-500/10 border border-gray-500/20 p-3 text-center">
                    <p className="text-2xl font-display font-bold text-foreground/40">{noDecision}</p>
                    <p className="text-xs text-foreground/40 mt-0.5">No Decision</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {visibleEvaluations.map((ev: any) => (
                <div key={ev.id} className="border border-border/50 rounded-xl p-4 bg-background/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-navy font-bold text-xs">
                        {ev.juryMemberName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{ev.juryMemberName}</p>
                        <p className="text-xs text-foreground/40">Jury Member</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {ev.recommendation === "no_decision" ? (
                        <span className="text-xs text-foreground/40 italic">No Decision — Evaluation Closed</span>
                      ) : (
                        <div className={`text-xs font-medium capitalize ${ev.recommendation === "approve" ? "text-green-400" : "text-red-400"}`}>
                          {ev.recommendation === "approve" ? "Approve" : "Reject"}
                        </div>
                      )}
                    </div>
                  </div>
                  {ev.notes && (
                    <p className="text-sm text-foreground/60 italic border-t border-border/30 pt-3">
                      "{ev.notes}"
                    </p>
                  )}
                </div>
                  ))}
                </div>
                </>
              );
            })()}

            {/* Sultan decision and notification stage */}
            {(submission.status === "approved" || submission.status === "rejected" || submission.status === "archived") && (
              <div className="mt-5 pt-4 border-t border-border/50 space-y-3">
                <h3 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Final Decision & Notify</h3>
                <div className="rounded-lg border border-border/50 bg-background/30 p-3">
                  <p className="text-xs text-foreground/40 mb-1">Dr. Sultan Decision</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        submission.status === "rejected"
                          ? "bg-red-500/15 text-red-400 border border-red-500/20"
                          : "bg-green-500/15 text-green-400 border border-green-500/20"
                      }`}
                    >
                      {submission.status === "rejected" ? "Rejected" : "Approved"}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/60">
                    {submission.finalDecision || "Final decision recorded by Dr. Sultan."}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-2">Notify</h4>
                  <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notifyChannels.email}
                        onChange={() => toggleNotifyChannel("email")}
                        className="accent-gold"
                        disabled={submission.status === "archived"}
                      />
                      Email
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notifyChannels.sms}
                        onChange={() => toggleNotifyChannel("sms")}
                        className="accent-gold"
                        disabled={submission.status === "archived"}
                      />
                      SMS
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notifyChannels.whatsapp}
                        onChange={() => toggleNotifyChannel("whatsapp")}
                        className="accent-gold"
                        disabled={submission.status === "archived"}
                      />
                      WhatsApp
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={notifyMessage}
                    onChange={(e) => setNotifyMessage(e.target.value)}
                    disabled={submission.status === "archived"}
                    placeholder={submission.status === "rejected" ? "Rejection notification message..." : "Approval notification message..."}
                    className="mt-2 w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold/50 resize-none disabled:opacity-60"
                  />
                  {submission.status === "archived" ? (
                    <p className="text-xs text-foreground/50 mt-2">Notification already sent. Current status: Archived.</p>
                  ) : (
                    <button
                      onClick={() =>
                        requestReviewerConfirmation("send_notification", "Confirm Notification", "Send notification through selected channels and archive this case?")
                      }
                      className="mt-2 px-4 py-2 rounded-lg gold-gradient text-navy text-sm font-semibold"
                    >
                      Send Notification
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Consolidation notes (visible during consolidation stage) */}
            {submission.status === "under_consolidation" && (
              <div className="mt-4 space-y-2">
                <label className="text-xs text-foreground/40 uppercase tracking-wider">Consolidation summary / reviewer notes</label>
                <textarea
                  rows={4}
                  value={consolidationNote}
                  onChange={(e) => setConsolidationNote(e.target.value)}
                  placeholder="Add overall summary and recommendation before generating final form…"
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold/50 resize-none"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* ── Reviewer actions ──────────────────────────────────────────────── */}
        {isReviewer && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <ReviewerActions />
          </motion.div>
        )}

        {isSultan && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-panel rounded-xl border border-gold/15 p-5">
            <h3 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-3">
              Final Decision
            </h3>
            {submission.status === "sent_for_final_decision" || submission.status === "approved" || submission.status === "rejected" ? (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => requestSultanDecision("approved")}
                  className="px-5 py-2.5 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 text-sm font-semibold transition-all"
                >
                  Approve
                </button>
                <button
                  onClick={() => requestSultanDecision("rejected")}
                  className="px-5 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-all"
                >
                  Reject
                </button>
              </div>
            ) : (
              <p className="text-sm text-foreground/50">
                This submission is not yet in the final decision stage.
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Jury form preview modal (Stage 3) ────────────────────────────────── */}
      <AnimatePresence>
        {reviewerSuccessMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setReviewerSuccessMessage(null)}
            className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 16, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-2xl border border-gold/30 w-full max-w-md bg-card p-6"
            >
              <div className="w-14 h-14 rounded-full gold-gradient mx-auto mb-4 flex items-center justify-center">
                <svg className="w-7 h-7 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-display font-bold text-center mb-1">Action Completed</h3>
              <p className="text-sm text-foreground/60 text-center mb-5">{reviewerSuccessMessage}</p>
              <div className="rounded-lg border border-border/50 bg-background/40 px-3 py-2 mb-4">
                <p className="text-xs text-foreground/40 mb-1">Current Submission Status</p>
                <p className="text-sm font-semibold text-foreground">{statusLabel(submission.status)}</p>
              </div>
              <button
                onClick={() => setReviewerSuccessMessage(null)}
                className="w-full py-2.5 rounded-lg gold-gradient text-navy text-sm font-semibold"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}

        {reviewerConfirm && isReviewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setReviewerConfirm(null)}
            className="fixed inset-0 z-[125] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 16, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-2xl border border-gold/30 w-full max-w-md bg-card p-6"
            >
              <h3 className="text-lg font-display font-bold mb-2">{reviewerConfirm.title}</h3>
              <p className="text-sm text-foreground/60 mb-5">{reviewerConfirm.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setReviewerConfirm(null)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-foreground/60 hover:border-gold/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReviewerAction}
                  className="flex-1 py-2.5 rounded-lg gold-gradient text-navy text-sm font-semibold transition-all"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {confirmDecision && isSultan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmDecision(null)}
            className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 16, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-2xl border border-gold/30 w-full max-w-md bg-card p-6"
            >
              <h3 className="text-lg font-display font-bold mb-2">Confirm Final Decision</h3>
              <p className="text-sm text-foreground/60 mb-5">
                Are you sure you want to {confirmDecision === "approved" ? "approve" : "reject"} this submission?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDecision(null)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-foreground/60 hover:border-gold/20 transition-all"
                >
                  No
                </button>
                <button
                  onClick={confirmSultanDecision}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    confirmDecision === "approved"
                      ? "border border-green-500/30 text-green-400 hover:bg-green-500/10"
                      : "border border-red-500/30 text-red-400 hover:bg-red-500/10"
                  }`}
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showJuryForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowJuryForm(false)}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 16, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-2xl border border-gold/30 w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-card"
            >
              <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-gold/15 px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gold/70 font-semibold">Jury Evaluation Form Preview</p>
                  <h3 className="text-lg font-display font-bold mt-0.5">{submission.referenceNumber}</h3>
                </div>
                <button onClick={() => setShowJuryForm(false)} className="w-9 h-9 rounded-full hover:bg-foreground/10 flex items-center justify-center text-foreground/60">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs">
                  Poet and requester identity are hidden in this form — jury members will only see the poem details below.
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Poem title" value={submission.poemTitle} />
                    <Field label="Poem type" value={submission.poemType} />
                  </div>
                  <Field label="Opening line" value={submission.openingLine} />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-foreground/40">Full poem content</span>
                    <div className="rounded-xl border border-gold/15 bg-gold/5 p-5">
                      <pre dir="rtl" className="font-arabic text-lg leading-loose text-foreground/90 whitespace-pre-wrap text-right">
                        {submission.poemContent}
                      </pre>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/50 flex gap-3">
                  <button
                    onClick={() =>
                      requestReviewerConfirmation("confirm_jury_form", "Confirm Jury Form", "Lock this jury form and continue?")
                    }
                    className="flex-1 py-3 rounded-xl gold-gradient text-navy font-bold text-sm"
                  >
                    Confirm & lock jury form
                  </button>
                  <button
                    onClick={() => setShowJuryForm(false)}
                    className="px-5 py-3 rounded-xl border border-border text-foreground/50 hover:border-gold/20 text-sm transition-all"
                  >
                    Edit further
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Jury assign modal (Stage 4) ───────────────────────────────────────── */}
      <AnimatePresence>
        {showJuryModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowJuryModal(false)}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 16, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-2xl border border-gold/30 w-full max-w-lg bg-card"
            >
              <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-gold/15 px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gold/70 font-semibold">Assign Jury Members</p>
                  <h3 className="text-base font-display font-bold mt-0.5">{submission.referenceNumber} · {submission.poemTitle}</h3>
                </div>
                <button onClick={() => setShowJuryModal(false)} className="w-9 h-9 rounded-full hover:bg-foreground/10 flex items-center justify-center text-foreground/60">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Jury selection */}
                <div>
                  <label className="text-xs text-foreground/40 uppercase tracking-wider mb-2 block">
                    Select jury members
                  </label>
                  <div className="space-y-2">
                    {JURY_MEMBERS.map((j) => {
                      const checked = selectedJury.includes(j.id);
                      return (
                        <button
                          key={j.id}
                          onClick={() => setSelectedJury((prev) =>
                            prev.includes(j.id) ? prev.filter((x) => x !== j.id) : [...prev, j.id]
                          )}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            checked
                              ? "border-gold/50 bg-gold/10"
                              : "border-border hover:border-gold/20"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            checked ? "border-gold bg-gold" : "border-border"
                          }`}>
                            {checked && <svg className="w-3 h-3 text-navy" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{j.name}</p>
                            <p className="text-xs text-foreground/40">{j.specialization}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="text-xs text-foreground/40 uppercase tracking-wider mb-2 block">
                    Evaluation deadline (hours)
                  </label>
                  <div className="flex gap-2">
                    {["24", "48", "72"].map((h) => (
                      <button
                        key={h}
                        onClick={() => setDeadline(h)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                          deadline === h
                            ? "gold-gradient text-navy border-transparent"
                            : "border-border text-foreground/50 hover:border-gold/30"
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      value={!["24","48","72"].includes(deadline) ? deadline : ""}
                      onChange={(e) => setDeadline(e.target.value)}
                      placeholder="Custom"
                      className="flex-1 bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold/50 text-center"
                    />
                  </div>
                  <p className="text-xs text-foreground/30 mt-1.5">Default: 48 hours (configurable per BRD)</p>
                </div>

                {/* Dispatch */}
                <button
                  onClick={() =>
                    requestReviewerConfirmation("dispatch_to_jury", "Confirm Jury Assignment", `Dispatch to jury with ${selectedJury.length} selected member(s)?`)
                  }
                  disabled={selectedJury.length === 0}
                  className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${
                    selectedJury.length > 0
                      ? "gold-gradient text-navy shadow-lg shadow-gold/20"
                      : "bg-foreground/10 text-foreground/30 cursor-not-allowed"
                  }`}
                >
                  Dispatch to jury ({selectedJury.length} selected)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-[200] glass-panel border border-gold/30 px-5 py-3 rounded-xl shadow-2xl max-w-sm"
          >
            <p className="text-sm font-medium">{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
