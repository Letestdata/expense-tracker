import React from 'react';
import appLogo from '../assets/screen.png';
import userAvatar from '../assets/avatar.png';

export default function Header({ 
  onCreateFormClick, 
  isConnected, 
  onConnectClick, 
  isConnecting, 
  isAssetsLoading = false,
  isLoading = false,
  activeTab = 'home',
  onSelectTab
}) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] z-30">
      <div className="w-full h-full px-4 sm:px-6 flex items-center justify-between gap-2">
        
        {/* Left: Title + Desktop Switcher */}
        {isAssetsLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg skeleton-shimmer flex-shrink-0" />
            <div className="h-4 w-28 rounded-lg skeleton-shimmer" />
          </div>
        ) : (
          <div className="flex items-center gap-3 sm:gap-4 text-on-surface-variant overflow-hidden flex-shrink min-w-0">
            <div 
              onClick={() => onSelectTab && onSelectTab('home')}
              className="flex items-center gap-2 flex-shrink-0 cursor-pointer group"
            >
              <img 
                src={appLogo} 
                alt="Expense Tracker" 
                className="w-7 h-7 object-contain rounded-lg shadow-xs group-hover:scale-105 transition-transform" 
              />
              <span className="font-headline-sm text-[15px] sm:text-[16px] text-on-surface font-extrabold tracking-tight truncate">
                Expense Tracker
              </span>
            </div>

            {/* Desktop Navigation Switcher */}
            {onSelectTab && (
              <div className="hidden sm:flex items-center bg-surface-container-low rounded-full p-0.5 border border-outline-variant/20 flex-shrink-0">
                {isLoading ? (
                  ['Home', 'Income', 'Expense', 'Records', 'Reports'].map((name) => (
                    <div
                      key={name}
                      className="h-6 w-14 rounded-full skeleton-shimmer mx-0.5"
                    />
                  ))
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelectTab('home')}
                      className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                        activeTab === 'home'
                          ? 'bg-primary-container text-on-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Home
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTab('income')}
                      className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                        activeTab === 'income'
                          ? 'bg-primary-container text-on-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Income
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTab('expense')}
                      className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                        activeTab === 'expense'
                          ? 'bg-primary-container text-on-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTab('records')}
                      className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                        activeTab === 'records'
                          ? 'bg-primary-container text-on-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Records
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTab('reports')}
                      className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                        activeTab === 'reports'
                          ? 'bg-primary-container text-on-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Reports
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right: Connection badge + Add button + Avatar */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Connection status */}
          {isAssetsLoading ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full skeleton-shimmer md:hidden flex-shrink-0" />
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container/60 border border-outline-variant/30">
                <div className="w-2 h-2 rounded-full skeleton-shimmer" />
                <div className="h-3 w-36 rounded skeleton-shimmer" />
              </div>
            </>
          ) : isConnected ? (
            <>
              {/* Mobile: Connected pill */}
              <div className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/80 text-on-secondary-container text-[11px] font-semibold flex-shrink-0 animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0"></span>
                <span>Connected</span>
              </div>
              {/* Desktop: full badge */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="font-caption font-medium text-[12px]">Google Sheets: Connected</span>
              </div>
            </>
          ) : (
            <>
              {/* Mobile: Disconnected pill */}
              <div className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-secondary border border-outline-variant/30 text-[11px] font-semibold flex-shrink-0 animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-outline flex-shrink-0"></span>
                <span>Disconnected</span>
              </div>
              {/* Desktop: full badge */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant">
                <span className="w-2 h-2 rounded-full bg-outline"></span>
                <span className="font-caption font-medium text-[12px]">Google Sheets: Disconnected</span>
              </div>
            </>
          )}

          {/* Add Expense button */}
          {isAssetsLoading ? (
            <div className="h-8 w-20 sm:w-28 rounded-full skeleton-shimmer flex-shrink-0" />
          ) : (
            <button
              onClick={onCreateFormClick}
              className="flex items-center gap-1 bg-primary hover:bg-primary/90 text-on-primary px-3 py-1.5 rounded-full shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="font-label-md hidden sm:inline text-[13px]">Add Expense</span>
            </button>
          )}

          {/* Avatar */}
          {isAssetsLoading ? (
            <div className="w-8 h-8 rounded-full skeleton-shimmer flex-shrink-0" />
          ) : (
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 animate-fade-in ring-1.5 ring-primary/40 shadow-xs hover:ring-primary transition-all cursor-pointer"
              src={userAvatar}
            />
          )}
        </div>
      </div>
    </header>
  );
}
