import React, { useState } from 'react';
import {
  Student,
  Teacher,
  SchoolSettings,
  SchoolSubject,
  GradeEntry,
  Gender,
  GradePromotionRule,
  ParentFeedback,
  TeacherLetter,
} from '../types';
import { ALL_GRADES, generateNextStudentId, STANDARD_SECTIONS, getGradePrefix } from '../utils/studentIdGenerator';
import { calculateClassRoster, getNextGradeLevel } from '../utils/calculations';
import { PrincipalPortal } from './PrincipalPortal';
import { KgDirectorPortal } from './KgDirectorPortal';
import { TeacherPortal } from './TeacherPortal';
import { ParentPortal } from './ParentPortal';
import {
  Users,
  GraduationCap,
  Key,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Search,
  FileSpreadsheet,
  Upload,
  Download,
  RotateCcw,
  Image as ImageIcon,
  Calendar,
  Sparkles,
  Sliders,
  Eye,
  Check,
  Layers,
  Settings2,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import {
  downloadStudentTemplate,
  downloadTeacherTemplate,
  parseStudentsExcelFile,
  parseTeachersExcelFile,
  exportStudentsToExcel,
  exportTeachersToExcel,
  ParsedStudentRow,
  ParsedTeacherRow,
} from '../utils/excelHelper';

interface AdminPortalProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  subjects: SchoolSubject[];
  setSubjects: React.Dispatch<React.SetStateAction<SchoolSubject[]>>;
  settings: SchoolSettings;
  setSettings: React.Dispatch<React.SetStateAction<SchoolSettings>>;
  grades: GradeEntry[];
  setGrades: React.Dispatch<React.SetStateAction<GradeEntry[]>>;
  feedbacks?: ParentFeedback[];
  setFeedbacks?: React.Dispatch<React.SetStateAction<ParentFeedback[]>>;
  letters?: TeacherLetter[];
  setLetters?: React.Dispatch<React.SetStateAction<TeacherLetter[]>>;
  activeTab: string;
  setActiveTab?: (tab: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  students,
  setStudents,
  teachers,
  setTeachers,
  subjects,
  setSubjects,
  settings,
  setSettings,
  grades,
  setGrades,
  feedbacks = [],
  setFeedbacks = () => {},
  letters = [],
  setLetters = () => {},
  activeTab,
  setActiveTab,
}) => {
  // Student registration states
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [searchStudentTerm, setSearchStudentTerm] = useState('');
  
  // Student Modal Form state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState<{
    id?: string;
    fullName: string;
    gender: Gender;
    age: number;
    academicYear: string;
    grade: string;
    section: string;
    parentPhone: string;
    address: string;
  }>({
    id: '',
    fullName: '',
    gender: 'ወንድ',
    age: 7,
    academicYear: settings.currentAcademicYear,
    grade: '1ኛ ክፍል',
    section: 'ሀ',
    parentPhone: '',
    address: 'ብርብር ከተማ ቀበሌ 01',
  });

  // Fast inline-edit row state
  const [inlineEditStudentId, setInlineEditStudentId] = useState<string | null>(null);
  const [inlineEditForm, setInlineEditForm] = useState<{
    id: string;
    fullName: string;
    gender: Gender;
    grade: string;
    section: string;
    academicYear: string;
    age: number;
  } | null>(null);

  // Bulk class / section renaming & reassignment state
  const [isBulkClassModalOpen, setIsBulkClassModalOpen] = useState(false);
  const [bulkClassSource, setBulkClassSource] = useState<{ grade: string; section: string; academicYear: string }>({
    grade: '8ኛ ክፍል',
    section: 'ሀ',
    academicYear: '2018',
  });
  const [bulkClassTarget, setBulkClassTarget] = useState<{ grade: string; section: string; academicYear: string; updateId: boolean }>({
    grade: '8ኛ ክፍል',
    section: 'ሀ',
    academicYear: '2019',
    updateId: true,
  });
  const [studentActionSuccessMsg, setStudentActionSuccessMsg] = useState<string>('');

  // Teacher modal / form state
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherRoleFilter, setTeacherRoleFilter] = useState<'all' | 'teachers' | 'leadership' | 'support'>('all');
  const [teacherForm, setTeacherForm] = useState<{
    name: string;
    roleTitle: string;
    phone: string;
    pin: string;
    isHomeroom: boolean;
    homeroomGrade: string;
    homeroomSection: string;
    assignedGrade: string;
    assignedSection: string;
    assignedSubject: string;
  }>({
    name: '',
    roleTitle: 'መ/ርት',
    phone: '',
    pin: '1008',
    isHomeroom: false,
    homeroomGrade: '1ኛ ክፍል',
    homeroomSection: 'ሀ',
    assignedGrade: '1ኛ ክፍል',
    assignedSection: 'ሀ',
    assignedSubject: 'እንግሊዝኛ',
  });

  // Subject Modal state
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    englishName: '',
    cycle: 'first_cycle' as 'preschool' | 'first_cycle' | 'second_cycle' | 'secondary' | 'prep_natural' | 'prep_social',
    grades: [] as string[],
  });

  // Promotion execution state
  const [promotionReport, setPromotionReport] = useState<{
    promotedCount: number;
    repeatedCount: number;
    details: Array<{
      studentName: string;
      fromGrade: string;
      toGrade: string;
      status: 'promoted' | 'repeated';
      failCount: number;
      reason: string;
    }>;
  } | null>(null);

  // Academic Year Management state
  const [newAcademicYearInput, setNewAcademicYearInput] = useState('');
  const [yearSuccessMsg, setYearSuccessMsg] = useState('');
  const [promotionSourceYear, setPromotionSourceYear] = useState(settings.currentAcademicYear);
  const [promotionTargetYear, setPromotionTargetYear] = useState<string>(() => {
    const otherYear = settings.availableAcademicYears.find(y => y !== settings.currentAcademicYear);
    if (otherYear) return otherYear;
    const nextY = parseInt(settings.currentAcademicYear) + 1;
    return isNaN(nextY) ? '2020' : nextY.toString();
  });

  // Grade-Specific Policy & Core Failing Subjects state
  const [selectedRuleGrade, setSelectedRuleGrade] = useState<string>('ማቆያ');
  const [gradeRuleForm, setGradeRuleForm] = useState<GradePromotionRule>(() => {
    return (
      settings.gradePromotionRules?.['ማቆያ'] || {
        failThresholdSubjects: 99,
        passAverageThreshold: 40,
        mandatoryFailingSubjects: [],
      }
    );
  });
  const [isGradeCustomOverride, setIsGradeCustomOverride] = useState<boolean>(() => {
    return !!settings.gradePromotionRules?.['ማቆያ'];
  });
  const [policySaveSuccessMsg, setPolicySaveSuccessMsg] = useState('');

  // Inspector Mode state (for viewing other portals)
  const [inspectedRole, setInspectedRole] = useState<
    'principal' | 'vice_principal' | 'kg_director' | 'teacher' | 'parent'
  >('principal');
  const [inspectedTeacherId, setInspectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [inspectedStudentId, setInspectedStudentId] = useState<string>(students[0]?.id || '');
  const [inspectorSubTab, setInspectorSubTab] = useState<string>('students');

  // Password management state
  const [passwordsForm, setPasswordsForm] = useState({ ...settings.passwords });
  const [passwordSaveSuccess, setPasswordSaveSuccess] = useState(false);

  // School Logo customizer state
  const [adminLogoInput, setAdminLogoInput] = useState(settings.customLogo || '/kale_heywet_logo.jpg');
  const [adminLogoSuccessMsg, setAdminLogoSuccessMsg] = useState(false);

  const handleAdminLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAdminLogoInput(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAdminLogo = () => {
    setSettings(prev => ({
      ...prev,
      customLogo: adminLogoInput,
    }));
    setAdminLogoSuccessMsg(true);
    setTimeout(() => setAdminLogoSuccessMsg(false), 3000);
  };

  const handleResetAdminLogo = () => {
    const defaultLogo = '/kale_heywet_logo.jpg';
    setAdminLogoInput(defaultLogo);
    setSettings(prev => ({
      ...prev,
      customLogo: defaultLogo,
    }));
    setAdminLogoSuccessMsg(true);
    setTimeout(() => setAdminLogoSuccessMsg(false), 3000);
  };

  // Excel states for Students
  const [parsedStudentsPreview, setParsedStudentsPreview] = useState<ParsedStudentRow[] | null>(null);
  const [isStudentExcelModalOpen, setIsStudentExcelModalOpen] = useState(false);
  const [studentImportSuccessMsg, setStudentImportSuccessMsg] = useState<string | null>(null);

  // Excel states for Teachers
  const [parsedTeachersPreview, setParsedTeachersPreview] = useState<ParsedTeacherRow[] | null>(null);
  const [isTeacherExcelModalOpen, setIsTeacherExcelModalOpen] = useState(false);
  const [teacherImportSuccessMsg, setTeacherImportSuccessMsg] = useState<string | null>(null);

  // Student Excel Upload Handlers
  const handleStudentFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseStudentsExcelFile(file, selectedYearFilter);
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
        academicYear: row.academicYear || selectedYearFilter,
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

  // Teacher Excel Upload Handlers
  const handleTeacherFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseTeachersExcelFile(file);
      if (parsed.length === 0) {
        alert('በተመረጠው የኤክሴል ሰነድ ውስጥ ምንም የመምህራን መረጃ አልተገኘም! እባክዎ የቅጹን አምዶች ይፈትሹ።');
        return;
      }
      setParsedTeachersPreview(parsed);
      setIsTeacherExcelModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('የመምህራን ኤክሴል ፋይሉን በማንበብ ሂደት ስህተት አጋጥሟል! እባክዎ ትክክለኛ .xlsx ወይም .csv ፋይል ይምረጡ።');
    }
    e.target.value = '';
  };

  const handleConfirmTeacherImport = () => {
    if (!parsedTeachersPreview || parsedTeachersPreview.length === 0) return;

    let updatedTeachers = [...teachers];
    let addedCount = 0;

    for (const row of parsedTeachersPreview) {
      const newTeacher: Teacher = {
        id: `tch-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`,
        name: row.name,
        roleTitle: row.roleTitle || 'መምህር',
        phone: row.phone,
        pin: row.pin || String(Math.floor(1000 + Math.random() * 9000)),
        isHomeroom: row.isHomeroom,
        homeroomGrade: row.homeroomGrade,
        homeroomSection: row.homeroomSection,
        assignments: row.assignedGrade && row.assignedSubject ? [
          {
            grade: row.assignedGrade,
            section: row.assignedSection || 'ሀ',
            subjectName: row.assignedSubject,
          }
        ] : [
          {
            grade: '1ኛ ክፍል',
            section: 'ሀ',
            subjectName: 'እንግሊዝኛ',
          }
        ],
      };
      updatedTeachers.push(newTeacher);
      addedCount++;
    }

    setTeachers(updatedTeachers);
    setIsTeacherExcelModalOpen(false);
    setParsedTeachersPreview(null);
    setTeacherImportSuccessMsg(`በኤክሴል ሰነድ ውስጥ የነበሩ ${addedCount} መምህራን በተሳካ ሁኔታ ተመዝግበዋል! የመግቢያ ቁልፎች (PIN) ተዘጋጅተዋል።`);
    setTimeout(() => setTeacherImportSuccessMsg(null), 5000);
  };

  // -------------------------------------------------------------
  // Student Actions
  // -------------------------------------------------------------
  const handleOpenAddStudent = () => {
    setEditingStudentId(null);
    setStudentForm({
      fullName: '',
      gender: 'ወንድ',
      age: selectedGradeFilter.includes('ማቆያ') ? 4 : 7,
      academicYear: selectedYearFilter,
      grade: selectedGradeFilter,
      section: 'ሀ',
      parentPhone: '',
      address: 'ብርብር ከተማ ቀበሌ 01',
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (s: Student) => {
    setEditingStudentId(s.id);
    setStudentForm({
      id: s.id,
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
      // Update existing
      const targetId = (studentForm.id && studentForm.id.trim()) ? studentForm.id.trim() : editingStudentId;
      setStudents(prev =>
        prev.map(s =>
          s.id === editingStudentId
            ? {
                ...s,
                ...studentForm,
                id: targetId,
              }
            : s
        )
      );

      // If ID changed, cascade to grades
      if (targetId !== editingStudentId) {
        setGrades(prev =>
          prev.map(g => (g.studentId === editingStudentId ? { ...g, studentId: targetId } : g))
        );
      }
      setStudentActionSuccessMsg(`የተማሪው መረጃ (${studentForm.fullName}) በተሳካ ሁኔታ ተሻሽሏል!`);
    } else {
      // Add new: generate ID adhering to the rule or use custom
      const nextId = (studentForm.id && studentForm.id.trim())
        ? studentForm.id.trim()
        : generateNextStudentId(studentForm.grade, students);
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
      setStudentActionSuccessMsg(`አዲሱ ተማሪ (${newStudent.fullName}) በመለያ ኮድ ${newStudent.id} ተመዝግቧል!`);
    }
    setIsStudentModalOpen(false);
    setTimeout(() => setStudentActionSuccessMsg(''), 3500);
  };

  // Inline fast edit handlers
  const handleStartInlineEdit = (s: Student) => {
    setInlineEditStudentId(s.id);
    setInlineEditForm({
      id: s.id,
      fullName: s.fullName,
      gender: s.gender,
      grade: s.grade,
      section: s.section,
      academicYear: s.academicYear,
      age: s.age,
    });
  };

  const handleSaveInlineEdit = () => {
    if (!inlineEditStudentId || !inlineEditForm) return;
    const oldId = inlineEditStudentId;
    const newId = inlineEditForm.id.trim() || oldId;

    setStudents(prev =>
      prev.map(s => {
        if (s.id === oldId) {
          return {
            ...s,
            id: newId,
            fullName: inlineEditForm.fullName.trim(),
            gender: inlineEditForm.gender,
            grade: inlineEditForm.grade,
            section: inlineEditForm.section,
            academicYear: inlineEditForm.academicYear,
            age: inlineEditForm.age,
          };
        }
        return s;
      })
    );

    if (newId !== oldId) {
      setGrades(prev =>
        prev.map(g => (g.studentId === oldId ? { ...g, studentId: newId } : g))
      );
    }

    setInlineEditStudentId(null);
    setInlineEditForm(null);
    setStudentActionSuccessMsg(`የተማሪው ስም እና የክፍል መረጃ (${inlineEditForm.fullName}) በተሳካ ሁኔታ ተሻሽሏል!`);
    setTimeout(() => setStudentActionSuccessMsg(''), 3500);
  };

  const handleCancelInlineEdit = () => {
    setInlineEditStudentId(null);
    setInlineEditForm(null);
  };

  // Bulk class / section reassign handler
  const handleApplyBulkClassChange = () => {
    const matchingStudents = students.filter(
      s =>
        (s.grade === bulkClassSource.grade || (bulkClassSource.grade === '8ኛ ክፍል' && s.grade.includes('8th'))) &&
        (s.section === bulkClassSource.section || (bulkClassSource.section === 'ሀ' && s.section === 'A')) &&
        s.academicYear === bulkClassSource.academicYear
    );

    if (matchingStudents.length === 0) {
      alert(`በተመረጠው ምንጭ (${bulkClassSource.grade} ሴክሽን ${bulkClassSource.section} - ${bulkClassSource.academicYear} ዓ/ም) ምንም ተማሪ አልተገኘም!`);
      return;
    }

    const confirmMsg = `${matchingStudents.length} ተማሪዎችን ከ [${bulkClassSource.grade} ሴክሽን ${bulkClassSource.section} - ${bulkClassSource.academicYear}] ወደ [${bulkClassTarget.grade} ሴክሽን ${bulkClassTarget.section} - ${bulkClassTarget.academicYear}] ማዘዋወር ወይም ስም ማስተካከል ይፈልጋሉ?`;
    if (!window.confirm(confirmMsg)) return;

    let updatedStudents = [...students];
    const idMap: Record<string, string> = {};

    matchingStudents.forEach((st, idx) => {
      let finalId = st.id;
      if (bulkClassTarget.updateId) {
        const prefix = getGradePrefix(bulkClassTarget.grade);
        finalId = `${prefix}-${101 + idx}`;
        idMap[st.id] = finalId;
      }
      updatedStudents = updatedStudents.map(s =>
        s.id === st.id
          ? {
              ...s,
              id: finalId,
              grade: bulkClassTarget.grade,
              section: bulkClassTarget.section,
              academicYear: bulkClassTarget.academicYear,
            }
          : s
      );
    });

    if (bulkClassTarget.updateId && Object.keys(idMap).length > 0) {
      setGrades(prev =>
        prev.map(g => (idMap[g.studentId] ? { ...g, studentId: idMap[g.studentId] } : g))
      );
    }

    setStudents(updatedStudents);
    setIsBulkClassModalOpen(false);
    setSelectedGradeFilter(bulkClassTarget.grade);
    setSelectedYearFilter(bulkClassTarget.academicYear);
    setSelectedSectionFilter(bulkClassTarget.section);
    setStudentActionSuccessMsg(`${matchingStudents.length} ተማሪዎች በተሳካ ሁኔታ ወደ ${bulkClassTarget.grade} ሴክሽን ${bulkClassTarget.section} (${bulkClassTarget.academicYear} ዓ/ም) ተዘዋውረዋል!`);
    setTimeout(() => setStudentActionSuccessMsg(''), 4500);
  };

  // Auto-normalize abnormal grades/sections
  const handleAutoNormalizeRoster = () => {
    let fixedCount = 0;
    const updated = students.map(s => {
      let changed = false;
      let newGrade = s.grade;
      let newSection = s.section;

      if (newGrade.toLowerCase().includes('8th') || newGrade === '8') { newGrade = '8ኛ ክፍል'; changed = true; }
      else if (newGrade.toLowerCase().includes('6th') || newGrade === '6') { newGrade = '6ኛ ክፍል'; changed = true; }
      else if (newGrade.toLowerCase().includes('7th') || newGrade === '7') { newGrade = '7ኛ ክፍል'; changed = true; }

      if (newSection.toUpperCase() === 'A') { newSection = 'ሀ'; changed = true; }
      else if (newSection.toUpperCase() === 'B') { newSection = 'ለ'; changed = true; }
      else if (newSection.toUpperCase() === 'C') { newSection = 'ሐ'; changed = true; }

      if (changed) {
        fixedCount++;
        return { ...s, grade: newGrade, section: newSection };
      }
      return s;
    });

    if (fixedCount > 0) {
      setStudents(updated);
      setStudentActionSuccessMsg(`${fixedCount} የተማሪዎች የክፍል እና ሴክሽን ስሞች ወደ መደበኛ አማርኛ ስያሜ ተስተካክለዋል!`);
    } else {
      setStudentActionSuccessMsg('ሁሉም የተማሪዎች የክፍልና ሴክሽን ስሞች ትክክለኛና መደበኛ ናቸው፤ የተበላሸ ስም አልተገኘም!');
    }
    setTimeout(() => setStudentActionSuccessMsg(''), 4000);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (window.confirm(`ተማሪ ${name} (${id}) በእርግጥ እንዲሰረዝ ይፈልጋሉ?`)) {
      setStudents(prev => prev.filter(s => s.id !== id));
      setGrades(prev => prev.filter(g => g.studentId !== id));
      setStudentActionSuccessMsg(`ተማሪ ${name} ተሰርዟል።`);
      setTimeout(() => setStudentActionSuccessMsg(''), 3000);
    }
  };

  // -------------------------------------------------------------
  // Teacher Actions
  // -------------------------------------------------------------
  const handleOpenAddTeacher = () => {
    setEditingTeacherId(null);
    setTeacherForm({
      name: '',
      roleTitle: 'መ/ርት',
      phone: '',
      pin: String(Math.floor(1000 + Math.random() * 9000)),
      isHomeroom: false,
      homeroomGrade: '1ኛ ክፍል',
      homeroomSection: 'ሀ',
      assignedGrade: '1ኛ ክፍል',
      assignedSection: 'ሀ',
      assignedSubject: 'እንግሊዝኛ',
    });
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (t: Teacher) => {
    setEditingTeacherId(t.id);
    const firstAss = t.assignments[0];
    setTeacherForm({
      name: t.name,
      roleTitle: t.roleTitle || 'መ/ርት',
      phone: t.phone,
      pin: t.pin,
      isHomeroom: t.isHomeroom,
      homeroomGrade: t.homeroomGrade || '1ኛ ክፍል',
      homeroomSection: t.homeroomSection || 'ሀ',
      assignedGrade: firstAss ? firstAss.grade : '1ኛ ክፍል',
      assignedSection: firstAss ? firstAss.section : 'ሀ',
      assignedSubject: firstAss ? firstAss.subjectName : 'እንግሊዝኛ',
    });
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacherId) {
      setTeachers(prev =>
        prev.map(t =>
          t.id === editingTeacherId
            ? {
                ...t,
                name: teacherForm.name,
                roleTitle: teacherForm.roleTitle,
                phone: teacherForm.phone,
                pin: teacherForm.pin,
                isHomeroom: teacherForm.isHomeroom,
                homeroomGrade: teacherForm.isHomeroom ? teacherForm.homeroomGrade : undefined,
                homeroomSection: teacherForm.isHomeroom ? teacherForm.homeroomSection : undefined,
              }
            : t
        )
      );
    } else {
      const newTeacher: Teacher = {
        id: `tch-${Date.now().toString().slice(-4)}`,
        name: teacherForm.name,
        roleTitle: teacherForm.roleTitle,
        phone: teacherForm.phone,
        pin: teacherForm.pin,
        isHomeroom: teacherForm.isHomeroom,
        homeroomGrade: teacherForm.isHomeroom ? teacherForm.homeroomGrade : undefined,
        homeroomSection: teacherForm.isHomeroom ? teacherForm.homeroomSection : undefined,
        assignments: [
          {
            grade: teacherForm.assignedGrade,
            section: teacherForm.assignedSection,
            subjectName: teacherForm.assignedSubject,
          },
        ],
      };
      setTeachers(prev => [...prev, newTeacher]);
    }
    setIsTeacherModalOpen(false);
  };

  const handleDeleteTeacher = (id: string, name: string) => {
    if (window.confirm(`መምህር ${name} ከመምህራን ዝርዝር ውስጥ ይሰረዝ?`)) {
      setTeachers(prev => prev.filter(t => t.id !== id));
    }
  };

  // Add an extra assignment to teacher
  const handleAddAssignment = (teacherId: string, grade: string, section: string, subjectName: string) => {
    setTeachers(prev =>
      prev.map(t => {
        if (t.id === teacherId) {
          const exists = t.assignments.some(
            a => a.grade === grade && a.section === section && a.subjectName === subjectName
          );
          if (exists) return t;
          return {
            ...t,
            assignments: [...t.assignments, { grade, section, subjectName }],
          };
        }
        return t;
      })
    );
  };

  const handleRemoveAssignment = (teacherId: string, index: number) => {
    setTeachers(prev =>
      prev.map(t => {
        if (t.id === teacherId) {
          const updated = [...t.assignments];
          updated.splice(index, 1);
          return { ...t, assignments: updated };
        }
        return t;
      })
    );
  };

  // -------------------------------------------------------------
  // Academic Years Management Handlers
  // -------------------------------------------------------------
  const handleAddAcademicYear = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newAcademicYearInput.trim();
    if (!trimmed) return;
    if (settings.availableAcademicYears.includes(trimmed)) {
      alert(`የትምህርት ዘመን ${trimmed} ዓ/ም ቀድሞውኑ በስርዓቱ ውስጥ ተመዝግቧል!`);
      return;
    }
    const updatedYears = [...settings.availableAcademicYears, trimmed];
    setSettings(prev => ({
      ...prev,
      availableAcademicYears: updatedYears,
    }));
    setNewAcademicYearInput('');
    setYearSuccessMsg(`አዲሱ የትምህርት ዘመን ${trimmed} ዓ/ም በተሳካ ሁኔታ ተጨምሯል!`);
    setTimeout(() => setYearSuccessMsg(''), 3500);
  };

  const handleSetActiveAcademicYear = (year: string) => {
    setSettings(prev => ({
      ...prev,
      currentAcademicYear: year,
    }));
    setSelectedYearFilter(year);
    setPromotionSourceYear(year);
    setYearSuccessMsg(`ንቁ የትምህርት ዘመን ወደ ${year} ዓ/ም ተቀይሯል!`);
    setTimeout(() => setYearSuccessMsg(''), 3000);
  };

  // -------------------------------------------------------------
  // Grade-Specific Promotion Policy Rule Handlers
  // -------------------------------------------------------------
  const handleSelectRuleGrade = (grade: string) => {
    setSelectedRuleGrade(grade);
    const existing = settings.gradePromotionRules?.[grade];
    if (existing) {
      setIsGradeCustomOverride(true);
      setGradeRuleForm({ ...existing });
    } else {
      setIsGradeCustomOverride(false);
      setGradeRuleForm({
        failThresholdSubjects: settings.failThresholdSubjects,
        passAverageThreshold: settings.passAverageThreshold,
        mandatoryFailingSubjects: [...(settings.mandatoryFailingSubjects || [])],
      });
    }
  };

  const handleToggleSchoolMandatorySubject = (subName: string) => {
    const list = settings.mandatoryFailingSubjects || [];
    const updated = list.includes(subName) ? list.filter(s => s !== subName) : [...list, subName];
    setSettings(prev => ({
      ...prev,
      mandatoryFailingSubjects: updated,
    }));
  };

  const handleToggleGradeMandatorySubject = (subName: string) => {
    const list = gradeRuleForm.mandatoryFailingSubjects || [];
    const updated = list.includes(subName) ? list.filter(s => s !== subName) : [...list, subName];
    setGradeRuleForm(prev => ({
      ...prev,
      mandatoryFailingSubjects: updated,
    }));
  };

  const handleSaveGradeRule = () => {
    const updatedRules = { ...(settings.gradePromotionRules || {}) };
    if (isGradeCustomOverride) {
      updatedRules[selectedRuleGrade] = { ...gradeRuleForm };
    } else {
      delete updatedRules[selectedRuleGrade];
    }
    setSettings(prev => ({
      ...prev,
      gradePromotionRules: updatedRules,
    }));
    setPolicySaveSuccessMsg(`ለ${selectedRuleGrade} የተዘጋጀው የማለፊያ መስፈርት በተሳካ ሁኔታ ተቀምጧል!`);
    setTimeout(() => setPolicySaveSuccessMsg(''), 3500);
  };

  const handleApplyPresetRule = (preset: 'kg' | 'primary' | 'middle8' | 'high12') => {
    if (preset === 'kg') {
      setIsGradeCustomOverride(true);
      setGradeRuleForm({
        failThresholdSubjects: 99,
        passAverageThreshold: 40,
        mandatoryFailingSubjects: [],
      });
    } else if (preset === 'primary') {
      setIsGradeCustomOverride(true);
      setGradeRuleForm({
        failThresholdSubjects: 2,
        passAverageThreshold: 50,
        mandatoryFailingSubjects: ['እንግሊዝኛ', 'ሒሳብ'],
      });
    } else if (preset === 'middle8') {
      setIsGradeCustomOverride(true);
      setGradeRuleForm({
        failThresholdSubjects: 2,
        passAverageThreshold: 50,
        mandatoryFailingSubjects: ['እንግሊዝኛ', 'ሒሳብ', 'አጠቃላይ ሳይንስ'],
      });
    } else if (preset === 'high12') {
      setIsGradeCustomOverride(true);
      setGradeRuleForm({
        failThresholdSubjects: 1,
        passAverageThreshold: 50,
        mandatoryFailingSubjects: ['እንግሊዝኛ', 'ሒሳብ'],
      });
    }
  };

  // -------------------------------------------------------------
  // Promotion Engine (ተማሪዎችን በውጤታቸውና በህጎቹ ማሻገር)
  // -------------------------------------------------------------
  const handleExecutePromotion = () => {
    const sourceCandidates = students.filter(s => s.academicYear === promotionSourceYear);
    if (sourceCandidates.length === 0) {
      alert(`በ${promotionSourceYear} ዓ/ም የተመዘገበ ተማሪ አልተገኘም!`);
      return;
    }

    const confirmMsg = `በ${promotionSourceYear} ዓ/ም ያሉ ${sourceCandidates.length} ተማሪዎችን በውጤታቸውና በየክፍላቸው ህግ መሰረት ወደ ${promotionTargetYear} ዓ/ም ማሻገር (እንዲሁም የወደቁትን በነበሩበት ክፍል ማስቀረት) ይከናወን?`;
    if (!window.confirm(confirmMsg)) return;

    let promoted = 0;
    let repeated = 0;
    const detailsList: Array<{
      studentName: string;
      fromGrade: string;
      toGrade: string;
      status: 'promoted' | 'repeated';
      failCount: number;
      reason: string;
    }> = [];

    const updatedStudentsList = [...students];

    sourceCandidates.forEach(std => {
      // Determine effective rule for student's grade
      const specificRule = settings.gradePromotionRules?.[std.grade];
      const effectiveFailThreshold = specificRule ? specificRule.failThresholdSubjects : settings.failThresholdSubjects;
      const effectivePassAvg = specificRule ? specificRule.passAverageThreshold : settings.passAverageThreshold;
      const effectiveMandatory = specificRule ? specificRule.mandatoryFailingSubjects : (settings.mandatoryFailingSubjects || []);

      // Check student's grades in the source academic year
      const stdGrades = grades.filter(g => g.studentId === std.id && g.academicYear === promotionSourceYear);
      let failCount = 0;
      let totalSum = 0;
      let subCount = 0;
      const failedMandatoryList: string[] = [];

      stdGrades.forEach(g => {
        subCount++;
        totalSum += g.marks.total;
        if (g.marks.total < 50) {
          failCount++;
          if (effectiveMandatory.includes(g.subjectName)) {
            failedMandatoryList.push(g.subjectName);
          }
        }
      });

      const avg = subCount > 0 ? Math.round((totalSum / subCount) * 10) / 10 : 50;
      const isSubjectThresholdFailed = failCount >= effectiveFailThreshold;
      const isAverageFailed = subCount > 0 && avg < effectivePassAvg;
      const isMandatoryFailed = failedMandatoryList.length > 0;
      const isFailed = isSubjectThresholdFailed || isAverageFailed || isMandatoryFailed;

      let reason = 'አልፏል (የማለፊያ መስፈርቶችን አሟልቷል)';
      if (isSubjectThresholdFailed && isMandatoryFailed) {
        reason = `በ${failCount} ትምህርቶች እና በወሳኝ ትምህርት (${failedMandatoryList.join(', ')}) < 50`;
      } else if (isMandatoryFailed) {
        reason = `በወሳኝ ትምህርት (${failedMandatoryList.join(', ')}) < 50 ስላመጣ`;
      } else if (isSubjectThresholdFailed) {
        reason = `በ${failCount} ትምህርቶች < 50 (የክፍሉ ጣሪያ ${effectiveFailThreshold})`;
      } else if (isAverageFailed) {
        reason = `አማካይ ውጤት (${avg}%) ከ${effectivePassAvg}% በታች`;
      }

      if (isFailed) {
        repeated++;
        // Repeat in same grade in target academic year
        const newId = generateNextStudentId(std.grade, updatedStudentsList);
        const repeatedStudent: Student = {
          ...std,
          id: newId,
          academicYear: promotionTargetYear,
          promotionStatus: 'repeated',
          previousGrade: `${std.grade} (ደገመ)`,
        };
        updatedStudentsList.push(repeatedStudent);
        detailsList.push({
          studentName: std.fullName,
          fromGrade: std.grade,
          toGrade: `${std.grade} (እዛው ቀረ/ደገመ)`,
          status: 'repeated',
          failCount,
          reason,
        });
      } else {
        promoted++;
        const nextGrade = getNextGradeLevel(std.grade);
        const newId = generateNextStudentId(nextGrade, updatedStudentsList);
        const promotedStudent: Student = {
          ...std,
          id: newId,
          grade: nextGrade,
          academicYear: promotionTargetYear,
          promotionStatus: 'promoted',
          previousGrade: std.grade,
        };
        updatedStudentsList.push(promotedStudent);
        detailsList.push({
          studentName: std.fullName,
          fromGrade: std.grade,
          toGrade: nextGrade,
          status: 'promoted',
          failCount,
          reason,
        });
      }
    });

    setStudents(updatedStudentsList);
    setPromotionReport({
      promotedCount: promoted,
      repeatedCount: repeated,
      details: detailsList,
    });
  };

  // -------------------------------------------------------------
  // Password / Security Actions
  // -------------------------------------------------------------
  const handleSavePasswords = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(prev => ({
      ...prev,
      passwords: { ...passwordsForm },
    }));
    setPasswordSaveSuccess(true);
    setTimeout(() => setPasswordSaveSuccess(false), 3000);
  };

  // Filtered students for display
  const filteredStudents = students.filter(s => {
    const matchGrade =
      !selectedGradeFilter ||
      selectedGradeFilter === 'all' ||
      s.grade === selectedGradeFilter ||
      (selectedGradeFilter === '8ኛ ክፍል' && (s.grade.toLowerCase().includes('8th') || s.grade === '8')) ||
      (selectedGradeFilter === '6ኛ ክፍል' && (s.grade.toLowerCase().includes('6th') || s.grade === '6'));

    const matchYear =
      !selectedYearFilter ||
      selectedYearFilter === 'all' ||
      s.academicYear === selectedYearFilter;

    const matchSection =
      !selectedSectionFilter ||
      selectedSectionFilter === 'all' ||
      s.section === selectedSectionFilter ||
      (selectedSectionFilter === 'ሀ' && s.section.toUpperCase() === 'A') ||
      (selectedSectionFilter === 'ለ' && s.section.toUpperCase() === 'B');

    const matchSearch =
      !searchStudentTerm ||
      s.fullName.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
      s.grade.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
      s.section.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
      s.parentPhone.includes(searchStudentTerm);

    return matchGrade && matchYear && matchSection && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Tab 1: Student Promotion Engine & Policy Rules (ማሻገርያና የማለፊያ ህጎች) */}
      {activeTab === 'promotion' && (
        <div className="space-y-6">
          {/* Section 1: Academic Years Manager (የትምህርት ዘመናት አስተዳደር) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-700" />
                  <span>የትምህርት ዘመናት አስተዳደር (Academic Years Manager)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  አሁን ያለንበት ይፋዊ የትምህርት ዘመን <strong>{settings.currentAcademicYear} ዓ/ም</strong> ሲሆን፣ አዳዲስ ቀጣይ አመታትን መጨመርና ንቁ ዘመን መቀየር ይችላሉ።
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-600 font-medium">የአሁኑ ዘመን፡</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs border border-emerald-300 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{settings.currentAcademicYear} ዓ/ም</span>
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Add New Academic Year Form */}
              <form onSubmit={handleAddAcademicYear} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  + አዲስ ቀጣይ የትምህርት ዘመን ጨምር (Add Next Academic Year)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="ለምሳሌ፡ 2021"
                    value={newAcademicYearInput}
                    onChange={e => setNewAcademicYearInput(e.target.value)}
                    className="flex-1 text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-600 font-semibold">ዓ/ም</span>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>አክል</span>
                  </button>
                </div>
                {yearSuccessMsg && (
                  <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{yearSuccessMsg}</span>
                  </div>
                )}
              </form>

              {/* Available Academic Years List */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <label className="block text-xs font-bold text-slate-800">
                  የተመዘገቡ የትምህርት ዘመናት (Available Years)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {settings.availableAcademicYears.map(year => {
                    const isActive = year === settings.currentAcademicYear;
                    return (
                      <div
                        key={year}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{year} ዓ/ም</span>
                        {isActive ? (
                          <span className="text-[10px] bg-emerald-700/60 px-1.5 py-0.5 rounded-sm">ንቁ</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetActiveAcademicYear(year)}
                            className="text-[10px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded-sm font-bold cursor-pointer"
                          >
                            ንቁ አድርግ
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Promotion & Failing Rules Policy (የማለፊያ እና የመውደቂያ መስፈርቶች ፖሊሲ) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-700" />
                <span>የማለፊያና የመውደቂያ መስፈርቶች ፖሊሲ (Promotion & Passing Policy)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ከ50 በታች ያመጡ ተማሪዎች በስንት ትምህርት እንደሚወድቁ፣ ለመውደቅ የሚዳርጉ ወሳኝ የትምህርት ዓይነቶች እና ከማቆያ እስከ 12ኛ ክፍል ያሉ የየክፍሉን የተለዩ ህጎች እዚህ ይወስኑ።
              </p>
            </div>

            {/* Part A: Default School-Wide Rule */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-slate-600" />
                  <span>1. ነባሪ አጠቃላይ ህግ (Default School-Wide Rule)</span>
                </h3>
                <span className="text-[11px] text-slate-500">የተለየ ህግ ላልተወሰነላቸው ክፍሎች በሙሉ የሚሰራ</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    የውድቀት መስፈርት፡ ከ50 በታች ባመጡ በስንት ትምህርት ዓይነት ይውደቁ?
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    ተማሪው ከዚህ ቁጥር እኩል ወይም ከዚያ በላይ ካመጣ ደጋሚ ይሆናል።
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.failThresholdSubjects}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          failThresholdSubjects: parseInt(e.target.value) || 2,
                        }))
                      }
                      className="w-20 text-sm font-semibold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono"
                    />
                    <span className="text-xs text-slate-700 font-medium">ትምህርቶችና ከዚያ በላይ</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    አነስተኛ የማለፊያ አማካይ ውጤት (Pass Average Threshold)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    ተማሪው ከዚህ አማካይ በመቶኛ በታች ካመጣ ደጋሚ ይሆናል።
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="30"
                      max="75"
                      value={settings.passAverageThreshold}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          passAverageThreshold: parseInt(e.target.value) || 50,
                        }))
                      }
                      className="w-20 text-sm font-semibold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono"
                    />
                    <span className="text-xs text-slate-700 font-medium">% አማካይ</span>
                  </div>
                </div>
              </div>

              {/* Mandatory failing subjects selection for default rule */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    ለመውደቅ የሚዳርጉ ወሳኝ የትምህርት ዓይነቶች ምርጫ (Mandatory Failing Subjects)
                  </label>
                  <span className="text-[11px] text-amber-700 font-semibold">
                    * በእነዚህ ትምህርቶች &lt; 50 ያመጣ ተማሪ ደጋሚ ይሆናል
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  ተማሪው በሌሎች ትምህርቶች ቢያልፍም እንኳ እዚህ በተመረጡት ትምህርቶች ከ50 በታች ካመጣ በቀጥታ የሚወድቅባቸውን ይምረጡ፡
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {subjects.map(sub => {
                    const isMandatory = (settings.mandatoryFailingSubjects || []).includes(sub.name);
                    return (
                      <button
                        type="button"
                        key={sub.id}
                        onClick={() => handleToggleSchoolMandatorySubject(sub.name)}
                        className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isMandatory
                            ? 'bg-rose-50 border-rose-400 text-rose-800 font-bold shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-[10px] ${
                          isMandatory ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-400 bg-white'
                        }`}>
                          {isMandatory && '✓'}
                        </span>
                        <span>{sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Part B: Grade-Specific Policy Overrides (ከማቆያ እስከ 12ኛ ክፍል) */}
            <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-700" />
                    <span>2. በክፍል ደረጃ የተለየ ህግ መወሰኛ (Grade-Specific Overrides) — ከማቆያ እስከ 12ኛ ክፍል</span>
                  </h3>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    የማቆያ/ኬጂ፣ የመጀመሪያ ደረጃ እና የመካከለኛ/ሁለተኛ ደረጃ ህግ የተለያየ ስለሚሆን ለእያንዳንዱ ክፍል ራሱን የቻለ ህግ ማበጀት ይችላሉ።
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">የሚስተካከለው ክፍል፡</span>
                  <select
                    value={selectedRuleGrade}
                    onChange={e => handleSelectRuleGrade(e.target.value)}
                    className="text-xs font-bold py-1.5 px-3 border border-indigo-300 rounded-lg bg-white text-indigo-900 shadow-2xs"
                  >
                    {ALL_GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Presets Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] font-bold text-slate-600">ፈጣን አብነቶች (Presets):</span>
                <button
                  type="button"
                  onClick={() => handleApplyPresetRule('kg')}
                  className="px-2.5 py-1 bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-700 rounded-md text-[11px] font-medium"
                >
                  🍼 የማቆያ/ኬጂ (ሁሉም ያልፋሉ)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetRule('primary')}
                  className="px-2.5 py-1 bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-700 rounded-md text-[11px] font-medium"
                >
                  📘 1-4ኛ ክፍል (2 ት/ት + ሒሳብ/እንግሊዝኛ)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetRule('middle8')}
                  className="px-2.5 py-1 bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-700 rounded-md text-[11px] font-medium"
                >
                  🎓 8ኛ ክፍል ሚኒስትሪ (ሳይንስ/ሒሳብ/እንግሊዝኛ)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetRule('high12')}
                  className="px-2.5 py-1 bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-700 rounded-md text-[11px] font-medium"
                >
                  🏛️ 12ኛ ክፍል (1 ት/ት ውድቀት)
                </button>
              </div>

              {/* Grade-Specific Custom Toggle & Form */}
              <div className="bg-white p-4 rounded-xl border border-indigo-200 space-y-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isGradeCustomOverride}
                    onChange={e => setIsGradeCustomOverride(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-900">
                    ለ<strong className="text-indigo-700 font-extrabold">{selectedRuleGrade}</strong> የተለየ የማለፊያ ህግ ተግብር (Override Default Policy for this Grade)
                  </span>
                </label>

                {isGradeCustomOverride && (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          ለ{selectedRuleGrade}፦ ከ50 በታች በስንት ትምህርት ይውደቁ?
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={gradeRuleForm.failThresholdSubjects}
                            onChange={e =>
                              setGradeRuleForm(prev => ({
                                ...prev,
                                failThresholdSubjects: parseInt(e.target.value) || 2,
                              }))
                            }
                            className="w-20 text-sm font-semibold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono"
                          />
                          <span className="text-xs text-slate-700 font-medium">
                            ትምህርቶች (ማስታወሻ፦ ለማቆያ/ኬጂ 99 ሲደረግ ማንም አይወድቅም)
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          ለ{selectedRuleGrade}፦ አነስተኛ የማለፊያ አማካይ ውጤት
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="20"
                            max="75"
                            value={gradeRuleForm.passAverageThreshold}
                            onChange={e =>
                              setGradeRuleForm(prev => ({
                                ...prev,
                                passAverageThreshold: parseInt(e.target.value) || 50,
                              }))
                            }
                            className="w-20 text-sm font-semibold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-mono"
                          />
                          <span className="text-xs text-slate-700 font-medium">% አማካይ</span>
                        </div>
                      </div>
                    </div>

                    {/* Grade-specific mandatory subjects */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-800">
                        ለ{selectedRuleGrade}፦ ለመውደቅ የሚዳርጉ ወሳኝ የትምህርት ዓይነቶች ምርጫ
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {subjects
                          .filter(s => s.applicableGrades.includes(selectedRuleGrade) || s.applicableGrades.length === 0)
                          .map(sub => {
                            const isMandatory = (gradeRuleForm.mandatoryFailingSubjects || []).includes(sub.name);
                            return (
                              <button
                                type="button"
                                key={sub.id}
                                onClick={() => handleToggleGradeMandatorySubject(sub.name)}
                                className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isMandatory
                                    ? 'bg-rose-50 border-rose-400 text-rose-800 font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-[10px] ${
                                  isMandatory ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-400 bg-white'
                                }`}>
                                  {isMandatory && '✓'}
                                </span>
                                <span>{sub.name}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs font-semibold text-emerald-800">
                    {policySaveSuccessMsg}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveGradeRule}
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>ለ{selectedRuleGrade} ህጉን መዝግብና አስቀምጥ</span>
                  </button>
                </div>
              </div>

              {/* Overview summary of active grade overrides */}
              <div className="bg-white p-3.5 rounded-xl border border-indigo-200 text-xs">
                <span className="font-bold text-slate-800 block mb-1.5">
                  የተቀመጡ የየክፍሎች የተለዩ ህጎች ማጠቃለያ (Active Grade Overrides):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(settings.gradePromotionRules || {}).map(([gName, rule]) => (
                    <div key={gName} className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5">
                      <div className="font-bold text-indigo-900">{gName}</div>
                      <div className="text-[11px] text-slate-600">
                        ጣሪያ፡ <strong>{rule.failThresholdSubjects}</strong> ት/ት · አማካይ፡ <strong>{rule.passAverageThreshold}%</strong>
                      </div>
                      <div className="text-[11px] text-rose-700 font-medium truncate">
                        ወሳኝ፡ {rule.mandatoryFailingSubjects?.length ? rule.mandatoryFailingSubjects.join(', ') : 'የለም'}
                      </div>
                    </div>
                  ))}
                  {Object.keys(settings.gradePromotionRules || {}).length === 0 && (
                    <div className="text-slate-500 italic py-1">
                      ምንም አይነት የተለየ ህግ አልተመዘገበም (ሁሉም ክፍሎች በነባሪው ህግ ይተዳደራሉ)።
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Promotion Execution Engine (የተማሪዎች ወደ አዲሱ የትምህርት ዘመን ማሻገርያ) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-700" />
                  <span>የተማሪዎች ወደ አዲሱ የትምህርት ዘመን ማሻገርያ (Student Promotion Engine)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  በምንጩ የትምህርት ዘመን የተማሩ ተማሪዎችን ውጤት ከላይ በተቀመጡት የየክፍሉ ህጎች መሰረት ገምግሞ ያለፉትን ወደ ሚቀጥለው ክፍል ማሻገር እንዲሁም የወደቁትን በነበሩበት ክፍል ማስቀረት።
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-300">
                  <span className="text-xs text-slate-600 font-medium">ከ፡</span>
                  <select
                    value={promotionSourceYear}
                    onChange={e => setPromotionSourceYear(e.target.value)}
                    className="text-xs font-bold py-1 px-2 bg-white border border-slate-300 rounded-md"
                  >
                    {settings.availableAcademicYears.map(y => (
                      <option key={y} value={y}>{y} ዓ/ም</option>
                    ))}
                  </select>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-600 font-medium">ወደ፡</span>
                  <select
                    value={promotionTargetYear}
                    onChange={e => setPromotionTargetYear(e.target.value)}
                    className="text-xs font-bold py-1 px-2 bg-white border border-slate-300 rounded-md"
                  >
                    {settings.availableAcademicYears.map(y => (
                      <option key={y} value={y}>{y} ዓ/ም</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleExecutePromotion}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>ወደ {promotionTargetYear} ዓ/ም ማሻገርን ተግባራዊ አድርግ</span>
                </button>
              </div>
            </div>

            {/* Promotion Report */}
            {promotionReport && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>የማሻገር ሥራው በተሳካ ሁኔታ ተጠናቋል!</span>
                  </h3>
                  <div className="text-xs text-emerald-800 font-medium flex items-center gap-4">
                    <span>ያለፉ (ያደጉ)፡ <strong>{promotionReport.promotedCount}</strong></span>
                    <span>የወደቁ (እዛው የቀሩ)፡ <strong>{promotionReport.repeatedCount}</strong></span>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto border border-emerald-200 rounded-lg bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-emerald-100/60 text-emerald-950 font-semibold border-b border-emerald-200 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">የተማሪ ስም</th>
                        <th className="py-2.5 px-3">የነበረበት ክፍል</th>
                        <th className="py-2.5 px-3">የወደቀበት ት/ት ብዛት</th>
                        <th className="py-2.5 px-3">ውሳኔ</th>
                        <th className="py-2.5 px-3">አዲሱ ክፍል</th>
                        <th className="py-2.5 px-3">ምክንያት / ማብራሪያ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {promotionReport.details.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-800">{d.studentName}</td>
                          <td className="py-2 px-3 text-slate-600">{d.fromGrade}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono font-semibold">{d.failCount}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${
                                d.status === 'promoted'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {d.status === 'promoted' ? 'አልፏል (ተሸጋግሯል)' : 'ወድቋል (ይደግማል)'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">{d.toGrade}</td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">{d.reason}</td>
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

      {/* Tab 2: Student Registration (ተማሪዎች ምዝገባ) */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            {/* School Header Required for each Grade level */}
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
                <div className="text-xs text-indigo-700 font-semibold mt-0.5 flex flex-wrap items-center justify-center gap-2">
                  <span>የተማሪዎች ምዝገባ እና የስም/ክፍል ማስተዳደሪያ ሰንጠረዥ</span>
                  <span className="text-slate-300">•</span>
                  <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md font-mono text-[11px]">
                    {selectedGradeFilter === 'all' ? 'ሁሉም ክፍሎች' : selectedGradeFilter}
                  </span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                    ሴክሽን: {selectedSectionFilter === 'all' ? 'ሁሉም' : selectedSectionFilter}
                  </span>
                  <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-mono text-[11px]">
                    {selectedYearFilter === 'all' ? 'ሁሉም ዓመታት' : `${selectedYearFilter} ዓ/ም`}
                  </span>
                  <span className="text-slate-500 font-normal text-[11px]">
                    (የተገኙ ተማሪዎች፡ {filteredStudents.length} / {students.length})
                  </span>
                </div>
              </div>
            </div>

            {studentActionSuccessMsg && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{studentActionSuccessMsg}</span>
              </div>
            )}

            {/* Filter controls */}
            <div className="mt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">የክፍል ደረጃ</label>
                  <select
                    value={selectedGradeFilter}
                    onChange={e => setSelectedGradeFilter(e.target.value)}
                    className="text-xs py-1.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    <option value="all">🌟 ሁሉም ክፍሎች ({students.length})</option>
                    {ALL_GRADES.map(g => (
                      <option key={g} value={g}>
                        {g} ({students.filter(s => s.grade === g).length})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">ሴክሽን</label>
                  <select
                    value={selectedSectionFilter}
                    onChange={e => setSelectedSectionFilter(e.target.value)}
                    className="text-xs py-1.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    <option value="all">ሁሉም ሴክሽኖች</option>
                    <option value="ሀ">ሴክሽን ሀ (A)</option>
                    <option value="ለ">ሴክሽን ለ (B)</option>
                    <option value="ሐ">ሴክሽን ሐ (C)</option>
                    <option value="መ">ሴክሽን መ (D)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">የትምህርት ዘመን</label>
                  <select
                    value={selectedYearFilter}
                    onChange={e => setSelectedYearFilter(e.target.value)}
                    className="text-xs py-1.5 px-3 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    <option value="all">🗓️ ሁሉም ዓመታት</option>
                    {settings.availableAcademicYears.map(yr => (
                      <option key={yr} value={yr}>{yr} ዓ/ም</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <label className="text-[11px] text-slate-500 block mb-0.5 font-medium">ፍለጋ (ስም/ኮድ/ስልክ)</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ስም፣ መለያ ኮድ፣ ክፍል..."
                      value={searchStudentTerm}
                      onChange={e => setSearchStudentTerm(e.target.value)}
                      className="text-xs py-1.5 pl-8 pr-7 bg-white border border-slate-300 rounded-lg w-48 focus:ring-1 focus:ring-indigo-500"
                    />
                    {searchStudentTerm && (
                      <button
                        onClick={() => setSearchStudentTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                <button
                  type="button"
                  onClick={() => setIsBulkClassModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap"
                  title="የተማሪዎችን ክፍል ወይም ሴክሽን በጅምላ ለመቀየር እና ስህተት ለማረም"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ክፍል በጅምላ አስተካክል</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoNormalizeRoster}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                  title="የተበላሹ ወይም በእንግሊዝኛ የተጻፉ የክፍልና ሴክሽን ስሞችን ወደ መደበኛ አማርኛ ስያሜ በራስ-ሰር ያስተካክላል"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ስም/ክፍል አጣራ</span>
                </button>

                <input
                  type="file"
                  id="student-excel-input"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleStudentFileSelect}
                />
                <button
                  onClick={() => document.getElementById('student-excel-input')?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap"
                  title="የተማሪዎችን መረጃ ከኤክሴል ሰነድ ጫን"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>ኤክሴል ጫን</span>
                </button>

                <button
                  onClick={downloadStudentTemplate}
                  className="flex items-center gap-1.5 px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors whitespace-nowrap"
                  title="የኤክሴል ምሳሌ ቅጽ አውርድ"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>ቅጽ</span>
                </button>

                <button
                  onClick={() => exportStudentsToExcel(students, `የተማሪዎች_ዝርዝር_${selectedGradeFilter}.xlsx`)}
                  className="flex items-center gap-1.5 px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors whitespace-nowrap"
                  title="የተመዘገቡ ተማሪዎችን በኤክሴል አውርድ"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ኤክሴል አውርድ</span>
                </button>

                <button
                  onClick={handleOpenAddStudent}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap"
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

            {/* Students Table with Fast Inline Edit */}
            <div className="mt-5 overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/90 text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">ተ.ቁ</th>
                    <th className="py-2.5 px-3">መለያ ኮድ (ID)</th>
                    <th className="py-2.5 px-3">የተማሪ ሙሉ ስም</th>
                    <th className="py-2.5 px-3 text-center">ጾታ</th>
                    <th className="py-2.5 px-3 text-center">ዕድሜ</th>
                    <th className="py-2.5 px-3">ክፍል / ሴክሽን</th>
                    <th className="py-2.5 px-3 text-center">የትምህርት ዘመን</th>
                    <th className="py-2.5 px-3">የወላጅ ስልክ</th>
                    <th className="py-2.5 px-3">አድራሻ</th>
                    <th className="py-2.5 px-3 text-center w-32">ተግባር (ማረሚያ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-500">
                        <div className="max-w-md mx-auto space-y-2">
                          <p className="font-semibold text-slate-700">በዚህ ማጣሪያ የተገኘ ተማሪ የለም።</p>
                          <p className="text-[11px] text-slate-400">
                            የክፍል ደረጃውን ወደ "ሁሉም ክፍሎች" ወይም የትምህርት ዘመኑን ወደ "ሁሉም ዓመታት" በመቀየር የተማሪዎችን ዝርዝር መመልከት ይችላሉ።
                          </p>
                          <button
                            onClick={() => {
                              setSelectedGradeFilter('all');
                              setSelectedYearFilter('all');
                              setSelectedSectionFilter('all');
                              setSearchStudentTerm('');
                            }}
                            className="mt-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold hover:bg-indigo-100"
                          >
                            🔄 ሁሉንም ማጣሪያዎች አጽዳ (Show All)
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => {
                      const isInlineEditing = inlineEditStudentId === s.id;

                      if (isInlineEditing && inlineEditForm) {
                        return (
                          <tr key={s.id} className="bg-amber-50/70 border-2 border-amber-300">
                            <td className="py-2 px-2 text-center font-bold text-amber-900">{idx + 1}</td>
                            
                            {/* Editable ID */}
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={inlineEditForm.id}
                                  onChange={e => setInlineEditForm({ ...inlineEditForm, id: e.target.value })}
                                  className="w-28 text-xs font-mono font-bold py-1 px-1.5 bg-white border border-amber-300 rounded text-indigo-800"
                                  title="መለያ ኮድ"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newId = generateNextStudentId(inlineEditForm.grade, students);
                                    setInlineEditForm({ ...inlineEditForm, id: newId });
                                  }}
                                  className="p-1 bg-amber-200 hover:bg-amber-300 rounded text-[10px]"
                                  title="ለተመረጠው ክፍል መደበኛ ኮድ ፍጠር"
                                >
                                  ⚡
                                </button>
                              </div>
                            </td>

                            {/* Editable Full Name */}
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={inlineEditForm.fullName}
                                onChange={e => setInlineEditForm({ ...inlineEditForm, fullName: e.target.value })}
                                className="w-full text-xs font-bold py-1 px-2 bg-white border border-amber-300 rounded text-slate-900 focus:ring-1 focus:ring-amber-500"
                                placeholder="የተማሪ ስም"
                              />
                            </td>

                            {/* Editable Gender */}
                            <td className="py-2 px-1 text-center">
                              <select
                                value={inlineEditForm.gender}
                                onChange={e => setInlineEditForm({ ...inlineEditForm, gender: e.target.value as Gender })}
                                className="text-xs py-1 px-1 bg-white border border-amber-300 rounded font-medium"
                              >
                                <option value="ወንድ">ወንድ</option>
                                <option value="ሴት">ሴት</option>
                              </select>
                            </td>

                            {/* Editable Age */}
                            <td className="py-2 px-1 text-center">
                              <input
                                type="number"
                                min="3"
                                max="22"
                                value={inlineEditForm.age}
                                onChange={e => setInlineEditForm({ ...inlineEditForm, age: parseInt(e.target.value) || 7 })}
                                className="w-12 text-xs py-1 px-1 bg-white border border-amber-300 rounded text-center font-mono"
                              />
                            </td>

                            {/* Editable Grade & Section */}
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-1">
                                <select
                                  value={inlineEditForm.grade}
                                  onChange={e => {
                                    const nextGrade = e.target.value;
                                    const nextId = generateNextStudentId(nextGrade, students);
                                    setInlineEditForm({ ...inlineEditForm, grade: nextGrade, id: nextId });
                                  }}
                                  className="text-xs py-1 px-1.5 bg-white border border-amber-300 rounded font-medium"
                                >
                                  {ALL_GRADES.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                  ))}
                                </select>
                                <select
                                  value={inlineEditForm.section}
                                  onChange={e => setInlineEditForm({ ...inlineEditForm, section: e.target.value })}
                                  className="text-xs py-1 px-1.5 bg-white border border-amber-300 rounded font-bold"
                                >
                                  {STANDARD_SECTIONS.map(sec => (
                                    <option key={sec} value={sec}>{sec}</option>
                                  ))}
                                </select>
                              </div>
                            </td>

                            {/* Editable Academic Year */}
                            <td className="py-2 px-1 text-center">
                              <select
                                value={inlineEditForm.academicYear}
                                onChange={e => setInlineEditForm({ ...inlineEditForm, academicYear: e.target.value })}
                                className="text-xs py-1 px-1 bg-white border border-amber-300 rounded font-medium"
                              >
                                {settings.availableAcademicYears.map(yr => (
                                  <option key={yr} value={yr}>{yr}</option>
                                ))}
                              </select>
                            </td>

                            {/* Phone */}
                            <td className="py-2 px-2 text-slate-600 font-mono text-[11px]">{s.parentPhone || '—'}</td>

                            {/* Address */}
                            <td className="py-2 px-2 text-slate-500 text-[11px] truncate max-w-[120px]">{s.address || 'ብርብር'}</td>

                            {/* Inline Actions */}
                            <td className="py-2 px-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={handleSaveInlineEdit}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs shadow-2xs"
                                  title="ማስተካከያውን አስቀምጥ"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>አስቀምጥ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelInlineEdit}
                                  className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs"
                                  title="ይቅር"
                                >
                                  &times;
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-slate-500 text-center">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                            {s.id}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{s.fullName}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium ${
                              s.gender === 'ሴት' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {s.gender}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-center text-slate-700">{s.age}</td>
                          <td className="py-2.5 px-3 text-slate-800 font-medium whitespace-nowrap">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                              {s.grade} - {s.section}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-700">{s.academicYear} ዓ/ም</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{s.parentPhone || '—'}</td>
                          <td className="py-2.5 px-3 text-slate-600 truncate max-w-[120px]">{s.address || 'ብርብር'}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartInlineEdit(s)}
                                title="ፈጣን ማረሚያ (Quick In-Place Edit): ስም ወይም ክፍል በቀጥታ እዚህ ይቀይሩ"
                                className="flex items-center gap-1 px-2 py-1 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md text-[11px] font-semibold transition-colors"
                              >
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                <span>ፈጣን ማረሚያ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditStudent(s)}
                                title="ሙሉ መረጃ አሻሽል"
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudent(s.id, s.fullName)}
                                title="ተማሪውን ሰርዝ"
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

      {/* Tab 3: Teachers Management (መምህራን አስተዳደር) */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
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
                    <Users className="w-4 h-4 text-indigo-700" />
                    <span>የመምህራን አስተዳደር፣ የትምህርት ምደባ እና የመግቢያ ቁልፍ (PIN)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    መምህራንን መመዝገብ፣ ኤዲት ማድረግ፣ መደለት፣ ትምህርት መመደብ እና መቆለፊያ ቁልፍ ማስተዳደር።
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  id="teacher-excel-input"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleTeacherFileSelect}
                />
                <button
                  onClick={() => document.getElementById('teacher-excel-input')?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
                  title="የመምህራንን ዝርዝር ከኤክሴል ሰነድ ጫን"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>ኤክሴል ጫን (Upload Excel)</span>
                </button>

                <button
                  onClick={downloadTeacherTemplate}
                  className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors whitespace-nowrap shrink-0"
                  title="የመምህራን ምሳሌ ቅጽ አውርድ"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>የቅጽ ማውረጃ</span>
                </button>

                <button
                  onClick={() => exportTeachersToExcel(teachers)}
                  className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition-colors whitespace-nowrap shrink-0"
                  title="መምህራንን በኤክሴል አውርድ"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ኤክሴል አውርድ</span>
                </button>

                <button
                  onClick={handleOpenAddTeacher}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>አዲስ መምህር መዝግብ</span>
                </button>
              </div>
            </div>

            {teacherImportSuccessMsg && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{teacherImportSuccessMsg}</span>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTeacherRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    teacherRoleFilter === 'all'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ሁሉም ({teachers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherRoleFilter('leadership')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    teacherRoleFilter === 'leadership'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  👑 አመራር ({teachers.filter(t => (t.roleTitle || '').includes('ር/መ/ር') || (t.roleTitle || '').includes('ር/መ/ርት') || (t.roleTitle || '').includes('ም/መ/ር')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherRoleFilter('teachers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    teacherRoleFilter === 'teachers'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  📚 መምህራን ({teachers.filter(t => ((t.roleTitle || '').includes('መ/ር') || (t.roleTitle || '').includes('መ/ርት')) && !(t.roleTitle || '').includes('ር/')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherRoleFilter('support')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    teacherRoleFilter === 'support'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🛠️ ድጋፍ ሰጪ ({teachers.filter(t => (t.roleTitle || '').includes('ሞግዚት') || (t.roleTitle || '').includes('ሂ') || (t.roleTitle || '').includes('ፅዳት')).length})
                </button>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ስም፣ ስልክ፣ PIN ወይም ኃላፊነት ይፈልጉ..."
                  value={teacherSearch}
                  onChange={e => setTeacherSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                {teacherSearch && (
                  <button
                    onClick={() => setTeacherSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* Teachers list */}
            {(() => {
              const filteredList = teachers.filter(t => {
                if (teacherSearch.trim()) {
                  const q = teacherSearch.toLowerCase();
                  const matchName = t.name.toLowerCase().includes(q);
                  const matchPhone = t.phone.includes(q);
                  const matchPin = t.pin.includes(q);
                  const matchRole = (t.roleTitle || '').toLowerCase().includes(q);
                  if (!matchName && !matchPhone && !matchPin && !matchRole) return false;
                }
                if (teacherRoleFilter === 'leadership') {
                  const r = t.roleTitle || '';
                  return r.includes('ር/መ/ር') || r.includes('ር/መ/ርት') || r.includes('ም/መ/ር');
                }
                if (teacherRoleFilter === 'teachers') {
                  const r = t.roleTitle || '';
                  return (r.includes('መ/ር') || r.includes('መ/ርት')) && !r.includes('ር/');
                }
                if (teacherRoleFilter === 'support') {
                  const r = t.roleTitle || '';
                  return r.includes('ሞግዚት') || r.includes('ሂ') || r.includes('ፅዳት');
                }
                return true;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="mt-6 p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                    <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">ምንም የተገኘ መምህር ወይም ሠራተኛ የለም</p>
                    <p className="text-xs text-slate-500 mt-1">የፍለጋ ቃሉን ወይም የተመረጠውን ማጣሪያ ይቀይሩ።</p>
                  </div>
                );
              }

              return (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredList.map(teacher => {
                    const isLeadership = (teacher.roleTitle || '').includes('ር/መ/ር') || (teacher.roleTitle || '').includes('ር/መ/ርት') || (teacher.roleTitle || '').includes('ም/መ/ር');
                    const isSupport = (teacher.roleTitle || '').includes('ሞግዚት') || (teacher.roleTitle || '').includes('ሂ') || (teacher.roleTitle || '').includes('ፅዳት');

                    return (
                      <div
                        key={teacher.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded">
                                #{teachers.indexOf(teacher) + 1}
                              </span>
                              <h3 className="text-sm font-bold text-slate-900">{teacher.name}</h3>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isLeadership
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : isSupport
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                }`}
                              >
                                {isLeadership ? '👑 ' : isSupport ? '🛠️ ' : '📚 '}
                                {teacher.roleTitle || 'መምህር'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                              <span>ስልክ፡ {teacher.phone}</span>
                              <span>·</span>
                              <span className="font-mono text-indigo-700 font-medium">PIN: {teacher.pin}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleOpenEditTeacher(teacher)}
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md"
                              title="አድስ / አስተካክል"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-white rounded-md"
                              title="ሰርዝ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Homeroom Status */}
                        <div className="text-xs">
                          {teacher.isHomeroom ? (
                            <span className="inline-flex items-center gap-1 text-indigo-800 font-semibold bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                              ★ የክፍል ስም ጠሪ (Homeroom): {teacher.homeroomGrade} ሴክሽን {teacher.homeroomSection}
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              {isSupport ? 'የድጋፍ ሰጪ ሠራተኛ' : 'ተራ መምህር (ስም ጠሪ አይደለም)'}
                            </span>
                          )}
                        </div>

                        {/* Assignments */}
                        <div>
                          <div className="text-[11px] font-semibold text-slate-700 mb-1">
                            {isSupport && teacher.assignments.length === 0 ? 'የተመደቡ የትምህርት ክፍሎች፡ (ምንም የለም - የድጋፍ ሰጪ ሠራተኛ)' : 'የተመደቡ የትምህርት ክፍሎች፡'}
                          </div>
                          {teacher.assignments.length > 0 ? (
                            <div className="space-y-1">
                              {teacher.assignments.map((ass, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between text-xs py-1 px-2.5 bg-white border border-slate-200 rounded-md"
                                >
                                  <span className="text-slate-800 font-medium">
                                    {ass.grade} ({ass.section}) — {ass.subjectName}
                                  </span>
                                  <button
                                    onClick={() => handleRemoveAssignment(teacher.id, i)}
                                    className="text-slate-400 hover:text-rose-600 text-xs"
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : !isSupport && (
                            <div className="text-[11px] text-slate-400 italic">ምንም የተመደበ ትምህርት የለም</div>
                          )}
                        </div>

                        {/* Quick Add Assignment */}
                        <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                          <select
                            id={`grade-${teacher.id}`}
                            className="text-[11px] py-1 px-1.5 bg-white border border-slate-300 rounded-md"
                          >
                            {ALL_GRADES.slice(0, 10).map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                          <select
                            id={`sec-${teacher.id}`}
                            className="text-[11px] py-1 px-1.5 bg-white border border-slate-300 rounded-md"
                          >
                            <option value="ሀ">ሀ</option>
                            <option value="ለ">ለ</option>
                            <option value="ሐ">ሐ</option>
                          </select>
                          <select
                            id={`sub-${teacher.id}`}
                            className="text-[11px] py-1 px-1.5 bg-white border border-slate-300 rounded-md max-w-[130px] truncate"
                          >
                            {subjects.map(s => (
                              <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const g = (document.getElementById(`grade-${teacher.id}`) as HTMLSelectElement).value;
                              const sec = (document.getElementById(`sec-${teacher.id}`) as HTMLSelectElement).value;
                              const sub = (document.getElementById(`sub-${teacher.id}`) as HTMLSelectElement).value;
                              handleAddAssignment(teacher.id, g, sec, sub);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          >
                            መድብ
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tab 4: Subjects Curriculum Management (የትምህርት ዓይነቶች) */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-700" />
                  <span>የትምህርት ዓይነቶች ስርዓተ-ትምህርት አስተዳደር (Curriculum Subjects)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  የትምህርት ዓይነቶችን መጨመር፣ ማረም (ኤዲት) ወይም መቀነስ (መደለት)።
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingSubjectId(null);
                  setSubjectForm({
                    name: '',
                    englishName: '',
                    cycle: 'first_cycle',
                    grades: ['1ኛ ክፍል', '2ኛ ክፍል'],
                  });
                  setIsSubjectModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>አዲስ የትምህርት ዓይነት ጨምር</span>
              </button>
            </div>

            <div className="mt-4 overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/75 text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">የአማርኛ ስም</th>
                    <th className="py-2.5 px-3">የእንግሊዝኛ ስም</th>
                    <th className="py-2.5 px-3">የትምህርት ደረጃ ዑደት</th>
                    <th className="py-2.5 px-3">የሚሰጥባቸው ክፍሎች ብዛት</th>
                    <th className="py-2.5 px-3 text-right">ተግባር</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{s.englishName}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {s.cycles.join(', ')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{s.applicableGrades.length} ክፍሎች</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingSubjectId(s.id);
                              setSubjectForm({
                                name: s.name,
                                englishName: s.englishName,
                                cycle: s.cycles[0] || 'first_cycle',
                                grades: s.applicableGrades,
                              });
                              setIsSubjectModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`ትምህርት ${s.name} ይሰረዝ?`)) {
                                setSubjects(prev => prev.filter(sub => sub.id !== s.id));
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Security & Passwords Manager (የቁልፍ/መቆለፊያ አስተዳደር) */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-2xl">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-700" />
                <span>ለሁሉም ገጾች መቆለፊያ ቁልፎች ማዘጋጃና መቀየሪያ (Access Keys & PINs)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                ዋና አድሚኑ ለሁሉም የኃላፊነት ሚናዎች እና ገጾች ሚስጥራዊ የመግቢያ ቁልፎችን የመቀየር ሙሉ ስልጣን አለው።
              </p>
            </div>

            <form onSubmit={handleSavePasswords} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  የዋና አድሚን ቁልፍ (Super Admin Password)
                </label>
                <input
                  type="text"
                  value={passwordsForm.super_admin}
                  onChange={e => setPasswordsForm({ ...passwordsForm, super_admin: e.target.value })}
                  required
                  className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  የዋና ር/መምህር ቁልፍ (Principal Password)
                </label>
                <input
                  type="text"
                  value={passwordsForm.principal}
                  onChange={e => setPasswordsForm({ ...passwordsForm, principal: e.target.value })}
                  required
                  className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  የም/ር/መምህር ቁልፍ (Vice Principal Password)
                </label>
                <input
                  type="text"
                  value={passwordsForm.vice_principal}
                  onChange={e => setPasswordsForm({ ...passwordsForm, vice_principal: e.target.value })}
                  required
                  className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  የኬጂ ትምህርት ቤት ር/መምህር ቁልፍ (KG Director Password)
                </label>
                <input
                  type="text"
                  value={passwordsForm.kg_director}
                  onChange={e => setPasswordsForm({ ...passwordsForm, kg_director: e.target.value })}
                  required
                  className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  የወላጆች አጠቃላይ መግቢያ ቁልፍ (Parent Access PIN)
                </label>
                <input
                  type="text"
                  value={passwordsForm.parent_general_pin}
                  onChange={e => setPasswordsForm({ ...passwordsForm, parent_general_pin: e.target.value })}
                  required
                  className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg bg-slate-50"
                />
              </div>

              {passwordSaveSuccess && (
                <div className="p-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>ሁሉም መቆለፊያ ቁልፎች በተሳካ ሁኔታ ተቀይረዋል!</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>ቁልፎችን አዘምንና አስቀምጥ</span>
                </button>
              </div>
            </form>
          </div>

          {/* School Logo & Brand Identity Manager Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-2xl">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <span>የትምህርት ቤቱ ይፋዊ አርማ/ሎጎ ማስተካከያ (School Logo & Emblem)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                የትምህርት ቤትዎን አርማ (PNG/JPG) ከኮምፒውተርዎ በመጫን ወይም የምስል ሊንክ በማስገባት በሁሉም ሰነዶችና ገጾች ላይ እንዲታይ ያድርጉ።
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-center shrink-0">
                  <img
                    src={adminLogoInput}
                    alt="Active Logo"
                    className="w-20 h-20 rounded-full object-cover border-3 border-amber-400 shadow-md bg-white mx-auto"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/kale_heywet_logo.jpg';
                    }}
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">የአሁን አርማ</span>
                </div>

                <div className="flex-1 w-full space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      አዲስ አርማ ከኮምፒውተር ይጫኑ (Upload File)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAdminLogoUpload}
                      className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ወይም የምስል ሊንክ ያስገቡ (Image URL)
                    </label>
                    <input
                      type="url"
                      value={adminLogoInput}
                      onChange={e => setAdminLogoInput(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {adminLogoSuccessMsg && (
                <div className="p-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>የትምህርት ቤቱ አርማ በተሳካ ሁኔታ ተቀይሯል!</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveAdminLogo}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>አርማውን አጽድቅና አስቀምጥ</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAdminLogo}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ወደ መደበኛው ቃለ ሕይወት መልስ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Inspector Mode (የሌሎች ገጾች ዕይታና ቁጥጥር) */}
      {activeTab === 'inspect_portals' && (
        <div className="space-y-5">
          {/* Supervisor Top Command Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>የዋና አድሚን የተቆጣጣሪነት ሁነታ (Supervisor Inspector)</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ዘመን፡ {settings.currentAcademicYear} ዓ/ም
                  </span>
                </div>
                <h2 className="text-base font-bold text-white tracking-tight mt-1">
                  የሌሎች የስራ ኃላፊነቶች ገጽ ዕይታና ቁጥጥር (Multi-Portal Inspector)
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  የዋና አድሚን ሥራዎች እንደተጠበቁ ሆነው፤ የር/መምህር፣ የም/ር/መምህር፣ የኬጂ፣ የመምህራን እና የወላጆች ገጾችን በቀጥታ እዚህ መመልከትና መከታተል ይችላሉ።
                </p>
              </div>

              {setActiveTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab('promotion')}
                  className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ወደ ዋና አድሚን ተግባራት ተመለስ</span>
                </button>
              )}
            </div>

            {/* Portal Role Switcher Tabs */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium mr-1">የሚመለከቱት ገጽ ይምረጡ፡</span>
              {[
                { id: 'principal', title: 'ዋና ርዕሰ-መምህር', badge: 'Principal', icon: '👨‍💼' },
                { id: 'vice_principal', title: 'ምክትል ርዕሰ-መምህር', badge: 'Vice Principal', icon: '👔' },
                { id: 'kg_director', title: 'የኬጂ ር/መምህር', badge: 'KG Director', icon: '🍼' },
                { id: 'teacher', title: 'መምህራን', badge: 'Teacher', icon: '👩‍🏫' },
                { id: 'parent', title: 'ወላጆች', badge: 'Parent', icon: '👨‍👩‍👧' },
              ].map(item => {
                const isSelected = inspectedRole === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setInspectedRole(item.id as any);
                      if (item.id === 'principal') setInspectorSubTab('students');
                      else if (item.id === 'vice_principal') setInspectorSubTab('sections');
                      else if (item.id === 'kg_director') setInspectorSubTab('kg_students');
                      else if (item.id === 'teacher') setInspectorSubTab('marks_entry');
                      else if (item.id === 'parent') setInspectorSubTab('report_card');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/50'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.title}</span>
                    <span className="text-[10px] opacity-75 font-mono">({item.badge})</span>
                  </button>
                );
              })}
            </div>

            {/* Contextual Selector: Pick Teacher or Student */}
            {(inspectedRole === 'teacher' || inspectedRole === 'parent') && (
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-800/40 p-3 rounded-xl">
                {inspectedRole === 'teacher' && (
                  <>
                    <span className="text-xs text-slate-300 font-medium">የሚታየው መምህር ይምረጡ፡</span>
                    <select
                      value={inspectedTeacherId}
                      onChange={e => setInspectedTeacherId(e.target.value)}
                      className="text-xs font-semibold py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white max-w-md"
                    >
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.roleTitle ? `[${t.roleTitle}]` : ''} — {t.isHomeroom ? `ስም ጠሪ (${t.homeroomGrade} ${t.homeroomSection})` : (t.roleTitle || 'መምህር')}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {inspectedRole === 'parent' && (
                  <>
                    <span className="text-xs text-slate-300 font-medium">የሚታየው የተማሪ ወላጅ ይምረጡ፡</span>
                    <select
                      value={inspectedStudentId}
                      onChange={e => setInspectedStudentId(e.target.value)}
                      className="text-xs font-semibold py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white max-w-md"
                    >
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.grade} {s.section}) — መለያ፡ {s.id}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            )}

            {/* Sub-tab Navigation for the Inspected Role */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between overflow-x-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium mr-1 shrink-0">የገጹ ክፍሎች፡</span>
                {inspectedRole === 'principal' &&
                  [
                    { id: 'students', label: 'ተማሪዎች ምዝገባ (Excel)' },
                    { id: 'sections', label: 'ክፍሎችና ስም ጠሪ' },
                    { id: 'roster', label: 'የክፍል ሮስተር' },
                    { id: 'analytics', label: 'የውጤት ትንተና' },
                    { id: 'top_students', label: 'ከፍተኛ ውጤቶች' },
                    { id: 'feedback', label: 'የወላጆች አስተያየት' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInspectorSubTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                        inspectorSubTab === tab.id
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}

                {inspectedRole === 'vice_principal' &&
                  [
                    { id: 'students', label: 'ተማሪዎች ምዝገባ' },
                    { id: 'sections', label: 'ክፍሎችና ስም ጠሪ' },
                    { id: 'roster', label: 'የክፍል ሮስተር' },
                    { id: 'analytics', label: 'የውጤት ትንተና' },
                    { id: 'letters', label: 'ደብዳቤዎችና መመሪያዎች' },
                    { id: 'feedback', label: 'የወላጆች አስተያየት' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInspectorSubTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                        inspectorSubTab === tab.id
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}

                {inspectedRole === 'kg_director' &&
                  [
                    { id: 'kg_students', label: 'የኬጂ ተማሪዎች (Excel)' },
                    { id: 'kg_sections', label: 'የኬጂ ክፍሎች' },
                    { id: 'kg_roster', label: 'የኬጂ ሮስተር' },
                    { id: 'kg_analytics', label: 'የውጤት ትንተና' },
                    { id: 'kg_feedback', label: 'የወላጅ ግንኙነት' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInspectorSubTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                        inspectorSubTab === tab.id
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}

                {inspectedRole === 'teacher' &&
                  [
                    { id: 'marks_entry', label: 'ውጤት ማጠራቀሚያ' },
                    { id: 'homeroom_roster', label: 'የክፍል ሮስተር (ስም ጠሪ)' },
                    { id: 'class_analytics', label: 'የክፍሉ ትንተና' },
                    { id: 'conduct_remarks', label: 'የባህሪ አስተያየት' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInspectorSubTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                        inspectorSubTab === tab.id
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}

                {inspectedRole === 'parent' &&
                  [
                    { id: 'report_card', label: 'የልጄ ውጤት ካርድ' },
                    { id: 'top_students', label: 'ከፍተኛ ውጤቶች' },
                    { id: 'send_feedback', label: 'አስተያየትና ጥያቄ' },
                    { id: 'conduct_notes', label: 'የባህሪ መግለጫ' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInspectorSubTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                        inspectorSubTab === tab.id
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Inspected Portal Rendering Surface */}
          <div className="bg-slate-50/50 p-2 sm:p-4 rounded-2xl border-2 border-dashed border-indigo-200">
            {inspectedRole === 'principal' && (
              <PrincipalPortal
                isVicePrincipal={false}
                students={students}
                setStudents={setStudents}
                teachers={teachers}
                setTeachers={setTeachers}
                subjects={subjects}
                settings={settings}
                setSettings={setSettings}
                grades={grades}
                feedbacks={feedbacks}
                setFeedbacks={setFeedbacks}
                letters={letters}
                setLetters={setLetters}
                activeTab={inspectorSubTab}
              />
            )}

            {inspectedRole === 'vice_principal' && (
              <PrincipalPortal
                isVicePrincipal={true}
                students={students}
                setStudents={setStudents}
                teachers={teachers}
                setTeachers={setTeachers}
                subjects={subjects}
                settings={settings}
                setSettings={setSettings}
                grades={grades}
                feedbacks={feedbacks}
                setFeedbacks={setFeedbacks}
                letters={letters}
                setLetters={setLetters}
                activeTab={inspectorSubTab}
              />
            )}

            {inspectedRole === 'kg_director' && (
              <KgDirectorPortal
                students={students}
                setStudents={setStudents}
                teachers={teachers}
                setTeachers={setTeachers}
                subjects={subjects}
                settings={settings}
                setSettings={setSettings}
                grades={grades}
                feedbacks={feedbacks}
                setFeedbacks={setFeedbacks}
                activeTab={inspectorSubTab}
              />
            )}

            {inspectedRole === 'teacher' && (
              (() => {
                const currentInspectedTeacher =
                  teachers.find(t => t.id === inspectedTeacherId) || teachers[0];
                if (!currentInspectedTeacher) {
                  return (
                    <div className="p-8 text-center text-slate-500 bg-white rounded-xl">
                      ምንም የተመዘገበ መምህር አልተገኘም።
                    </div>
                  );
                }
                return (
                  <TeacherPortal
                    currentTeacher={currentInspectedTeacher}
                    students={students}
                    setStudents={setStudents}
                    grades={grades}
                    setGrades={setGrades}
                    subjects={subjects}
                    settings={settings}
                    activeTab={inspectorSubTab}
                  />
                );
              })()
            )}

            {inspectedRole === 'parent' && (
              (() => {
                const currentInspectedStudent =
                  students.find(s => s.id === inspectedStudentId) || students[0];
                if (!currentInspectedStudent) {
                  return (
                    <div className="p-8 text-center text-slate-500 bg-white rounded-xl">
                      ምንም የተመዘገበ ተማሪ አልተገኘም።
                    </div>
                  );
                }
                return (
                  <ParentPortal
                    currentStudent={currentInspectedStudent}
                    students={students}
                    grades={grades}
                    subjects={subjects}
                    settings={settings}
                    feedbacks={feedbacks}
                    setFeedbacks={setFeedbacks}
                    activeTab={inspectorSubTab}
                  />
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* Student Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingStudentId ? 'የተማሪ መረጃ ማረሚያ' : 'አዲስ ተማሪ መመዝገቢያ'}
              </h3>
              <button onClick={() => setIsStudentModalOpen(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveStudent} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ስም ከነ አያት *</label>
                <input
                  type="text"
                  required
                  value={studentForm.fullName}
                  onChange={e => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  placeholder="ለምሳሌ፡ ዳዊት አስፋው ታደሰ"
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  የተማሪ መለያ ኮድ (Student ID)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={studentForm.id || ''}
                    onChange={e => setStudentForm({ ...studentForm, id: e.target.value })}
                    placeholder="ለምሳሌ፡ bkhrsm8-101"
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg font-mono font-semibold text-indigo-700 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newId = generateNextStudentId(studentForm.grade, students);
                      setStudentForm({ ...studentForm, id: newId });
                    }}
                    className="px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0"
                    title="ለተመረጠው ክፍል መደበኛ ኮድ ፍጠር"
                  >
                    ⚡ ኮድ አድስ
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  የክፍሉን ቅጥያ መሰረት በማድረግ (ለምሳሌ 6ኛ = bkhrsf6-..., 8ኛ = bkhrsm8-...) ይሰራል
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ጾታ *</label>
                  <select
                    value={studentForm.gender}
                    onChange={e => setStudentForm({ ...studentForm, gender: e.target.value as Gender })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="ወንድ">ወንድ</option>
                    <option value="ሴት">ሴት</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ዕድሜ *</label>
                  <input
                    type="number"
                    min="3"
                    max="22"
                    required
                    value={studentForm.age}
                    onChange={e => setStudentForm({ ...studentForm, age: parseInt(e.target.value) || 7 })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">የክፍል ደረጃ *</label>
                  <select
                    value={studentForm.grade}
                    onChange={e => {
                      const newGrade = e.target.value;
                      // Update id suggestion if desired
                      const suggestedId = generateNextStudentId(newGrade, students);
                      setStudentForm({ ...studentForm, grade: newGrade, id: studentForm.id ? suggestedId : '' });
                    }}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    {ALL_GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ሴክሽን *</label>
                  <select
                    value={studentForm.section}
                    onChange={e => setStudentForm({ ...studentForm, section: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    {STANDARD_SECTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">የትምህርት ዘመን *</label>
                  <select
                    value={studentForm.academicYear}
                    onChange={e => setStudentForm({ ...studentForm, academicYear: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    {settings.availableAcademicYears.map(yr => (
                      <option key={yr} value={yr}>{yr} ዓ/ም</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">የወላጅ ስልክ ቁጥር</label>
                  <input
                    type="text"
                    value={studentForm.parentPhone}
                    onChange={e => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                    placeholder="09..."
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">አድራሻ</label>
                <input
                  type="text"
                  value={studentForm.address}
                  onChange={e => setStudentForm({ ...studentForm, address: e.target.value })}
                  placeholder="ብርብር ከተማ ቀበሌ 01"
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg"
                >
                  {editingStudentId ? 'አሻሽል (Save Changes)' : 'አስቀምጥ (Save)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Class & Section Reassignment Modal */}
      {isBulkClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-200" />
                <h3 className="text-sm font-bold">
                  የክፍል ስም እና ሴክሽን በጅምላ ማስተካከያ (Bulk Class/Section Fixer)
                </h3>
              </div>
              <button
                onClick={() => setIsBulkClassModalOpen(false)}
                className="text-amber-100 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                የተሳሳተ የክፍል ስም ወይም ሴክሽን ለማረም፣ ወይም ተማሪዎችን ከአንድ ክፍል ወደ ሌላ ክፍል በጅምላ ለማዛወር ይህንን ይጠቀሙ።
              </p>

              {/* Source Class Selection */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>1. ምንጭ ክፍል (የሚቀየረው ክፍል)</span>
                  {(() => {
                    const matchCount = students.filter(
                      s =>
                        (s.grade === bulkClassSource.grade || (bulkClassSource.grade === '8ኛ ክፍል' && s.grade.includes('8th'))) &&
                        (s.section === bulkClassSource.section || (bulkClassSource.section === 'ሀ' && s.section === 'A')) &&
                        s.academicYear === bulkClassSource.academicYear
                    ).length;
                    return (
                      <span className="text-[11px] font-mono px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-bold">
                        የተገኙ ተማሪዎች: {matchCount}
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">የክፍል ደረጃ</label>
                    <select
                      value={bulkClassSource.grade}
                      onChange={e => setBulkClassSource({ ...bulkClassSource, grade: e.target.value })}
                      className="w-full text-xs py-1.5 px-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {ALL_GRADES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">ሴክሽን</label>
                    <select
                      value={bulkClassSource.section}
                      onChange={e => setBulkClassSource({ ...bulkClassSource, section: e.target.value })}
                      className="w-full text-xs py-1.5 px-2 border border-slate-300 rounded-lg bg-white font-bold"
                    >
                      <option value="ሀ">ሴክሽን ሀ (A)</option>
                      <option value="ለ">ሴክሽን ለ (B)</option>
                      <option value="ሐ">ሴክሽን ሐ (C)</option>
                      <option value="መ">ሴክሽን መ (D)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">የትምህርት ዘመን</label>
                    <select
                      value={bulkClassSource.academicYear}
                      onChange={e => setBulkClassSource({ ...bulkClassSource, academicYear: e.target.value })}
                      className="w-full text-xs py-1.5 px-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {settings.availableAcademicYears.map(yr => (
                        <option key={yr} value={yr}>{yr} ዓ/ም</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Target Class Selection */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-emerald-950">
                  2. መዳረሻ አዲስ ክፍል (አዲሱ ትክክለኛ ስም)
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">አዲሱ ክፍል</label>
                    <select
                      value={bulkClassTarget.grade}
                      onChange={e => setBulkClassTarget({ ...bulkClassTarget, grade: e.target.value })}
                      className="w-full text-xs py-1.5 px-2 border border-slate-300 rounded-lg bg-white font-medium"
                    >
                      {ALL_GRADES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">አዲሱ ሴክሽን</label>
                    <select
                      value={bulkClassTarget.section}
                      onChange={e => setBulkClassTarget({ ...bulkClassTarget, section: e.target.value })}
                      className="w-full text-xs py-1.5 px-2 border border-slate-300 rounded-lg bg-white font-bold"
                    >
                      <option value="ሀ">ሴክሽን ሀ (A)</option>
                      <option value="ለ">ሴክሽን ለ (B)</option>
                      <option value="ሐ">ሴክሽን ሐ (C)</option>
                      <option value="መ">ሴክሽን መ (D)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">የትምህርት ዘመን</label>
                    <select
                      value={bulkClassTarget.academicYear}
                      onChange={e => setBulkClassTarget({ ...bulkClassTarget, academicYear: e.target.value })}
                      className="w-full text-xs py-1.5 px-2 border border-slate-300 rounded-lg bg-white font-medium"
                    >
                      {settings.availableAcademicYears.map(yr => (
                        <option key={yr} value={yr}>{yr} ዓ/ም</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-emerald-900 font-medium">
                    <input
                      type="checkbox"
                      checked={bulkClassTarget.updateId}
                      onChange={e => setBulkClassTarget({ ...bulkClassTarget, updateId: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>የተማሪዎችን መለያ ኮድ (ID) ወደ አዲሱ ክፍል መደበኛ ቅጥያ በራስ-ሰር አድስ</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkClassModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ይቅር
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkClassChange}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  ለውጡን ተግብር (Apply Changes)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Modal */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingTeacherId ? 'የመምህር መረጃ ማረሚያ' : 'አዲስ መምህር መመዝገቢያ'}
              </h3>
              <button onClick={() => setIsTeacherModalOpen(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveTeacher} className="p-5 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">የሠራተኛው/መምህሩ ሙሉ ስም *</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.name}
                    onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })}
                    placeholder="ለምሳሌ፡ ዮንኬ በሪ ዘለቀ"
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">የሥራ ኃላፊነት (Role) *</label>
                  <select
                    value={teacherForm.roleTitle}
                    onChange={e => setTeacherForm({ ...teacherForm, roleTitle: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="መ/ርት">መ/ርት (መምህርት)</option>
                    <option value="መ/ር">መ/ር (መምህር)</option>
                    <option value="ር/መ/ር">ር/መ/ር (ርዕሰ መምህር)</option>
                    <option value="ር/መ/ርት">ር/መ/ርት (ርዕሰ መምህርት)</option>
                    <option value="ም/መ/ር">ም/መ/ር (ምክትል ርዕሰ መምህር)</option>
                    <option value="ሞግዚት">ሞግዚት (ሞግዚት)</option>
                    <option value="የሂ/ሠራተኛ">የሂ/ሠራተኛ (የሂሳብ ሠራተኛ)</option>
                    <option value="ፅዳት">ፅዳት (የፅዳት ሠራተኛ)</option>
                    <option value="ጠባቂ">ጠባቂ (ጥበቃ)</option>
                    <option value="ፀሐፊ">ፀሐፊ (ሬጅስትራር/ፀሐፊ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ስልክ ቁጥር *</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.phone}
                    onChange={e => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    placeholder="0911..."
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">የመግቢያ ቁልፍ (PIN) *</label>
                  <input
                    type="text"
                    required
                    value={teacherForm.pin}
                    onChange={e => setTeacherForm({ ...teacherForm, pin: e.target.value })}
                    className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={teacherForm.isHomeroom}
                    onChange={e => setTeacherForm({ ...teacherForm, isHomeroom: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    የክፍል ስም ጠሪ (Homeroom Teacher) ነው?
                  </span>
                </label>

                {teacherForm.isHomeroom && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-0.5">ስም ጠሪ የሚሆንበት ክፍል</label>
                      <select
                        value={teacherForm.homeroomGrade}
                        onChange={e => setTeacherForm({ ...teacherForm, homeroomGrade: e.target.value })}
                        className="w-full text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-md"
                      >
                        {ALL_GRADES.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-0.5">ሴክሽን</label>
                      <select
                        value={teacherForm.homeroomSection}
                        onChange={e => setTeacherForm({ ...teacherForm, homeroomSection: e.target.value })}
                        className="w-full text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-md"
                      >
                        {STANDARD_SECTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ይቅር
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg"
                >
                  አስቀምጥ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingSubjectId ? 'የትምህርት ዓይነት ማረሚያ' : 'አዲስ የትምህርት ዓይነት'}
              </h3>
              <button onClick={() => setIsSubjectModalOpen(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (editingSubjectId) {
                  setSubjects(prev =>
                    prev.map(sub =>
                      sub.id === editingSubjectId
                        ? {
                            ...sub,
                            name: subjectForm.name,
                            englishName: subjectForm.englishName,
                          }
                        : sub
                    )
                  );
                } else {
                  const newSub: SchoolSubject = {
                    id: `sub-${Date.now().toString().slice(-4)}`,
                    name: subjectForm.name,
                    englishName: subjectForm.englishName,
                    cycles: [subjectForm.cycle],
                    applicableGrades: ALL_GRADES.slice(3, 9),
                  };
                  setSubjects(prev => [...prev, newSub]);
                }
                setIsSubjectModalOpen(false);
              }}
              className="p-5 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">የትምህርቱ ስም (በአማርኛ) *</label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="ለምሳሌ፡ ኬሚስትሪ"
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">የእንግሊዝኛ መጠሪያ ስም</label>
                <input
                  type="text"
                  value={subjectForm.englishName}
                  onChange={e => setSubjectForm({ ...subjectForm, englishName: e.target.value })}
                  placeholder="e.g. Chemistry"
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ይቅር
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg"
                >
                  አስቀምጥ
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

      {/* Teacher Excel Preview Modal */}
      {isTeacherExcelModalOpen && parsedTeachersPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="text-sm font-bold">ከኤክሴል ሰነድ የተገኙ መምህራን ማረጋገጫ (Import Preview)</h3>
                  <p className="text-[11px] text-emerald-200">
                    የተገኙ መምህራን ብዛት፡ <strong>{parsedTeachersPreview.length}</strong> · የመግቢያ ቁልፎች (PIN) ይዘጋጃሉ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTeacherExcelModalOpen(false)}
                className="text-emerald-200 hover:text-white text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                ከታች የሚታዩት <strong>{parsedTeachersPreview.length} መምህራን</strong> ወደ ስርዓቱ ይመዘገባሉ። የመግቢያ ሚስጥራዊ ቁልፍ (PIN) በራስ-ሰር ተሰጥቷቸው የክፍልና የትምህርት ምደባቸው ይከናወናል።
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">ተ.ቁ</th>
                      <th className="py-2 px-3">የመምህር ስም</th>
                      <th className="py-2 px-3">ስልክ ቁጥር</th>
                      <th className="py-2 px-3">የመግቢያ PIN</th>
                      <th className="py-2 px-3">የክፍል ስም ጠሪነት</th>
                      <th className="py-2 px-3">የሚያስተምረው ክፍል</th>
                      <th className="py-2 px-3">የትምህርት ዓይነት</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedTeachersPreview.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-600">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{t.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{t.phone || '—'}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-indigo-700">{t.pin}</td>
                        <td className="py-2 px-3">
                          {t.isHomeroom ? (
                            <span className="text-emerald-700 font-semibold">
                              አዎ ({t.homeroomGrade} {t.homeroomSection})
                            </span>
                          ) : (
                            <span className="text-slate-500">አይደለም</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {t.assignedGrade ? `${t.assignedGrade} (${t.assignedSection})` : '—'}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">{t.assignedSubject || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                ጠቅላላ የሚመዘገቡ መምህራን፡ <strong>{parsedTeachersPreview.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTeacherExcelModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  ይቅር (Cancel)
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTeacherImport}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>ሁሉንም {parsedTeachersPreview.length} መምህራን መዝግብ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
