
import type { ReactNode } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Suspense } from 'react';

export default function MainPagesLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading layout...</div>}>
      <AppLayout>{children}</AppLayout>
    </Suspense>
  );
}
