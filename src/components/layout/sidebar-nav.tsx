// src/components/layout/sidebar-nav.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { ListChecks, Users, FileText, Trophy } from "lucide-react";

// Define the navigation structure inside this component
const navItems = [
  {
    href: "/",
    label: "League History",
    icon: <Trophy />,
    subItems: [
      { href: "/?section=all-seasons", label: "Overview", queryParamValue: "all-seasons" },
      { href: "/?section=season-detail", label: "Season View", queryParamValue: "season-detail" },
      { href: "/?section=gm-career", label: "GM View", queryParamValue: "gm-career" },
    ],
  },
  {
    href: "/draft-history",
    label: "Draft History",
    icon: <ListChecks />,
    subItems: [
      { href: "/draft-history?section=overview", label: "Overview", queryParamValue: "overview" },
      { href: "/draft-history?section=season-view", label: "Season View", queryParamValue: "season-view" },
      { href: "/draft-history?section=gm-view", label: "GM View", queryParamValue: "gm-view" },
    ],
  },
  { href: "/h2h", label: "Head-to-Head", icon: <Users /> },
  { href: "/deep-dives", label: "Deep Dives", icon: <FileText /> },
];

export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSectionQuery = searchParams.get('section');

  // Simplified and more robust active link logic
  const isMainActive = (href: string) => {
    if (href === "/") return pathname === "/";
    // Check if the current path starts with the link's href
    return pathname.startsWith(href);
  };

  const isSubActive = (mainHref: string, subQuery: string) => {
    if (!isMainActive(mainHref)) return false;
    const defaultQuery = mainHref === "/" ? "all-seasons" : "overview";
    return currentSectionQuery === subQuery || (!currentSectionQuery && subQuery === defaultQuery);
  };

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <React.Fragment key={item.href + item.label}>
          <SidebarMenuItem>
            <Link href={item.subItems ? item.subItems[0].href : item.href} legacyBehavior passHref>
              <SidebarMenuButton
                isActive={isMainActive(item.href)}
                tooltip={{ children: item.label, className: "group-data-[collapsible=icon]:block hidden" }}
                className="justify-start"
              >
                {item.icon}
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          {isMainActive(item.href) && item.subItems && (
            <ul className="pl-2 pr-1 space-y-0.5 group-data-[collapsible=icon]:hidden">
              {item.subItems.map((subItem) => (
                <SidebarMenuItem key={subItem.href + subItem.label}>
                  <Link href={subItem.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      variant="ghost"
                      size="sm"
                      isActive={isSubActive(item.href, subItem.queryParamValue)}
                      className="justify-start w-full text-sidebar-foreground/80 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary data-[active=true]:font-medium"
                    >
                      <span className="ml-[26px]">{subItem.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </ul>
          )}
        </React.Fragment>
      ))}
    </SidebarMenu>
  );
}