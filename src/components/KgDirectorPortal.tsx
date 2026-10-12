import React, { useState } from 'react';
import {
  Student,
  Teacher,
  SchoolSettings,
  SchoolSubject,
  GradeEntry,
  ParentFeedback,
} from '../types';
import { KG_GRADES, STANDARD_SECTIONS } from '../utils/studentIdGenerator';
import {
  calculateClassRoster,
  calculateClassPerformanceAnalysis,
  calculateSubjectPerformanceAnalysis,
  calculateAllSubjectsAnalysis,
} from '../utils/calculations';
import {
  Baby,
  Users,
  FileText,
  BarChart3,
  MessageSquare,
  Printer,
  ShieldCheck,
  Send,
  Plus,
  Download,
  FileSpreadsheet,
  Upload,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import {
  downloadStudentTemplate,
  parseStudentsExcelFile,
  exportStudentsToExcel,
  ParsedStudentRow,
} from '../utils/excelHelper';
import { generateNextStudentId } from '../utils/studentIdGenerator';

interface KgDirectorPortalProps {
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
  activeTab: string;
}

export const KgDirectorPortal: React.FC<KgDirectorPortalProps> = ({
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
  activeTab,
}) => {
  const [selectedKgGrade, setSelectedKgGrade] = useState<string>('ማቆያ');
  const [selectedKgSection, setSelectedKgSection] = useState<string>('ሀ');
  const [selectedKgSubject, setSelectedKgSubject] = useState<string>('ጋሞኛ (የአካባቢ ቋንቋ)');

  // Reply input state
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});

  // Conduct remark state
  const [selectedStudentForNote, setSelectedStudentForNote] = useState<Student | null>(null);
  const [noteContent, setNoteContent] = useState('');

  // Calculate roster for chosen KG grade and section
  const kgRoster = calculateClassRoster(
    students,
    grades,
    subjects,
    selectedKgGrade,
    selectedKgSection,
    settings.currentAcademicYear,
    settings.failThresholdSubjects,
    settings.passAverageThreshold,
    settings.mandatoryFailingSubjects,
    settings.gradePromotionRules
  );

  const kgSubjects = subjects.filter(sub => sub.applicableGrades.includes(selectedKgGrade));

  const classPerformance = calculateClassPerformanceAnalysis(kgRoster);
  const subjectPerformance = calculateSubjectPerformanceAnalysis(kgRoster, selectedKgSubject);
  const allKgSubjectsAnalysis = calculateAllSubjectsAnalysis(kgRoster, kgSubjects);

  // KG Homeroom Teacher
  const currentKgHomeroom = teachers.find(
    t => t.isHomeroom && t.homeroomGrade === selectedKgGrade && t.homeroomSection === selectedKgSection
  );

  // Filter KG feedbacks
  const kgFeedbacks = feedbacks.filter(
    fb => fb.targetRole === 'kg_director' || fb.studentId.startsWith('kg')
  );

  const handleSendKgReply = (id: string) => {
    const text = replyText[id];
    if (!text || !text.trim()) return;

    setFeedbacks(prev =>
      prev.map(f =>
        f.id === id
          ? {
              ...f,
              reply: text.trim(),
              replyDate: new Date().toISOString().split('T')[0],
              repliedBy: 'የኬጂ ር/መምህርት',
            }
          : f
      )
    );
    setReplyText(prev => ({ ...prev, [id]: '' }));
  };

  const handleSaveConduct = () => {
    if (!selectedStudentForNote || !noteContent.trim()) return;

    const newNote = {
      id: `cn-kg-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      author: 'የኬጂ ር/መምህር',
      authorRole: 'የኬጂ ር/መምህር',
      note: noteContent.trim(),
    };

    setStudents(prev =>
      prev.map(s =>
        s.id === selectedStudentForNote.id
          ? {
              ...s,
              conductNotes: [newNote, ...s.conductNotes],
            }
          : s
      )
    );

    setSelectedStudentForNote(null);
    setNoteContent('');
  };

  // KG Student registration states
  const [selectedKgRegGrade, setSelectedKgRegGrade] = useState<string>('ማቆያ');
  const [selectedKgRegYear, setSelectedKgRegYear] = useState<string>(settings.currentAcademicYear);
  const [searchKgTerm, setSearchKgTerm] = useState('');
  const [isKgStudentModalOpen, setIsKgStudentModalOpen] = useState(false);
  const [editingKgStudentId, setEditingKgStudentId] = useState<string | null>(null);
  const [kgStudentForm, setKgStudentForm] = useState<{
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
    age: 4,
    academicYear: settings.currentAcademicYear,
    grade: 'ማቆያ',
    section: 'ሀ',
    parentPhone: '',
    address: 'ብርብር ከተማ ቀበሌ 01',
  });

  const [parsedKgStudentsPreview, setParsedKgStudentsPreview] = useState<ParsedStudentRow[] | null>(null);
  const [isKgStudentExcelModalOpen, setIsKgStudentExcelModalOpen] = useState(false);
  const [kgImportSuccessMsg, setKgImportSuccessMsg] = useState<string | null>(null);

  const handleKgStudentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseStudentsExcelFile(file, selectedKgRegYear);
      if (parsed.length === 0) {
        alert('በተመረጠው የኤክሴል ሰነድ ውስጥ ምንም የተማሪ መረጃ አልተገኘም! እባክዎ የቅጹን አምዶች ይፈትሹ።');
        return;
      }
      setParsedKgStudentsPreview(parsed);
      setIsKgStudentExcelModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('የኤክሴል ፋይሉን በማንበብ ሂደት ስህተት አጋጥሟል! እባክዎ ትክክለኛ .xlsx ወይም .csv ፋይል ይምረጡ።');
    }
    e.target.value = '';
  };

  const handleConfirmKgStudentImport = () => {
    if (!parsedKgStudentsPreview || parsedKgStudentsPreview.length === 0) return;

    let updatedList = [...students];
    let addedCount = 0;

    for (const row of parsedKgStudentsPreview) {
      const nextId = generateNextStudentId(row.grade, updatedList);
      const newStudent: Student = {
        id: nextId,
        seqNo: updatedList.filter(s => s.grade === row.grade).length + 1,
        fullName: row.fullName,
        gender: row.gender,
        age: row.age,
        academicYear: row.academicYear || selectedKgRegYear,
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
    setIsKgStudentExcelModalOpen(false);
    setParsedKgStudentsPreview(null);
    setKgImportSuccessMsg(`በኤክሴል ሰነድ ውስጥ የነበሩ ${addedCount} የኬጂ ተማሪዎች በተሳካ ሁኔታ ተመዝግበዋል! መለያ ኮዶች (ID) ተዘጋጅተዋል።`);
    setTimeout(() => setKgImportSuccessMsg(null), 5000);
  };

  const handleOpenAddKgStudent = () => {
    setEditingKgStudentId(null);
    setKgStudentForm({
      fullName: '',
      gender: 'ወንድ',
      age: selectedKgRegGrade === 'ማቆያ' ? 4 : selectedKgRegGrade === 'ደረጃ 1' ? 5 : 6,
      academicYear: selectedKgRegYear,
      grade: selectedKgRegGrade,
      section: 'ሀ',
      parentPhone: '',
      address: 'ብርብር ከተማ ቀበሌ 01',
    });
    setIsKgStudentModalOpen(true);
  };

  const handleOpenEditKgStudent = (s: Student) => {
    setEditingKgStudentId(s.id);
    setKgStudentForm({
      fullName: s.fullName,
      gender: s.gender,
      age: s.age,
      academicYear: s.academicYear,
      grade: s.grade,
      section: s.section,
      parentPhone: s.parentPhone,
      address: s.address,
    });
    setIsKgStudentModalOpen(true);
  };

  const handleSaveKgStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingKgStudentId) {
      setStudents(prev =>
        prev.map(s =>
          s.id === editingKgStudentId
            ? {
                ...s,
                ...kgStudentForm,
              }
            : s
        )
      );
    } else {
      const nextId = generateNextStudentId(kgStudentForm.grade, students);
      const newStudent: Student = {
        id: nextId,
        seqNo: students.filter(s => s.grade === kgStudentForm.grade).length + 1,
        fullName: kgStudentForm.fullName,
        gender: kgStudentForm.gender,
        age: kgStudentForm.age,
        academicYear: kgStudentForm.academicYear,
        grade: kgStudentForm.grade,
        section: kgStudentForm.section,
        parentPhone: kgStudentForm.parentPhone,
        address: kgStudentForm.address,
        promotionStatus: 'pending',
        conductNotes: [],
      };
      setStudents(prev => [...prev, newStudent]);
    }
    setIsKgStudentModalOpen(false);
  };

  const handleDeleteKgStudent = (id: string, name: string) => {
    if (window.confirm(`ተማሪ ${name} (${id}) በእርግጥ እንዲሰረዝ ይፈልጋሉ?`)) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const filteredKgStudents = students.filter(s => {
    const isKgGrade = KG_GRADES.includes(s.grade);
    const matchGrade = !selectedKgRegGrade || s.grade === selectedKgRegGrade;
    const matchYear = !selectedKgRegYear || s.academicYear === selectedKgRegYear;
    const matchSearch =
      !searchKgTerm ||
      s.fullName.toLowerCase().includes(searchKgTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchKgTerm.toLowerCase()) ||
      s.parentPhone.includes(searchKgTerm);
    return isKgGrade && matchGrade && matchYear && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Tab 0: KG Students Registration & Excel */}
      {activeTab === 'kg_students' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            {/* Header with Kale Hewet Logo */}
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
                  የቅድመ-መደበኛ (KG) ተማሪዎች ምዝገባ — [{selectedKgRegGrade}] ({selectedKgRegYear} ዓ/ም)
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">የክፍል ደረጃ</label>
                  <select
                    value={selectedKgRegGrade}
                    onChange={e => setSelectedKgRegGrade(e.target.value)}
                    className="text-xs py-1.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  >
                    {KG_GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">የትምህርት ዘመን</label>
                  <select
                    value={selectedKgRegYear}
                    onChange={e => setSelectedKgRegYear(e.target.value)}
                    className="text-xs py-1.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="2020">2020 ዓ/ም</option>
                    <option value="2019">2019 ዓ/ም</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">ፍለጋ</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ስም ወይም መለያ..."
                      value={searchKgTerm}
                      onChange={e => setSearchKgTerm(e.target.value)}
                      className="text-xs py-1.5 pl-8 pr-3 bg-white border border-slate-300 rounded-lg w-44"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0">
                <input
                  type="file"
                  id="kg-student-excel-input"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleKgStudentFileSelect}
                />
                <button
                  onClick={() => document.getElementById('kg-student-excel-input')?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
                  title="የኬጂ ተማሪዎችን ከኤክሴል ጫን"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>ኤክሴል ጫን (Upload Excel)</span>
                </button>

                <button
                  onClick={downloadStudentTemplate}
                  className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>የኤክሴል ቅጽ</span>
                </button>

                <button
                  onClick={() => exportStudentsToExcel(students.filter(s => KG_GRADES.includes(s.grade)), `የኬጂ_ተማሪዎች_${selectedKgRegGrade}.xlsx`)}
                  className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors whitespace-nowrap shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ኤክሴል አውርድ</span>
                </button>

                <button
                  onClick={handleOpenAddKgStudent}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>አዲስ የኬጂ ተማሪ</span>
                </button>
              </div>
            </div>

            {kgImportSuccessMsg && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{kgImportSuccessMsg}</span>
              </div>
            )}

            {/* Table */}
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
                    <th className="py-2.5 px-3 text-right">ተግባር</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredKgStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        በዚህ የኬጂ ደረጃ የተመዘገበ ተማሪ የለም።
                      </td>
                    </tr>
                  ) : (
                    filteredKgStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-medium text-slate-600">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700">{s.id}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{s.fullName}</td>
                        <td className="py-2.5 px-3 text-slate-700">{s.gender}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{s.age}</td>
                        <td className="py-2.5 px-3 text-slate-700">{s.grade} - {s.section}</td>
                        <td className="py-2.5 px-3 text-slate-700">{s.academicYear} ዓ/ም</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{s.parentPhone || '—'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditKgStudent(s)}
                              className="p-1 text-slate-500 hover:text-indigo-600 rounded-md"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteKgStudent(s.id, s.fullName)}
                              className="p-1 text-slate-500 hover:text-rose-600 rounded-md"
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
      {/* Tab 1: KG Sections & Teacher Assignment */}
      {activeTab === 'kg_sections' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Baby className="w-5 h-5 text-indigo-700" />
                  <span>የቅድመ-መደበኛ (ማቆያ፣ ደረጃ 1፣ ደረጃ 2) ክፍሎችና መምህራን መከታተያ</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  የማቆያ፣ ደረጃ 1 እና ደረጃ 2 ክፍሎችን ማደራጀት፣ መምህራንን መመደብ እና የትምህርት አሰጣጥን መቆጣጠር።
                </p>
              </div>

              {/* KG Approval toggle */}
              <button
                onClick={() =>
                  setSettings(prev => ({
                    ...prev,
                    kgResultsApproved: !prev.kgResultsApproved,
                  }))
                }
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  settings.kgResultsApproved
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {settings.kgResultsApproved
                    ? 'የኬጂ ውጤት ለወላጆች ጸድቋል'
                    : 'የኬጂ ውጤት ገና አልጸደቀም'}
                </span>
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  የቅድመ-መደበኛ ደረጃ
                </label>
                <select
                  value={selectedKgGrade}
                  onChange={e => setSelectedKgGrade(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                >
                  {KG_GRADES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ሴክሽን (ሀ፣ ለ፣ ሐ፣ መ...)
                </label>
                <select
                  value={selectedKgSection}
                  onChange={e => setSelectedKgSection(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                >
                  {STANDARD_SECTIONS.map(s => (
                    <option key={s} value={s}>ሴክሽን {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  የክፍሉ ስም ጠሪ አስተማሪ
                </label>
                <div className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-indigo-900">
                  {currentKgHomeroom ? `${currentKgHomeroom.name} (${currentKgHomeroom.roleTitle || 'መ/ርት'})` : 'አልተመደበም'}
                </div>
              </div>
            </div>

            <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">
                የ{selectedKgGrade} ሴክሽን {selectedKgSection} የተመዘገቡ ህፃናት ብዛት፡{' '}
                <strong>{kgRoster.length}</strong> (ወንድ፡{' '}
                <strong>{kgRoster.filter(r => r.student.gender === 'ወንድ').length}</strong>, ሴት፡{' '}
                <strong>{kgRoster.filter(r => r.student.gender === 'ሴት').length}</strong>)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: KG Roster */}
      {activeTab === 'kg_roster' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h1 className="text-base font-bold text-slate-900">
                  የብርብር ከተማ ቃለ ሕይወት ርኆቦት ት/ቤት — የኬጂ ሮስተር
                </h1>
                <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                  {selectedKgGrade} (ሴክሽን {selectedKgSection}) — {settings.currentAcademicYear} ዓ/ም
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedKgGrade}
                  onChange={e => setSelectedKgGrade(e.target.value)}
                  className="text-xs py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
                >
                  {KG_GRADES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>ሮስተር አትም</span>
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-2 border-r border-slate-200">ተ.ቁ</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-left">የህፃኑ ሙሉ ስም</th>
                    <th className="py-2.5 px-2 border-r border-slate-200">ጾታ</th>
                    <th className="py-2.5 px-2 border-r border-slate-200">መለያ ኮድ</th>
                    {kgSubjects.map(s => (
                      <th key={s.id} className="py-2.5 px-2 border-r border-slate-200">
                        {s.name}
                      </th>
                    ))}
                    <th className="py-2.5 px-2 border-r border-slate-200 bg-slate-200/50">ድምር</th>
                    <th className="py-2.5 px-2 border-r border-slate-200 bg-indigo-50">አማካይ</th>
                    <th className="py-2.5 px-2 bg-amber-50">ደረጃ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kgRoster.length === 0 ? (
                    <tr>
                      <td colSpan={7 + kgSubjects.length} className="py-8 text-center text-slate-500">
                        በዚህ የኬጂ ክፍል የተመዘገበ ልጅ የለም።
                      </td>
                    </tr>
                  ) : (
                    kgRoster.map((item, idx) => (
                      <tr key={item.student.id} className="hover:bg-slate-50">
                        <td className="py-2 px-2 border-r border-slate-200">{idx + 1}</td>
                        <td className="py-2 px-3 border-r border-slate-200 text-left font-semibold text-slate-900">
                          {item.student.fullName}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200">{item.student.gender}</td>
                        <td className="py-2 px-2 border-r border-slate-200 font-mono text-indigo-700">
                          {item.student.id}
                        </td>
                        {kgSubjects.map(s => {
                          const sc = item.subjectScores[s.name];
                          return (
                            <td key={s.id} className="py-2 px-2 border-r border-slate-200 font-mono">
                              {sc?.combined ?? '—'}
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 border-r border-slate-200 font-mono font-bold bg-slate-50">
                          {item.annualTotal}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 font-mono font-bold text-indigo-900 bg-indigo-50/50">
                          {item.annualAvg}
                        </td>
                        <td className="py-2 px-2 font-mono font-bold text-amber-900 bg-amber-50/50">
                          {item.annualRank || '—'}
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

      {/* Tab 3: KG Gender Performance Analytics */}
      {activeTab === 'kg_analytics' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-700" />
                  <span>የኬጂ ውጤት ትንተና በወንድና በሴት (KG Gender Analysis)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ከ75 በላይ፣ ከ50 እስከ 74 እና ከ50 በታች በወንድና ሴት የተከፋፈለ ዝርዝር።
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedKgGrade}
                  onChange={e => setSelectedKgGrade(e.target.value)}
                  className="text-xs py-1.5 px-3 border border-slate-300 rounded-lg bg-white"
                >
                  {KG_GRADES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>ትንተናውን አትም</span>
                </button>
              </div>
            </div>

            {/* Overall KG Class table */}
            <div className="mt-5">
              <h3 className="text-xs font-bold text-slate-800 mb-2">
                የክፍሉ አጠቃላይ ውጤት ትንተና — {selectedKgGrade}
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-center font-mono">
                  <thead className="bg-slate-100 font-sans font-semibold text-slate-800 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-left">የውጤት ደረጃ</th>
                      <th className="py-2.5 px-3">ወንድ ብዛት</th>
                      <th className="py-2.5 px-3">ወንድ %</th>
                      <th className="py-2.5 px-3">ሴት ብዛት</th>
                      <th className="py-2.5 px-3">ሴት %</th>
                      <th className="py-2.5 px-3">አጠቃላይ ድምር</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-left font-sans font-semibold text-emerald-800">
                        ከ75 በላይ (ከፍተኛ)
                      </td>
                      <td className="py-2.5 px-3">{classPerformance.above75.maleCount}</td>
                      <td className="py-2.5 px-3">{classPerformance.above75.malePercent}%</td>
                      <td className="py-2.5 px-3">{classPerformance.above75.femaleCount}</td>
                      <td className="py-2.5 px-3">{classPerformance.above75.femalePercent}%</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {classPerformance.above75.totalCount}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-left font-sans font-semibold text-amber-800">
                        ከ50 እስከ 74 (መካከለኛ)
                      </td>
                      <td className="py-2.5 px-3">{classPerformance.between50And74.maleCount}</td>
                      <td className="py-2.5 px-3">{classPerformance.between50And74.malePercent}%</td>
                      <td className="py-2.5 px-3">{classPerformance.between50And74.femaleCount}</td>
                      <td className="py-2.5 px-3">{classPerformance.between50And74.femalePercent}%</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {classPerformance.between50And74.totalCount}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-left font-sans font-semibold text-rose-800">
                        ከ50 በታች (ዝቅተኛ)
                      </td>
                      <td className="py-2.5 px-3 text-rose-600">{classPerformance.below50.maleCount}</td>
                      <td className="py-2.5 px-3">{classPerformance.below50.malePercent}%</td>
                      <td className="py-2.5 px-3 text-rose-600">{classPerformance.below50.femaleCount}</td>
                      <td className="py-2.5 px-3">{classPerformance.below50.femalePercent}%</td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">
                        {classPerformance.below50.totalCount}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: KG All Subjects Breakdown */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <span>2. የኬጂ ሁሉም የትምህርት ዓይነቶች አጠቃላይ የውጤት ትንተና — {selectedKgGrade}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    በዚህ ክፍል ውስጥ ያሉ ሁሉም የቅድመ-መደበኛ ትምህርት ዓይነቶች አማካይ፣ ከፍተኛ፣ ዝቅተኛ እና የማለፊያ ምጣኔ ንጽጽር።
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
                    {allKgSubjectsAnalysis.map((subItem) => (
                      <tr key={subItem.subjectName} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 text-left font-sans font-bold text-slate-900">
                          {subItem.subjectName}
                        </td>
                        <td className="py-2 px-2 text-slate-600">{subItem.testedCount}</td>
                        <td className="py-2 px-2 font-bold text-indigo-700">{subItem.average}</td>
                        <td className="py-2 px-2 text-emerald-600 font-semibold">{subItem.highest}</td>
                        <td className="py-2 px-2 text-rose-600 font-semibold">{subItem.lowest}</td>
                        <td className="py-2 px-2 bg-emerald-50/30 text-emerald-800 font-semibold">
                          {subItem.analysis.above75.totalCount} ({subItem.analysis.above75.totalPercent}%)
                        </td>
                        <td className="py-2 px-2 bg-amber-50/30 text-amber-800 font-semibold">
                          {subItem.analysis.between50And74.totalCount} ({subItem.analysis.between50And74.totalPercent}%)
                        </td>
                        <td className="py-2 px-2 bg-rose-50/30 text-rose-700 font-bold">
                          {subItem.analysis.below50.totalCount} ({subItem.analysis.below50.totalPercent}%)
                        </td>
                        <td className="py-2 px-3 font-sans">
                          <span
                            className={`font-bold ${
                              subItem.passRate >= 75
                                ? 'text-emerald-700'
                                : subItem.passRate >= 50
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {subItem.passRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: KG Parent Feedback & Communication */}
      {activeTab === 'kg_feedback' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-700" />
                <span>ከቅድመ-መደበኛ ወላጆች የሚሰጡ አስተያየቶችና ምላሾች</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ከማቆያ እስከ ደረጃ 2 ድረስ ላሉ ህፃናት ወላጆች ምላሽ መስጠትና መልዕክት መጻፍ።
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {kgFeedbacks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  እስካሁን ከኬጂ ወላጆች የቀረበ አስተያየት የለም።
                </div>
              ) : (
                kgFeedbacks.map(fb => (
                  <div key={fb.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-bold text-slate-900">
                        {fb.parentName} ({fb.studentName})
                      </span>
                      <span>{fb.date}</span>
                    </div>
                    <p className="text-xs text-slate-800 p-3 bg-white rounded-lg border border-slate-200">
                      "{fb.message}"
                    </p>

                    {fb.reply ? (
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-950">
                        <strong>የኬጂ ር/መምህርት ምላሽ:</strong> {fb.reply} ({fb.replyDate})
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          placeholder="ለወላጅ ምላሽ ይጻፉ..."
                          rows={2}
                          value={replyText[fb.id] || ''}
                          onChange={e => setReplyText({ ...replyText, [fb.id]: e.target.value })}
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                        />
                        <button
                          onClick={() => handleSendKgReply(fb.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 text-white rounded-lg text-xs font-semibold"
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
      {/* KG Student Add/Edit Modal */}
      {isKgStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-indigo-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingKgStudentId ? 'የኬጂ ተማሪ መረጃ ኤዲት ማድረጊያ' : 'አዲስ የኬጂ ተማሪ መመዝገቢያ'}
              </h3>
              <button
                onClick={() => setIsKgStudentModalOpen(false)}
                className="text-slate-300 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveKgStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ስም ከነ አያት (ሙሉ ስም) *</label>
                <input
                  type="text"
                  required
                  placeholder="ለምሳሌ፡ አቤል ደረጀ ታደሰ"
                  value={kgStudentForm.fullName}
                  onChange={e => setKgStudentForm({ ...kgStudentForm, fullName: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ጾታ</label>
                  <select
                    value={kgStudentForm.gender}
                    onChange={e => setKgStudentForm({ ...kgStudentForm, gender: e.target.value as 'ወንድ' | 'ሴት' })}
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
                    max={8}
                    value={kgStudentForm.age}
                    onChange={e => setKgStudentForm({ ...kgStudentForm, age: parseInt(e.target.value) || 4 })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">የክፍል ደረጃ</label>
                  <select
                    value={kgStudentForm.grade}
                    onChange={e => setKgStudentForm({ ...kgStudentForm, grade: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    {KG_GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ሴክሽን</label>
                  <select
                    value={kgStudentForm.section}
                    onChange={e => setKgStudentForm({ ...kgStudentForm, section: e.target.value })}
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
                    value={kgStudentForm.academicYear}
                    onChange={e => setKgStudentForm({ ...kgStudentForm, academicYear: e.target.value })}
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
                    value={kgStudentForm.parentPhone}
                    onChange={e => setKgStudentForm({ ...kgStudentForm, parentPhone: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">አድራሻ</label>
                <input
                  type="text"
                  placeholder="ብርብር ከተማ ቀበሌ 01"
                  value={kgStudentForm.address}
                  onChange={e => setKgStudentForm({ ...kgStudentForm, address: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsKgStudentModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ይቅር
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg"
                >
                  {editingKgStudentId ? 'ለውጦችን መዝግብ' : 'ተማሪውን መዝግብ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KG Student Excel Preview Modal */}
      {isKgStudentExcelModalOpen && parsedKgStudentsPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="text-sm font-bold">ከኤክሴል የተገኙ የኬጂ ተማሪዎች ማረጋገጫ (Import Preview)</h3>
                  <p className="text-[11px] text-emerald-200">
                    የተገኙ ተማሪዎች ብዛት፡ <strong>{parsedKgStudentsPreview.length}</strong> · መለያ ኮዶች በደንቡ መሰረት ይሰጣሉ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsKgStudentExcelModalOpen(false)}
                className="text-emerald-200 hover:text-white text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedKgStudentsPreview.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-600">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{s.fullName}</td>
                        <td className="py-2 px-3 text-slate-700">{s.gender}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{s.age}</td>
                        <td className="py-2 px-3 font-medium text-indigo-700">{s.grade}</td>
                        <td className="py-2 px-3 text-slate-700">{s.section}</td>
                        <td className="py-2 px-3 text-slate-700">{s.academicYear} ዓ/ም</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{s.parentPhone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                ጠቅላላ የኬጂ ተማሪዎች፡ <strong>{parsedKgStudentsPreview.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsKgStudentExcelModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  ይቅር (Cancel)
                </button>
                <button
                  type="button"
                  onClick={handleConfirmKgStudentImport}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>ሁሉንም {parsedKgStudentsPreview.length} ተማሪዎች መዝግብ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
