import { SchoolSubject } from '../types';

export const INITIAL_SUBJECTS: SchoolSubject[] = [
  // Preschool (ማቆያ - ደረጃ 2)
  {
    id: 'sub-gamo-pre',
    name: 'ጋሞኛ (የአካባቢ ቋንቋ)',
    englishName: 'Gamo (Mother Tongue)',
    cycles: ['preschool'],
    applicableGrades: ['ማቆያ', 'ደረጃ 1', 'ደረጃ 2']
  },
  {
    id: 'sub-math-pre',
    name: 'ሂሳብ (የመጀመሪያ)',
    englishName: 'Early Mathematics (Numeracy)',
    cycles: ['preschool'],
    applicableGrades: ['ማቆያ', 'ደረጃ 1', 'ደረጃ 2']
  },
  {
    id: 'sub-env-pre',
    name: 'አካባቢ ሳይንስ',
    englishName: 'Environmental Science',
    cycles: ['preschool'],
    applicableGrades: ['ማቆያ', 'ደረጃ 1', 'ደረጃ 2']
  },
  {
    id: 'sub-pe-pre',
    name: 'የሰውነትና ማጎልመሻ',
    englishName: 'Physical Development',
    cycles: ['preschool'],
    applicableGrades: ['ማቆያ', 'ደረጃ 1', 'ደረጃ 2']
  },
  {
    id: 'sub-eng-pre',
    name: 'እንግሊዝኛ',
    englishName: 'English',
    cycles: ['preschool'],
    applicableGrades: ['ማቆያ', 'ደረጃ 1', 'ደረጃ 2']
  },

  // First Cycle (1ኛ - 6ኛ ክፍል)
  {
    id: 'sub-gamo-pri',
    name: 'ጋሞኛ (አፍ መፈቻ ቋንቋ)',
    englishName: 'Gamo (Mother Tongue)',
    cycles: ['first_cycle'],
    applicableGrades: ['1ኛ ክፍል', '2ኛ ክፍል', '3ኛ ክፍል', '4ኛ ክፍል', '5ኛ ክፍል', '6ኛ ክፍል']
  },
  {
    id: 'sub-amh-pri',
    name: 'አማርኛ (የፌዴራል ቋንቋ)',
    englishName: 'Amharic (Federal Language)',
    cycles: ['first_cycle'],
    applicableGrades: ['1ኛ ክፍል', '2ኛ ክፍል', '3ኛ ክፍል', '4ኛ ክፍል', '5ኛ ክፍል', '6ኛ ክፍል']
  },
  {
    id: 'sub-eng-pri',
    name: 'እንግሊዝኛ',
    englishName: 'English Language',
    cycles: ['first_cycle'],
    applicableGrades: ['1ኛ ክፍል', '2ኛ ክፍል', '3ኛ ክፍል', '4ኛ ክፍል', '5ኛ ክፍል', '6ኛ ክፍል']
  },
  {
    id: 'sub-math-pri',
    name: 'ሂሳብ',
    englishName: 'Mathematics',
    cycles: ['first_cycle'],
    applicableGrades: ['1ኛ ክፍል', '2ኛ ክፍል', '3ኛ ክፍል', '4ኛ ክፍል', '5ኛ ክፍል', '6ኛ ክፍል']
  },
  {
    id: 'sub-env-pri',
    name: 'አካባቢ ሳይንስ',
    englishName: 'Environmental Science',
    cycles: ['first_cycle'],
    applicableGrades: ['1ኛ ክፍል', '2ኛ ክፍል', '3ኛ ክፍል', '4ኛ ክፍል', '5ኛ ክፍል', '6ኛ ክፍል']
  },
  {
    id: 'sub-ethics-pri',
    name: 'ሥነ-ዜጋና ሥነ-ምግባር',
    englishName: 'Ethical and Citizenship Education',
    cycles: ['first_cycle'],
    applicableGrades: ['1ኛ ክፍል', '2ኛ ክፍል', '3ኛ ክፍል', '4ኛ ክፍል', '5ኛ ክፍል', '6ኛ ክፍል']
  },
  {
    id: 'sub-pva-pri',
    name: 'ሥነ-ጥበብ (PVA)',
    englishName: 'Performing and Visual Arts',
    cycles: ['first_cycle'],
    applicableGrades: ['1ኛ ክፍል', '2ኛ ክፍል', '3ኛ ክፍል', '4ኛ ክፍል', '5ኛ ክፍል', '6ኛ ክፍል']
  },
  {
    id: 'sub-pe-pri',
    name: 'የሰውነት ማሳደጊያ / ስፖርት',
    englishName: 'Physical Education (PE)',
    cycles: ['first_cycle'],
    applicableGrades: ['1ኛ ክፍል', '2ኛ ክፍል', '3ኛ ክፍል', '4ኛ ክፍል', '5ኛ ክፍል', '6ኛ ክፍል']
  },
  {
    id: 'sub-cte-pri',
    name: 'የሙያና ቴክኖሎጂ ትምህርት (CTE)',
    englishName: 'Career and Technical Education',
    cycles: ['first_cycle'],
    applicableGrades: ['5ኛ ክፍል', '6ኛ ክፍል']
  },

  // Second Cycle (7ኛ - 8ኛ ክፍል / 12 subjects)
  {
    id: 'sub-gamo-mid',
    name: 'ጋሞኛ',
    englishName: 'Gamo Language',
    cycles: ['second_cycle'],
    applicableGrades: ['7ኛ ክፍል', '8ኛ ክፍል']
  },
  {
    id: 'sub-amh-mid',
    name: 'አማርኛ',
    englishName: 'Amharic Language',
    cycles: ['second_cycle'],
    applicableGrades: ['7ኛ ክፍል', '8ኛ ክፍል']
  },
  {
    id: 'sub-eng-mid',
    name: 'እንግሊዝኛ',
    englishName: 'English Language',
    cycles: ['second_cycle'],
    applicableGrades: ['7ኛ ክፍል', '8ኛ ክፍል']
  },
  {
    id: 'sub-math-mid',
    name: 'ሂሳብ',
    englishName: 'Mathematics',
    cycles: ['second_cycle'],
    applicableGrades: ['7ኛ ክፍል', '8ኛ ክፍል']
  },
  {
    id: 'sub-phy-mid',
    name: 'ፊዚክስ',
    englishName: 'Physics',
    cycles: ['second_cycle'],
    applicableGrades: ['7ኛ ክፍል', '8ኛ ክፍል']
  },
  {
    id: 'sub-chem-mid',
    name: 'ኬሚስትሪ',
    englishName: 'Chemistry',
    cycles: ['second_cycle'],
    applicableGrades: ['7ኛ ክፍል', '8ኛ ክፍል']
  },
  {
    id: 'sub-bio-mid',
    name: 'ባዮሎጂ',
    englishName: 'Biology',
    cycles: ['second_cycle'],
    applicableGrades: ['7ኛ ክፍል', '8ኛ ክፍል']
  },
  {
    id: 'sub-soc-mid',
    name: 'ማህበራዊ ሳይንስ',
    englishName: 'Social Studies',
    cycles: ['second_cycle'],
    applicableGrades: ['7ኛ ክፍል', '8ኛ ክፍል']
  },
  {
    id: 'sub-cit-mid',
    name: 'ዜግነት ትምህርት',
    englishName: 'Citizenship Education',
    cycles: ['second_cycle'],
    applicableGrades: ['7ኛ ክፍል', '8ኛ ክፍል']
  },
  {
    id: 'sub-cte-mid',
    name: 'የሙያና ቴክኖሎጂ ትምህርት (CTE)',
    englishName: 'Career and Technical Education',
    cycles: ['second_cycle'],
    applicableGrades: ['7ኛ ክፍል', '8ኛ ክፍል']
  },
  {
    id: 'sub-pe-mid',
    name: 'የሰውነት ማሳደጊያ / ስፖርት',
    englishName: 'Physical Education (PE)',
    cycles: ['second_cycle'],
    applicableGrades: ['7ኛ ክፍል', '8ኛ ክፍል']
  },
  {
    id: 'sub-pva-mid',
    name: 'ሥነ-ጥበብ (PVA)',
    englishName: 'Performing and Visual Arts',
    cycles: ['second_cycle'],
    applicableGrades: ['7ኛ ክፍል', '8ኛ ክፍል']
  },

  // Secondary 9th - 10th
  {
    id: 'sub-eng-sec',
    name: 'እንግሊዝኛ',
    englishName: 'English',
    cycles: ['secondary'],
    applicableGrades: ['9ኛ ክፍል', '10ኛ ክፍል']
  },
  {
    id: 'sub-amh-sec',
    name: 'አማርኛ',
    englishName: 'Amharic',
    cycles: ['secondary'],
    applicableGrades: ['9ኛ ክፍል', '10ኛ ክፍል']
  },
  {
    id: 'sub-math-sec',
    name: 'ሂሳብ',
    englishName: 'Mathematics',
    cycles: ['secondary'],
    applicableGrades: ['9ኛ ክፍል', '10ኛ ክፍል']
  },
  {
    id: 'sub-phy-sec',
    name: 'ፊዚክስ',
    englishName: 'Physics',
    cycles: ['secondary'],
    applicableGrades: ['9ኛ ክፍል', '10ኛ ክፍል']
  },
  {
    id: 'sub-chem-sec',
    name: 'ኬሚስትሪ',
    englishName: 'Chemistry',
    cycles: ['secondary'],
    applicableGrades: ['9ኛ ክፍል', '10ኛ ክፍል']
  },
  {
    id: 'sub-bio-sec',
    name: 'ባዮሎጂ',
    englishName: 'Biology',
    cycles: ['secondary'],
    applicableGrades: ['9ኛ ክፍል', '10ኛ ክፍል']
  },
  {
    id: 'sub-hist-sec',
    name: 'ታሪክ',
    englishName: 'History',
    cycles: ['secondary'],
    applicableGrades: ['9ኛ ክፍል', '10ኛ ክፍል']
  },
  {
    id: 'sub-geo-sec',
    name: 'ጂኦግራፊ',
    englishName: 'Geography',
    cycles: ['secondary'],
    applicableGrades: ['9ኛ ክፍል', '10ኛ ክፍል']
  },
  {
    id: 'sub-cit-sec',
    name: 'ዜግነት ትምህርት',
    englishName: 'Citizenship Education',
    cycles: ['secondary'],
    applicableGrades: ['9ኛ ክፍል', '10ኛ ክፍል']
  },
  {
    id: 'sub-ict-sec',
    name: 'ኢንፎርሜሽን ኮሙኒኬሽን ቴክኖሎጂ (ICT)',
    englishName: 'ICT',
    cycles: ['secondary'],
    applicableGrades: ['9ኛ ክፍል', '10ኛ ክፍል']
  },
  {
    id: 'sub-pe-sec',
    name: 'የሰውነት ማሳደጊያ / ስፖርት',
    englishName: 'Physical Education (PE)',
    cycles: ['secondary'],
    applicableGrades: ['9ኛ ክፍል', '10ኛ ክፍል']
  },

  // Preparatory Natural Science (11th - 12th)
  {
    id: 'sub-eng-prep-nat',
    name: 'እንግሊዝኛ',
    englishName: 'English',
    cycles: ['prep_natural'],
    applicableGrades: ['11ኛ ክፍል (ተፈጥሮ)', '12ኛ ክፍል (ተፈጥሮ)']
  },
  {
    id: 'sub-math-prep-nat',
    name: 'ሂሳብ (ለናቹራል)',
    englishName: 'Advanced Mathematics',
    cycles: ['prep_natural'],
    applicableGrades: ['11ኛ ክፍል (ተፈጥሮ)', '12ኛ ክፍል (ተፈጥሮ)']
  },
  {
    id: 'sub-phy-prep-nat',
    name: 'ፊዚክስ',
    englishName: 'Physics',
    cycles: ['prep_natural'],
    applicableGrades: ['11ኛ ክፍል (ተፈጥሮ)', '12ኛ ክፍል (ተፈጥሮ)']
  },
  {
    id: 'sub-chem-prep-nat',
    name: 'ኬሚስትሪ',
    englishName: 'Chemistry',
    cycles: ['prep_natural'],
    applicableGrades: ['11ኛ ክፍል (ተፈጥሮ)', '12ኛ ክፍል (ተፈጥሮ)']
  },
  {
    id: 'sub-bio-prep-nat',
    name: 'ባዮሎጂ',
    englishName: 'Biology',
    cycles: ['prep_natural'],
    applicableGrades: ['11ኛ ክፍል (ተፈጥሮ)', '12ኛ ክፍል (ተፈጥሮ)']
  },
  {
    id: 'sub-ict-prep-nat',
    name: 'ኢንፎርሜሽን ኮሙኒኬሽን ቴክኖሎጂ (ICT)',
    englishName: 'ICT',
    cycles: ['prep_natural'],
    applicableGrades: ['11ኛ ክፍል (ተፈጥሮ)', '12ኛ ክፍል (ተፈጥሮ)']
  },
  {
    id: 'sub-cit-prep-nat',
    name: 'ዜግነት ትምህርት',
    englishName: 'Citizenship Education',
    cycles: ['prep_natural'],
    applicableGrades: ['11ኛ ክፍል (ተፈጥሮ)', '12ኛ ክፍል (ተፈጥሮ)']
  },

  // Preparatory Social Science (11th - 12th)
  {
    id: 'sub-eng-prep-soc',
    name: 'እንግሊዝኛ',
    englishName: 'English',
    cycles: ['prep_social'],
    applicableGrades: ['11ኛ ክፍል (ማህበራዊ)', '12ኛ ክፍል (ማህበራዊ)']
  },
  {
    id: 'sub-math-prep-soc',
    name: 'ሂሳብ (ለሶሻል)',
    englishName: 'Social Mathematics',
    cycles: ['prep_social'],
    applicableGrades: ['11ኛ ክፍል (ማህበራዊ)', '12ኛ ክፍል (ማህበራዊ)']
  },
  {
    id: 'sub-hist-prep-soc',
    name: 'ታሪክ',
    englishName: 'History',
    cycles: ['prep_social'],
    applicableGrades: ['11ኛ ክፍል (ማህበራዊ)', '12ኛ ክፍል (ማህበራዊ)']
  },
  {
    id: 'sub-geo-prep-soc',
    name: 'ጂኦግራፊ',
    englishName: 'Geography',
    cycles: ['prep_social'],
    applicableGrades: ['11ኛ ክፍል (ማህበራዊ)', '12ኛ ክፍል (ማህበራዊ)']
  },
  {
    id: 'sub-econ-prep-soc',
    name: 'ኢኮኖሚክስ',
    englishName: 'Economics',
    cycles: ['prep_social'],
    applicableGrades: ['11ኛ ክፍል (ማህበራዊ)', '12ኛ ክፍል (ማህበራዊ)']
  },
  {
    id: 'sub-psy-prep-soc',
    name: 'ስነ-ልቦና / ስነ-ማህበረሰብ',
    englishName: 'General Psychology / Sociology',
    cycles: ['prep_social'],
    applicableGrades: ['11ኛ ክፍል (ማህበራዊ)', '12ኛ ክፍል (ማህበራዊ)']
  },
  {
    id: 'sub-cit-prep-soc',
    name: 'ዜግነት ትምህርት',
    englishName: 'Citizenship Education',
    cycles: ['prep_social'],
    applicableGrades: ['11ኛ ክፍል (ማህበራዊ)', '12ኛ ክፍል (ማህበራዊ)']
  }
];

export function getSubjectsForGrade(grade: string, allSubjects: SchoolSubject[]): SchoolSubject[] {
  return allSubjects.filter(sub => sub.applicableGrades.includes(grade));
}
