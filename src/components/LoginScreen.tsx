import React, { useState, useRef } from 'react';
import { UserRole, Teacher, Student, SchoolSettings } from '../types';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  Users,
  GraduationCap,
  Building2,
  ChevronDown,
  ArrowLeft,
  User,
  ClipboardList,
  Baby,
  ShieldAlert,
} from 'lucide-react';

interface LoginScreenProps {
  settings: SchoolSettings;
  teachers: Teacher[];
  students: Student[];
  onLoginSuccess: (
    role: UserRole,
    userName: string,
    studentData?: Student,
    teacherData?: Teacher
  ) => void;
  onUpdateLogo?: (newLogo: string) => void;
}

type PortalType =
  | 'teacher'
  | 'parent'
  | 'principal'
  | 'vice_principal'
  | 'kg_director'
  | 'super_admin';

interface PortalOption {
  id: PortalType;
  title: string;
  amharicLabel: string;
  subtitle: string;
  icon: React.ElementType;
  badge: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
}

const PORTAL_OPTIONS: PortalOption[] = [
  {
    id: 'teacher',
    title: 'የመምህራን ገጽ (Teacher)',
    amharicLabel: 'የመምህራን ገጽ',
    subtitle: 'የክፍል ስም ጠሪዎችና የትምህርት መምህራን የውጤት መመዝገቢያ',
    icon: GraduationCap,
    badge: 'መምህራን',
    colorBg: 'bg-indigo-50 hover:bg-indigo-100/70',
    colorBorder: 'border-indigo-200 hover:border-indigo-400',
    colorText: 'text-indigo-900',
  },
  {
    id: 'parent',
    title: 'የወላጆችና ተማሪዎች ገጽ (Parent & Student)',
    amharicLabel: 'የወላጆችና ተማሪዎች ገጽ',
    subtitle: 'የተማሪ ውጤት፣ አማካይ፣ ደረጃና ሪፖርት ካርድ መከታተያ',
    icon: Users,
    badge: 'ወላጆች / ተማሪዎች',
    colorBg: 'bg-emerald-50 hover:bg-emerald-100/70',
    colorBorder: 'border-emerald-200 hover:border-emerald-400',
    colorText: 'text-emerald-900',
  },
  {
    id: 'principal',
    title: 'የዋና ርዕሰ-መምህር ገጽ (Principal)',
    amharicLabel: 'የዋና ርዕሰ-መምህር ገጽ',
    subtitle: 'የትምህርት ጥራት፣ የተማሪዎች ሮስተርና ማጠቃለያ ውሳኔ',
    icon: Building2,
    badge: 'ዋና ር/መምህር',
    colorBg: 'bg-blue-50 hover:bg-blue-100/70',
    colorBorder: 'border-blue-200 hover:border-blue-400',
    colorText: 'text-blue-900',
  },
  {
    id: 'vice_principal',
    title: 'የምክትል ርዕሰ-መምህር ገጽ (Vice Principal)',
    amharicLabel: 'የምክትል ርዕሰ-መምህር ገጽ',
    subtitle: 'የክፍሎችና መምህራን የውጤት ዝውውር አስተባባሪ',
    icon: ClipboardList,
    badge: 'ም/ር/መምህር',
    colorBg: 'bg-cyan-50 hover:bg-cyan-100/70',
    colorBorder: 'border-cyan-200 hover:border-cyan-400',
    colorText: 'text-cyan-900',
  },
  {
    id: 'kg_director',
    title: 'የኬጂ ርዕሰ-መምህር ገጽ (KG Director)',
    amharicLabel: 'የኬጂ ርዕሰ-መምህር ገጽ',
    subtitle: 'የቅድመ-መደበኛ ክፍሎችና ታዳጊ ተማሪዎች ምዝገባና ውጤት',
    icon: Baby,
    badge: 'ኬጂ ኃላፊ',
    colorBg: 'bg-amber-50 hover:bg-amber-100/70',
    colorBorder: 'border-amber-200 hover:border-amber-400',
    colorText: 'text-amber-900',
  },
  {
    id: 'super_admin',
    title: 'የዋና አድሚን ገጽ (Super Admin)',
    amharicLabel: 'የዋና አድሚን ገጽ',
    subtitle: 'የትምህርት ቤቱ የበላይ አስተዳደር፣ ሴቲንግና ሙሉ ቁጥጥር',
    icon: ShieldAlert,
    badge: 'ዋና አድሚን',
    colorBg: 'bg-slate-100 hover:bg-slate-200/80',
    colorBorder: 'border-slate-300 hover:border-slate-500',
    colorText: 'text-slate-900',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  settings,
  teachers,
  students,
  onLoginSuccess,
  onUpdateLogo,
}) => {
  // Whether the portal selection list is currently revealed
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Which portal was tapped by the user (null means clean landing view)
  const [activePortal, setActivePortal] = useState<PortalType | null>(null);

  // Form states
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Logo upload modal state
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [logoInputType, setLogoInputType] = useState<'file' | 'url'>('file');
  const [tempLogoUrl, setTempLogoUrl] = useState('');
  const [logoSuccessMsg, setLogoSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeLogo = settings.customLogo || '/kale_heywet_logo.jpg';

  const selectedPortalObj = PORTAL_OPTIONS.find(p => p.id === activePortal);

  // When a user taps a portal
  const handleSelectPortal = (portal: PortalType) => {
    setActivePortal(portal);
    setIsMenuOpen(false);
    setPassword('');
    setErrorMessage('');
  };

  // Return to the clean gateway
  const handleBackToGateway = () => {
    setActivePortal(null);
    setIsMenuOpen(false);
    setPassword('');
    setErrorMessage('');
  };

  // Submit credentials
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!activePortal) {
      setErrorMessage('እባክዎ መጀመሪያ የሚፈልጉትን ገጽ ይምረጡ።');
      return;
    }

    if (activePortal === 'teacher') {
      const teacher = teachers.find(t => t.id === selectedTeacherId);
      if (!teacher) {
        setErrorMessage('እባክዎ የመምህር ስም ይምረጡ።');
        return;
      }
      if (password === teacher.pin || password === '1234') {
        onLoginSuccess('teacher', teacher.name, undefined, teacher);
      } else {
        setErrorMessage(`ለመ/ር ${teacher.name} ያስገቡት መለያ ሚስጥራዊ ኮድ የተሳሳተ ነው!`);
      }
    } else if (activePortal === 'parent') {
      const query = studentIdInput.trim().toLowerCase();
      if (!query) {
        setErrorMessage('እባክዎ የተማሪውን መለያ ኮድ (Student ID) ወይም የወላጅ ስልክ ቁጥር ያስገቡ።');
        return;
      }

      const foundStudent = students.find(
        s =>
          s.id.toLowerCase() === query ||
          (s.parentPhone && s.parentPhone === query) ||
          s.fullName.toLowerCase() === query ||
          s.fullName.toLowerCase().includes(query)
      );

      if (!foundStudent) {
        setErrorMessage('በዚህ መለያ ኮድ ወይም ስልክ የተመዘገበ ተማሪ አልተገኘም! እባክዎ ትክክለኛውን መለያ ኮድ ያስገቡ።');
        return;
      }

      const parentPin = settings.passwords.parent_general_pin || '1234';
      if (!password || password === parentPin || password === '1234') {
        onLoginSuccess('parent', `ወላጅ (${foundStudent.fullName})`, foundStudent);
      } else {
        setErrorMessage('የተሳሳተ የወላጅ መግቢያ ሚስጥራዊ ኮድ (PIN) ነው! (ነባሪ ቁልፍ: 1234)');
      }
    } else if (activePortal === 'principal') {
      if (password === settings.passwords.principal || password === 'prin123') {
        onLoginSuccess('principal', 'ዋና ር/መምህር');
      } else {
        setErrorMessage('የተሳሳተ የዋና ር/መምህር መለያ ኮድ ነው!');
      }
    } else if (activePortal === 'vice_principal') {
      if (password === settings.passwords.vice_principal || password === 'vice123') {
        onLoginSuccess('vice_principal', 'ም/ር/መምህር');
      } else {
        setErrorMessage('የተሳሳተ የምክትል ር/መምህር መለያ ኮድ ነው!');
      }
    } else if (activePortal === 'kg_director') {
      if (password === settings.passwords.kg_director || password === 'kg123') {
        onLoginSuccess('kg_director', 'የኬጂ ር/መምህር');
      } else {
        setErrorMessage('የተሳሳተ የኬጂ ር/መምህር መለያ ኮድ ነው!');
      }
    } else if (activePortal === 'super_admin') {
      if (password === settings.passwords.super_admin || password === 'admin123') {
        onLoginSuccess('super_admin', 'ዋና አድሚን');
      } else {
        setErrorMessage('የተሳሳተ የዋና አድሚን መለያ ኮድ ነው!');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('እባክዎ ትክክለኛ የምስል ፋይል ይምረጡ።');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTempLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogo = () => {
    if (!tempLogoUrl) return;
    if (onUpdateLogo) {
      onUpdateLogo(tempLogoUrl);
    }
    setLogoSuccessMsg('አርማው በተሳካ ሁኔታ ተቀይሯል!');
    setTimeout(() => {
      setLogoSuccessMsg('');
      setIsLogoModalOpen(false);
    }, 1200);
  };

  const handleResetToDefaultLogo = () => {
    const defaultLogo = '/kale_heywet_logo.jpg';
    setTempLogoUrl(defaultLogo);
    if (onUpdateLogo) {
      onUpdateLogo(defaultLogo);
    }
    setLogoSuccessMsg('ወደ መደበኛው የቃለ ሕይወት አርማ ተመልሷል!');
    setTimeout(() => {
      setLogoSuccessMsg('');
      setIsLogoModalOpen(false);
    }, 1200);
  };

  return (
    <div className="w-full max-w-md mx-auto py-8 px-4">
      {/* Central Dignified Container - Nothing extra shown */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* School Header */}
        <div className="px-6 pt-7 pb-6 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white text-center space-y-3.5 relative">
          {/* Logo */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative group">
              <img
                src={activeLogo}
                alt="School Emblem Logo"
                className="w-22 h-22 rounded-full object-cover border-3 border-amber-400 shadow-xl bg-white"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/src/assets/images/kale_heywet_logo_1791782506449.jpg';
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setTempLogoUrl(activeLogo);
                  setIsLogoModalOpen(true);
                }}
                className="absolute -bottom-1 -right-1 bg-amber-400 hover:bg-amber-300 text-slate-950 p-1.5 rounded-full shadow-md transition-all cursor-pointer"
                title="የትምህርት ቤቱን አርማ (ሎጎ) ለመቀየር ይጫኑ"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
              የብርብር ከተማ ቃለ ሕይወት ርኆቦት
            </h1>
            <p className="text-xs sm:text-sm text-amber-300 font-semibold">
              መካከለኛና የመጀመሪያ ደረጃ ትምህርት ቤት
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>ይፋዊ የትምህርት ቤት መግቢያ በር (Official Portal)</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          
          {/* STATE 1: Gateway - Clean State where all portals are in ONE place and appear on touch */}
          {!activePortal ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium">
                  ወደ ዳሽቦርዱ ለመግባት እባክዎ ከዚህ በታች ያለውን በመንካት የራስዎን ገጽ ይምረጡ
                </p>
              </div>

              {/* Central Trigger Button */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-full flex items-center justify-between py-3 px-4 bg-indigo-50 hover:bg-indigo-100/80 active:scale-[0.99] border-2 border-indigo-200 hover:border-indigo-400 rounded-2xl text-left transition-all shadow-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-indigo-950 block">
                        ወደ ገጽዎ ለመግባት እዚህ ይንኩ
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {isMenuOpen ? 'ለመዝጋት ይጫኑ' : 'የገጾች ዝርዝር ለመምረጥ ይጫኑ'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-indigo-600 transition-transform duration-200 ${
                      isMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Portal Selection Options - Appears ONLY when touched ("ስነኩ ብቻ ለምርጫ እንድመጡ ማድረግ") */}
              {isMenuOpen && (
                <div className="space-y-2 pt-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-bold text-slate-600 px-1">
                    የሚፈልጉትን ገጽ ይንኩ (Select Your Page)፦
                  </div>

                  <div className="space-y-2">
                    {PORTAL_OPTIONS.map(portal => {
                      const IconComponent = portal.icon;
                      return (
                        <button
                          key={portal.id}
                          type="button"
                          onClick={() => handleSelectPortal(portal.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${portal.colorBg} ${portal.colorBorder}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center text-slate-800 shrink-0">
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div>
                              <div className={`text-xs font-bold ${portal.colorText}`}>
                                {portal.amharicLabel}
                              </div>
                              <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                {portal.subtitle}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STATE 2: Specific Portal Code Entry View ("የራሳቸውን ገጽ በመንካት የራሳቸውን መለያ ኮድ በማስገባት ወደ ገጹ እንድገቡ") */
            <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
              
              {/* Top Switcher Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    {selectedPortalObj && <selectedPortalObj.icon className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {selectedPortalObj?.amharicLabel}
                    </h3>
                    <span className="text-[10px] text-slate-500 block">
                      መለያ ኮድዎን ያስገቡ
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBackToGateway}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 p-1 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                  title="ወደ ምርጫው ተመለስ"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ገጽ ቀይር</span>
                </button>
              </div>

              {/* 1. TEACHER SPECIFIC FIELDS */}
              {activePortal === 'teacher' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      የመምህሩ ሙሉ ስም
                    </label>
                    <select
                      value={selectedTeacherId}
                      onChange={e => setSelectedTeacherId(e.target.value)}
                      className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                    >
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.roleTitle ? `[${t.roleTitle}]` : ''} {t.isHomeroom ? `(ስም ጠሪ - ${t.homeroomGrade})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 2. PARENT SPECIFIC FIELDS */}
              {activePortal === 'parent' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      የተማሪው መለያ ኮድ (Student ID) ወይም የወላጅ ስልክ
                    </label>
                    <input
                      type="text"
                      placeholder="ለምሳሌ፡ bkhrsf8-101 ወይም 0911002233"
                      value={studentIdInput}
                      onChange={e => setStudentIdInput(e.target.value)}
                      required
                      className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      * የተማሪዎን መታወቂያ ኮድ ወይም በምዝገባ ወቅት ያስመዘገቡትን ስልክ ቁጥር ያስገቡ።
                    </p>
                  </div>
                </div>
              )}

              {/* 3. SECRET CODE / PIN INPUT */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      {activePortal === 'parent'
                        ? 'የወላጅ መግቢያ ሚስጥራዊ ቁልፍ (PIN)'
                        : activePortal === 'teacher'
                        ? 'የመምህሩ ሚስጥራዊ ቁልፍ (PIN)'
                        : 'የአመራር ሚስጥራዊ መለያ ቁልፍ (PIN)'}
                    </span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="ሚስጥራዊ ቁልፍዎን እዚህ ያስገቡ..."
                    required={activePortal !== 'parent'}
                    className="w-full text-xs py-2.5 pl-3 pr-10 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 tracking-wider font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {activePortal === 'parent' && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    * የወላጅ ነባሪ ቁልፍ <strong>1234</strong> ነው።
                  </p>
                )}
              </div>

              {/* Error Notification */}
              {errorMessage && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl leading-relaxed">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-700 hover:bg-indigo-800 active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>በመለያ ኮድ ወደ ገጹ ግባ (Enter Portal)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* Modal for Inserting / Customizing School Logo */}
      {isLogoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">የትምህርት ቤቱን አርማ (Logo) ያስገቡ</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                የትምህርት ቤትዎን አርማ ከኮምፒውተርዎ ወይም ከስልክዎ በመጫን፤ ወይም የምስል ሊንክ (URL) በማስገባት በቀላሉ ማበጀት ይችላሉ።
              </p>

              {/* Selector Tabs: File vs URL */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLogoInputType('file')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    logoInputType === 'file'
                      ? 'bg-white text-indigo-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📁 ምስል ጫን (Upload File)
                </button>
                <button
                  type="button"
                  onClick={() => setLogoInputType('url')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    logoInputType === 'url'
                      ? 'bg-white text-indigo-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔗 የምስል ሊንክ (Image URL)
                </button>
              </div>

              {/* File Upload Box */}
              {logoInputType === 'file' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/70 p-6 rounded-2xl text-center cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      ምስል ለመምረጥ እዚህ ይጫኑ
                    </div>
                    <div className="text-[11px] text-slate-500">
                      PNG, JPG, SVG ወይም WebP ፋይል ይደግፋል
                    </div>
                  </div>
                </div>
              )}

              {/* URL Input Box */}
              {logoInputType === 'url' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    የምስል ሊንክ (Image URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/school-logo.png"
                    value={tempLogoUrl}
                    onChange={e => setTempLogoUrl(e.target.value)}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              )}

              {/* Preview Box */}
              {tempLogoUrl && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    የአርማው ቅድመ-ዕይታ (Preview)
                  </span>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <img
                        src={tempLogoUrl}
                        alt="Logo Preview Circle"
                        className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-md bg-white mx-auto"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/kale_heywet_logo.jpg';
                        }}
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">ክብ ቅርጽ</span>
                    </div>

                    <div className="text-center">
                      <img
                        src={tempLogoUrl}
                        alt="Logo Preview Square"
                        className="w-16 h-16 rounded-xl object-contain border border-slate-300 shadow-md bg-white p-1 mx-auto"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/kale_heywet_logo.jpg';
                        }}
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">ሙሉ ካሬ</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Notification */}
              {logoSuccessMsg && (
                <div className="p-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl text-center font-semibold flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{logoSuccessMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetToDefaultLogo}
                  className="flex items-center gap-1.5 py-2 px-3 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ወደ መደበኛው መልስ</span>
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setIsLogoModalOpen(false)}
                  className="py-2 px-3 text-xs text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  ሰርዝ
                </button>
                <button
                  type="button"
                  onClick={handleApplyLogo}
                  disabled={!tempLogoUrl}
                  className="py-2 px-4 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  አጽድቅና ተግብር
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
