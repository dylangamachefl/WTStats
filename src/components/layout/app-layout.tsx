
"use client"

import type { ReactNode } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BarChart3, ListChecks, Users, FileText, Settings, ShieldQuestion, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import * as React from "react";

interface NavSubItem {
  href: string;
  label: string;
  queryParamValue: string;
}

interface NavItemConfig {
  href: string;
  label: string;
  icon: ReactNode;
  matchSegments?: number;
  subItems?: NavSubItem[];
}

const navItems: NavItemConfig[] = [
  {
    href: "/",
    label: "League History",
    icon: <Trophy />, // Changed to Trophy to match image
    matchSegments: 1,
    subItems: [
      { href: "/?section=all-seasons", label: "All Seasons Overview", queryParamValue: "all-seasons" },
      { href: "/?section=season-detail", label: "Season Detail", queryParamValue: "season-detail" },
      { href: "/?section=gm-career", label: "GM Career", queryParamValue: "gm-career" },
    ],
  },
  { href: "/draft-history", label: "Draft History", icon: <ListChecks />, matchSegments: 2 },
  { href: "/h2h", label: "Head-to-Head", icon: <Users />, matchSegments: 2 },
  { href: "/deep-dives", label: "Deep Dives", icon: <FileText />, matchSegments: 2 },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSectionQuery = searchParams.get('section');

  const isActive = (href: string, matchSegments: number = 1, isSubItem: boolean = false, subItemQueryParam?: string) => {
    if (href === "/") {
      const isBasePath = pathname === "/";
      if (isSubItem && subItemQueryParam) {
        return isBasePath && (currentSectionQuery === subItemQueryParam || (subItemQueryParam === 'all-seasons' && !currentSectionQuery));
      }
      // For the main "League History" item, it's active if the path is "/", regardless of section,
      // or if a sub-item is active.
      return isBasePath;
    }

    const pathSegments = pathname.split("/").filter(Boolean);
    const hrefSegments = href.split("/").filter(Boolean);
    
    if (pathSegments.length < matchSegments || hrefSegments.length < matchSegments) {
      return false;
    }

    for (let i = 0; i < matchSegments; i++) {
      if (pathSegments[i] !== hrefSegments[i]) {
        return false;
      }
    }
    return true;
  };

  const getPageTitle = () => {
    if (pathname === "/") {
      if (currentSectionQuery === "season-detail") return "Season Detail";
      if (currentSectionQuery === "gm-career") return "GM Career";
      return "All Seasons Overview"; // Default for "/" or "/?section=all-seasons"
    }
    const activeMainItem = navItems.find(item => isActive(item.href, item.matchSegments));
    return activeMainItem?.label || "Gridiron Archive";
  };


  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
             <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <Image src="https://placehold.co/40x40.png" alt="Gridiron Archive Logo" width={32} height={32} className="rounded-sm" data-ai-hint="football logo"/>
                <span className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Gridiron Archive</span>
             </Link>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <React.Fragment key={item.href + item.label}>
                <SidebarMenuItem>
                  <Link href={item.subItems ? "/?section=all-seasons" : item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={isActive(item.href, item.matchSegments)}
                      tooltip={{ children: item.label, className: "group-data-[collapsible=icon]:block hidden" }}
                      className="justify-start"
                    >
                      {item.icon}
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                {isActive(item.href, item.matchSegments) && item.subItems && (
                  <ul className="pl-2 pr-1 space-y-0.5 group-data-[collapsible=icon]:hidden">
                    {item.subItems.map((subItem) => (
                      <SidebarMenuItem key={subItem.href + subItem.label}>
                        <Link href={subItem.href} legacyBehavior passHref>
                          <SidebarMenuButton
                            variant="ghost"
                            size="sm"
                            isActive={isActive(item.href, item.matchSegments, true, subItem.queryParamValue)}
                            className="justify-start w-full text-sidebar-foreground/80 hover:text-sidebar-foreground"
                          >
                            <span className="ml-[26px]">{subItem.label}</span> {/* Adjusted margin for alignment */}
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                    ))}
                  </ul>
                )}
              </React.Fragment>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
           <div className="flex flex-col gap-2 group-data-[collapsible=icon]:items-center">
             <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto">
                <Settings size={18} />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">Settings</span>
             </Button>
             <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto">
                <ShieldQuestion size={18} />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">Help</span>
             </Button>
           </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-semibold">
            {getPageTitle()}
          </h1>
          <div>
            {/* User Avatar or other header items can go here */}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
