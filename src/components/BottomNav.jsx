import React from 'react';

export default function BottomNav({ 
  activeTab, 
  onSelectTab, 
  onAddIncome, 
  onAddExpense,
  isHidden = false,
  isLoading = false,
  isAssetsLoading = false,
  isTabTransitioning = false,
}) {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'account_balance_wallet' },
    { id: 'income', label: 'Income', icon: 'trending_up' },
    { id: 'expense', label: 'Expense', icon: 'trending_down' },
    { id: 'records', label: 'Records', icon: 'receipt_long' },
    { id: 'reports', label: 'Reports', icon: 'bar_chart' },
  ];

  return (
    <nav 
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
      className={`fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] lg:hidden transition-all duration-300 ease-in-out ${
        isHidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="h-[60px] max-w-lg mx-auto grid grid-cols-5 items-center w-full px-1">
        {isAssetsLoading ? (
          /* Dedicated Skeleton Loader for Buttons before buttons load */
          tabs.map((tab) => (
            <div
              key={tab.id}
              className="flex flex-col items-center justify-center w-full h-full py-1"
            >
              <div className="w-12 h-7 rounded-full skeleton-shimmer mb-0.5" />
              <div className="w-9 h-2.5 rounded-full skeleton-shimmer mt-0.5" />
            </div>
          ))
        ) : (
          tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isButtonLoading = isTabTransitioning && isActive;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center w-full h-full py-1 group cursor-pointer transition-all select-none ${
                  isTabTransitioning && !isActive ? 'opacity-40' : 'opacity-100'
                } ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant hover:text-on-surface font-medium'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-12 h-7 rounded-full transition-all mb-0.5 relative ${
                    isButtonLoading
                      ? 'skeleton-shimmer ring-2 ring-primary/50 text-primary shadow-sm'
                      : isActive
                      ? 'bg-secondary-container/70 text-primary'
                      : 'text-outline group-hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[21px]">
                    {tab.icon}
                  </span>
                  {isButtonLoading && (
                    <span className="absolute inset-0 rounded-full skeleton-shimmer bg-primary/20 pointer-events-none" />
                  )}
                </div>

                {isButtonLoading ? (
                  <div className="h-2.5 w-8 rounded-full skeleton-shimmer mt-0.5" />
                ) : (
                  <span className="text-[10.5px] sm:text-[11px] tracking-tight leading-tight truncate w-full text-center">
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </nav>
  );
}
