import React, { useState } from "react";
import {
  LayoutDashboard,
  Tv,
  FileSpreadsheet,
  Film,
  Radio,
  ClipboardList,
  Compass,
  ShieldCheck,
  ShieldAlert,
  Moon,
  Sun,
  LogOut,
  ExternalLink,
  ChevronDown,
  MonitorCheck,
  Sparkles,
  RefreshCw,
  Sliders,
  ArrowRight,
  SplitSquareVertical,
} from "lucide-react";
import { useAdminControl, PRESET_USERS } from "@/context/AdminControlContext";
import { googleSignIn, logout } from "@/services/googleAuthService";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  onNavigate?: (path: string) => void;
}

export const ADMIN_NAV_ITEMS = [
  {
    path: "/admin",
    label: "דשבורד בקרה",
    icon: LayoutDashboard,
    badge: null,
    description: "מדדי בריאות מסכים, סנכרון ואירועים",
  },
  {
    path: "/admin/screens",
    label: "ניהול וצימוד מסכים",
    icon: Tv,
    badge: "צימוד חי",
    description: "צימוד 6 ספרות, שליטה מרחוק וסטטוס",
  },
  {
    path: "/admin/sheets-mapping",
    label: "מיפוי גיליונות Sheets",
    icon: FileSpreadsheet,
    badge: null,
    adminOnly: true,
    description: "מיפוי עמודות ובדיקות Fetch",
  },
  {
    path: "/admin/media",
    label: "ספריית מדיה ושומר מסך",
    icon: Film,
    badge: null,
    description: "סרטוני Drive, מצגות ותזמון הפסקות",
  },
  {
    path: "/admin/overrides",
    label: "שידור מבצעי בזק",
    icon: Radio,
    badge: "LIVE",
    description: "התראות מתפרצות, כריזה ובאנרים",
  },
  {
    path: "/admin/traffic",
    label: "מפת פקקים ו-Waze",
    icon: Compass,
    badge: "חי",
    description: "Waze Live Map ומעקב עומסי צירי השרון ומשאיות",
  },
  {
    path: "/admin/audit",
    label: "יומן ביקורת (Audit)",
    icon: ClipboardList,
    badge: null,
    adminOnly: true,
    description: "תיעוד שינויים, הרשאות ואבטחה",
  },
];

export default function AdminLayout({
  children,
  activePath = "/admin",
  onNavigate,
}: AdminLayoutProps) {
  const { currentUser, setCurrentUser, canManageSystem, screens, activeBroadcast } =
    useAdminControl();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleUserSelect = (presetUser: (typeof PRESET_USERS)[0]) => {
    setCurrentUser(presetUser);
    setUserDropdownOpen(false);
    toast.success(`הוחלף משתמש ל-${presetUser.name} (${presetUser.role})`);
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser({
          id: res.user.uid,
          name: res.user.displayName || "משתמש גוגל",
          email: res.user.email || "user@saban.co.il",
          role: "ADMIN",
          branch: "Google Workspace SSO",
          avatar: res.user.photoURL || undefined,
        });
        toast.success(`התחברת בהצלחה עם Google Workspace`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("התחברות גוגל נכשלה: " + msg);
    }
  };

  const onlineScreensCount = screens.filter((s) => s.status === "online").length;

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none"
      dir="rtl"
    >
      {/* Fixed RTL Sidebar */}
      <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col justify-between shrink-0 shadow-2xl z-30">
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-800/80 bg-gradient-to-b from-slate-850 to-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-sky-500/20 border border-sky-400/30">
                  ח.ס
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm tracking-tight text-white">
                      ח. סבן בע״מ
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 rounded font-bold">
                      1994
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span>SabanOS Control Plane</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick TV Link & Screen Status summary */}
            <div className="mt-3.5 p-2 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MonitorCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-medium">מסכים מחוברים:</span>
                <span className="font-bold text-emerald-400">
                  {onlineScreensCount}/{screens.length}
                </span>
              </div>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors font-medium bg-sky-950/40 hover:bg-sky-900/40 px-2 py-0.5 rounded border border-sky-800/50"
                title="פתח מסך שידור טלוויזיה חי בלשונית חדשה"
              >
                <span>שידור TV</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Active Broadcast Alert Badge */}
          {activeBroadcast && (
            <div className="m-3 p-2.5 rounded-lg bg-rose-950/70 border border-rose-600/50 text-rose-200 text-xs animate-pulse flex items-start gap-2">
              <Radio className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold flex items-center gap-1">
                  <span>שידור מבצעי פעיל!</span>
                  <span className="text-[10px] bg-rose-600 text-white px-1 rounded">דחוף</span>
                </div>
                <div className="text-[11px] text-rose-300 line-clamp-1 mt-0.5">
                  {activeBroadcast.title}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              תפריט ניהול ובקרה
            </div>
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.path;
              const isRestricted = item.adminOnly && !canManageSystem;

              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate?.(item.path)}
                  disabled={isRestricted}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-right group ${
                    isActive
                      ? "bg-sky-600 text-white shadow-lg shadow-sky-600/25 border border-sky-400/30 font-semibold"
                      : isRestricted
                        ? "text-slate-600 cursor-not-allowed hover:bg-transparent"
                        : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : isRestricted ? "text-slate-600" : "text-slate-400 group-hover:text-sky-400"}`}
                    />
                    <div className="truncate">
                      <div className="truncate leading-snug">{item.label}</div>
                      <div
                        className={`text-[10px] truncate ${isActive ? "text-sky-100" : "text-slate-500"}`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 mr-1">
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          item.badge === "LIVE"
                            ? "bg-rose-500 text-white animate-pulse"
                            : "bg-sky-900/60 text-sky-300 border border-sky-700/50"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.adminOnly && (
                      <span title="הרשאת מנהל בלבד (ADMIN)">
                        {canManageSystem ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* User Profile & SSO Section */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/90 relative">
            <div
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={
                    currentUser.avatar ||
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
                  }
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-500/30 shrink-0"
                />
                <div className="truncate text-right">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                    <span>{currentUser.name}</span>
                    <span
                      className={`text-[9px] px-1 rounded font-bold ${
                        currentUser.role === "ADMIN"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{currentUser.branch}</div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

            {/* Quick Switcher Dropdown */}
            {userDropdownOpen && (
              <div className="absolute bottom-16 left-3 right-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="text-[11px] font-bold text-slate-400 px-2 py-1 border-b border-slate-800 mb-1 flex items-center justify-between">
                  <span>החלפת משתמש מהירה (RBAC)</span>
                  <span className="text-[10px] text-sky-400">פרופילים</span>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {PRESET_USERS.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleUserSelect(u)}
                      className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs text-right transition-colors ${
                        currentUser.id === u.id
                          ? "bg-sky-600 text-white font-bold"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${u.role === "ADMIN" ? "bg-amber-400" : "bg-sky-400"}`}
                        />
                        <span>{u.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">({u.role})</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-1 border-t border-slate-800 flex flex-col gap-1">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors"
                  >
                    <span>התחבר עם Google Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Control Bar */}
        <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-tight">
                  SabanOS Control Plane
                </h1>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 font-mono">
                  {activePath}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                מערכת ניהול ובקרה מרכזית — ח. סבן חומרי בניין בע״מ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick live TV preview button */}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition-all"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>מסך שידור TV</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            </a>

            {/* Dark/Light toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title={isDark ? "מצב יום" : "מצב לילה"}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-sky-400" />
              )}
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">{children}</main>
      </div>
    </div>
  );
}
