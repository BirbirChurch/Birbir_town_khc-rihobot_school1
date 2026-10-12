import React, { useState } from 'react';
import {
  Student,
  Teacher,
  SchoolSettings,
  SchoolSubject,
  GradeEntry,
  SubjectMarks,
} from '../types';
import {
  calculateClassRoster,
  calculateClassPerformanceAnalysis,
  calculateSubjectPerformanceAnalysis,
  calculateAllSubjectsAnalysis,
} from '../utils/calculations';
import {
  Check,
  Save,
  Printer,
  Edit3,
  BarChart3,
  FileSpreadsheet,
  MessageCircle,
  HelpCircle,
  Award,
} from 'lucide-react';

interface TeacherPortalProps {
  currentTeacher: Teacher;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  grades: GradeEntry[];
  setGrades: React.Dispatch<React.SetStateAction<GradeEntry[]>>;
  subjects: SchoolSubject[];
  settings: SchoolSettings;
  activeTab: string;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  currentTeacher,
  students,
  setStudents,
  grades,
  setGrades,
  subjects,
  settings,
  activeTab,
}) => {
  // Select active assignment
  const assignments = currentTeacher.assignments;
  const [selectedAssIndex, setSelectedAssIndex] = useState<number>(0);
  const activeAssignment = assignments[selectedAssIndex] || assignments[0] || {
    grade: '1ኛ ክፍል',
    section: 'ሀ',
    subjectName: 'እንግሊዝኛ',
  };

  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(settings.currentSemester);
  const [selectedTeacherYear, setSelectedTeacherYear] = useState<string>(() => {
    const match = students.find(
      s => s.grade === activeAssignment.grade || s.grade.includes(activeAssignment.grade.replace(' ክፍል', ''))
    );
    return match ? match.academicYear : settings.currentAcademicYear;
  });

  // Active assignment students
  const targetStudents = students.filter(
    s => {
      const matchGrade = s.grade === activeAssignment.grade ||
        (activeAssignment.grade === '8ኛ ክፍል' && (s.grade.includes('8th') || s.grade === '8')) ||
        (activeAssignment.grade === '6ኛ ክፍል' && (s.grade.includes('6th') || s.grade === '6'));
      const matchSec = s.section === activeAssignment.section ||
        (activeAssignment.section === 'ሀ' && s.section.toUpperCase() === 'A') ||
        (activeAssignment.section === 'ለ' && s.section.toUpperCase() === 'B');
      const matchYear = selectedTeacherYear === 'all' || s.academicYear === selectedTeacherYear;
      return matchGrade && matchSec && matchYear;
    }
  );

  // Local draft of marks for inline fast-editing
  const [marksDraft, setMarksDraft] = useState<{
    [studentId: string]: SubjectMarks;
  }>(() => {
    const draft: { [studentId: string]: SubjectMarks } = {};
    targetStudents.forEach(s => {
      const existing = grades.find(
        g =>
          g.studentId === s.id &&
          g.subjectName === activeAssignment.subjectName &&
          g.academicYear === settings.currentAcademicYear &&
          g.semester === selectedSemester
      );
      if (existing) {
        draft[s.id] = { ...existing.marks };
      } else {
        draft[s.id] = {
          test1: 0,
          test2: 0,
          midExam: 0,
          assignment: 0,
          project: 0,
          quiz: 0,
          homework: 0,
          finalExam: 0,
          total: 0,
        };
      }
    });
    return draft;
  });

  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Update marks draft on assignment or semester change
  const handleAssignmentChange = (index: number) => {
    setSelectedAssIndex(index);
    const newAss = assignments[index];
    if (!newAss) return;
    refreshDraft(newAss.grade, newAss.section, newAss.subjectName, selectedSemester);
  };

  const handleSemesterChange = (sem: 1 | 2) => {
    setSelectedSemester(sem);
    refreshDraft(activeAssignment.grade, activeAssignment.section, activeAssignment.subjectName, sem);
  };

  const refreshDraft = (grade: string, section: string, subjectName: string, sem: 1 | 2) => {
    const stList = students.filter(
      s => s.grade === grade && s.section === section && s.academicYear === settings.currentAcademicYear
    );
    const draft: { [studentId: string]: SubjectMarks } = {};
    stList.forEach(s => {
      const existing = grades.find(
        g =>
          g.studentId === s.id &&
          g.subjectName === subjectName &&
          g.academicYear === settings.currentAcademicYear &&
          g.semester === sem
      );
      if (existing) {
        draft[s.id] = { ...existing.marks };
      } else {
        draft[s.id] = {
          test1: 0,
          test2: 0,
          midExam: 0,
          assignment: 0,
          project: 0,
          quiz: 0,
          homework: 0,
          finalExam: 0,
          total: 0,
        };
      }
    });
    setMarksDraft(draft);
  };

  // Update single field in assessment and auto compute total (out of 100)
  const handleMarkInputChange = (
    studentId: string,
    field: keyof SubjectMarks,
    valStr: string
  ) => {
    const val = Math.max(0, parseFloat(valStr) || 0);

    setMarksDraft(prev => {
      const current = prev[studentId] || {
        test1: 0,
        test2: 0,
        midExam: 0,
        assignment: 0,
        project: 0,
        quiz: 0,
        homework: 0,
        finalExam: 0,
        total: 0,
      };

      const updated = {
        ...current,
        [field]: val,
      };

      // Recalculate 10 + 10 + 10 + 10 + 20 + 10 + 10 + 20 = 100!
      const total =
        (field === 'test1' ? val : updated.test1) +
        (field === 'test2' ? val : updated.test2) +
        (field === 'midExam' ? val : updated.midExam) +
        (field === 'assignment' ? val : updated.assignment) +
        (field === 'project' ? val : updated.project) +
        (field === 'quiz' ? val : updated.quiz) +
        (field === 'homework' ? val : updated.homework) +
        (field === 'finalExam' ? val : updated.finalExam);

      updated.total = Math.round(total * 10) / 10;

      return {
        ...prev,
        [studentId]: updated,
      };
    });
  };

  // Batch Save all entered marks
  const handleSaveAllMarks = () => {
    const updatedGradesList = [...grades];

    Object.entries(marksDraft).forEach(([studentId, marks]) => {
      const existingIdx = updatedGradesList.findIndex(
        g =>
          g.studentId === studentId &&
          g.subjectName === activeAssignment.subjectName &&
          g.academicYear === settings.currentAcademicYear &&
          g.semester === selectedSemester
      );

      if (existingIdx !== -1) {
        updatedGradesList[existingIdx] = {
          ...updatedGradesList[existingIdx],
          marks: { ...marks },
          updatedAt: new Date().toISOString().split('T')[0],
        };
      } else {
        updatedGradesList.push({
          id: `grd-${Date.now()}-${studentId}`,
          studentId,
          subjectName: activeAssignment.subjectName,
          academicYear: settings.currentAcademicYear,
          semester: selectedSemester,
          marks: { ...marks },
          updatedAt: new Date().toISOString().split('T')[0],
        });
      }
    });

    setGrades(updatedGradesList);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // -----------------------------------------------------------------
  // Homeroom ("የክፍል ስም ጠሪ") calculations
  // -----------------------------------------------------------------
  const isHomeroomTeacher = currentTeacher.isHomeroom && currentTeacher.homeroomGrade;
  const homeroomGrade = currentTeacher.homeroomGrade || '1ኛ ክፍል';
  const homeroomSection = currentTeacher.homeroomSection || 'ሀ';

  const homeroomRoster = calculateClassRoster(
    students,
    grades,
    subjects,
    homeroomGrade,
    homeroomSection,
    selectedTeacherYear === 'all'
      ? (students.find(s => s.grade === homeroomGrade)?.academicYear || settings.currentAcademicYear)
      : selectedTeacherYear,
    settings.failThresholdSubjects,
    settings.passAverageThreshold,
    settings.mandatoryFailingSubjects,
    settings.gradePromotionRules
  );

  const homeroomSubjects = subjects.filter(s => s.applicableGrades.includes(homeroomGrade));
  const classPerformance = calculateClassPerformanceAnalysis(homeroomRoster);
  const allSubjectsAnalysis = calculateAllSubjectsAnalysis(homeroomRoster, homeroomSubjects);
  const [selectedAnalysisSubject, setSelectedAnalysisSubject] = useState<string>(
    homeroomSubjects[0]?.name || 'እንግሊዝኛ'
  );
  const subjectPerformance = calculateSubjectPerformanceAnalysis(
    homeroomRoster,
    selectedAnalysisSubject
  );

  // Conduct remark modal/state for teacher
  const [selectedStudentForConduct, setSelectedStudentForConduct] = useState<Student | null>(null);
  const [teacherConductNote, setTeacherConductNote] = useState('');

  const handleSaveTeacherConduct = () => {
    if (!selectedStudentForConduct || !teacherConductNote.trim()) return;

    const newNote = {
      id: `cn-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      author: currentTeacher.name,
      authorRole: currentTeacher.isHomeroom ? 'የክፍል ስም ጠሪ መምህር' : 'መምህር',
      note: teacherConductNote.trim(),
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
    setTeacherConductNote('');
  };

  return (
    <div className="space-y-6">
      {/* Tab 1: Marks Entry Sheet (የውጤት ማጠራቀሚያ 10+10+10+10+20+10+10+20 = 100) */}
      {activeTab === 'marks_entry' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={settings.customLogo || "/kale_heywet_logo.jpg"}
                  alt="Kale Heywet Logo"
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-xs bg-white shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/src/assets/images/kale_heywet_logo_1791782506449.jpg';
                  }}
                />
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-700" />
                    <span>የተከታታይ ምዘና እና ማጠቃለያ ውጤት ማጠራቀሚያ ሰነድ</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    የተከታታይ ምዘና ቀመር፡ ምዘና1 (10) + ምዘና2 (10) + ሚድ (10) + አሳይንመንት (10) + ፕሮጀክት (20) + ፈተና1 (10) + ፈተና2 (10) + ማጠቃለያ (20) = 100%።
                  </p>
                </div>
              </div>

              {/* Assignment & Year Switchers */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-lg">
                  <span className="text-[11px] font-semibold text-slate-600 pl-1">ክፍልና ትምህርት፡</span>
                  <select
                    value={selectedAssIndex}
                    onChange={e => handleAssignmentChange(parseInt(e.target.value))}
                    className="text-xs py-1 px-2.5 bg-white border border-slate-300 rounded-md font-medium text-indigo-900"
                  >
                    {assignments.map((ass, idx) => (
                      <option key={idx} value={idx}>
                        {ass.grade} ({ass.section}) — {ass.subjectName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-lg">
                  <span className="text-[11px] font-semibold text-slate-600 pl-1">ዘመን፡</span>
                  <select
                    value={selectedTeacherYear}
                    onChange={e => setSelectedTeacherYear(e.target.value)}
                    className="text-xs py-1 px-2 bg-white border border-slate-300 rounded-md font-semibold text-amber-900"
                  >
                    <option value="all">ሁሉም ዓመታት</option>
                    {settings.availableAcademicYears.map(yr => (
                      <option key={yr} value={yr}>{yr} ዓ/ም</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                  <button
                    onClick={() => handleSemesterChange(1)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      selectedSemester === 1
                        ? 'bg-indigo-700 text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1ኛ ሰሚስተር
                  </button>
                  <button
                    onClick={() => handleSemesterChange(2)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      selectedSemester === 2
                        ? 'bg-indigo-700 text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2ኛ ሰሚስተር
                  </button>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-slate-600">
                የተመዘገቡ ተማሪዎች ብዛት፡ <strong>{targetStudents.length}</strong> · ውጤቱ ከመቶ ተደምሮ በቀጥታ ለክፍሉ ስም ጠሪ መምህር ይሄዳል።
              </div>

              <button
                onClick={handleSaveAllMarks}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>ውጤቶችን በሙሉ አስቀምጥ (Save Marks)</span>
              </button>
            </div>

            {saveSuccessNotice && (
              <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>ሁሉም የተማሪ ውጤቶች በተሳካ ሁኔታ ተመዝግበው ተቀምጠዋል! ለክፍሉ ስም ጠሪ ሮስተር ተላልፈዋል።</span>
              </div>
            )}

            {/* Assessment Input Table */}
            <div className="mt-4 overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-2 border-r border-slate-200 w-10">ተ.ቁ</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-left min-w-[140px]">
                      የተማሪ ሙሉ ስም
                    </th>
                    <th className="py-2.5 px-2 border-r border-slate-200 w-24">መለያ ኮድ</th>
                    <th className="py-2 px-1 border-r border-slate-200 bg-indigo-50/50">
                      ምዘና 1
                      <div className="text-[10px] font-normal text-slate-500">(10%)</div>
                    </th>
                    <th className="py-2 px-1 border-r border-slate-200 bg-indigo-50/50">
                      ምዘና 2
                      <div className="text-[10px] font-normal text-slate-500">(10%)</div>
                    </th>
                    <th className="py-2 px-1 border-r border-slate-200 bg-amber-50/50">
                      ሚድ ፈተና
                      <div className="text-[10px] font-normal text-slate-500">(10%)</div>
                    </th>
                    <th className="py-2 px-1 border-r border-slate-200 bg-indigo-50/50">
                      አሳይንመንት
                      <div className="text-[10px] font-normal text-slate-500">(10%)</div>
                    </th>
                    <th className="py-2 px-1 border-r border-slate-200 bg-indigo-50/50">
                      ፕሮጀክት
                      <div className="text-[10px] font-normal text-slate-500">(20%)</div>
                    </th>
                    <th className="py-2 px-1 border-r border-slate-200 bg-indigo-50/50">
                      ኩዊዝ
                      <div className="text-[10px] font-normal text-slate-500">(10%)</div>
                    </th>
                    <th className="py-2 px-1 border-r border-slate-200 bg-indigo-50/50">
                      የቤት ስራ
                      <div className="text-[10px] font-normal text-slate-500">(10%)</div>
                    </th>
                    <th className="py-2 px-1 border-r border-slate-200 bg-amber-50/50">
                      ማጠቃለያ
                      <div className="text-[10px] font-normal text-slate-500">(20%)</div>
                    </th>
                    <th className="py-2.5 px-2 bg-slate-200/80 font-extrabold w-20">
                      ድምር (100)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {targetStudents.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-500">
                        በዚህ ክፍል የተመዘገበ ተማሪ የለም።
                      </td>
                    </tr>
                  ) : (
                    targetStudents.map((s, idx) => {
                      const m = marksDraft[s.id] || {
                        test1: 0,
                        test2: 0,
                        midExam: 0,
                        assignment: 0,
                        project: 0,
                        quiz: 0,
                        homework: 0,
                        finalExam: 0,
                        total: 0,
                      };

                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-2 px-2 border-r border-slate-200 font-medium text-slate-600">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-left font-semibold text-slate-900">
                            {s.fullName}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 font-mono text-indigo-700">
                            {s.id}
                          </td>

                          {/* Test 1 (10) */}
                          <td className="py-1 px-1 border-r border-slate-200">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={m.test1 || ''}
                              onChange={e => handleMarkInputChange(s.id, 'test1', e.target.value)}
                              className="w-14 text-center font-mono py-1 px-1 border border-slate-300 rounded-md focus:bg-white"
                            />
                          </td>

                          {/* Test 2 (10) */}
                          <td className="py-1 px-1 border-r border-slate-200">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={m.test2 || ''}
                              onChange={e => handleMarkInputChange(s.id, 'test2', e.target.value)}
                              className="w-14 text-center font-mono py-1 px-1 border border-slate-300 rounded-md focus:bg-white"
                            />
                          </td>

                          {/* Mid (10) */}
                          <td className="py-1 px-1 border-r border-slate-200">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={m.midExam || ''}
                              onChange={e => handleMarkInputChange(s.id, 'midExam', e.target.value)}
                              className="w-14 text-center font-mono py-1 px-1 border border-slate-300 rounded-md focus:bg-white"
                            />
                          </td>

                          {/* Assignment (10) */}
                          <td className="py-1 px-1 border-r border-slate-200">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={m.assignment || ''}
                              onChange={e => handleMarkInputChange(s.id, 'assignment', e.target.value)}
                              className="w-14 text-center font-mono py-1 px-1 border border-slate-300 rounded-md focus:bg-white"
                            />
                          </td>

                          {/* Project (20) */}
                          <td className="py-1 px-1 border-r border-slate-200">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={m.project || ''}
                              onChange={e => handleMarkInputChange(s.id, 'project', e.target.value)}
                              className="w-14 text-center font-mono py-1 px-1 border border-slate-300 rounded-md focus:bg-white"
                            />
                          </td>

                          {/* Quiz (10) */}
                          <td className="py-1 px-1 border-r border-slate-200">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={m.quiz || ''}
                              onChange={e => handleMarkInputChange(s.id, 'quiz', e.target.value)}
                              className="w-14 text-center font-mono py-1 px-1 border border-slate-300 rounded-md focus:bg-white"
                            />
                          </td>

                          {/* Homework (10) */}
                          <td className="py-1 px-1 border-r border-slate-200">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={m.homework || ''}
                              onChange={e => handleMarkInputChange(s.id, 'homework', e.target.value)}
                              className="w-14 text-center font-mono py-1 px-1 border border-slate-300 rounded-md focus:bg-white"
                            />
                          </td>

                          {/* Final Exam (20) */}
                          <td className="py-1 px-1 border-r border-slate-200">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={m.finalExam || ''}
                              onChange={e => handleMarkInputChange(s.id, 'finalExam', e.target.value)}
                              className="w-14 text-center font-mono py-1 px-1 border border-slate-300 rounded-md focus:bg-white"
                            />
                          </td>

                          {/* Total (100) */}
                          <td
                            className={`py-2 px-2 font-mono font-bold text-sm ${
                              m.total < 50
                                ? 'text-rose-700 bg-rose-50'
                                : 'text-slate-900 bg-slate-100/70'
                            }`}
                          >
                            {m.total}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Homeroom Roster (የክፍል ስም ጠሪ ሮስተር) */}
      {activeTab === 'homeroom_roster' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            {!isHomeroomTeacher ? (
              <div className="py-12 text-center space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">
                  እርስዎ የክፍል ስም ጠሪ መምህር አይደሉም።
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  የክፍል ሮስተር የማዘጋጀትና የመቆጣጠር ስልጣን የተሰጠው በትምህርት ቤቱ ር/መምህር ለተመደቡ የክፍል ስም ጠሪ መምህራን ብቻ ነው።
                </p>
              </div>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={settings.customLogo || "/kale_heywet_logo.jpg"}
                      alt="Kale Heywet Logo"
                      className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-xs bg-white shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/src/assets/images/kale_heywet_logo_1791782506449.jpg';
                      }}
                    />
                    <div>
                      <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-indigo-700" />
                        <span>የክፍል ስም ጠሪ መምህር የሮስተር ዝግጅት ሰሌዳ</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ክፍል፡ <strong>{homeroomGrade}</strong> (ሴክሽን <strong>{homeroomSection}</strong>) · ስም ጠሪ፡ {currentTeacher.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                      <span className="text-[11px] font-medium text-slate-500">ዘመን፡</span>
                      <select
                        value={selectedTeacherYear}
                        onChange={e => setSelectedTeacherYear(e.target.value)}
                        className="text-xs py-0.5 px-2 bg-white border border-slate-300 rounded font-bold text-amber-900"
                      >
                        <option value="all">ሁሉም ዓመታት</option>
                        {settings.availableAcademicYears.map(yr => (
                          <option key={yr} value={yr}>{yr} ዓ/ም</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium"
                    >
                      <Printer className="w-4 h-4" />
                      <span>ይፋዊ ሮስተር አትም (Print Roster)</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-[11px] text-center border-collapse">
                    <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-1 border-r border-slate-200">ተ.ቁ</th>
                        <th className="py-2 px-2 border-r border-slate-200 text-left">የተማሪ ስም</th>
                        <th className="py-2 px-1 border-r border-slate-200">መለያ ኮድ</th>
                        {homeroomSubjects.map(sub => (
                          <th key={sub.id} className="py-2 px-1 border-r border-slate-200 truncate max-w-[70px]">
                            {sub.name.slice(0, 6)}..
                          </th>
                        ))}
                        <th className="py-2 px-1 border-r border-slate-200 bg-slate-200/50">ድምር</th>
                        <th className="py-2 px-1 border-r border-slate-200 bg-indigo-50">አማካይ</th>
                        <th className="py-2 px-1 border-r border-slate-200 bg-amber-50">ደረጃ</th>
                        <th className="py-2 px-1">ውሳኔ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {homeroomRoster.map((item, idx) => (
                        <tr key={item.student.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-1 border-r border-slate-200">{idx + 1}</td>
                          <td className="py-1.5 px-2 border-r border-slate-200 text-left font-semibold text-slate-900">
                            {item.student.fullName}
                          </td>
                          <td className="py-1.5 px-1 border-r border-slate-200 font-mono text-indigo-700">
                            {item.student.id}
                          </td>
                          {homeroomSubjects.map(sub => {
                            const sc = item.subjectScores[sub.name];
                            return (
                              <td key={sub.id} className="py-1.5 px-1 border-r border-slate-200 font-mono">
                                {sc?.combined ?? '—'}
                              </td>
                            );
                          })}
                          <td className="py-1.5 px-1 border-r border-slate-200 font-mono font-bold bg-slate-50">
                            {item.annualTotal}
                          </td>
                          <td className="py-1.5 px-1 border-r border-slate-200 font-mono font-bold text-indigo-900 bg-indigo-50/50">
                            {item.annualAvg}
                          </td>
                          <td className="py-1.5 px-1 border-r border-slate-200 font-mono font-bold text-amber-900 bg-amber-50/50">
                            {item.annualRank || '—'}
                          </td>
                          <td className="py-1.5 px-1 font-semibold text-[10px]">
                            {item.passed ? (
                              <span className="text-emerald-700">አልፏል</span>
                            ) : (
                              <span className="text-rose-700">ይደግማል</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Class Performance Analytics by Gender (ለስም ጠሪ መምህር) */}
      {activeTab === 'class_analytics' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-700" />
                  <span>የክፍሉ የውጤት ትንተና በወንድና በሴት (Gender Breakdown)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  የክፍል ስም ጠሪ መምህር የሚያዘጋጀው የክፍልና የነጠላ ትምህርት ውጤት ትንተና።
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>አትም</span>
              </button>
            </div>

            {/* Class overall */}
            <div className="mt-5">
              <h3 className="text-xs font-bold text-slate-800 mb-2">
                የክፍሉ አጠቃላይ ውጤት ትንተና ({homeroomGrade} {homeroomSection})
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-center font-mono">
                  <thead className="bg-slate-100 font-sans font-semibold text-slate-800 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 text-left">የውጤት ክልል</th>
                      <th className="py-2 px-3">ወንድ ብዛት</th>
                      <th className="py-2 px-3">ወንድ %</th>
                      <th className="py-2 px-3">ሴት ብዛት</th>
                      <th className="py-2 px-3">ሴት %</th>
                      <th className="py-2 px-3">ድምር</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-left font-sans font-semibold text-emerald-800">
                        ከ75 በላይ (ከፍተኛ)
                      </td>
                      <td className="py-2 px-3">{classPerformance.above75.maleCount}</td>
                      <td className="py-2 px-3">{classPerformance.above75.malePercent}%</td>
                      <td className="py-2 px-3">{classPerformance.above75.femaleCount}</td>
                      <td className="py-2 px-3">{classPerformance.above75.femalePercent}%</td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {classPerformance.above75.totalCount}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-left font-sans font-semibold text-amber-800">
                        ከ50 እስከ 74 (መካከለኛ)
                      </td>
                      <td className="py-2 px-3">{classPerformance.between50And74.maleCount}</td>
                      <td className="py-2 px-3">{classPerformance.between50And74.malePercent}%</td>
                      <td className="py-2 px-3">{classPerformance.between50And74.femaleCount}</td>
                      <td className="py-2 px-3">{classPerformance.between50And74.femalePercent}%</td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {classPerformance.between50And74.totalCount}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-left font-sans font-semibold text-rose-800">
                        ከ50 በታች (ዝቅተኛ)
                      </td>
                      <td className="py-2 px-3 text-rose-600">{classPerformance.below50.maleCount}</td>
                      <td className="py-2 px-3">{classPerformance.below50.malePercent}%</td>
                      <td className="py-2 px-3 text-rose-600">{classPerformance.below50.femaleCount}</td>
                      <td className="py-2 px-3">{classPerformance.below50.femalePercent}%</td>
                      <td className="py-2 px-3 font-bold text-rose-700">
                        {classPerformance.below50.totalCount}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* All Subjects Performance Breakdown Table */}
            <div className="mt-8 pt-5 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>የክፍሉ ሁሉም የትምህርት ዓይነቶች አጠቃላይ የውጤት ትንተና</span>
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-center font-mono">
                  <thead className="bg-slate-100 font-sans font-semibold text-slate-800 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-left">የትምህርት ዓይነት</th>
                      <th className="py-2.5 px-2">ተፈታኝ</th>
                      <th className="py-2.5 px-2">አማካይ</th>
                      <th className="py-2.5 px-2 text-emerald-700">ከፍተኛ</th>
                      <th className="py-2.5 px-2 text-rose-700">ዝቅተኛ</th>
                      <th className="py-2.5 px-2 text-emerald-800 bg-emerald-50/50">ከ75 በላይ (%)</th>
                      <th className="py-2.5 px-2 text-amber-800 bg-amber-50/50">50-74 (%)</th>
                      <th className="py-2.5 px-2 text-rose-800 bg-rose-50/50">ከ50 በታች (%)</th>
                      <th className="py-2.5 px-3 font-sans">ያለፉበት %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allSubjectsAnalysis.map(subItem => (
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
                        <td className="py-2 px-3">
                          <span className={`font-bold ${subItem.passRate >= 75 ? 'text-emerald-700' : subItem.passRate >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                            {subItem.passRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subject-specific analysis */}
            <div className="mt-8 pt-5 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800">
                  የነጠላ ትምህርት ዓይነት ውጤት ዝርዝር በወንድና በሴት
                </h3>
                <select
                  value={selectedAnalysisSubject}
                  onChange={e => setSelectedAnalysisSubject(e.target.value)}
                  className="text-xs py-1 px-3 border border-slate-300 rounded-lg bg-white"
                >
                  {homeroomSubjects.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-center font-mono">
                  <thead className="bg-slate-100 font-sans font-semibold text-slate-800 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 text-left">የውጤት ክልል ({selectedAnalysisSubject})</th>
                      <th className="py-2 px-3">ወንድ ብዛት</th>
                      <th className="py-2 px-3">ወንድ %</th>
                      <th className="py-2 px-3">ሴት ብዛት</th>
                      <th className="py-2 px-3">ሴት %</th>
                      <th className="py-2 px-3">ድምር</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-left font-sans font-semibold text-emerald-800">
                        ከ75 በላይ (ከፍተኛ)
                      </td>
                      <td className="py-2 px-3">{subjectPerformance.above75.maleCount}</td>
                      <td className="py-2 px-3">{subjectPerformance.above75.malePercent}%</td>
                      <td className="py-2 px-3">{subjectPerformance.above75.femaleCount}</td>
                      <td className="py-2 px-3">{subjectPerformance.above75.femalePercent}%</td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {subjectPerformance.above75.totalCount}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-left font-sans font-semibold text-amber-800">
                        ከ50 እስከ 74 (መካከለኛ)
                      </td>
                      <td className="py-2 px-3">{subjectPerformance.between50And74.maleCount}</td>
                      <td className="py-2 px-3">{subjectPerformance.between50And74.malePercent}%</td>
                      <td className="py-2 px-3">{subjectPerformance.between50And74.femaleCount}</td>
                      <td className="py-2 px-3">{subjectPerformance.between50And74.femalePercent}%</td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {subjectPerformance.between50And74.totalCount}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-left font-sans font-semibold text-rose-800">
                        ከ50 በታች (ዝቅተኛ)
                      </td>
                      <td className="py-2 px-3 text-rose-600">{subjectPerformance.below50.maleCount}</td>
                      <td className="py-2 px-3">{subjectPerformance.below50.malePercent}%</td>
                      <td className="py-2 px-3 text-rose-600">{subjectPerformance.below50.femaleCount}</td>
                      <td className="py-2 px-3">{subjectPerformance.below50.femalePercent}%</td>
                      <td className="py-2 px-3 font-bold text-rose-700">
                        {subjectPerformance.below50.totalCount}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Conduct Remarks */}
      {activeTab === 'conduct_remarks' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-700" />
                <span>የተማሪዎች ስነ-ምግባርና የባህሪ አስተያየት መዝገብ</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                መምህሩ ስለሚያስተምራቸው ተማሪዎች ጠንካራና ሊሻሻሉ የሚገባቸውን ባህሪያት ለወላጆች ይጽፋል።
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {targetStudents.map(std => (
                <div key={std.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{std.fullName}</h4>
                      <span className="text-[11px] font-mono text-indigo-700">{std.id}</span>
                    </div>
                    <button
                      onClick={() => setSelectedStudentForConduct(std)}
                      className="px-3 py-1 bg-indigo-700 text-white rounded-md text-xs font-medium"
                    >
                      አስተያየት ጻፍ
                    </button>
                  </div>

                  {/* Previous Notes */}
                  <div className="space-y-1.5 pt-2">
                    {std.conductNotes.length === 0 ? (
                      <p className="text-[11px] text-slate-400">ምንም አስተያየት አልተመዘገበም።</p>
                    ) : (
                      std.conductNotes.map(n => (
                        <div key={n.id} className="text-xs p-2 bg-white border border-slate-200 rounded-md">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span>{n.author} ({n.authorRole})</span>
                            <span>{n.date}</span>
                          </div>
                          <p className="text-slate-700">{n.note}</p>
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

      {/* Conduct Remark Modal for Teacher */}
      {selectedStudentForConduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                የባህሪ አስተያየት መጻፊያ — {selectedStudentForConduct.fullName}
              </h3>
              <button
                onClick={() => setSelectedStudentForConduct(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-3">
              <textarea
                rows={3}
                placeholder="ስለ ተማሪው የትምህርት ጥረት፣ የቤት ስራ አሰራር ወይም ስነ-ምግባር እዚህ ይጻፉ..."
                value={teacherConductNote}
                onChange={e => setTeacherConductNote(e.target.value)}
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
                  onClick={handleSaveTeacherConduct}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg"
                >
                  መዝግብ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
