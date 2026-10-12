import React, { useState } from 'react';
import {
  Student,
  Teacher,
  SchoolSettings,
  SchoolSubject,
  GradeEntry,
  ParentFeedback,
  TeacherLetter,
} from '../types';
import { ALL_GRADES, STANDARD_SECTIONS } from '../utils/studentIdGenerator';
import {
  calculateClassRoster,
  calculateClassPerformanceAnalysis,
  calculateSubjectPerformanceAnalysis,
  calculateAllSubjectsAnalysis,
  StudentRosterItem,
} from '../utils/calculations';
import {
  FileText,
  BarChart3,
  Award,
  MessageSquare,
  Mail,
  Printer,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Eye,
  Send,
  Users,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Search,
} from 'lucide-react';
import {
  downloadStudentTemplate,
  parseStudentsExcelFile,
  exportStudentsToExcel,
  ParsedStudentRow,
} from '../utils/excelHelper';
import { generateNextStudentId } from '../utils/studentIdGenerator';

interface PrincipalPortalProps {
  isVicePrincipal?: boolean;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  subjects: SchoolSubject[];
  settings: SchoolSettings;
  setSettings: React.Dispatch<React.SetStateAction<SchoolSettings>>;
  grades: GradeEntry[];
  feedbacks: ParentFeedback[];
  setFeedbacks: React.Dispatch<React.SetStateAction<ParentFeedback[]>>;
  letters: TeacherLetter[];
  setLetters: React.Dispatch<React.SetStateAction<TeacherLetter[]>>;
  activeTab: string;
}

