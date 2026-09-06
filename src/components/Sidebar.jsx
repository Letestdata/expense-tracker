import React from 'react';

export default function Sidebar({ isOpen, onClose, activeTab = 'home', onSelectTab, onAddExpense, isLoading = false, isSheetConnected = false }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-[260px] bg-on-surface z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col">
          <div className="h-16 px-space-lg flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <img
                alt="SheetFlow Logo"
                className="h-8 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida/AEtjO1UWQtMnI1oKZ0o_UbTLrbqREGGwglXp0h3uau7RUjrpBdI14bz3OJM4tEimAnYlUrwygVUZ1DdpZUcDGgeBMMboZ06P2OrvYEmk-1lUnrIZP5k-J4HesezAT85zeTIZWJ_O2Xi_qMUMJgAMFcdNHrD06vOTNVN741gW_idJcQlEf2HKJTjkirjDwBxCeM9JQCVs00MxDFecD5cYO9nMZg7-_ZyPxDW3KJmmbPbyuNHTY5K4NEEa2F7Bpbc"
              />
              <span className="text-surface-container-lowest font-headline-sm tracking-tight">
                SheetFlow
              </span>
            </div>
            <button 
              className="lg:hidden text-surface-container-lowest hover:text-white"
              onClick={onClose}
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
          <nav
            className="flex flex-col gap-space-2xs px-space-md py-space-sm"
          >
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 w-full rounded-xl bg-surface-container-high/40 skeleton-shimmer" />
              ))
            ) : (
              <>
            <button
              type="button"
              onClick={() => {
                if (onSelectTab) onSelectTab('home');
                if (onClose) onClose();
              }}
              className={`flex items-center w-full px-space-md py-space-sm transition-colors text-left rounded-xl ${
                activeTab === 'home'
                  ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                  : 'text-surface-dim hover:text-surface-container-lowest hover:bg-surface/10'
              }`}
            >
              <span className="material-symbols-outlined mr-space-sm text-[20px]">
                dashboard
              </span>
              <span className="font-label-md">Home Overview</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSelectTab) onSelectTab('income');
                if (onClose) onClose();
              }}
              className={`flex items-center w-full px-space-md py-space-sm transition-colors text-left rounded-xl ${
                activeTab === 'income'
                  ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                  : 'text-surface-dim hover:text-surface-container-lowest hover:bg-surface/10'
              }`}
            >
              <span className="material-symbols-outlined mr-space-sm text-[20px]">
                trending_up
              </span>
              <span className="font-label-md">Income Tracking</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSelectTab) onSelectTab('expense');
                if (onClose) onClose();
              }}
              className={`flex items-center w-full px-space-md py-space-sm transition-colors text-left rounded-xl ${
                activeTab === 'expense'
                  ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                  : 'text-surface-dim hover:text-surface-container-lowest hover:bg-surface/10'
              }`}
            >
              <span className="material-symbols-outlined mr-space-sm text-[20px]">
                trending_down
              </span>
              <span className="font-label-md">Expense Tracking</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSelectTab) onSelectTab('records');
                if (onClose) onClose();
              }}
              className={`flex items-center w-full px-space-md py-space-sm transition-colors text-left rounded-xl ${
                activeTab === 'records'
                  ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                  : 'text-surface-dim hover:text-surface-container-lowest hover:bg-surface/10'
              }`}
            >
              <span className="material-symbols-outlined mr-space-sm text-[20px]">
                receipt_long
              </span>
              <span className="font-label-md">Records &amp; Forms</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSelectTab) onSelectTab('reports');
                if (onClose) onClose();
              }}
              className={`flex items-center w-full px-space-md py-space-sm transition-colors text-left rounded-xl ${
                activeTab === 'reports'
                  ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                  : 'text-surface-dim hover:text-surface-container-lowest hover:bg-surface/10'
              }`}
            >
              <span className="material-symbols-outlined mr-space-sm text-[20px]">
                bar_chart
              </span>
              <span className="font-label-md">Reports Breakdown</span>
            </button>
            </>
          )}
            <button
              type="button"
              onClick={() => {
                if (onAddExpense) onAddExpense();
                if (onClose) onClose();
              }}
              className="flex items-center w-full px-space-md py-space-sm text-surface-dim hover:text-surface-container-lowest hover:bg-surface/10 transition-colors text-left rounded-xl"
            >
              <span className="material-symbols-outlined mr-space-sm text-[20px]">
                add_circle
              </span>
              <span className="font-label-md">Add Transaction</span>
            </button>
            <a
              className="flex items-center px-space-md py-space-sm text-surface-dim hover:text-surface-container-lowest transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined mr-space-sm text-[20px]">
                inbox
              </span>
              <span className="font-label-md">Submissions</span>
            </a>
            <a
              className="flex items-center justify-between px-space-md py-space-sm text-surface-dim hover:text-surface-container-lowest transition-colors"
              href="#"
            >
              <div className="flex items-center">
                <span className="material-symbols-outlined mr-space-sm text-[20px]">
                  table_chart
                </span>
                <span className="font-label-md">Google Sheets</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${isSheetConnected ? 'bg-primary-fixed' : 'bg-outline'}`}></span>
            </a>
            <a
              className="flex items-center px-space-md py-space-sm text-surface-dim hover:text-surface-container-lowest transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined mr-space-sm text-[20px]">
                settings
              </span>
              <span className="font-label-md">Settings</span>
            </a>
          </nav>
        </div>
        <div className="p-space-md m-space-md bg-inverse-surface rounded-xl flex items-center justify-between gap-space-xs">
          <div className="flex items-center gap-space-xs overflow-hidden">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnoU1152VSspEThhdq7wUMMQOpF81RHv721b5TcDr-I0d-J84slgex0TpGWd9t42QstOeCCfKWdWjoc-l0o3BosOggc6RRfkPk24DPnf04fb9Xu7m4NaCojmSl5Te-6bA3wcOrOfRDHxRtzAMhXg15v-wQKyhQnUnnVnTIs70jFDDHxkebXdH2eHJ75BuiYWSohXAVYcu6EahwPErk4PGmi5zy_DpV8mrEBmWMbDIuwPQzhLfC0_8a"
            />
            <div className="flex flex-col truncate">
              <span className="text-surface-container-lowest font-label-sm truncate">
                Suresh Patel
              </span>
              <span className="text-surface-dim font-caption truncate">
                suresh@sheetflow.io
              </span>
            </div>
          </div>
          <a
            className="text-surface-dim hover:text-surface-container-lowest p-space-2xs transition-colors"
            href="#"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </a>
        </div>
      </aside>
    </>
  );
}
