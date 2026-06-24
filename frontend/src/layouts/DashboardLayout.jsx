import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";

export default function DashboardLayout({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen bg-base-bg font-sans text-tx-main overflow-hidden">

            {/* Sidebar */}
            <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header (Hidden on Desktop) */}
                <div className="md:hidden h-16 bg-base-surface border-b border-base-border-subtle flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary-500 rounded-md flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-tx-main">SocialERP</h2>
                    </div>
                    <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -mr-2 text-tx-subtle hover:text-tx-main"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/* Page Content */}
                <div className="flex-1 overflow-auto">
                    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
                        {children}
                    </div>
                </div>
            </div>
            
        </div>
    );
}