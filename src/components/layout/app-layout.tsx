// src/components/layout/app-layout.tsx
"use client"

import type { ReactNode } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { SidebarNav } from "./sidebar-nav"; // Import our new component

// --- THIS IS THE BULLETPROOF LOGO FIX ---
// Import the image file directly using the correct relative path.
// This happens at build time and is guaranteed to work.
import logo from '../../../public/images/wtstats-logo.png';

function LayoutFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading application layout...</p>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LayoutFallback />}>
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              {/* Use the imported logo variable */}
              <Image
                src={logo}
                alt="WTStats App Logo"
                width={140}
                height={44}
                className="group-data-[collapsible=icon]:hidden"
                priority
              />
              <Image
                src={logo}
                alt="WTStats App Logo Small"
                width={40}
                height={40}
                className="hidden group-data-[collapsible=icon]:block"
                priority
              />
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-2">
            {/* All navigation logic is now neatly contained here */}
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border" />
        </Sidebar>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarProvider>
    </Suspense>
  );
}