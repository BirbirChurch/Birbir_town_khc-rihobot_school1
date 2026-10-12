import React, { useState, useEffect } from 'react';
import {
  UserRole,
  Student,
  Teacher,
  SchoolSubject,
  GradeEntry,
  SchoolSettings,
  ParentFeedback,
  TeacherLetter,
} from './types';
import {
  loadSettings,
  saveSettings,
  loadStudents,
  saveStudents,
  loadTeachers,
  saveTeachers,
  loadGrades,
  saveGrades,
  loadSubjects,
  saveSubjects,
  loadFeedbacks,
  saveFeedbacks,
  loadLetters,
  saveLetters,
  resetAllDataToDefault,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { AdminPortal } from './components/AdminPortal';
import { PrincipalPortal } from './components/PrincipalPortal';
import { KgDirectorPortal } from './components/KgDirectorPortal';
import { TeacherPortal } from './components/TeacherPortal';
import { ParentPortal } from './components/ParentPortal';
import { RotateCcw } from 'lucide-react';

export default function App() {
  // Persistent data state
  const [settings, setSettings] = useState<SchoolSettings>(() => loadSettings());
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadTeachers());
  const [grades, setGrades] = useState<GradeEntry[]>(() => loadGrades());
  const [subjects, setSubjects] = useState<SchoolSubject[]>(() => loadSubjects());
  const [feedbacks, setFeedbacks] = useState<ParentFeedback[]>(() => loadFeedbacks());
  const [letters, setLetters] = useState<TeacherLetter[]>(() => loadLetters());

  // Save on state updates
  useEffect(() => { saveSettings(settings); }, [settings]);
  useEffect(() => { saveStudents(students); }, [students]);
  useEffect(() => { saveTeachers(teachers); }, [teachers]);
  useEffect(() => { saveGrades(grades); }, [grades]);
  useEffect(() => { saveSubjects(subjects); }, [subjects]);
  useEffect(() => { saveFeedbacks(feedbacks); }, [feedbacks]);
  useEffect(() => { saveLetters(letters); }, [letters]);

  // Auth / Active user state
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [currentStudent, setCurrentStudent] = useState<Student | undefined>(undefined);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | undefined>(undefined);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('home');

  // Login handler
  const handleLoginSuccess = (
    role: UserRole,
    userName: string,
    studentData?: Student,
    teacherData?: Teacher
  ) => {
    setCurrentRole(role);
    setCurrentUserName(userName);
    setCurrentStudent(studentData);
    setCurrentTeacher(teacherData);

    // Set initial default tab for role
    switch (role) {
      case 'super_admin':
        setActiveTab('promotion');
        break;
      case 'principal':
      case 'vice_principal':
        setActiveTab('roster');
        break;
      case 'kg_director':
        setActiveTab('kg_sections');
        break;
      case 'teacher':
        setActiveTab('marks_entry');
        break;
      case 'parent':
        setActiveTab('report_card');
        break;
      default:
        setActiveTab('home');
    }
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setCurrentUserName('');
    setCurrentStudent(undefined);
    setCurrentTeacher(undefined);
    setActiveTab('home');
  };

  const handleUpdateLogo = (newLogo: string) => {
    setSettings(prev => ({
      ...prev,
      customLogo: newLogo,
    }));
  };

  // Strictly Nothing shown on dashboard until logged in
  if (!currentRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 p-4">
        <LoginScreen
          settings={settings}
          teachers={teachers}
          students={students}
          onLoginSuccess={handleLoginSuccess}
          onUpdateLogo={handleUpdateLogo}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* 3-zone Top Bar Contract Navigation */}
      <Navbar
        currentRole={currentRole}
        currentUserName={currentUserName}
        academicYear={settings.currentAcademicYear}
        semester={settings.currentSemester}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        logoUrl={settings.customLogo}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 1. Super Admin View */}
        {currentRole === 'super_admin' && (
          <AdminPortal
            students={students}
            setStudents={setStudents}
            teachers={teachers}
            setTeachers={setTeachers}
            subjects={subjects}
            setSubjects={setSubjects}
            settings={settings}
            setSettings={setSettings}
            grades={grades}
            setGrades={setGrades}
            feedbacks={feedbacks}
            setFeedbacks={setFeedbacks}
            letters={letters}
            setLetters={setLetters}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}

            {/* 2 & 3. Principal & Vice Principal View */}
            {(currentRole === 'principal' || currentRole === 'vice_principal') && (
              <PrincipalPortal
                isVicePrincipal={currentRole === 'vice_principal'}
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
                activeTab={activeTab}
              />
            )}

            {/* 4. KG Director View */}
            {currentRole === 'kg_director' && (
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
                activeTab={activeTab}
              />
            )}

            {/* 5. Teacher View */}
            {currentRole === 'teacher' && currentTeacher && (
              <TeacherPortal
                currentTeacher={currentTeacher}
                students={students}
                setStudents={setStudents}
                grades={grades}
                setGrades={setGrades}
                subjects={subjects}
                settings={settings}
                activeTab={activeTab}
              />
            )}

            {/* 6. Parent View */}
            {currentRole === 'parent' && currentStudent && (
              <ParentPortal
                currentStudent={currentStudent}
                students={students}
                grades={grades}
                subjects={subjects}
                settings={settings}
                feedbacks={feedbacks}
                setFeedbacks={setFeedbacks}
                activeTab={activeTab}
              />
            )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              የብርብር ከተማ ቃለ ሕይወት ርኆቦት መካከለኛና የመጀመሪያ ደረጃ ትምህርት ቤት
            </span>
            <span>·</span>
            <span>© {settings.currentAcademicYear} ዓ/ም</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => resetAllDataToDefault()}
              title="ሁሉንም መረጃ ወደ መጀመሪያው የሙከራ ዳታ መልስ"
              className="flex items-center gap-1.5 text-slate-500 hover:text-rose-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ዳታ ወደ ነባሪ መልስ (Reset Demo)</span>
            </button>
            <span>·</span>
            <span>የውጤትና ሮስተር ስርዓት</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
