
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
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ListChecks, Users, FileText, Settings, ShieldQuestion } from "lucide-react"; // Home icon removed
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  matchSegments?: number; // How many path segments to match for active state
}

const navItems: NavItem[] = [
  // Dashboard item removed
  { href: "/", label: "League History", icon: <BarChart3 />, matchSegments: 1 }, // Was /league-history, now / and acts as homepage
  { href: "/draft-history", label: "Draft History", icon: <ListChecks />, matchSegments: 2 },
  { href: "/h2h", label: "Head-to-Head", icon: <Users />, matchSegments: 2 },
  { href: "/deep-dives", label: "Deep Dives", icon: <FileText />, matchSegments: 2 },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string, matchSegments: number = 1) => {
    if (href === "/") return pathname === "/";
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
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
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
            {navItems.find(item => isActive(item.href, item.matchSegments))?.label || "Gridiron Archive"}
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
