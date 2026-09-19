"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  UserCheck,
  Calendar,
  Video,
  Scissors,
  CreditCard,
  DollarSign,
  Receipt,
  UserPlus,
  CheckSquare,
  LifeBuoy,
  FileSearch,
  BarChart3,
  LogOut,
} from "lucide-react";
import { SessionUser } from "@/lib/rbac";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: SessionUser;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const pathname = usePathname();

  // Navigation schema with role gating
  const navigationGroups = [
    {
      title: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          allowed: ["OWNER", "ADMIN", "EMPLOYEE"],
        },
      ],
    },
    {
      title: "SALES & CLIENTS",
      items: [
        {
          name: "Clients & Leads",
          href: "/dashboard/clients",
          icon: Users,
          allowed: ["OWNER", "ADMIN"],
          allowedEmployees: ["SALES"],
        },
        {
          name: "Orders & Packages",
          href: "/dashboard/orders",
          icon: Package,
          allowed: ["OWNER", "ADMIN"],
          allowedEmployees: ["SALES"],
        },
      ],
    },
    {
      title: "PRODUCTION PIPELINE",
      items: [
        {
          name: "Scripts (Manual)",
          href: "/dashboard/scripts",
          icon: FileText,
          allowed: ["OWNER", "ADMIN"],
          allowedEmployees: ["SCRIPT_WRITER", "SHOOT_MANAGER"],
        },
        {
          name: "Creators",
          href: "/dashboard/creators",
          icon: UserCheck,
          allowed: ["OWNER", "ADMIN"],
          allowedEmployees: ["SHOOT_MANAGER"],
        },
        {
          name: "Shoots & Calendar",
          href: "/dashboard/shoots",
          icon: Calendar,
          allowed: ["OWNER", "ADMIN"],
          allowedEmployees: ["SHOOT_MANAGER"],
        },
        {
          name: "Video Pipeline",
          href: "/dashboard/videos",
          icon: Video,
          allowed: ["OWNER", "ADMIN"],
          allowedEmployees: ["EDITOR"],
        },
        {
          name: "Editor Queue",
          href: "/dashboard/editor",
          icon: Scissors,
          allowed: ["OWNER", "ADMIN"],
          allowedEmployees: ["EDITOR"],
        },
      ],
    },
    {
      title: "FINANCIALS",
      items: [
        {
          name: "Payments & Invoices",
          href: "/dashboard/payments",
          icon: CreditCard,
          allowed: ["OWNER", "ADMIN"],
        },
        {
          name: "Expenses",
          href: "/dashboard/expenses",
          icon: Receipt,
          allowed: ["OWNER", "ADMIN"],
        },
        {
          name: "Creator Payouts",
          href: "/dashboard/payouts",
          icon: DollarSign,
          allowed: ["OWNER", "ADMIN"],
        },
        {
          name: "Executive Reports",
          href: "/dashboard/reports",
          icon: BarChart3,
          allowed: ["OWNER", "ADMIN"],
        },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        {
          name: "Employee Directory",
          href: "/dashboard/employees",
          icon: UserPlus,
          allowed: ["OWNER", "ADMIN"],
        },
        {
          name: "Tasks Board",
          href: "/dashboard/tasks",
          icon: CheckSquare,
          allowed: ["OWNER", "ADMIN", "EMPLOYEE"],
        },
        {
          name: "Support Tickets",
          href: "/dashboard/tickets",
          icon: LifeBuoy,
          allowed: ["OWNER", "ADMIN", "EMPLOYEE"],
        },
        {
          name: "Audit Trail",
          href: "/dashboard/audit-logs",
          icon: FileSearch,
          allowed: ["OWNER", "ADMIN"],
        },
      ],
    },
  ];

  const filterItem = (item: any) => {
    if (user.role === "OWNER") return true;
    if (item.allowed && item.allowed.includes(user.role)) {
      if (user.role === "EMPLOYEE" && item.allowedEmployees) {
        return item.allowedEmployees.includes(user.employeeRole);
      }
      return true;
    }
    return false;
  };

  return (
    <aside className="w-64 bg-[#111111] border-r border-zinc-800/80 flex flex-col h-screen select-none shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-800/80 gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-charcoal shadow-sm shadow-amber-500/20">
          L
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            LEADYFY <span className="text-amber-500 text-xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-mono">OS</span>
          </span>
          <p className="text-[10px] text-zinc-400 tracking-wider uppercase font-medium">UGC Agency Operating System</p>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navigationGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter(filterItem);
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">
                {group.title}
              </p>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                      isActive
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-amber-400" : "text-zinc-400")} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-amber-400 border border-amber-500/30 shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-zinc-100 truncate">{user.name}</p>
              <p className="text-[10px] text-amber-400/90 font-mono uppercase tracking-wide">
                {user.role === "EMPLOYEE" ? user.employeeRole : user.role}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="text-zinc-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-zinc-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
