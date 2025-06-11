
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
import { ListChecks, Users, FileText, Settings, ShieldQuestion, Trophy, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
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
  matchSegments?: number; // How many path segments to match for main item active state
  subItems?: NavSubItem[];
}

const navItems: NavItemConfig[] = [
  {
    href: "/",
    label: "League History",
    icon: <Trophy />,
    matchSegments: 1,
    subItems: [
      { href: "/?section=all-seasons", label: "All Seasons Overview", queryParamValue: "all-seasons" },
      { href: "/?section=season-detail", label: "Season Detail", queryParamValue: "season-detail" },
      { href: "/?section=gm-career", label: "GM Career", queryParamValue: "gm-career" },
    ],
  },
  {
    href: "/draft-history",
    label: "Draft History",
    icon: <ListChecks />,
    matchSegments: 2,
    subItems: [
      { href: "/draft-history?section=overview", label: "Overview", queryParamValue: "overview" },
      { href: "/draft-history?section=season-view", label: "Season View", queryParamValue: "season-view" },
      { href: "/draft-history?section=gm-view", label: "GM View", queryParamValue: "gm-view" },
    ],
  },
  { href: "/h2h", label: "Head-to-Head", icon: <Users />, matchSegments: 2 },
  { href: "/deep-dives", label: "Deep Dives", icon: <FileText />, matchSegments: 2 },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSectionQuery = searchParams.get('section');

  const isActive = (href: string, matchSegments: number = 1, isSubItem: boolean = false, subItemQueryParam?: string) => {
    const isBasePathCorrect = pathname === href || (href === "/" && pathname.startsWith("/?")) || (href.startsWith("/") && pathname.startsWith(href) && (pathname.length === href.length || pathname[href.length] === '?'));

    if (isSubItem && subItemQueryParam) {
        const isDefaultSubItemForLeagueHistory = href === "/" && subItemQueryParam === 'all-seasons';
        const isDefaultSubItemForDraftHistory = href === "/draft-history" && subItemQueryParam === 'overview';
        
        return isBasePathCorrect && 
               (currentSectionQuery === subItemQueryParam || 
                ((isDefaultSubItemForLeagueHistory || isDefaultSubItemForDraftHistory) && !currentSectionQuery));
    }
    
    if (pathname === "/" && href === "/") return true;
    if (href !== "/") return pathname.startsWith(href);

    return false;
  };

 const getPageTitle = () => {
    const activeMainItem = navItems.find(item => isActive(item.href, item.matchSegments));

    if (activeMainItem) {
      if (activeMainItem.subItems && currentSectionQuery) {
        const activeSubItem = activeMainItem.subItems.find(sub => sub.queryParamValue === currentSectionQuery);
        if (activeSubItem) return activeSubItem.label;
      }
      if (activeMainItem.subItems) {
        const defaultSubItemQuery = activeMainItem.href === "/" ? "all-seasons" : (activeMainItem.href === "/draft-history" ? "overview" : undefined);
        if (defaultSubItemQuery) {
            const defaultSubItem = activeMainItem.subItems.find(sub => sub.queryParamValue === defaultSubItemQuery);
            if (defaultSubItem && (currentSectionQuery === defaultSubItemQuery || !currentSectionQuery)) {
              return defaultSubItem.label;
            }
        }
      }
      return activeMainItem.label;
    }
    return "WTStats";
  };


  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
             <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                
                <span className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">WTStats</span>
             </Link>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <React.Fragment key={item.href + item.label}>
                <SidebarMenuItem>
                  <Link href={item.subItems ? `${item.href}?section=${item.subItems[0].queryParamValue}` : item.href} legacyBehavior passHref>
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
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
           
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col overflow-x-hidden"> {}
        <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="md:hidden" />
          
          <div>
            
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
