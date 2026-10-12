import * as XLSX from 'xlsx';
import { Student, Teacher, Gender } from '../types';
import { generateNextStudentId } from './studentIdGenerator';

export interface ParsedStudentRow {
  fullName: string;
  gender: Gender;
  age: number;
  grade: string;
  section: string;
  academicYear: string;
  parentPhone: string;
  address: string;
}

export interface ParsedTeacherRow {
  name: string;
  roleTitle?: string;
  phone: string;
  pin: string;
  isHomeroom: boolean;
  homeroomGrade?: string;
  homeroomSection?: string;
  assignedGrade?: string;
  assignedSection?: string;
  assignedSubject?: string;
}

/**
 * Downloads a sample Excel template for Student Registration
 */
export function downloadStudentTemplate() {
  const sampleData = [
    {
      'ስም ከነ አያት (Full Name)': 'ታሪኩ አሰፋ ደስታ',
      'ጾታ (Gender: ወንድ/ሴት)': 'ወንድ',
      'ዕድሜ (Age)': 7,
      'የክፍል ደረጃ (Grade)': '1ኛ ክፍል',
      'ሴክሽን (Section: ሀ/ለ/ሐ)': 'ሀ',
      'የትምህርት ዘመን (Year)': '2020',
      'የወላጅ ስልክ (Parent Phone)': '0911223344',
      'አድራሻ (Address)': 'ብርብር ከተማ ቀበሌ 01',
    },
    {
      'ስም ከነ አያት (Full Name)': 'ሄለን ብርሃኑ ተስፋዬ',
      'ጾታ (Gender: ወንድ/ሴት)': 'ሴት',
      'ዕድሜ (Age)': 7,
      'የክፍል ደረጃ (Grade)': '1ኛ ክፍል',
      'ሴክሽን (Section: ሀ/ለ/ሐ)': 'ሀ',
      'የትምህርት ዘመን (Year)': '2020',
      'የወላጅ ስልክ (Parent Phone)': '0922334455',
      'አድራሻ (Address)': 'ብርብር ከተማ ቀበሌ 02',
    },
    {
      'ስም ከነ አያት (Full Name)': 'ዮሴፍ ዳንኤል ገብሬ',
      'ጾታ (Gender: ወንድ/ሴት)': 'ወንድ',
      'ዕድሜ (Age)': 4,
      'የክፍል ደረጃ (Grade)': 'ማቆያ',
      'ሴክሽን (Section: ሀ/ለ/ሐ)': 'ሀ',
      'የትምህርት ዘመን (Year)': '2020',
      'የወላጅ ስልክ (Parent Phone)': '0933445566',
      'አድራሻ (Address)': 'ብርብር ከተማ ቀበሌ 01',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  // Auto-fit column widths
  ws['!cols'] = [
    { wch: 26 },
    { wch: 22 },
    { wch: 12 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
    { wch: 26 },
    { wch: 26 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'የተማሪዎች ቅጽ');
  XLSX.writeFile(wb, 'የተማሪዎች_ምዝገባ_ቅጽ_Template.xlsx');
}

/**
 * Downloads a sample Excel template for Teacher Registration
 */
export function downloadTeacherTemplate() {
  const sampleData = [
    {
      'ተ.ቁ': 1,
      'የሠራተኞች ስም (Name)': 'ዮንኬ በሪ ዘለቀ',
      'የሥራ ኃላፍነት (Role: ር/መ/ር, ር/መ/ርት, መ/ር, መ/ርት, ም/መ/ር, ሞግዚት, የሂ/ሠራተኛ, ፅዳት)': 'ር/መ/ር',
      'ስልክ ቁጥር (Phone)': '0911001001',
      'የመግቢያ ቁልፍ (PIN)': '1001',
      'የክፍል ስም ጠሪ ነው? (አዎ/አይደለም)': 'አይደለም',
      'ስም ጠሪ የሚሆንበት ክፍል': '',
      'ስም ጠሪ ሴክሽን': '',
      'የሚያስተምረው ክፍል': '8ኛ ክፍል',
      'የሚያስተምረው ሴክሽን': 'ሀ',
      'የትምህርት ዓይነት': 'ዜግነት ትምህርት',
    },
    {
      'ተ.ቁ': 2,
      'የሠራተኞች ስም (Name)': 'ዘውድቱ ሚልክያስ',
      'የሥራ ኃላፍነት (Role: ር/መ/ር, ር/መ/ርት, መ/ር, መ/ርት, ም/መ/ር, ሞግዚት, የሂ/ሠራተኛ, ፅዳት)': 'መ/ርት',
      'ስልክ ቁጥር (Phone)': '0911001003',
      'የመግቢያ ቁልፍ (PIN)': '1003',
      'የክፍል ስም ጠሪ ነው? (አዎ/አይደለም)': 'አዎ',
      'ስም ጠሪ የሚሆንበት ክፍል': '1ኛ ክፍል',
      'ስም ጠሪ ሴክሽን': 'ሀ',
      'የሚያስተምረው ክፍል': '1ኛ ክፍል',
      'የሚያስተምረው ሴክሽን': 'ሀ',
      'የትምህርት ዓይነት': 'እንግሊዝኛ',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 24 },
    { wch: 18 },
    { wch: 18 },
    { wch: 26 },
    { wch: 20 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'የመምህራን ቅጽ');
  XLSX.writeFile(wb, 'የመምህራንና_ሠራተኞች_ምዝገባ_ቅጽ_Template.xlsx');
}

/**
 * Parses uploaded Excel/CSV file for Students
 */
export async function parseStudentsExcelFile(file: File, defaultYear: string = '2020'): Promise<ParsedStudentRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws);

  const parsedStudents: ParsedStudentRow[] = [];

  for (const row of rawRows) {
    // Look up fields with case-insensitive and flexible header matching (Amharic or English)
    const findVal = (...keys: string[]) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return row[k];
        // Case-insensitive fallback
        const lowerK = k.toLowerCase();
        for (const actualKey of Object.keys(row)) {
          if (actualKey.toLowerCase() === lowerK && row[actualKey] !== undefined && row[actualKey] !== null) {
            return row[actualKey];
          }
        }
      }
      return undefined;
    };

    const rawFullName = findVal(
      'ስም ከነ አያት (Full Name)',
      'ስም ከነ አያት',
      'ሙሉ ስም',
      'student_name',
      'STUDENT_NAME',
      'Student Name',
      'Full Name',
      'Name'
    );

    if (!rawFullName || typeof rawFullName !== 'string' || !rawFullName.trim()) continue;

    const rawGender = findVal(
      'ጾታ (Gender: ወንድ/ሴት)',
      'ጾታ',
      'gender',
      'Gender',
      'sex',
      'Sex'
    ) || 'ወንድ';
    
    let gender: Gender = 'ወንድ';
    const gStr = String(rawGender).trim().toLowerCase();
    if (gStr.includes('ሴ') || gStr === 'f' || gStr === 'female') {
      gender = 'ሴት';
    }

    let rawGrade = String(findVal(
      'የክፍል ደረጃ (Grade)',
      'የክፍል ደረጃ',
      'ክፍል',
      'st_grade',
      'ST_GRADE',
      'Grade',
      'grade'
    ) || '1ኛ ክፍል').trim();

    // Normalize grade names (e.g. "8th" -> "8ኛ ክፍል", "6th" -> "6ኛ ክፍል")
    if (rawGrade.toLowerCase().includes('8th') || rawGrade === '8') rawGrade = '8ኛ ክፍል';
    else if (rawGrade.toLowerCase().includes('6th') || rawGrade === '6') rawGrade = '6ኛ ክፍል';
    else if (rawGrade.toLowerCase().includes('7th') || rawGrade === '7') rawGrade = '7ኛ ክፍል';
    else if (rawGrade.toLowerCase().includes('5th') || rawGrade === '5') rawGrade = '5ኛ ክፍል';
    else if (rawGrade.toLowerCase().includes('4th') || rawGrade === '4') rawGrade = '4ኛ ክፍል';
    else if (rawGrade.toLowerCase().includes('3rd') || rawGrade === '3') rawGrade = '3ኛ ክፍል';
    else if (rawGrade.toLowerCase().includes('2nd') || rawGrade === '2') rawGrade = '2ኛ ክፍል';
    else if (rawGrade.toLowerCase().includes('1st') || rawGrade === '1') rawGrade = '1ኛ ክፍል';
    else if (rawGrade.toLowerCase().includes('kg1') || rawGrade.toLowerCase().includes('ማቆያ')) rawGrade = 'ማቆያ';
    else if (rawGrade.toLowerCase().includes('kg2') || rawGrade.toLowerCase().includes('ደረጃ 1')) rawGrade = 'ደረጃ 1';
    else if (rawGrade.toLowerCase().includes('kg3') || rawGrade.toLowerCase().includes('ደረጃ 2')) rawGrade = 'ደረጃ 2';

    let rawSection = String(findVal(
      'ሴክሽን (Section: ሀ/ለ/ሐ)',
      'ሴክሽን',
      'st_section',
      'ST_SECTION',
      'Section',
      'section'
    ) || 'ሀ').trim();

    // Normalize section (A -> ሀ, B -> ለ, C -> ሐ, D -> መ)
    if (rawSection.toUpperCase() === 'A') rawSection = 'ሀ';
    else if (rawSection.toUpperCase() === 'B') rawSection = 'ለ';
    else if (rawSection.toUpperCase() === 'C') rawSection = 'ሐ';
    else if (rawSection.toUpperCase() === 'D') rawSection = 'መ';

    const ageRaw = findVal('ዕድሜ (Age)', 'ዕድሜ', 'age', 'Age');
    let age = parseInt(ageRaw, 10);
    if (isNaN(age) || age <= 0) {
      if (rawGrade.includes('8')) age = 14;
      else if (rawGrade.includes('7')) age = 13;
      else if (rawGrade.includes('6')) age = 12;
      else if (rawGrade.includes('5')) age = 11;
      else if (rawGrade.includes('4')) age = 10;
      else if (rawGrade.includes('3')) age = 9;
      else if (rawGrade.includes('2')) age = 8;
      else if (rawGrade.includes('1ኛ')) age = 7;
      else if (rawGrade.includes('ደረጃ 2')) age = 6;
      else if (rawGrade.includes('ደረጃ 1')) age = 5;
      else if (rawGrade.includes('ማቆያ')) age = 4;
      else age = 7;
    }

    const year = findVal(
      'የትምህርት ዘመን (Year)',
      'የትምህርት ዘመን',
      'academic_year',
      'Academic Year',
      'Year',
      'year'
    ) || defaultYear;

    const parentPhone = findVal(
      'የወላጅ ስልክ (Parent Phone)',
      'የወላጅ ስልክ',
      'ስልክ ቁጥር',
      'ስልክ',
      'Phone',
      'phone',
      'parent_phone'
    ) || '';

    const address = findVal(
      'አድራሻ (Address)',
      'አድራሻ',
      'Address',
      'address'
    ) || 'ብርብር ከተማ ቀበሌ 01';

    parsedStudents.push({
      fullName: String(rawFullName).trim(),
      gender,
      age,
      grade: rawGrade,
      section: rawSection,
      academicYear: String(year).trim(),
      parentPhone: String(parentPhone).trim(),
      address: String(address).trim(),
    });
  }

  return parsedStudents;
}

/**
 * Parses uploaded Excel/CSV file for Teachers
 */
export async function parseTeachersExcelFile(file: File): Promise<ParsedTeacherRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws);

  const parsedTeachers: ParsedTeacherRow[] = [];

  for (const row of rawRows) {
    const name =
      row['የመምህሩ ሙሉ ስም (Teacher Name)'] ||
      row['የመምህሩ ሙሉ ስም'] ||
      row['የመምህሩ ስም'] ||
      row['ስም'] ||
      row['Teacher Name'] ||
      row['Name'];

    if (!name || typeof name !== 'string' || !name.trim()) continue;

    const phone =
      row['ስልክ ቁጥር (Phone)'] ||
      row['ስልክ ቁጥር'] ||
      row['ስልክ'] ||
      row['Phone'] ||
      '';

    const pin =
      row['የመግቢያ ቁልፍ (PIN)'] ||
      row['የመግቢያ ቁልፍ'] ||
      row['PIN'] ||
      row['Pin'] ||
      String(Math.floor(1000 + Math.random() * 9000));

    const isHomeroomRaw =
      row['የክፍል ስም ጠሪ ነው? (አዎ/አይደለም)'] ||
      row['የክፍል ስም ጠሪ ነው?'] ||
      row['ስም ጠሪ'] ||
      row['Is Homeroom'] ||
      row['is_homeroom'];

    const isHomeroom =
      String(isHomeroomRaw).trim().toLowerCase() === 'አዎ' ||
      String(isHomeroomRaw).trim().toLowerCase() === 'yes' ||
      String(isHomeroomRaw).trim() === 'true';

    const homeroomGrade =
      row['ስም ጠሪ የሚሆንበት ክፍል'] ||
      row['ስም ጠሪ ክፍል'] ||
      row['Homeroom Grade'];

    const homeroomSection =
      row['ስም ጠሪ ሴክሽን'] ||
      row['Homeroom Section'] ||
      'ሀ';

    const assignedGrade =
      row['የሚያስተምረው ክፍል'] ||
      row['ክፍል'] ||
      row['Assigned Grade'] ||
      '1ኛ ክፍል';

    const assignedSection =
      row['የሚያስተምረው ሴክሽን'] ||
      row['ሴክሽን'] ||
      row['Assigned Section'] ||
      'ሀ';

    const assignedSubject =
      row['የትምህርት ዓይነት'] ||
      row['ትምህርት'] ||
      row['Subject'] ||
      'እንግሊዝኛ';

    const roleTitle =
      row['የሥራ ኃላፍነት'] ||
      row['የሥራ ኃላፊነት'] ||
      row['ኃላፊነት'] ||
      row['Role'] ||
      row['Job Title'] ||
      'መምህር';

    parsedTeachers.push({
      name: String(name).trim(),
      roleTitle: String(roleTitle).trim(),
      phone: String(phone).trim(),
      pin: String(pin).trim(),
      isHomeroom,
      homeroomGrade: isHomeroom && homeroomGrade ? String(homeroomGrade).trim() : undefined,
      homeroomSection: isHomeroom ? String(homeroomSection).trim() : undefined,
      assignedGrade: assignedGrade ? String(assignedGrade).trim() : undefined,
      assignedSection: assignedSection ? String(assignedSection).trim() : undefined,
      assignedSubject: assignedSubject ? String(assignedSubject).trim() : undefined,
    });
  }

  return parsedTeachers;
}

