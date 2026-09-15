import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { AdminControlProvider } from "@/context/AdminControlContext";
import AdminLayout from "@/app/admin/layout";
import AdminDashboardPage from "@/app/admin/page";
import ScreensPage from "@/app/admin/screens/page";
import ScreenDetailPage from "@/app/admin/screens/[screenId]/page";
import SheetsMappingPage from "@/app/admin/sheets-mapping/page";
import MediaPage from "@/app/admin/media/page";
import OverridesPage from "@/app/admin/overrides/page";
import AuditPage from "@/app/admin/audit/page";
import { TrafficLiveDashboard } from "@/components/traffic/TrafficLiveDashboard";
import { DispatchProvider } from "@/context/DispatchContext";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "SabanOS Enterprise · מרכז שליטה ובקרה (Admin Control Plane)" },
      {
        name: "description",
        content:
          "מערכת ניהול ובקרה מרכזית עבור ח. סבן חומרי בניין (1994) בע״מ ו-Noa AI Logistics Hub.",
      },
    ],
  }),
  component: AdminRouteComponent,
});

function AdminRouteComponent() {
  const [currentPath, setCurrentPath] = useState<string>("/admin");
  const [screenDetailId, setScreenDetailId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateFromUrl = () => {
        const hash = window.location.hash.replace("#", "");
        const searchParams = new URLSearchParams(window.location.search);
        const sub = searchParams.get("tab") || hash;

        if (sub) {
          if (sub.startsWith("/admin")) {
            setCurrentPath(sub);
          } else if (sub.startsWith("screens/")) {
            const sId = sub.replace("screens/", "");
            setScreenDetailId(sId);
            setCurrentPath(`/admin/screens/${sId}`);
          } else {
            setCurrentPath(`/admin/${sub}`);
          }
        } else {
          // Check pathname
          const pathname = window.location.pathname;
          if (pathname.startsWith("/admin/screens/")) {
            const sId = pathname.replace("/admin/screens/", "");
            setScreenDetailId(sId);
            setCurrentPath(pathname);
          } else if (pathname.startsWith("/admin")) {
            setCurrentPath(pathname);
          }
        }
      };

      updateFromUrl();
      window.addEventListener("popstate", updateFromUrl);
      window.addEventListener("hashchange", updateFromUrl);
      return () => {
        window.removeEventListener("popstate", updateFromUrl);
        window.removeEventListener("hashchange", updateFromUrl);
      };
    }
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (path.startsWith("/admin/screens/")) {
      const sId = path.replace("/admin/screens/", "");
      setScreenDetailId(sId);
    } else {
      setScreenDetailId(null);
    }

    if (typeof window !== "undefined") {
      const tabName = path.replace("/admin/", "").replace("/admin", "");
      if (tabName) {
        window.history.pushState(null, "", `/admin?tab=${tabName}`);
      } else {
        window.history.pushState(null, "", "/admin");
      }
    }
  };

  const renderContent = () => {
    if (currentPath === "/admin" || currentPath === "/admin/") {
      return <AdminDashboardPage onNavigate={handleNavigate} />;
    }
    if (currentPath === "/admin/screens") {
      return <ScreensPage onNavigate={handleNavigate} />;
    }
    if (currentPath.startsWith("/admin/screens/") && screenDetailId) {
      return <ScreenDetailWrapper screenId={screenDetailId} onNavigate={handleNavigate} />;
    }
    if (currentPath === "/admin/sheets-mapping") {
      return <SheetsMappingPage />;
    }
    if (currentPath === "/admin/media") {
      return <MediaPage />;
    }
    if (currentPath === "/admin/overrides") {
      return <OverridesPage />;
    }
    if (currentPath === "/admin/traffic") {
      return (
        <DispatchProvider>
          <div className="p-1">
            <TrafficLiveDashboard />
          </div>
        </DispatchProvider>
      );
    }
    if (currentPath === "/admin/audit") {
      return <AuditPage />;
    }
    return <AdminDashboardPage onNavigate={handleNavigate} />;
  };

  return (
    <AdminControlProvider>
      <AdminLayout activePath={currentPath} onNavigate={handleNavigate}>
        {renderContent()}
      </AdminLayout>
    </AdminControlProvider>
  );
}

function ScreenDetailWrapper({
  screenId,
  onNavigate,
}: {
  screenId: string;
  onNavigate: (path: string) => void;
}) {
  return <ScreenDetailPage screenId={screenId} onNavigate={onNavigate} />;
}
