'use client';

import { useState, Suspense } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SidebarContent } from './sidebar-content';

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden fixed top-20 left-4 z-40"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Documentation</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          <Suspense
            fallback={
              <div className="p-4 space-y-2">
                <div className="h-6 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
              </div>
            }
          >
            <SidebarContent />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  );
}


