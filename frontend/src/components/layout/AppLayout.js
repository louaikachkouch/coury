import React from 'react';
import Sidebar from './Sidebar';
import { MobileHeader, MobileNav } from './MobileNav';

const AppLayout = ({ children }) => {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#FBF9F6] dark:bg-background">
        {/* Mobile Header */}
        <MobileHeader />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileNav />
      </main>
    </div>
  );
};

export default AppLayout;
