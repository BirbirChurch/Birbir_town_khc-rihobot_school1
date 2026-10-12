import { Student } from '../types';

/**
 * Generates an official student ID based on Birbir Town Kale Heywet Rehoboth School rules:
 * - ማቆያ (KG1): kg1-101, kg1-102, ...
 * - ደረጃ 1 (KG2): kg2-101, kg2-102, ...
 * - ደረጃ 2 (KG3): kg3-101, kg3-102, ...
 * - 1ኛ - 6ኛ ክፍል: bkhrsf[gradeNum]-101, e.g. bkhrsf1-101, bkhrsf2-101
 * - 7ኛ - 8ኛ ክፍል: bkhrsm[gradeNum]-101, e.g. bkhrsm7-101, bkhrsm8-101
 * - 9ኛ - 12ኛ ክፍል: bkhrsh[gradeNum]-101, e.g. bkhrsh9-101, bkhrsh10-101, bkhrsh11-101, bkhrsh12-101
 */
export function getGradePrefix(grade: string): string {
  const g = grade.trim();
  if (g.includes('ማቆያ')) return 'kg1';
  if (g.includes('ደረጃ 1')) return 'kg2';
  if (g.includes('ደረጃ 2')) return 'kg3';

  // Check numeric grade
  const match = g.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 6) {
      return `bkhrsf${num}`;
    }
    if (num >= 7 && num <= 8) {
      return `bkhrsm${num}`;
    }
    if (num >= 9 && num <= 12) {
      return `bkhrsh${num}`;
    }
  }

  // Fallback
  return 'bkhrsf1';
}

export function generateNextStudentId(grade: string, existingStudents: Student[]): string {
  const prefix = getGradePrefix(grade);
  const matchingStudents = existingStudents.filter(s => s.id.startsWith(`${prefix}-`));
  
  let maxSeq = 100;
  for (const student of matchingStudents) {
    const parts = student.id.split('-');
    if (parts.length === 2) {
      const num = parseInt(parts[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}-${nextSeq}`;
}

export const ALL_GRADES = [
  'ማቆያ',
  'ደረጃ 1',
  'ደረጃ 2',
  '1ኛ ክፍል',
  '2ኛ ክፍል',
  '3ኛ ክፍል',
  '4ኛ ክፍል',
  '5ኛ ክፍል',
  '6ኛ ክፍል',
  '7ኛ ክፍል',
  '8ኛ ክፍል',
  '9ኛ ክፍል',
  '10ኛ ክፍል',
  '11ኛ ክፍል (ተፈጥሮ)',
  '11ኛ ክፍል (ማህበራዊ)',
  '12ኛ ክፍል (ተፈጥሮ)',
  '12ኛ ክፍል (ማህበራዊ)',
];

export const KG_GRADES = ['ማቆያ', 'ደረጃ 1', 'ደረጃ 2'];

export const PRIMARY_FIRST_CYCLE = [
  '1ኛ ክፍል',
  '2ኛ ክፍል',
  '3ኛ ክፍል',
  '4ኛ ክፍል',
  '5ኛ ክፍል',
  '6ኛ ክፍል',
];

export const PRIMARY_SECOND_CYCLE = ['7ኛ ክፍል', '8ኛ ክፍል'];

export const SECONDARY_GRADES = [
  '9ኛ ክፍል',
  '10ኛ ክፍል',
  '11ኛ ክፍል (ተፈጥሮ)',
  '11ኛ ክፍል (ማህበራዊ)',
  '12ኛ ክፍል (ተፈጥሮ)',
  '12ኛ ክፍል (ማህበራዊ)',
];

export const STANDARD_SECTIONS = ['ሀ', 'ለ', 'ሐ', 'መ'];
