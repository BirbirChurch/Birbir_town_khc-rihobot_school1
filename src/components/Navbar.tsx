import React from 'react';
import { UserRole } from '../types';
import { LogOut, Printer, Shield, User, Award, School } from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole | null;
  currentUserName: string;
  academicYear: string;
  semester: 1 | 2;
  onLogout: () => void;
  onOpenLogin?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  logoUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentUserName,
  academicYear,
  semester,
  onLogout,
  activeTab,
  setActiveTab,
  logoUrl,
}) => {
  const getRoleTitle = (role: UserRole | null): string => {
    switch (role) {
      case 'super_admin':
        return 'ዋና አድሚን';
      case 'principal':
        return 'ዋና ር/መምህር';
      case 'vice_principal':
        return 'ም/ር/መምህር';
      case 'kg_director':
        return 'የኬጂ ር/መምህር';
      case 'teacher':
        return 'መምህር';
      case 'parent':
        return 'ወላጅ';
      default:
        return 'እንግዳ';
    }
  };

  const getNavItems = () => {
    if (!currentRole) {
      return [];
    }

    switch (currentRole) {
      case 'super_admin':
        return [
          { id: 'promotion', label: 'የተማሪዎች ማሻገርያ' },
          { id: 'students', label: 'ተማሪዎች ምዝገባ' },
          { id: 'teachers', label: 'መምህራን አስተዳደር' },
          { id: 'subjects', label: 'የትምህርት ዓይነቶች' },
          { id: 'security', label: 'የቁልፍና አርማ አስተዳደር' },
          { id: 'inspect_portals', label: 'የሌሎች ገጾች ዕይታ (Inspector)' },
        ];
      case 'principal':
      case 'vice_principal':
        return [
          { id: 'students', label: 'ተማሪዎች ምዝገባ (Excel)' },
          { id: 'sections', label: 'ክፍሎችና ስም ጠሪ' },
          { id: 'roster', label: 'የክፍል ሮስተር' },
          { id: 'analytics', label: 'የውጤት ትንተና' },
          { id: 'top_students', label: 'ከፍተኛ ውጤቶች' },
          { id: 'feedback', label: 'የወላጆች አስተያየት' },
          ...(currentRole === 'vice_principal'
            ? [{ id: 'letters', label: 'ደብዳቤዎችና መመሪያዎች' }]
            : []),
        ];
      case 'kg_director':
        return [
          { id: 'kg_students', label: 'የኬጂ ተማሪዎች (Excel)' },
          { id: 'kg_sections', label: 'የኬጂ ክፍሎች' },
          { id: 'kg_roster', label: 'የኬጂ ሮስተር' },
          { id: 'kg_analytics', label: 'የውጤት ትንተና' },
          { id: 'kg_feedback', label: 'የወላጅ ግንኙነት' },
        ];
      case 'teacher':
        return [
          { id: 'marks_entry', label: 'ውጤት ማጠራቀሚያ' },
          { id: 'homeroom_roster', label: 'የክፍል ሮስተር (ስም ጠሪ)' },
          { id: 'class_analytics', label: 'የክፍሉ ትንተና' },
          { id: 'conduct_remarks', label: 'የባህሪ አስተያየት' },
        ];
      case 'parent':
        return [
          { id: 'report_card', label: 'የልጄ ውጤት ካርድ' },
          { id: 'top_students', label: 'ከፍተኛ ውጤቶች' },
          { id: 'send_feedback', label: 'አስተያየትና ጥያቄ' },
          { id: 'conduct_notes', label: 'የባህሪ መግለጫ' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark with emblem */}
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <img
              src={logoUrl || "/kale_heywet_logo.jpg"}
              alt="Kale Heywet Logo"
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-xs bg-white shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/src/assets/images/kale_heywet_logo_1791782506449.jpg';
              }}
            />
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                የብርብር ቃለ ሕይወት ርኆቦት ት/ቤት
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {academicYear} ዓ/ም · {semester}ኛ ሰሚስተር
              </span>
            </div>
          </div>

          {/* Zone 2: 4-5 Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === item.id
                    ? 'text-indigo-700 font-semibold border-b-2 border-indigo-700'
                    : 'hover:text-slate-900 text-slate-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 primary action / active session */}
          <div className="flex items-center gap-3 shrink-0">
            {currentRole ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1 justify-end">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{currentUserName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {getRoleTitle(currentRole)}
                  </div>
                </div>
                <button
                  onClick={() => window.print()}
                  title="የአሁኑን ገጽ አትም (Print)"
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ውጣ</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>የተቆለፈ ፖርታል</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile secondary navigation strip */}
        {navItems.length > 0 && (
          <div className="lg:hidden flex items-center gap-2 overflow-x-auto py-2 border-t border-slate-100 text-xs">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1 rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === item.id
                    ? 'bg-indigo-100 text-indigo-800 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
