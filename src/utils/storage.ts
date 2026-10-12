import { Student, Teacher, GradeEntry, SchoolSettings, ParentFeedback, TeacherLetter, SchoolSubject } from '../types';
import { INITIAL_SETTINGS, INITIAL_TEACHERS, INITIAL_STUDENTS, INITIAL_GRADES, INITIAL_FEEDBACKS, INITIAL_LETTERS } from '../data/initialData';
import { INITIAL_SUBJECTS } from '../data/initialSubjects';

const STORAGE_KEYS = {
  SETTINGS: 'bkhr_school_settings_v1',
  STUDENTS: 'bkhr_school_students_v2',
  TEACHERS: 'bkhr_school_teachers_v2',
  GRADES: 'bkhr_school_grades_v1',
  SUBJECTS: 'bkhr_school_subjects_v1',
  FEEDBACKS: 'bkhr_school_feedbacks_v1',
  LETTERS: 'bkhr_school_letters_v1',
};

export function loadSettings(): SchoolSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      const years = Array.isArray(parsed.availableAcademicYears) && parsed.availableAcademicYears.length
        ? Array.from(new Set(['2018', ...parsed.availableAcademicYears]))
        : INITIAL_SETTINGS.availableAcademicYears;
      return {
        ...INITIAL_SETTINGS,
        ...parsed,
        passwords: { ...INITIAL_SETTINGS.passwords, ...(parsed.passwords || {}) },
        availableAcademicYears: years,
        mandatoryFailingSubjects: parsed.mandatoryFailingSubjects || INITIAL_SETTINGS.mandatoryFailingSubjects,
        gradePromotionRules: parsed.gradePromotionRules || {},
      };
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return INITIAL_SETTINGS;
}

export function saveSettings(settings: SchoolSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 100) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load students', e);
  }
  return INITIAL_STUDENTS;
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Failed to save students', e);
  }
}

export function loadTeachers(): Teacher[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 40) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load teachers', e);
  }
  return INITIAL_TEACHERS;
}

export function saveTeachers(teachers: Teacher[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  } catch (e) {
    console.error('Failed to save teachers', e);
  }
}

export function loadGrades(): GradeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GRADES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load grades', e);
  }
  return INITIAL_GRADES;
}

export function saveGrades(grades: GradeEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
  } catch (e) {
    console.error('Failed to save grades', e);
  }
}

export function loadSubjects(): SchoolSubject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load subjects', e);
  }
  return INITIAL_SUBJECTS;
}

export function saveSubjects(subjects: SchoolSubject[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  } catch (e) {
    console.error('Failed to save subjects', e);
  }
}

export function loadFeedbacks(): ParentFeedback[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load feedbacks', e);
  }
  return INITIAL_FEEDBACKS;
}

export function saveFeedbacks(feedbacks: ParentFeedback[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(feedbacks));
  } catch (e) {
    console.error('Failed to save feedbacks', e);
  }
}

export function loadLetters(): TeacherLetter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LETTERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load letters', e);
  }
  return INITIAL_LETTERS;
}

export function saveLetters(letters: TeacherLetter[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LETTERS, JSON.stringify(letters));
  } catch (e) {
    console.error('Failed to save letters', e);
  }
}

export function resetAllDataToDefault(): void {
  localStorage.clear();
  window.location.reload();
}
