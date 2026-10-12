export type UserRole = 
  | 'super_admin' 
  | 'principal' 
  | 'vice_principal' 
  | 'kg_director' 
  | 'teacher' 
  | 'parent';

export type Gender = 'ወንድ' | 'ሴት';

export interface ConductNote {
  id: string;
  date: string;
  author: string;
  authorRole: string;
  note: string;
}

export interface Student {
  id: string; // e.g. kg1-101, bkhrsf1-101, bkhrsm7-101, bkhrsh9-101
  seqNo: number;
  fullName: string; // ስም ከነ አያት
  gender: Gender;
  age: number;
  academicYear: string; // e.g. "2019", "2020"
  grade: string; // e.g. "ማቆያ", "ደረጃ 1", "ደረጃ 2", "1ኛ ክፍል", ... "12ኛ ክፍል (ተፈጥሮ)"
  section: string; // "ሀ", "ለ", "ሐ", "መ"
  parentPhone: string;
  address: string;
  previousGrade?: string;
  promotionStatus?: 'promoted' | 'repeated' | 'pending';
  conductNotes: ConductNote[];
}

export interface SubjectMarks {
  test1: number; // 10
  test2: number; // 10
  midExam: number; // 10
  assignment: number; // 10
  project: number; // 20
  quiz: number; // 10
  homework: number; // 10
  finalExam: number; // 20
  total: number; // 100
}

export interface GradeEntry {
  id: string;
  studentId: string;
  subjectName: string;
  academicYear: string;
  semester: 1 | 2;
  marks: SubjectMarks;
  updatedAt: string;
}

export interface TeacherAssignment {
  grade: string;
  section: string;
  subjectName: string;
}

export interface Teacher {
  id: string;
  name: string;
  roleTitle?: string; // e.g. 'ር/መ/ር', 'ር/መ/ርት', 'ም/መ/ር', 'መ/ርት', 'መ/ር', 'ሞግዚት', 'የሂ/ሠራተኛ', 'ፅዳት'
  phone: string;
  pin: string;
  assignments: TeacherAssignment[];
  isHomeroom: boolean;
  homeroomGrade?: string;
  homeroomSection?: string;
}

export interface SchoolSubject {
  id: string;
  name: string;
  englishName: string;
  cycles: ('preschool' | 'first_cycle' | 'second_cycle' | 'secondary' | 'prep_natural' | 'prep_social')[];
  applicableGrades: string[];
}

export interface ParentFeedback {
  id: string;
  studentId: string;
  studentName: string;
  parentName: string;
  phone: string;
  date: string;
  message: string;
  reply?: string;
  replyDate?: string;
  repliedBy?: string;
  targetRole: 'principal' | 'vice_principal' | 'kg_director';
}

export interface TeacherLetter {
  id: string;
  title: string;
  content: string;
  date: string;
  sender: string;
  targetTeacherId?: string; // all or specific
  replies: {
    teacherId: string;
    teacherName: string;
    text: string;
    date: string;
  }[];
}

export interface GradePromotionRule {
  failThresholdSubjects: number;
  passAverageThreshold: number;
  mandatoryFailingSubjects: string[];
}

export interface SchoolSettings {
  schoolName: string;
  customLogo?: string; // Optional user-provided custom logo data URL or URL
  currentAcademicYear: string; // e.g. "2019"
  availableAcademicYears: string[]; // e.g. ["2019", "2020", "2021"]
  currentSemester: 1 | 2;
  failThresholdSubjects: number; // How many subjects < 50 causes student to fail (default e.g. 2 or 3)
  passAverageThreshold: number; // default 50
  mandatoryFailingSubjects: string[]; // Subjects which cause failure if < 50 (e.g. ["እንግሊዝኛ", "ሒሳብ"])
  gradePromotionRules?: Record<string, GradePromotionRule>; // Specific rule overrides per grade
  resultsApprovedForStudents: boolean; // if true, parents can view published roster/report cards
  kgResultsApproved: boolean; // if true, KG parents can view
  passwords: {
    super_admin: string;
    principal: string;
    vice_principal: string;
    kg_director: string;
    parent_general_pin: string;
  };
}
