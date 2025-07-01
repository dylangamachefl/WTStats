// src/components/layout/sidebar-nav.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { ListChecks, Users, FileText, Trophy } from "lucide-react";

// Simplified navigation structure - NO SUB-ITEMS
const navItems = [
  { href: "/league-history", label: "League History", icon: <Trophy /> },
  { href: "/draft-history", label: "Draft History", icon: <ListChecks /> },
  { href: "/h2h", label: "Head-to-Head", icon: <Users /> },
  { href: "/deep-dives", label: "Deep Dives", icon: <FileText /> },
];

export function SidebarNav() {
  const pathname = usePathname();

  const isMainActive = (href: string) => {
    if (href === "/league-history" && pathname === "/") return true;
    return pathname.startsWith(href);
  };

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton
              isActive={isMainActive(item.href)}
              tooltip={{ children: item.label }}
              className="justify-start"
            >
              {item.icon}
              <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}