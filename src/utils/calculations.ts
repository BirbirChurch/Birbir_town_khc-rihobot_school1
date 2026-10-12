import { Student, GradeEntry, SchoolSubject, GradePromotionRule } from '../types';
import { ALL_GRADES } from './studentIdGenerator';

export interface StudentRosterItem {
  student: Student;
  subjectScores: Record<string, { sem1: number | null; sem2: number | null; combined: number | null }>;
  sem1Total: number;
  sem1Avg: number;
  sem1Rank: number;
  sem2Total: number;
  sem2Avg: number;
  sem2Rank: number;
  annualTotal: number;
  annualAvg: number;
  annualRank: number;
  failingSubjectsCount: number;
  failedMandatorySubjects?: string[];
  failReason?: string;
  passed: boolean;
}

export function calculateClassRoster(
  students: Student[],
  grades: GradeEntry[],
  subjects: SchoolSubject[],
  gradeName: string,
  sectionName: string,
  academicYear: string,
  failThreshold: number = 2,
  passAverageThreshold: number = 50,
  mandatoryFailingSubjects: string[] = [],
  gradePromotionRules?: Record<string, GradePromotionRule>
): StudentRosterItem[] {
  const normGrade = (g: string) => {
    const l = g.toLowerCase();
    if (l.includes('8th') || l === '8') return '8ኛ ክፍል';
    if (l.includes('6th') || l === '6') return '6ኛ ክፍል';
    if (l.includes('7th') || l === '7') return '7ኛ ክፍል';
    return g;
  };

  const normSec = (sec: string) => {
    const u = sec.toUpperCase().trim();
    if (u === 'A') return 'ሀ';
    if (u === 'B') return 'ለ';
    if (u === 'C') return 'ሐ';
    if (u === 'D') return 'መ';
    return sec;
  };

  const targetNormGrade = normGrade(gradeName);
  const targetNormSec = normSec(sectionName);

  const classStudents = students.filter(s => {
    const sGrade = normGrade(s.grade);
    const sSec = normSec(s.section);
    const matchGrade = sGrade === targetNormGrade || s.grade === gradeName;
    const matchSec = sectionName === 'all' || sSec === targetNormSec || s.section === sectionName;
    const matchYear = academicYear === 'all' || s.academicYear === academicYear;
    return matchGrade && matchSec && matchYear;
  });

  const gradeSubjects = subjects.filter(sub => sub.applicableGrades.includes(gradeName) || sub.applicableGrades.includes(targetNormGrade));
  const subjectNames = gradeSubjects.map(s => s.name);

  // Check if there is a specific rule configured for this grade level
  const specificRule = gradePromotionRules?.[gradeName] || gradePromotionRules?.[targetNormGrade];
  const effectiveFailThreshold = specificRule ? specificRule.failThresholdSubjects : failThreshold;
  const effectivePassAvg = specificRule ? specificRule.passAverageThreshold : passAverageThreshold;
  const effectiveMandatorySubjects = specificRule ? specificRule.mandatoryFailingSubjects : mandatoryFailingSubjects;

  const roster: StudentRosterItem[] = classStudents.map(student => {
    const studentGrades = grades.filter(
      g => g.studentId === student.id && (academicYear === 'all' || g.academicYear === academicYear || g.academicYear === student.academicYear)
    );

    const subjectScores: Record<string, { sem1: number | null; sem2: number | null; combined: number | null }> = {};
    let sem1Sum = 0;
    let sem1Count = 0;
    let sem2Sum = 0;
    let sem2Count = 0;
    let failingCount = 0;

    subjectNames.forEach(subName => {
      const g1 = studentGrades.find(g => g.subjectName === subName && g.semester === 1);
      const g2 = studentGrades.find(g => g.subjectName === subName && g.semester === 2);

      const s1Score = g1 ? g1.marks.total : null;
      const s2Score = g2 ? g2.marks.total : null;

      let combined: number | null = null;
      if (s1Score !== null && s2Score !== null) {
        combined = Math.round(((s1Score + s2Score) / 2) * 10) / 10;
      } else if (s1Score !== null) {
        combined = s1Score;
      } else if (s2Score !== null) {
        combined = s2Score;
      }

      if (combined !== null && combined < 50) {
        failingCount++;
      }

      if (s1Score !== null) {
        sem1Sum += s1Score;
        sem1Count++;
      }
      if (s2Score !== null) {
        sem2Sum += s2Score;
        sem2Count++;
      }

      subjectScores[subName] = {
        sem1: s1Score,
        sem2: s2Score,
        combined,
      };
    });

    const sem1Avg = sem1Count > 0 ? Math.round((sem1Sum / sem1Count) * 10) / 10 : 0;
    const sem2Avg = sem2Count > 0 ? Math.round((sem2Sum / sem2Count) * 10) / 10 : 0;

    let annualAvg = 0;
    if (sem1Count > 0 && sem2Count > 0) {
      annualAvg = Math.round(((sem1Avg + sem2Avg) / 2) * 10) / 10;
    } else if (sem1Count > 0) {
      annualAvg = sem1Avg;
    } else if (sem2Count > 0) {
      annualAvg = sem2Avg;
    }

    const annualTotal = sem1Sum + sem2Sum;

    // Check failed mandatory subjects
    const failedMandatorySubjects: string[] = [];
    if (effectiveMandatorySubjects && effectiveMandatorySubjects.length > 0) {
      effectiveMandatorySubjects.forEach(mSub => {
        const score = subjectScores[mSub]?.combined;
        if (score !== null && score !== undefined && score < 50) {
          failedMandatorySubjects.push(mSub);
        }
      });
    }

    const isSubjectThresholdFailed = failingCount >= effectiveFailThreshold;
    const isAverageFailed = annualAvg > 0 && annualAvg < effectivePassAvg;
    const isMandatoryFailed = failedMandatorySubjects.length > 0;

    let failReason = '';
    if (isSubjectThresholdFailed && isMandatoryFailed) {
      failReason = `በ${failingCount} ትምህርቶች እና በወሳኝ ትምህርት (${failedMandatorySubjects.join(', ')}) < 50`;
    } else if (isMandatoryFailed) {
      failReason = `በወሳኝ ትምህርት (${failedMandatorySubjects.join(', ')}) < 50`;
    } else if (isSubjectThresholdFailed) {
      failReason = `በ${failingCount} ትምህርቶች < 50 (ጣሪያው ${effectiveFailThreshold})`;
    } else if (isAverageFailed) {
      failReason = `አማካይ (${annualAvg}%) ከ${effectivePassAvg}% በታች`;
    }

    const passed = !isSubjectThresholdFailed && !isAverageFailed && !isMandatoryFailed;

    return {
      student,
      subjectScores,
      sem1Total: sem1Sum,
      sem1Avg,
      sem1Rank: 0,
      sem2Total: sem2Sum,
      sem2Avg,
      sem2Rank: 0,
      annualTotal,
      annualAvg,
      annualRank: 0,
      failingSubjectsCount: failingCount,
      failedMandatorySubjects,
      failReason,
      passed,
    };
  });

  // Calculate Sem 1 Ranks
  const sortedSem1 = [...roster].sort((a, b) => b.sem1Avg - a.sem1Avg);
  sortedSem1.forEach((item, idx) => {
    item.sem1Rank = item.sem1Avg > 0 ? idx + 1 : 0;
  });

  // Calculate Sem 2 Ranks
  const sortedSem2 = [...roster].sort((a, b) => b.sem2Avg - a.sem2Avg);
  sortedSem2.forEach((item, idx) => {
    item.sem2Rank = item.sem2Avg > 0 ? idx + 1 : 0;
  });

  // Calculate Annual Ranks
  const sortedAnnual = [...roster].sort((a, b) => b.annualAvg - a.annualAvg);
  sortedAnnual.forEach((item, idx) => {
    item.annualRank = item.annualAvg > 0 ? idx + 1 : 0;
  });

  return roster;
}

