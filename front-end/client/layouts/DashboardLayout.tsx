import { PropsWithChildren, useEffect, useState } from "react";
import {
  Bell,
  LineChart,
  LogOut,
  Newspaper,
  PieChart,
  Settings,
  User,
  Wallet,
  Search,
  Mail,
  Moon,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const SidebarItem = ({
  icon: Icon,
  label,
  to,
  collapsed,
}: {
  icon: any;
  label: string;
  to?: string;
  collapsed: boolean;
}) => {
  const location = useLocation();
  const active = to ? location.pathname.startsWith(to) : false;
  const Comp: any = to ? Link : (props: any) => <div {...props} />;
  return (
    <Comp
      to={to as any}
      title={collapsed ? label : undefined}
      className={`group flex items-center ${collapsed ? "justify-center gap-0 px-0" : "gap-3 px-4"} ${collapsed ? "rounded-xl" : "rounded-full"} py-2 text-sm ${active ? "bg-[#2b2b2b] text-white" : "text-white/70 hover:bg-white/5"}`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-md ${active ? "bg-yellow-300 text-black" : "text-white/65"}`}
      >
        <Icon size={14} />
      </span>
      {!collapsed && <span className="font-medium">{label}</span>}
    </Comp>
  );
};

export default function DashboardLayout({ children }: PropsWithChildren) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("sb:collapsed");
    if (saved !== null) setCollapsed(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("sb:collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const sidebarWidth = collapsed ? 80 : 240;
  const location = useLocation();
  const isChart = location.pathname === "/chart" || location.pathname.startsWith("/chart/");

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#0a0a0a,rgba(10,10,10,0.95))] text-white">
      {/* Top header */}
      <header className="sticky top-0 z-40 bg-[#0f0f0f]/70 backdrop-blur ring-1 ring-white/10">
        <div className="flex items-center gap-3 px-6 py-3">
          <div className="text-lg font-semibold text-yellow-300">Dashboard</div>
          <div className="relative mx-auto flex-1 max-w-2xl">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              placeholder="Search"
              className="h-10 w-full rounded-full bg-[#0f0f0f] pl-10 pr-4 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-muted-foreground"
            />
          </div>
          {isChart && (
            <a
              href="/analysis"
              className="inline-flex items-center rounded-full bg-yellow-300 px-3 py-2 text-sm font-semibold text-black hover:bg-yellow-200"
            >
              Analysis
            </a>
          )}
          <button className="inline-flex size-9 items-center justify-center rounded-lg bg-[#0f0f0f] ring-1 ring-white/10">
            <Mail size={18} />
          </button>
          <button className="inline-flex size-9 items-center justify-center rounded-lg bg-[#0f0f0f] ring-1 ring-white/10">
            <Moon size={18} />
          </button>
          <button className="inline-flex size-9 items-center justify-center rounded-lg bg-[#0f0f0f] ring-1 ring-white/10">
            <Bell size={18} />
          </button>
          <div className="inline-flex size-10 items-center justify-center rounded-full bg-yellow-300 text-black font-semibold">
            A
          </div>
        </div>
      </header>

      <div
        className="grid w-full gap-6 px-6 py-6"
        style={{ gridTemplateColumns: `${sidebarWidth}px 1fr` }}
      >
        {/* Sidebar */}
        <aside
          className="flex h-[calc(100vh-120px)] flex-col justify-between rounded-2xl bg-black p-2 ring-1 ring-white/10"
          style={{ width: sidebarWidth }}
        >
          <div
            className={`mb-1 flex ${collapsed ? "justify-center" : "justify-end"} px-1`}
          >
            <button
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              className="inline-flex size-7 items-center justify-center rounded-lg bg-white/5 text-white/70 hover:bg-white/10"
            >
              {collapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>
          </div>

          <nav className="grid gap-3 mt-0">
            <SidebarItem
              icon={LayoutGrid}
              label="Dashboard"
              to="/dashboard"
              collapsed={collapsed}
            />
            <SidebarItem
              icon={User}
              label="Account"
              to="/account"
              collapsed={collapsed}
            />
            <SidebarItem
              icon={LineChart}
              label="Chart"
              to="/chart"
              collapsed={collapsed}
            />
            <SidebarItem
              icon={Wallet}
              label="Wallet"
              to="/wallet"
              collapsed={collapsed}
            />
            <SidebarItem
              icon={Newspaper}
              label="News"
              to="/news"
              collapsed={collapsed}
            />
            <SidebarItem
              icon={Settings}
              label="Settings"
              to="/settings"
              collapsed={collapsed}
            />
          </nav>

          <div
            className={`mt-6 rounded-xl bg-background/40 p-3 text-sm ring-1 ring-white/10 ${collapsed ? "text-center" : ""}`}
          >
            <Link
              to="/"
              className={`inline-flex items-center gap-2 text-primary hover:underline ${collapsed ? "justify-center" : ""}`}
            >
              <LogOut size={16} /> {!collapsed && <span>Log out</span>}
            </Link>
          </div>
        </aside>

        {/* Content */}
        <section className="space-y-6">{children}</section>
      </div>
    </main>
  );
}