export const PrincipalPortal: React.FC<PrincipalPortalProps> = ({
  isVicePrincipal = false,
  students,
  setStudents,
  teachers,
  setTeachers,
  subjects,
  settings,
  setSettings,
  grades,
  feedbacks,
  setFeedbacks,
  letters,
  setLetters,
  activeTab,
}) => {
  // Class selection for Roster & Analytics
  const [selectedGrade, setSelectedGrade] = useState<string>('1ኛ ክፍል');
  const [selectedSection, setSelectedSection] = useState<string>('ሀ');
  const [selectedPrincipalYear, setSelectedPrincipalYear] = useState<string>(settings.currentAcademicYear);
  const [rosterViewMode, setRosterViewMode] = useState<'annual' | 'sem1' | 'sem2'>('annual');
  const [selectedSubjectForAnalysis, setSelectedSubjectForAnalysis] = useState<string>('እንግሊዝኛ');

  // Top rankings filter
  const [topRankingFilter, setTopRankingFilter] = useState<
    'top3_class' | 'top3_female' | 'top3_school' | 'top20_school' | 'top10_class'
  >('top3_class');

  // Parent Feedback reply state
  const [replyInput, setReplyInput] = useState<{ [feedbackId: string]: string }>({});

  // Conduct remark modal state
  const [selectedStudentForConduct, setSelectedStudentForConduct] = useState<Student | null>(null);
  const [conductText, setConductText] = useState('');

  // Vice Principal Letters form
  const [newLetterTitle, setNewLetterTitle] = useState('');
  const [newLetterContent, setNewLetterContent] = useState('');

  // Student registration states for Principal
  const [selectedRegGradeFilter, setSelectedRegGradeFilter] = useState<string>('1ኛ ክፍል');
  const [selectedRegYearFilter, setSelectedRegYearFilter] = useState<string>(settings.currentAcademicYear);
  const [searchStudentTerm, setSearchStudentTerm] = useState('');
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState<{
    fullName: string;
    gender: 'ወንድ' | 'ሴት';
    age: number;
    academicYear: string;
    grade: string;
    section: string;
    parentPhone: string;
    address: string;
  }>({
    fullName: '',
    gender: 'ወንድ',
    age: 7,
    academicYear: settings.currentAcademicYear,
    grade: '1ኛ ክፍል',
    section: 'ሀ',
    parentPhone: '',
    address: 'ብርብር ከተማ ቀበሌ 01',
  });

  const [parsedStudentsPreview, setParsedStudentsPreview] = useState<ParsedStudentRow[] | null>(null);
  const [isStudentExcelModalOpen, setIsStudentExcelModalOpen] = useState(false);
  const [studentImportSuccessMsg, setStudentImportSuccessMsg] = useState<string | null>(null);

  const handleStudentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseStudentsExcelFile(file, selectedRegYearFilter);
      if (parsed.length === 0) {
        alert('በተመረጠው የኤክሴል ሰነድ ውስጥ ምንም የተማሪ መረጃ አልተገኘም! እባክዎ የቅጹን አምዶች ይፈትሹ።');
        return;
      }
      setParsedStudentsPreview(parsed);
      setIsStudentExcelModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('የኤክሴል ፋይሉን በማንበብ ሂደት ስህተት አጋጥሟል! እባክዎ ትክክለኛ .xlsx ወይም .csv ፋይል ይምረጡ።');
    }
    e.target.value = '';
  };

  const handleConfirmStudentImport = () => {
    if (!parsedStudentsPreview || parsedStudentsPreview.length === 0) return;

    let updatedList = [...students];
    let addedCount = 0;

    for (const row of parsedStudentsPreview) {
      const nextId = generateNextStudentId(row.grade, updatedList);
      const newStudent: Student = {
        id: nextId,
        seqNo: updatedList.filter(s => s.grade === row.grade).length + 1,
        fullName: row.fullName,
        gender: row.gender,
        age: row.age,
        academicYear: row.academicYear || selectedRegYearFilter,
        grade: row.grade,
        section: row.section || 'ሀ',
        parentPhone: row.parentPhone || '',
        address: row.address || 'ብርብር ከተማ ቀበሌ 01',
        promotionStatus: 'pending',
        conductNotes: [],
      };
      updatedList.push(newStudent);
      addedCount++;
    }

    setStudents(updatedList);
    setIsStudentExcelModalOpen(false);
    setParsedStudentsPreview(null);
    setStudentImportSuccessMsg(`በኤክሴል ሰነድ ውስጥ የነበሩ ${addedCount} ተማሪዎች በተሳካ ሁኔታ ተመዝግበዋል! መለያ ኮዶች (ID) በራስ-ሰር ተዘጋጅተዋል።`);
    setTimeout(() => setStudentImportSuccessMsg(null), 5000);
  };

  const handleOpenAddStudent = () => {
    setEditingStudentId(null);
    setStudentForm({
      fullName: '',
      gender: 'ወንድ',
      age: selectedRegGradeFilter.includes('ማቆያ') ? 4 : 7,
      academicYear: selectedRegYearFilter,
      grade: selectedRegGradeFilter,
      section: 'ሀ',
      parentPhone: '',
      address: 'ብርብር ከተማ ቀበሌ 01',
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (s: Student) => {
    setEditingStudentId(s.id);
    setStudentForm({
      fullName: s.fullName,
      gender: s.gender,
      age: s.age,
      academicYear: s.academicYear,
      grade: s.grade,
      section: s.section,
      parentPhone: s.parentPhone,
      address: s.address,
    });
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudentId) {
      setStudents(prev =>
        prev.map(s =>
          s.id === editingStudentId
            ? {
                ...s,
                ...studentForm,
              }
            : s
        )
      );
    } else {
      const nextId = generateNextStudentId(studentForm.grade, students);
      const newStudent: Student = {
        id: nextId,
        seqNo: students.filter(s => s.grade === studentForm.grade).length + 1,
        fullName: studentForm.fullName,
        gender: studentForm.gender,
        age: studentForm.age,
        academicYear: studentForm.academicYear,
        grade: studentForm.grade,
        section: studentForm.section,
        parentPhone: studentForm.parentPhone,
        address: studentForm.address,
        promotionStatus: 'pending',
        conductNotes: [],
      };
      setStudents(prev => [...prev, newStudent]);
    }
    setIsStudentModalOpen(false);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (window.confirm(`ተማሪ ${name} (${id}) በእርግጥ እንዲሰረዝ ይፈልጋሉ?`)) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const filteredPrincipalStudents = students.filter(s => {
    const matchGrade = !selectedRegGradeFilter || s.grade === selectedRegGradeFilter;
    const matchYear = !selectedRegYearFilter || s.academicYear === selectedRegYearFilter;
    const matchSearch =
      !searchStudentTerm ||
      s.fullName.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
      s.parentPhone.includes(searchStudentTerm);
    return matchGrade && matchYear && matchSearch;
  });

  // Calculate current class roster
  const currentRoster = calculateClassRoster(
    students,
    grades,
    subjects,
    selectedGrade,
    selectedSection,
    selectedPrincipalYear === 'all'
      ? (students.find(s => s.grade === selectedGrade)?.academicYear || settings.currentAcademicYear)
      : selectedPrincipalYear,
    settings.failThresholdSubjects,
    settings.passAverageThreshold,
    settings.mandatoryFailingSubjects,
    settings.gradePromotionRules
  );

  const gradeSubjects = subjects.filter(sub => sub.applicableGrades.includes(selectedGrade));

  // Performance analytics
  const classPerformance = calculateClassPerformanceAnalysis(currentRoster);
  const subjectPerformance = calculateSubjectPerformanceAnalysis(
    currentRoster,
    selectedSubjectForAnalysis
  );
  const allSubjectsAnalysis = calculateAllSubjectsAnalysis(currentRoster, gradeSubjects);

  // Homeroom teacher for selected grade and section
  const currentHomeroomTeacher = teachers.find(
    t => t.isHomeroom && t.homeroomGrade === selectedGrade && t.homeroomSection === selectedSection
  );

  // Assign or change homeroom teacher
  const handleAssignHomeroom = (teacherId: string) => {
    setTeachers(prev =>
      prev.map(t => {
        if (t.id === teacherId) {
          return {
            ...t,
            isHomeroom: true,
            homeroomGrade: selectedGrade,
            homeroomSection: selectedSection,
          };
        }
        // If someone else was homeroom for this exact grade/section, clear it
        if (t.homeroomGrade === selectedGrade && t.homeroomSection === selectedSection) {
          return {
            ...t,
            isHomeroom: false,
            homeroomGrade: undefined,
            homeroomSection: undefined,
          };
        }
        return t;
      })
    );
  };

  // Reply to parent feedback
  const handleSendFeedbackReply = (feedbackId: string) => {
    const text = replyInput[feedbackId];
    if (!text || !text.trim()) return;

    setFeedbacks(prev =>
      prev.map(fb =>
        fb.id === feedbackId
          ? {
              ...fb,
              reply: text.trim(),
              replyDate: new Date().toISOString().split('T')[0],
              repliedBy: isVicePrincipal ? 'ም/ር/መምህር' : 'ዋና ር/መምህር',
            }
          : fb
      )
    );
    setReplyInput(prev => ({ ...prev, [feedbackId]: '' }));
  };

  // Save conduct remark
  const handleSaveConduct = () => {
    if (!selectedStudentForConduct || !conductText.trim()) return;

    const newNote = {
      id: `cn-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      author: isVicePrincipal ? 'ም/ር/መምህር' : 'ዋና ር/መምህር',
      authorRole: isVicePrincipal ? 'ም/ር/መምህር' : 'ዋና ር/መምህር',
      note: conductText.trim(),
    };

    setStudents(prev =>
      prev.map(s =>
        s.id === selectedStudentForConduct.id
          ? {
              ...s,
              conductNotes: [newNote, ...s.conductNotes],
            }
          : s
      )
    );

    setSelectedStudentForConduct(null);
    setConductText('');
  };

  // Create new letter (Vice Principal)
  const handleCreateLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLetterTitle.trim() || !newLetterContent.trim()) return;

    const letter: TeacherLetter = {
      id: `ltr-${Date.now()}`,
      title: newLetterTitle.trim(),
      content: newLetterContent.trim(),
      date: new Date().toISOString().split('T')[0],
      sender: isVicePrincipal ? 'ም/ር/መምህር ጽ/ቤት' : 'ዋና ር/መምህር ጽ/ቤት',
      replies: [],
    };

    setLetters(prev => [letter, ...prev]);
    setNewLetterTitle('');
    setNewLetterContent('');
  };

  // Compute overall top rankings across the entire school
  const allActiveStudents = students.filter(
    s => s.academicYear === settings.currentAcademicYear
  );

  // Compute school-wide rosters for overall leaderboards
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

  const getRankedList = () => {
    const list = [...schoolWideRosterItems].filter(r => r.annualAvg > 0 || r.sem1Avg > 0);
    list.sort((a, b) => (b.annualAvg || b.sem1Avg) - (a.annualAvg || a.sem1Avg));

    if (topRankingFilter === 'top3_class') {
      return [...currentRoster]
        .sort((a, b) => (b.annualAvg || b.sem1Avg) - (a.annualAvg || a.sem1Avg))
        .slice(0, 3);
    }
    if (topRankingFilter === 'top10_class') {
      return [...currentRoster]
        .sort((a, b) => (b.annualAvg || b.sem1Avg) - (a.annualAvg || a.sem1Avg))
        .slice(0, 10);
    }
    if (topRankingFilter === 'top3_female') {
      return list.filter(r => r.student.gender === 'ሴት').slice(0, 3);
    }
    if (topRankingFilter === 'top3_school') {
      return list.slice(0, 3);
    }
    if (topRankingFilter === 'top20_school') {
      return list.slice(0, 20);
    }
    return list.slice(0, 10);
  };

  const rankedStudents = getRankedList();

  return (
    <div className="space-y-6">
      {/* Tab 0: Student Registration (ተማሪዎች ምዝገባ & ኤክሴል መጫኛ) */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            {/* School Header with Kale Hewet Logo */}
            <div className="flex items-center justify-center gap-3.5 pb-4 border-b border-slate-100">
              <img
                src={settings.customLogo || "/kale_heywet_logo.jpg"}
                alt="Kale Heywet Logo"
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-xs bg-white shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/src/assets/images/kale_heywet_logo_1791782506449.jpg';
                }}
              />
              <div className="text-center">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  የብርብር ከተማ ቃለ ሕይወት ርኆቦት መጀመሪያና መካከለኛ ትምህርት ቤት
                </h1>
                <div className="text-xs text-indigo-700 font-semibold mt-0.5">
                  የተማሪዎች ምዝገባ ሰንጠረዥ — [{selectedRegGradeFilter}] ({selectedRegYearFilter} ዓ/ም)
                </div>
              </div>
            </div>

            {/* Filter controls */}
            <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">የክፍል ደረጃ</label>
                  <select
                    value={selectedRegGradeFilter}
                    onChange={e => setSelectedRegGradeFilter(e.target.value)}
                    className="text-xs py-1.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  >
                    {ALL_GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">የትምህርት ዘመን</label>
                  <select
                    value={selectedRegYearFilter}
                    onChange={e => setSelectedRegYearFilter(e.target.value)}
                    className="text-xs py-1.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="2020">2020 ዓ/ም</option>
                    <option value="2019">2019 ዓ/ም</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">ፍለጋ (ስም/ኮድ)</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ስም ወይም መለያ ኮድ..."
                      value={searchStudentTerm}
                      onChange={e => setSearchStudentTerm(e.target.value)}
                      className="text-xs py-1.5 pl-8 pr-3 bg-white border border-slate-300 rounded-lg w-44"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0">
                <input
                  type="file"
                  id="principal-student-excel-input"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleStudentFileSelect}
                />
                <button
                  onClick={() => document.getElementById('principal-student-excel-input')?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
                  title="የተማሪዎችን መረጃ ከኤክሴል ሰነድ ጫን"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>ኤክሴል ጫን (Upload Excel)</span>
                </button>

                <button
                  onClick={downloadStudentTemplate}
                  className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors whitespace-nowrap shrink-0"
                  title="የኤክሴል ምሳሌ ቅጽ አውርድ"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>የኤክሴል ቅጽ</span>
                </button>

                <button
                  onClick={() => exportStudentsToExcel(students, `የተማሪዎች_ዝርዝር_${selectedRegGradeFilter}.xlsx`)}
                  className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors whitespace-nowrap shrink-0"
                  title="የተመዘገቡ ተማሪዎችን በኤክሴል አውርድ"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ኤክሴል አውርድ</span>
                </button>

                <button
                  onClick={handleOpenAddStudent}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>አዲስ ተማሪ መዝግብ</span>
                </button>
              </div>
            </div>

            {studentImportSuccessMsg && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{studentImportSuccessMsg}</span>
              </div>
            )}

            {/* Students Table */}
            <div className="mt-5 overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/75 text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">ተራ ቁጥር</th>
                    <th className="py-2.5 px-3">መለያ ኮድ (ID)</th>
                    <th className="py-2.5 px-3">ስም ከነ አያት</th>
                    <th className="py-2.5 px-3">ጾታ</th>
                    <th className="py-2.5 px-3">ዕድሜ</th>
                    <th className="py-2.5 px-3">ክፍል / ሴክሽን</th>
                    <th className="py-2.5 px-3">የትምህርት ዘመን</th>
                    <th className="py-2.5 px-3">የወላጅ ስልክ</th>
                    <th className="py-2.5 px-3">አድራሻ</th>
                    <th className="py-2.5 px-3 text-right">ተግባር</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPrincipalStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        በዚህ ክፍልና የትምህርት ዘመን የተመዘገበ ተማሪ የለም። "አዲስ ተማሪ መዝግብ" ወይም "ኤክሴል ጫን" የሚለውን ይጫኑ።
                      </td>
                    </tr>
                  ) : (
                    filteredPrincipalStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-600">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700">
                          {s.id}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{s.fullName}</td>
                        <td className="py-2.5 px-3 text-slate-700">{s.gender}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{s.age}</td>
                        <td className="py-2.5 px-3 text-slate-700">{s.grade} - {s.section}</td>
                        <td className="py-2.5 px-3 text-slate-700">{s.academicYear} ዓ/ም</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{s.parentPhone || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{s.address || 'ብርብር'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditStudent(s)}
                              title="ኤዲት አድርግ"
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s.id, s.fullName)}
                              title="ሰርዝ"
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Section Management & Homeroom Assignment */}
      {activeTab === 'sections' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-700" />
                  <span>የክፍሎች አደረጃጀት፣ ሴክሽኖች እና የክፍል ስም ጠሪ መምህር መመደቢያ</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  የክፍል ስም ጠሪ መምህር የክፍሉን ሮስተር የሚያዘጋጅና የሚከታተል ኃላፊ ነው።
                </p>
              </div>

              {/* Semester Switcher control */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-xl">
                <span className="text-xs font-semibold text-slate-700">ንቁ ሰሚስተር፡</span>
                <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, currentSemester: 1 }))}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      settings.currentSemester === 1
                        ? 'bg-indigo-700 text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1ኛ ሰሚስተር
                  </button>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, currentSemester: 2 }))}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      settings.currentSemester === 2
                        ? 'bg-indigo-700 text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2ኛ ሰሚስተር
                  </button>
                </div>
              </div>
            </div>

            {/* Select Grade, Section, Academic Year, and Homeroom Teacher */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  የክፍል ደረጃ ምረጥ
                </label>
                <select
                  value={selectedGrade}
                  onChange={e => setSelectedGrade(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                >
                  {ALL_GRADES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ሴክሽን ምረጥ
                </label>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white font-bold"
                >
                  {STANDARD_SECTIONS.map(s => (
                    <option key={s} value={s}>ሴክሽን {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  የትምህርት ዘመን
                </label>
                <select
                  value={selectedPrincipalYear}
                  onChange={e => setSelectedPrincipalYear(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white font-semibold text-amber-900"
                >
                  <option value="all">ሁሉም ዓመታት</option>
                  {settings.availableAcademicYears.map(yr => (
                    <option key={yr} value={yr}>{yr} ዓ/ም</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  የክፍሉ ስም ጠሪ መምህር
                </label>
                <select
                  value={currentHomeroomTeacher?.id || ''}
                  onChange={e => handleAssignHomeroom(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-indigo-300 rounded-lg bg-indigo-50/50 font-medium text-indigo-900"
                >
                  <option value="">-- ስም ጠሪ መምህር መድብ --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.roleTitle ? `(${t.roleTitle})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Class Summary */}
            <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">
                  {selectedGrade} (ሴክሽን {selectedSection}):
                </span>
                <span className="text-slate-600">
                  የተማሪዎች ብዛት፡ <strong>{currentRoster.length}</strong> (ወንድ፡{' '}
                  <strong>{currentRoster.filter(r => r.student.gender === 'ወንድ').length}</strong>, ሴት፡{' '}
                  <strong>{currentRoster.filter(r => r.student.gender === 'ሴት').length}</strong>)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-600">ስም ጠሪ መምህር፡</span>
                <span className="font-semibold text-indigo-700">
                  {currentHomeroomTeacher ? currentHomeroomTeacher.name : 'አልተመደበም'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Complete Class Roster (ሮስተር) */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            {/* Header with Print & Approval toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={settings.customLogo || "/kale_heywet_logo.jpg"}
                  alt="Kale Heywet Logo"
                  className="w-12 h-12 rounded-full object-cover border border-amber-400 shadow-xs bg-white shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/src/assets/images/kale_heywet_logo_1791782506449.jpg';
                  }}
                />
                <div className="text-center md:text-left">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight">
                    የብርብር ከተማ ቃለ ሕይወት ርኆቦት መጀመሪያና መካከለኛ ትምህርት ቤት
                  </h1>
                  <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                    የተማሪዎች ይፋዊ ሮስተር (Official Class Roster) — {selectedGrade} (ሴክሽን {selectedSection})
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Result Approval / Publication for students */}
                <button
                  onClick={() =>
                    setSettings(prev => ({
                      ...prev,
                      resultsApprovedForStudents: !prev.resultsApprovedForStudents,
                    }))
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    settings.resultsApprovedForStudents
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                  title="ተማሪዎችና ወላጆች ውጤት እንዲያዩ ይፈቀድ ወይም ይታገድ"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {settings.resultsApprovedForStudents
                      ? 'ውጤት ለተማሪዎች ጸድቋል (Approved)'
                      : 'ውጤት ለተማሪዎች አልጸደቀም (Pending)'}
                  </span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>ሮስተር አትም (Print)</span>
                </button>
              </div>
            </div>

            {/* Filter Grade & Semester Tabs */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <select
                  value={selectedGrade}
                  onChange={e => setSelectedGrade(e.target.value)}
                  className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  {ALL_GRADES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  {STANDARD_SECTIONS.map(s => (
                    <option key={s} value={s}>ሴክሽን {s}</option>
                  ))}
                </select>
              </div>

              {/* View options: Annual, Sem 1, Sem 2 */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setRosterViewMode('sem1')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    rosterViewMode === 'sem1'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1ኛ ሰሚስተር ለብቻ
                </button>
                <button
                  onClick={() => setRosterViewMode('sem2')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    rosterViewMode === 'sem2'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2ኛ ሰሚስተር ለብቻ
                </button>
                <button
                  onClick={() => setRosterViewMode('annual')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    rosterViewMode === 'annual'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  የሁለቱም ሰሚስተር የተዋቀለ (ከነ አማካይ)
                </button>
              </div>
            </div>

            {/* Official Roster Table */}
            <div className="mt-4 overflow-x-auto border border-slate-300 rounded-xl">
              <table className="w-full text-[11px] text-center border-collapse">
                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-1.5 border-r border-slate-300 w-8">ተ.ቁ</th>
                    <th className="py-2 px-2 border-r border-slate-300 text-left min-w-[130px]">
                      የተማሪ ሙሉ ስም
                    </th>
                    <th className="py-2 px-1.5 border-r border-slate-300 w-10">ጾታ</th>
                    <th className="py-2 px-1.5 border-r border-slate-300 w-24">መለያ ኮድ</th>

                    {/* Subject columns */}
                    {gradeSubjects.map(sub => (
                      <th
                        key={sub.id}
                        className="py-2 px-1.5 border-r border-slate-300 min-w-[65px] truncate"
                        title={sub.name}
                      >
                        {sub.name.slice(0, 7)}..
                      </th>
                    ))}

                    <th className="py-2 px-1.5 border-r border-slate-300 bg-slate-200/70 w-14">
                      ድምር
                    </th>
                    <th className="py-2 px-1.5 border-r border-slate-300 bg-indigo-50 w-14">
                      አማካይ
                    </th>
                    <th className="py-2 px-1.5 border-r border-slate-300 bg-amber-50 w-12">
                      ደረጃ
                    </th>
                    <th className="py-2 px-1.5 w-16">ውሳኔ</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {currentRoster.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8 + gradeSubjects.length}
                        className="py-8 text-center text-slate-500"
                      >
                        በዚህ ክፍል የተመዘገበ ተማሪ አልተገኘም።
                      </td>
                    </tr>
                  ) : (
                    currentRoster.map((item, idx) => {
                      const total =
                        rosterViewMode === 'sem1'
                          ? item.sem1Total
                          : rosterViewMode === 'sem2'
                          ? item.sem2Total
                          : item.annualTotal;

                      const avg =
                        rosterViewMode === 'sem1'
                          ? item.sem1Avg
                          : rosterViewMode === 'sem2'
                          ? item.sem2Avg
                          : item.annualAvg;

                      const rank =
                        rosterViewMode === 'sem1'
                          ? item.sem1Rank
                          : rosterViewMode === 'sem2'
                          ? item.sem2Rank
                          : item.annualRank;

                      return (
                        <tr key={item.student.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-1 border-r border-slate-200">{idx + 1}</td>
                          <td className="py-1.5 px-2 border-r border-slate-200 text-left font-semibold text-slate-900">
                            {item.student.fullName}
                          </td>
                          <td className="py-1.5 px-1 border-r border-slate-200">
                            {item.student.gender}
                          </td>
                          <td className="py-1.5 px-1 border-r border-slate-200 font-mono text-indigo-700 font-medium">
                            {item.student.id}
                          </td>

                          {gradeSubjects.map(sub => {
                            const sc = item.subjectScores[sub.name];
                            let scoreVal: number | null = null;
                            if (sc) {
                              scoreVal =
                                rosterViewMode === 'sem1'
                                  ? sc.sem1
                                  : rosterViewMode === 'sem2'
                                  ? sc.sem2
                                  : sc.combined;
                            }

                            return (
                              <td
                                key={sub.id}
                                className={`py-1.5 px-1 border-r border-slate-200 font-mono ${
                                  scoreVal !== null && scoreVal < 50
                                    ? 'text-rose-600 font-bold bg-rose-50/50'
                                    : 'text-slate-800'
                                }`}
                              >
                                {scoreVal !== null ? scoreVal : '—'}
                              </td>
                            );
                          })}

                          <td className="py-1.5 px-1 border-r border-slate-200 font-mono font-bold bg-slate-100/60">
                            {total}
                          </td>
                          <td className="py-1.5 px-1 border-r border-slate-200 font-mono font-bold bg-indigo-50/70 text-indigo-900">
                            {avg}
                          </td>
                          <td className="py-1.5 px-1 border-r border-slate-200 font-mono font-bold bg-amber-50/70 text-amber-900">
                            {rank || '—'}
                          </td>
                          <td className="py-1.5 px-1 font-semibold text-[10px]">
                            {item.passed ? (
                              <span className="text-emerald-700">አልፏል</span>
                            ) : (
                              <span className="text-rose-700">ይደግማል</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Signatures strip for print */}
            <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-3 gap-6 text-xs text-center">
              <div>
                <div className="font-semibold text-slate-800">የክፍል ስም ጠሪ መምህር፡</div>
                <div className="mt-1 text-slate-600">
                  {currentHomeroomTeacher ? currentHomeroomTeacher.name : '........................'}
                </div>
                <div className="mt-3 text-slate-400">ፊርማ፡ _______________</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">ምክትል ር/መምህር፡</div>
                <div className="mt-1 text-slate-600">........................</div>
                <div className="mt-3 text-slate-400">ፊርማ፡ _______________</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">ዋና ር/መምህርና ማህተም፡</div>
                <div className="mt-1 text-slate-600">........................</div>
                <div className="mt-3 text-slate-400">ፊርማና ማህተም፡ _________</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Performance Analytics (የውጤት ትንተና በወንድ በሴት) */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-700" />
                  <span>የክፍልና የትምህርት ዓይነት የውጤት ትንተና በወንድና በሴት (Gender Analysis)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ከ75 በላይ፣ ከ50 እስከ 74 እና ከ50 በታች በወንድና በሴት የውጤት ስርጭት ትንተና።
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedGrade}
                  onChange={e => setSelectedGrade(e.target.value)}
                  className="text-xs py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
                >
                  {ALL_GRADES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="text-xs py-1.5 px-3 border border-slate-300 rounded-lg bg-white font-bold"
                >
                  {STANDARD_SECTIONS.map(s => (
                    <option key={s} value={s}>ሴክሽን {s}</option>
                  ))}
                </select>
                <select
                  value={selectedPrincipalYear}
                  onChange={e => setSelectedPrincipalYear(e.target.value)}
                  className="text-xs py-1.5 px-3 border border-slate-300 rounded-lg bg-white font-semibold text-amber-900"
                >
                  <option value="all">ሁሉም ዓመታት</option>
                  {settings.availableAcademicYears.map(yr => (
                    <option key={yr} value={yr}>{yr} ዓ/ም</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 1: Overall Class Performance by Gender */}
            <div className="mt-5">
              <h3 className="text-xs font-bold text-slate-800 mb-2">
                1. የአጠቃላይ ክፍሉ ውጤት ትንተና — {selectedGrade} ({selectedSection})
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-center">
                  <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-left">የውጤት ክልል (Range)</th>
                      <th className="py-2.5 px-3">ወንድ ብዛት</th>
                      <th className="py-2.5 px-3">ወንድ %</th>
                      <th className="py-2.5 px-3">ሴት ብዛት</th>
                      <th className="py-2.5 px-3">ሴት %</th>
                      <th className="py-2.5 px-3">አጠቃላይ ድምር</th>
                      <th className="py-2.5 px-3">አጠቃላይ %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-left font-sans font-semibold text-emerald-800">
                        ከ75 በላይ (ከፍተኛ ውጤት)
                      </td>
                      <td className="py-2.5 px-3">{classPerformance.above75.maleCount}</td>
                      <td className="py-2.5 px-3">{classPerformance.above75.malePercent}%</td>
                      <td className="py-2.5 px-3">{classPerformance.above75.femaleCount}</td>
                      <td className="py-2.5 px-3">{classPerformance.above75.femalePercent}%</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {classPerformance.above75.totalCount}
                      </td>
                      <td className="py-2.5 px-3 font-bold">{classPerformance.above75.totalPercent}%</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-left font-sans font-semibold text-amber-800">
                        ከ50 እስከ 74 (መካከለኛ ውጤት)
                      </td>
                      <td className="py-2.5 px-3">{classPerformance.between50And74.maleCount}</td>
                      <td className="py-2.5 px-3">{classPerformance.between50And74.malePercent}%</td>
                      <td className="py-2.5 px-3">{classPerformance.between50And74.femaleCount}</td>
                      <td className="py-2.5 px-3">{classPerformance.between50And74.femalePercent}%</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {classPerformance.between50And74.totalCount}
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        {classPerformance.between50And74.totalPercent}%
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-left font-sans font-semibold text-rose-800">
                        ከ50 በታች (ዝቅተኛ / ውድቀት)
                      </td>
                      <td className="py-2.5 px-3 text-rose-600">
                        {classPerformance.below50.maleCount}
                      </td>
                      <td className="py-2.5 px-3">{classPerformance.below50.malePercent}%</td>
                      <td className="py-2.5 px-3 text-rose-600">
                        {classPerformance.below50.femaleCount}
                      </td>
                      <td className="py-2.5 px-3">{classPerformance.below50.femalePercent}%</td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">
                        {classPerformance.below50.totalCount}
                      </td>
                      <td className="py-2.5 px-3 font-bold">{classPerformance.below50.totalPercent}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Comprehensive All-Subjects Performance Breakdown */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <span>2. የሁሉም የትምህርት ዓይነቶች አጠቃላይ የውጤት ትንተና — {selectedGrade} ({selectedSection})</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    በዚህ ክፍል ውስጥ ያሉ ሁሉም የትምህርት ዓይነቶች አማካይ፣ ከፍተኛ፣ ዝቅተኛ እና የማለፊያ ምጣኔ ንጽጽር።
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-center">
                  <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-left">የትምህርት ዓይነት</th>
                      <th className="py-2.5 px-2">ተፈታኝ</th>
                      <th className="py-2.5 px-2">አማካይ</th>
                      <th className="py-2.5 px-2 text-emerald-700">ከፍተኛ</th>
                      <th className="py-2.5 px-2 text-rose-700">ዝቅተኛ</th>
                      <th className="py-2.5 px-2 text-emerald-800 bg-emerald-50/50">ከ75 በላይ (%)</th>
                      <th className="py-2.5 px-2 text-amber-800 bg-amber-50/50">50-74 (%)</th>
                      <th className="py-2.5 px-2 text-rose-800 bg-rose-50/50">ከ50 በታች (%)</th>
                      <th className="py-2.5 px-3">የማለፍ ምጣኔ (Pass %)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {allSubjectsAnalysis.map((subItem) => (
                      <tr key={subItem.subjectName} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-left font-sans font-bold text-slate-900">
                          {subItem.subjectName}
                        </td>
                        <td className="py-2.5 px-2 text-slate-600">{subItem.testedCount}</td>
                        <td className="py-2.5 px-2 font-bold text-indigo-700">{subItem.average}</td>
                        <td className="py-2.5 px-2 font-semibold text-emerald-600">{subItem.highest}</td>
                        <td className="py-2.5 px-2 font-semibold text-rose-600">{subItem.lowest}</td>
                        <td className="py-2.5 px-2 bg-emerald-50/30 font-semibold text-emerald-800">
                          {subItem.analysis.above75.totalCount} ({subItem.analysis.above75.totalPercent}%)
                        </td>
                        <td className="py-2.5 px-2 bg-amber-50/30 font-semibold text-amber-800">
                          {subItem.analysis.between50And74.totalCount} ({subItem.analysis.between50And74.totalPercent}%)
                        </td>
                        <td className="py-2.5 px-2 bg-rose-50/30 font-bold text-rose-700">
                          {subItem.analysis.below50.totalCount} ({subItem.analysis.below50.totalPercent}%)
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`font-bold ${subItem.passRate >= 75 ? 'text-emerald-700' : subItem.passRate >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                              {subItem.passRate}%
                            </span>
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${subItem.passRate >= 75 ? 'bg-emerald-500' : subItem.passRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${subItem.passRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {allSubjectsAnalysis.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-slate-400 font-sans">
                          ለዚህ ክፍል የተመዘገበ የትምህርት ዓይነት አልተገኘም።
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Subject Performance by Gender Drilldown */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <h3 className="text-xs font-bold text-slate-800">
                  3. የነጠላ ትምህርት ዓይነት የውጤት ዝርዝር በወንድና በሴት
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">ትምህርት ምረጥ፡</span>
                  <select
                    value={selectedSubjectForAnalysis}
                    onChange={e => setSelectedSubjectForAnalysis(e.target.value)}
                    className="text-xs py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    {gradeSubjects.map(sub => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-center">
                  <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-left">የውጤት ክልል ({selectedSubjectForAnalysis})</th>
                      <th className="py-2.5 px-3">ወንድ ብዛት</th>
                      <th className="py-2.5 px-3">ወንድ %</th>
                      <th className="py-2.5 px-3">ሴት ብዛት</th>
                      <th className="py-2.5 px-3">ሴት %</th>
                      <th className="py-2.5 px-3">አጠቃላይ ድምር</th>
                      <th className="py-2.5 px-3">አጠቃላይ %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-left font-sans font-semibold text-emerald-800">
                        ከ75 በላይ (ከፍተኛ ውጤት)
                      </td>
                      <td className="py-2.5 px-3">{subjectPerformance.above75.maleCount}</td>
                      <td className="py-2.5 px-3">{subjectPerformance.above75.malePercent}%</td>
                      <td className="py-2.5 px-3">{subjectPerformance.above75.femaleCount}</td>
                      <td className="py-2.5 px-3">{subjectPerformance.above75.femalePercent}%</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {subjectPerformance.above75.totalCount}
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        {subjectPerformance.above75.totalPercent}%
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-left font-sans font-semibold text-amber-800">
                        ከ50 እስከ 74 (መካከለኛ ውጤት)
                      </td>
                      <td className="py-2.5 px-3">{subjectPerformance.between50And74.maleCount}</td>
                      <td className="py-2.5 px-3">{subjectPerformance.between50And74.malePercent}%</td>
                      <td className="py-2.5 px-3">{subjectPerformance.between50And74.femaleCount}</td>
                      <td className="py-2.5 px-3">{subjectPerformance.between50And74.femalePercent}%</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {subjectPerformance.between50And74.totalCount}
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        {subjectPerformance.between50And74.totalPercent}%
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-left font-sans font-semibold text-rose-800">
                        ከ50 በታች (ዝቅተኛ / ውድቀት)
                      </td>
                      <td className="py-2.5 px-3 text-rose-600">
                        {subjectPerformance.below50.maleCount}
                      </td>
                      <td className="py-2.5 px-3">{subjectPerformance.below50.malePercent}%</td>
                      <td className="py-2.5 px-3 text-rose-600">
                        {subjectPerformance.below50.femaleCount}
                      </td>
                      <td className="py-2.5 px-3">{subjectPerformance.below50.femalePercent}%</td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">
                        {subjectPerformance.below50.totalCount}
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        {subjectPerformance.below50.totalPercent}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Top Ranking Students (ከፍተኛ ውጤት ያመጡ ተማሪዎች) */}
      {activeTab === 'top_students' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>የትምህርት ቤቱ ከፍተኛ ውጤት ያመጡ ተማሪዎች ማጠቃለያ</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ከየክፍሉ ከ1-3፣ ከአጠቃላይ ሴቶች ከ1-3፣ የት/ቤቱ ምርጥ 3፣ ከፍተኛ 20 እና የክፍሉ ምርጥ 10 ተማሪዎች።
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>ዝርዝሩን አትም (Print)</span>
              </button>
            </div>

            {/* Filter buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setTopRankingFilter('top3_class')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  topRankingFilter === 'top3_class'
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                የክፍሉ ከ1ኛ እስከ 3ኛ ({selectedGrade})
              </button>
              <button
                onClick={() => setTopRankingFilter('top10_class')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  topRankingFilter === 'top10_class'
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                የክፍሉ ምርጥ 10 ተማሪዎች ({selectedGrade})
              </button>
              <button
                onClick={() => setTopRankingFilter('top3_female')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  topRankingFilter === 'top3_female'
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ከአጠቃላይ ሴቶች ምርጥ 3 (Top 3 Females)
              </button>
              <button
                onClick={() => setTopRankingFilter('top3_school')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  topRankingFilter === 'top3_school'
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                የትምህርት ቤቱ ከፍተኛ ውጤት (Top 3 School)
              </button>
              <button
                onClick={() => setTopRankingFilter('top20_school')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  topRankingFilter === 'top20_school'
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                የትምህርት ቤቱ ምርጥ 20 ተማሪዎች (Top 20)
              </button>
            </div>

            {/* Table of ranked students */}
            <div className="mt-5 overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">ደረጃ (Rank)</th>
                    <th className="py-2.5 px-3">የተማሪ መለያ ኮድ</th>
                    <th className="py-2.5 px-3">ስም ከነ አያት</th>
                    <th className="py-2.5 px-3">ጾታ</th>
                    <th className="py-2.5 px-3">ክፍል</th>
                    <th className="py-2.5 px-3">አማካይ ውጤት</th>
                    <th className="py-2.5 px-3">የባህሪ አስተያየት ጻፍ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        ምንም ውጤት የተመዘገበ ተማሪ የለም።
                      </td>
                    </tr>
                  ) : (
                    rankedStudents.map((r, idx) => (
                      <tr key={r.student.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-amber-800">
                          #{idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700">
                          {r.student.id}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {r.student.fullName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{r.student.gender}</td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {r.student.grade} ({r.student.section})
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-900">
                          {r.annualAvg || r.sem1Avg}%
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => setSelectedStudentForConduct(r.student)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium"
                          >
                            ባህሪ ጻፍ
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Parent Feedback & Inquiries (የወላጆች አስተያየት) */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-700" />
                <span>ከወላጆች የሚሰጡ አስተያየቶችና ጥያቄዎች መቀበያና ምላሽ መስጫ</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ወላጆች ለትምህርት ቤቱ የሚያቀርቧቸውን ጥያቄዎችና አስተያየቶች መመልከትና ምላሽ መስጠት።
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {feedbacks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  እስካሁን ከወላጆች የቀረበ አስተያየት የለም።
                </div>
              ) : (
                feedbacks.map(fb => (
                  <div
                    key={fb.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-1">
                      <div className="font-semibold text-slate-900">
                        {fb.parentName} (የተማሪ {fb.studentName} ወላጅ)
                      </div>
                      <div className="flex items-center gap-2">
                        <span>ስልክ፡ {fb.phone}</span>
                        <span>·</span>
                        <span>ቀን፡ {fb.date}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed">
                      "{fb.message}"
                    </div>

                    {/* School reply if exists */}
                    {fb.reply ? (
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-950 space-y-1">
                        <div className="font-semibold text-indigo-900 flex items-center justify-between">
                          <span>የትምህርት ቤቱ ምላሽ ({fb.repliedBy})</span>
                          <span className="text-[11px] text-indigo-600 font-normal">{fb.replyDate}</span>
                        </div>
                        <p>{fb.reply}</p>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        <textarea
                          placeholder="ለትምህርት ቤቱ ወላጅ ምላሽዎን እዚህ ይጻፉ..."
                          value={replyInput[fb.id] || ''}
                          onChange={e =>
                            setReplyInput({ ...replyInput, [fb.id]: e.target.value })
                          }
                          rows={2}
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                        />
                        <button
                          onClick={() => handleSendFeedbackReply(fb.id)}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>ምላሽ ላክ</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Teacher Letters & Circulars (ለአስተማሪዎች የሚጻፍ ደብዳቤ - Vice Principal / Principal) */}
      {activeTab === 'letters' && isVicePrincipal && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-700" />
                <span>ለመምህራን የሚላኩ መመሪያዎች፣ ደብዳቤዎችና የትምህርት ግብረ-መልስ</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ከመማር ማስተማር አንጻር ለእያንዳንዱ መምህር አስተያየት መጻፍ፣ ደብዳቤ መስቀልና ምላሻቸውን መቀበል።
              </p>
            </div>

            {/* Create new circular form */}
            <form onSubmit={handleCreateLetter} className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-800">አዲስ ይፋዊ ደብዳቤ / ማሳሰቢያ ጻፍ</h3>
              <div>
                <input
                  type="text"
                  placeholder="የደብዳቤው ርዕስ..."
                  required
                  value={newLetterTitle}
                  onChange={e => setNewLetterTitle(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <textarea
                  placeholder="የደብዳቤው ሙሉ ዝርዝር ይዘት..."
                  required
                  rows={3}
                  value={newLetterContent}
                  onChange={e => setNewLetterContent(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ደብዳቤውን ላክ</span>
              </button>
            </form>

            {/* Existing Letters list */}
            <div className="mt-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-800">የተላኩ ደብዳቤዎችና ከመምህራን የተሰጡ ምላሾች</h3>
              {letters.map(ltr => (
                <div key={ltr.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-slate-900 text-sm">{ltr.title}</span>
                    <span>ቀን፡ {ltr.date}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{ltr.content}</p>

                  {/* Teacher replies */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-600">የመምህራን ምላሽ፡</span>
                    {ltr.replies.length === 0 ? (
                      <p className="text-[11px] text-slate-400">ምንም ምላሽ አልተሰጠም።</p>
                    ) : (
                      ltr.replies.map((rep, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 rounded-md text-xs text-slate-800">
                          <strong>{rep.teacherName}:</strong> {rep.text} ({rep.date})
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conduct Remark Modal */}
      {selectedStudentForConduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                የተማሪ ባህሪ አስተያየት መጻፊያ — {selectedStudentForConduct.fullName}
              </h3>
              <button
                onClick={() => setSelectedStudentForConduct(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600">
                ይህ አስተያየት በቀጥታ ለተማሪው ወላጅ በፖርታላቸው ላይ ይታያል።
              </p>
              <textarea
                rows={3}
                placeholder="ስለ ተማሪው ስነ-ምግባር፣ የክፍል ተሳትፎ ወይም ትጋት አስተያየት ይጻፉ..."
                value={conductText}
                onChange={e => setConductText(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedStudentForConduct(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ይቅር
                </button>
                <button
                  onClick={handleSaveConduct}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg"
                >
                  አስተያየቱን መዝግብ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Student Add/Edit Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-indigo-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingStudentId ? 'የተማሪ መረጃ ኤዲት ማድረጊያ' : 'አዲስ ተማሪ መመዝገቢያ'}
              </h3>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-300 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ስም ከነ አያት (ሙሉ ስም) *</label>
                <input
                  type="text"
                  required
                  placeholder="ለምሳሌ፡ አበበ ከበደ ጫላ"
                  value={studentForm.fullName}
                  onChange={e => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ጾታ</label>
                  <select
                    value={studentForm.gender}
                    onChange={e => setStudentForm({ ...studentForm, gender: e.target.value as 'ወንድ' | 'ሴት' })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="ወንድ">ወንድ</option>
                    <option value="ሴት">ሴት</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ዕድሜ</label>
                  <input
                    type="number"
                    min={3}
                    max={25}
                    value={studentForm.age}
                    onChange={e => setStudentForm({ ...studentForm, age: parseInt(e.target.value) || 7 })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">የክፍል ደረጃ</label>
                  <select
                    value={studentForm.grade}
                    onChange={e => setStudentForm({ ...studentForm, grade: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    {ALL_GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ሴክሽን</label>
                  <select
                    value={studentForm.section}
                    onChange={e => setStudentForm({ ...studentForm, section: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    {STANDARD_SECTIONS.map(s => (
                      <option key={s} value={s}>ሴክሽን {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">የትምህርት ዘመን</label>
                  <select
                    value={studentForm.academicYear}
                    onChange={e => setStudentForm({ ...studentForm, academicYear: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="2020">2020 ዓ/ም</option>
                    <option value="2019">2019 ዓ/ም</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">የወላጅ ስልክ ቁጥር</label>
                  <input
                    type="text"
                    placeholder="0911..."
                    value={studentForm.parentPhone}
                    onChange={e => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">አድራሻ</label>
                <input
                  type="text"
                  placeholder="ብርብር ከተማ ቀበሌ 01"
                  value={studentForm.address}
                  onChange={e => setStudentForm({ ...studentForm, address: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ይቅር
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg"
                >
                  {editingStudentId ? 'ለውጦችን መዝግብ' : 'ተማሪውን መዝግብ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Excel Preview Modal */}
      {isStudentExcelModalOpen && parsedStudentsPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="text-sm font-bold">ከኤክሴል ሰነድ የተገኙ ተማሪዎች ማረጋገጫ (Import Preview)</h3>
                  <p className="text-[11px] text-emerald-200">
                    የተገኙ ተማሪዎች ብዛት፡ <strong>{parsedStudentsPreview.length}</strong> · መለያ ኮዶች (ID) በራስ-ሰር ይመነጫሉ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStudentExcelModalOpen(false)}
                className="text-emerald-200 hover:text-white text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                ከታች የሚታዩት <strong>{parsedStudentsPreview.length} ተማሪዎች</strong> ወደ ስርዓቱ ከመመዝገባቸው በፊት መረጃቸውን ያረጋግጡ። "ሁሉንም መዝግብ" ሲጫኑ የት/ቤቱ ይፋዊ የመለያ ኮድ ደንብ (ምሳሌ፡ kg1-101፣ bkhrsf1-101...) ተሰጥቷቸው ይመዘገባሉ።
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">ተ.ቁ</th>
                      <th className="py-2 px-3">ስም ከነ አያት</th>
                      <th className="py-2 px-3">ጾታ</th>
                      <th className="py-2 px-3">ዕድሜ</th>
                      <th className="py-2 px-3">የክፍል ደረጃ</th>
                      <th className="py-2 px-3">ሴክሽን</th>
                      <th className="py-2 px-3">የትምህርት ዘመን</th>
                      <th className="py-2 px-3">የወላጅ ስልክ</th>
                      <th className="py-2 px-3">አድራሻ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedStudentsPreview.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-600">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{s.fullName}</td>
                        <td className="py-2 px-3 text-slate-700">{s.gender}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{s.age}</td>
                        <td className="py-2 px-3 font-medium text-indigo-700">{s.grade}</td>
                        <td className="py-2 px-3 text-slate-700">{s.section}</td>
                        <td className="py-2 px-3 text-slate-700">{s.academicYear} ዓ/ም</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{s.parentPhone || '—'}</td>
                        <td className="py-2 px-3 text-slate-600">{s.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                ጠቅላላ የሚመዘገቡ ተማሪዎች፡ <strong>{parsedStudentsPreview.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsStudentExcelModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  ይቅር (Cancel)
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStudentImport}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>ሁሉንም {parsedStudentsPreview.length} ተማሪዎች መዝግብ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