export interface GenderTierStats {
  maleCount: number;
  malePercent: number;
  femaleCount: number;
  femalePercent: number;
  totalCount: number;
  totalPercent: number;
}

export interface PerformanceAnalysis {
  above75: GenderTierStats;
  between50And74: GenderTierStats;
  below50: GenderTierStats;
  totalStudents: number;
  maleTotal: number;
  femaleTotal: number;
}

export function calculateClassPerformanceAnalysis(roster: StudentRosterItem[]): PerformanceAnalysis {
  let maleTotal = 0;
  let femaleTotal = 0;

  let mAbove75 = 0;
  let fAbove75 = 0;

  let m50to74 = 0;
  let f50to74 = 0;

  let mBelow50 = 0;
  let fBelow50 = 0;

  roster.forEach(r => {
    const isMale = r.student.gender === 'ወንድ';
    if (isMale) maleTotal++;
    else femaleTotal++;

    const score = r.annualAvg > 0 ? r.annualAvg : r.sem1Avg;
    if (score >= 75) {
      if (isMale) mAbove75++;
      else fAbove75++;
    } else if (score >= 50) {
      if (isMale) m50to74++;
      else f50to74++;
    } else {
      if (isMale) mBelow50++;
      else fBelow50++;
    }
  });

  const total = roster.length || 1;
  const mTotalSafe = maleTotal || 1;
  const fTotalSafe = femaleTotal || 1;

  return {
    totalStudents: roster.length,
    maleTotal,
    femaleTotal,
    above75: {
      maleCount: mAbove75,
      malePercent: Math.round((mAbove75 / mTotalSafe) * 100),
      femaleCount: fAbove75,
      femalePercent: Math.round((fAbove75 / fTotalSafe) * 100),
      totalCount: mAbove75 + fAbove75,
      totalPercent: Math.round(((mAbove75 + fAbove75) / total) * 100),
    },
    between50And74: {
      maleCount: m50to74,
      malePercent: Math.round((m50to74 / mTotalSafe) * 100),
      femaleCount: f50to74,
      femalePercent: Math.round((f50to74 / fTotalSafe) * 100),
      totalCount: m50to74 + f50to74,
      totalPercent: Math.round(((m50to74 + f50to74) / total) * 100),
    },
    below50: {
      maleCount: mBelow50,
      malePercent: Math.round((mBelow50 / mTotalSafe) * 100),
      femaleCount: fBelow50,
      femalePercent: Math.round((fBelow50 / fTotalSafe) * 100),
      totalCount: mBelow50 + fBelow50,
      totalPercent: Math.round(((mBelow50 + fBelow50) / total) * 100),
    },
  };
}

