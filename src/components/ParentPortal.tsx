import React, { useState } from 'react';
import {
  Student,
  GradeEntry,
  SchoolSubject,
  SchoolSettings,
  ParentFeedback,
} from '../types';
import {
  FileText,
  Award,
  MessageSquare,
  Printer,
  Send,
  CheckCircle,
  AlertCircle,
  User,
  HeartHandshake,
} from 'lucide-react';
import { calculateClassRoster, StudentRosterItem } from '../utils/calculations';
import { ALL_GRADES, STANDARD_SECTIONS } from '../utils/studentIdGenerator';

interface ParentPortalProps {
  currentStudent: Student;
  students: Student[];
  grades: GradeEntry[];
  subjects: SchoolSubject[];
  settings: SchoolSettings;
  feedbacks: ParentFeedback[];
  setFeedbacks: React.Dispatch<React.SetStateAction<ParentFeedback[]>>;
  activeTab: string;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  currentStudent,
  students,
  grades,
  subjects,
  settings,
  feedbacks,
  setFeedbacks,
  activeTab,
}) => {
  const [selectedSemesterView, setSelectedSemesterView] = useState<1 | 2 | 'annual'>('annual');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackRoleTarget, setFeedbackRoleTarget] = useState<'principal' | 'vice_principal' | 'kg_director'>(
    currentStudent.id.startsWith('kg') ? 'kg_director' : 'principal'
  );
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Student applicable subjects
  const studentSubjects = subjects.filter(s =>
    s.applicableGrades.includes(currentStudent.grade)
  );

  // Check if results are approved
  const isApproved = currentStudent.id.startsWith('kg')
    ? settings.kgResultsApproved
    : settings.resultsApprovedForStudents;

  // Student grades for current year
  const studentGrades = grades.filter(
    g =>
      g.studentId === currentStudent.id &&
      g.academicYear === settings.currentAcademicYear
  );

  // Parent's feedbacks for this student
  const myFeedbacks = feedbacks.filter(f => f.studentId === currentStudent.id);

  // Submit feedback to school
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    const newFb: ParentFeedback = {
      id: `fb-${Date.now()}`,
      studentId: currentStudent.id,
      studentName: currentStudent.fullName,
      parentName: `የተማሪ ${currentStudent.fullName} ወላጅ`,
      phone: currentStudent.parentPhone || '—',
      date: new Date().toISOString().split('T')[0],
      message: feedbackMessage.trim(),
      targetRole: feedbackRoleTarget,
    };

    setFeedbacks(prev => [newFb, ...prev]);
    setFeedbackMessage('');
    setFeedbackSuccess(true);
    setTimeout(() => setFeedbackSuccess(false), 3000);
  };

  // Compute ranks & overall leaderboard for top students tab
  const schoolWideRosterItems: StudentRosterItem[] = [];
  ALL_GRADES.forEach(g => {
    STANDARD_SECTIONS.forEach(sec => {
      const classR = calculateClassRoster(
        students,
        grades,
        subjects,
        g,
        sec,
        settings.currentAcademicYear,
        settings.failThresholdSubjects
      );
      schoolWideRosterItems.push(...classR);
    });
  });

  const [topRankFilter, setTopRankFilter] = useState<'class3' | 'female3' | 'school3' | 'school20' | 'class10'>('class3');

  const myClassRoster = calculateClassRoster(
    students,
    grades,
    subjects,
    currentStudent.grade,
    currentStudent.section,
    settings.currentAcademicYear,
    settings.failThresholdSubjects
  );

  const getRankedList = () => {
    const list = [...schoolWideRosterItems].filter(r => r.annualAvg > 0 || r.sem1Avg > 0);
    list.sort((a, b) => (b.annualAvg || b.sem1Avg) - (a.annualAvg || a.sem1Avg));

    if (topRankFilter === 'class3') {
      return [...myClassRoster]
        .sort((a, b) => (b.annualAvg || b.sem1Avg) - (a.annualAvg || a.sem1Avg))
        .slice(0, 3);
    }
    if (topRankFilter === 'class10') {
      return [...myClassRoster]
        .sort((a, b) => (b.annualAvg || b.sem1Avg) - (a.annualAvg || a.sem1Avg))
        .slice(0, 10);
    }
    if (topRankFilter === 'female3') {
      return list.filter(r => r.student.gender === 'ሴት').slice(0, 3);
    }
    if (topRankFilter === 'school3') {
      return list.slice(0, 3);
    }
    if (topRankFilter === 'school20') {
      return list.slice(0, 20);
    }
    return list.slice(0, 10);
  };

  // Student specific roster item for total/rank
  const myRosterItem = myClassRoster.find(r => r.student.id === currentStudent.id);

  return (
    <div className="space-y-6">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={settings.customLogo || "/kale_heywet_logo.jpg"}
              alt="Kale Heywet Logo"
              className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-lg bg-white shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/src/assets/images/kale_heywet_logo_1791782506449.jpg';
              }}
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight">{currentStudent.fullName}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200 mt-1">
                <span className="font-mono bg-white/15 px-2 py-0.5 rounded text-white">
                  ኮድ፡ {currentStudent.id}
                </span>
                <span>ክፍል፡ {currentStudent.grade} (ሴክሽን {currentStudent.section})</span>
                <span>ጾታ፡ {currentStudent.gender}</span>
                <span>የትምህርት ዘመን፡ {settings.currentAcademicYear} ዓ/ም</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg text-xs shadow-sm transition-colors whitespace-nowrap self-start sm:self-center"
          >
            <Printer className="w-4 h-4" />
            <span>የውጤት ካርድ አትም (Print Card)</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Detailed Report Card (ውጤት ካርድ) */}
      {activeTab === 'report_card' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-700" />
                  <span>የተማሪ ይፋዊ የውጤት ካርድ (Official Student Report Card)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  የብርብር ከተማ ቃለ ሕይወት ርኆቦት መካከለኛና የመጀመሪያ ደረጃ ትምህርት ቤት
                </p>
              </div>

              {/* Semester selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setSelectedSemesterView(1)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedSemesterView === 1
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1ኛ ሰሚስተር
                </button>
                <button
                  onClick={() => setSelectedSemesterView(2)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedSemesterView === 2
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2ኛ ሰሚስተር
                </button>
                <button
                  onClick={() => setSelectedSemesterView('annual')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedSemesterView === 'annual'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  የአመቱ አማካይ (Annual)
                </button>
              </div>
            </div>

            {/* If results are not approved yet */}
            {!isApproved ? (
              <div className="p-6 text-center space-y-2 bg-amber-50 border border-amber-200 rounded-xl mt-4">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                <h3 className="text-sm font-bold text-amber-900">ውጤቱ በሂደት ላይ ነው</h3>
                <p className="text-xs text-amber-700 max-w-md mx-auto">
                  የትምህርት ቤቱ አስተዳደር ውጤቱን ለወላጆች ይፋ እስኪያደርግና እስኪያጸድቅ ድረስ ለጊዜው አይታይም። እባክዎ በትዕግስት ይጠብቁ።
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                {/* Printable Report Card Header */}
                <div className="text-center pb-3 border-b border-slate-300 print-only hidden">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <img
                      src={settings.customLogo || "/kale_heywet_logo.jpg"}
                      alt="Kale Heywet Logo"
                      className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 bg-white"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/src/assets/images/kale_heywet_logo_1791782506449.jpg';
                      }}
                    />
                    <div>
                      <h1 className="text-lg font-bold text-slate-900">የብርብር ከተማ ቃለ ሕይወት ርኆቦት ት/ቤት</h1>
                      <p className="text-xs text-slate-700">የተማሪ ይፋዊ የውጤት መግለጫ ካርድ (Official Report Card)</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold">
                    ክፍል፡ {currentStudent.grade} ({currentStudent.section}) | የትምህርት ዘመን፡ {settings.currentAcademicYear} ዓ/ም | ስም፡ {currentStudent.fullName} | መለያ፡ {currentStudent.id}
                  </p>
                </div>

                {/* Subject Mark Breakdown Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 text-left">የትምህርት ዓይነት</th>
                        <th className="py-2 px-1">ምዘና 1 (10)</th>
                        <th className="py-2 px-1">ምዘና 2 (10)</th>
                        <th className="py-2 px-1">ሚድ (10)</th>
                        <th className="py-2 px-1">አሳይንመንት (10)</th>
                        <th className="py-2 px-1">ፕሮጀክት (20)</th>
                        <th className="py-2 px-1">ፈተና 1 (10)</th>
                        <th className="py-2 px-1">የቤት ስራ (10)</th>
                        <th className="py-2 px-1">ማጠቃለያ (20)</th>
                        <th className="py-2.5 px-3 bg-slate-200/60 font-extrabold">ድምር (100)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {studentSubjects.map(sub => {
                        const targetSem = selectedSemesterView === 'annual' ? 1 : selectedSemesterView;
                        const gEntry = studentGrades.find(
                          g => g.subjectName === sub.name && g.semester === targetSem
                        );
                        const m = gEntry?.marks;

                        return (
                          <tr key={sub.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-left font-sans font-semibold text-slate-900">
                              {sub.name}
                            </td>
                            <td className="py-2 px-1 text-slate-700">{m?.test1 ?? '—'}</td>
                            <td className="py-2 px-1 text-slate-700">{m?.test2 ?? '—'}</td>
                            <td className="py-2 px-1 text-slate-700">{m?.midExam ?? '—'}</td>
                            <td className="py-2 px-1 text-slate-700">{m?.assignment ?? '—'}</td>
                            <td className="py-2 px-1 text-slate-700">{m?.project ?? '—'}</td>
                            <td className="py-2 px-1 text-slate-700">{m?.quiz ?? '—'}</td>
                            <td className="py-2 px-1 text-slate-700">{m?.homework ?? '—'}</td>
                            <td className="py-2 px-1 text-slate-700">{m?.finalExam ?? '—'}</td>
                            <td
                              className={`py-2.5 px-3 font-bold text-sm ${
                                m && m.total < 50
                                  ? 'text-rose-600 bg-rose-50/50'
                                  : 'text-slate-900 bg-slate-100/50'
                              }`}
                            >
                              {m ? m.total : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Cumulative summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">አጠቃላይ ድምር</div>
                    <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                      {myRosterItem ? myRosterItem.annualTotal : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">የአመቱ አማካይ ውጤት</div>
                    <div className="text-lg font-bold font-mono text-indigo-700 mt-0.5">
                      {myRosterItem ? `${myRosterItem.annualAvg}%` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">የክፍል ደረጃ (Rank)</div>
                    <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">
                      {myRosterItem?.annualRank ? `${myRosterItem.annualRank}ኛ` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">የማለፍ ሁኔታ</div>
                    <div className="text-sm font-bold mt-1">
                      {myRosterItem?.passed ? (
                        <span className="text-emerald-700">አልፏል (ተሸጋግሯል)</span>
                      ) : (
                        <span className="text-rose-700">ይደግማል</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Report Card Signature footer for print */}
                <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-center print-only hidden">
                  <div>
                    <div className="font-semibold text-slate-800">የክፍል ስም ጠሪ መምህር ፊርማ</div>
                    <div className="mt-4 text-slate-400">________________________</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">የትምህርት ቤቱ ር/መምህር ፊርማና ማህተም</div>
                    <div className="mt-4 text-slate-400">________________________</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Conduct Notes from School (የባህሪ መግለጫ) */}
      {activeTab === 'conduct_notes' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-indigo-700" />
                <span>ስለ ተማሪው ከመምህራንና ር/መምህር የተሰጡ የባህሪ አስተያየቶች</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                በትምህርት ቤት የተማሪውን ስነ-ምግባር፣ ታታሪነትና ማሻሻያ የሚሹ ነጥቦችን የሚገልጹ ማስታወሻዎች።
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {currentStudent.conductNotes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  እስካሁን ምንም የባህሪ አስተያየት አልተመዘገበም።
                </div>
              ) : (
                currentStudent.conductNotes.map(n => (
                  <div key={n.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-900">
                        {n.author} ({n.authorRole})
                      </span>
                      <span>{n.date}</span>
                    </div>
                    <p className="text-xs text-slate-800 pt-1 leading-relaxed">{n.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Top Students List */}
      {activeTab === 'top_students' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>የትምህርት ቤቱ ከፍተኛ ውጤት ያመጡ ተማሪዎች</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                የልጆችዎን አቻዎችና የትምህርት ቤቱን አርአያ ተማሪዎች ዝርዝር ይመልከቱ።
              </p>
            </div>

            {/* Filter buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setTopRankFilter('class3')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  topRankFilter === 'class3'
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                የክፍሉ ምርጥ 3 ({currentStudent.grade})
              </button>
              <button
                onClick={() => setTopRankFilter('class10')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  topRankFilter === 'class10'
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                የክፍሉ ምርጥ 10 ({currentStudent.grade})
              </button>
              <button
                onClick={() => setTopRankFilter('female3')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  topRankFilter === 'female3'
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ከአጠቃላይ ሴቶች ምርጥ 3
              </button>
              <button
                onClick={() => setTopRankFilter('school3')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  topRankFilter === 'school3'
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                የትምህርት ቤቱ ከፍተኛ ውጤት (Top 3)
              </button>
              <button
                onClick={() => setTopRankFilter('school20')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  topRankFilter === 'school20'
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                የትምህርት ቤቱ ከፍተኛ 20 ተማሪዎች
              </button>
            </div>

            <div className="mt-4 overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">ደረጃ</th>
                    <th className="py-2.5 px-3">የተማሪ ሙሉ ስም</th>
                    <th className="py-2.5 px-3">ጾታ</th>
                    <th className="py-2.5 px-3">ክፍል</th>
                    <th className="py-2.5 px-3">አማካይ ውጤት</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getRankedList().map((r, idx) => (
                    <tr
                      key={r.student.id}
                      className={`hover:bg-slate-50 ${
                        r.student.id === currentStudent.id ? 'bg-amber-50/60 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-amber-800">#{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {r.student.fullName} {r.student.id === currentStudent.id ? '(የእርስዎ ልጅ)' : ''}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{r.student.gender}</td>
                      <td className="py-2.5 px-3 text-slate-700">{r.student.grade}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-900">
                        {r.annualAvg || r.sem1Avg}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Send Feedback & Questions to School */}
      {activeTab === 'send_feedback' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-700" />
                <span>ለትምህርት ቤቱ አስተዳደር ጥያቄ ወይም አስተያየት መላኪያ</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                መልዕክትዎን ለዋና ር/መምህር፣ ለምክትል ር/መምህር ወይም ለኬጂ ር/መምህር መላክ ይችላሉ።
              </p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  መልዕክቱ የሚላክለት ኃላፊ
                </label>
                <select
                  value={feedbackRoleTarget}
                  onChange={e =>
                    setFeedbackRoleTarget(
                      e.target.value as 'principal' | 'vice_principal' | 'kg_director'
                    )
                  }
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="principal">ለትምህርት ቤቱ ዋና ር/መምህር</option>
                  <option value="vice_principal">ለትምህርት ቤቱ ም/ር/መምህር</option>
                  <option value="kg_director">ለኬጂ ትምህርት ቤት ር/መምህር</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  የአስተያየትዎ ወይም ጥያቄዎ ዝርዝር
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="ጥያቄዎትን ወይም ገንቢ አስተያየትዎን እዚህ በግልጽ ይጻፉ..."
                  value={feedbackMessage}
                  onChange={e => setFeedbackMessage(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg"
                />
              </div>

              {feedbackSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>መልዕክትዎ በተሳካ ሁኔታ ለትምህርት ቤቱ ተልኳል! ምላሽ ሲሰጥ እዚህ ገጽ ላይ ይታያል።</span>
                </div>
              )}

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>አስተያየቱን ላክ</span>
              </button>
            </form>

            {/* List of Previous messages & responses */}
            <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-800">ቀደም ሲል የላኳቸው መልዕክቶችና የተሰጡ ምላሾች</h3>
              {myFeedbacks.length === 0 ? (
                <p className="text-xs text-slate-400">እስካሁን ምንም መልዕክት አልላኩም።</p>
              ) : (
                myFeedbacks.map(fb => (
                  <div key={fb.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">የእርስዎ ጥያቄ</span>
                      <span>{fb.date}</span>
                    </div>
                    <p className="text-xs text-slate-700 p-2.5 bg-white rounded-lg border border-slate-200">
                      "{fb.message}"
                    </p>

                    {fb.reply ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950 space-y-1">
                        <div className="flex items-center justify-between font-semibold text-emerald-900">
                          <span>የትምህርት ቤቱ ምላሽ ({fb.repliedBy})</span>
                          <span className="text-[11px] font-normal">{fb.replyDate}</span>
                        </div>
                        <p>{fb.reply}</p>
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-700 font-medium">
                        ⏳ ምላሽ በመጠባበቅ ላይ ነው...
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