/**
 * Export all students to Excel
 */
export function exportStudentsToExcel(students: Student[], fileName: string = 'የተማሪዎች_ዝርዝር.xlsx') {
  const exportData = students.map((s, idx) => ({
    'ተ.ቁ': idx + 1,
    'መለያ ኮድ (ID)': s.id,
    'ስም ከነ አያት': s.fullName,
    'ጾታ': s.gender,
    'ዕድሜ': s.age,
    'የክፍል ደረጃ': s.grade,
    'ሴክሽን': s.section,
    'የትምህርት ዘመን': `${s.academicYear} ዓ/ም`,
    'የወላጅ ስልክ': s.parentPhone || '',
    'አድራሻ': s.address || '',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ተማሪዎች');
  XLSX.writeFile(wb, fileName);
}

/**
 * Export all teachers to Excel
 */
export function exportTeachersToExcel(teachers: Teacher[], fileName: string = 'የመምህራንና_ሠራተኞች_ዝርዝር.xlsx') {
  const exportData = teachers.map((t, idx) => ({
    'ተ.ቁ': idx + 1,
    'የሠራተኞች ስም': t.name,
    'የሥራ ኃላፊነት': t.roleTitle || 'መምህር',
    'ስልክ ቁጥር': t.phone,
    'የመግቢያ ቁልፍ (PIN)': t.pin,
    'የክፍል ስም ጠሪ': t.isHomeroom ? `አዎ (${t.homeroomGrade} ${t.homeroomSection})` : 'አይደለም',
    'የተመደቡ ክፍሎች': t.assignments.map(a => `${a.grade}(${a.section})-${a.subjectName}`).join(', '),
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'መምህራንና ሠራተኞች');
  XLSX.writeFile(wb, fileName);
}