export function calculateSubjectPerformanceAnalysis(
  roster: StudentRosterItem[],
  subjectName: string
): PerformanceAnalysis {
  let maleTotal = 0;
  let femaleTotal = 0;

  let mAbove75 = 0;
  let fAbove75 = 0;
  let m50to74 = 0;
  let f50to74 = 0;
  let mBelow50 = 0;
  let fBelow50 = 0;

  roster.forEach(r => {
    const isMale = r.student.gender === 'ወንድ';
    const sub = r.subjectScores[subjectName];
    if (!sub || sub.combined === null) return;

    if (isMale) maleTotal++;
    else femaleTotal++;

    const score = sub.combined;
    if (score >= 75) {
      if (isMale) mAbove75++;
      else fAbove75++;
    } else if (score >= 50) {
      if (isMale) m50to74++;
      else f50to74++;
    } else {
      if (isMale) mBelow50++;
      else fBelow50++;
    }
  });

  const total = (maleTotal + femaleTotal) || 1;
  const mTotalSafe = maleTotal || 1;
  const fTotalSafe = femaleTotal || 1;

  return {
    totalStudents: maleTotal + femaleTotal,
    maleTotal,
    femaleTotal,
    above75: {
      maleCount: mAbove75,
      malePercent: Math.round((mAbove75 / mTotalSafe) * 100),
      femaleCount: fAbove75,
      femalePercent: Math.round((fAbove75 / fTotalSafe) * 100),
      totalCount: mAbove75 + fAbove75,
      totalPercent: Math.round(((mAbove75 + fAbove75) / total) * 100),
    },
    between50And74: {
      maleCount: m50to74,
      malePercent: Math.round((m50to74 / mTotalSafe) * 100),
      femaleCount: f50to74,
      femalePercent: Math.round((f50to74 / fTotalSafe) * 100),
      totalCount: m50to74 + f50to74,
      totalPercent: Math.round(((m50to74 + f50to74) / total) * 100),
    },
    below50: {
      maleCount: mBelow50,
      malePercent: Math.round((mBelow50 / mTotalSafe) * 100),
      femaleCount: fBelow50,
      femalePercent: Math.round((fBelow50 / fTotalSafe) * 100),
      totalCount: mBelow50 + fBelow50,
      totalPercent: Math.round(((mBelow50 + fBelow50) / total) * 100),
    },
  };
}

export interface SubjectOverallSummary {
  subjectName: string;
  testedCount: number;
  average: number;
  highest: number;
  lowest: number;
  passCount: number;
  failCount: number;
  passRate: number;
  analysis: PerformanceAnalysis;
}

export function calculateAllSubjectsAnalysis(
  roster: StudentRosterItem[],
  subjects: { name: string }[]
): SubjectOverallSummary[] {
  return subjects.map(sub => {
    const analysis = calculateSubjectPerformanceAnalysis(roster, sub.name);
    let totalScore = 0;
    let count = 0;
    let highest = 0;
    let lowest = 100;
    let passCount = 0;
    let failCount = 0;

    roster.forEach(r => {
      const scoreObj = r.subjectScores[sub.name];
      if (scoreObj && scoreObj.combined !== null) {
        const val = scoreObj.combined;
        count++;
        totalScore += val;
        if (val > highest) highest = val;
        if (val < lowest) lowest = val;
        if (val >= 50) passCount++;
        else failCount++;
      }
    });

    if (count === 0) {
      lowest = 0;
    }

    const average = count > 0 ? Math.round((totalScore / count) * 10) / 10 : 0;
    const passRate = count > 0 ? Math.round((passCount / count) * 100) : 0;

    return {
      subjectName: sub.name,
      testedCount: count,
      average,
      highest,
      lowest,
      passCount,
      failCount,
      passRate,
      analysis,
    };
  });
}

export function getNextGradeLevel(currentGrade: string): string {
  const idx = ALL_GRADES.indexOf(currentGrade);
  if (idx !== -1 && idx < ALL_GRADES.length - 1) {
    return ALL_GRADES[idx + 1];
  }
  return currentGrade; // Already at top or not matched
}
