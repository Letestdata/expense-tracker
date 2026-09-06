import React from 'react';

/**
 * Reusable single transaction item skeleton
 */
export function TransactionItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/15">
      <div className="flex items-center gap-3">
        {/* Circular icon skeleton */}
        <div className="w-10 h-10 rounded-2xl skeleton-shimmer flex-shrink-0" />
        <div className="flex flex-col gap-1.5">
          {/* Title line */}
          <div className="h-4 w-32 sm:w-44 rounded-md skeleton-shimmer" />
          {/* Subtitle / time */}
          <div className="h-3 w-20 sm:w-28 rounded-md skeleton-shimmer-subtle" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {/* Amount */}
        <div className="h-4 w-16 sm:w-20 rounded-md skeleton-shimmer" />
        {/* Payment mode pill */}
        <div className="h-3 w-12 rounded-full skeleton-shimmer-subtle" />
      </div>
    </div>
  );
}

/**
 * 1. Home Page Skeleton Loader
 */
export function HomeSkeleton() {
  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 pb-28 gap-5 animate-fade-in">
      {/* Top Greeting & Sync Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full skeleton-shimmer" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-24 rounded-md skeleton-shimmer-subtle" />
            <div className="h-4 w-36 rounded-md skeleton-shimmer" />
          </div>
        </div>
        <div className="h-7 w-24 rounded-full skeleton-shimmer" />
      </div>

      {/* Hero Balance Card Skeleton */}
      <div className="rounded-3xl p-5 sm:p-6 bg-surface-container-low border border-outline-variant/20 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded-md skeleton-shimmer-subtle" />
          <div className="h-7 w-20 rounded-full skeleton-shimmer" />
        </div>
        <div className="h-10 w-48 rounded-xl skeleton-shimmer my-1" />
        <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/15">
          <div className="h-6 w-32 rounded-full skeleton-shimmer-subtle" />
          <div className="h-6 w-28 rounded-full skeleton-shimmer-subtle" />
        </div>
      </div>

      {/* Inflow / Outflow Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg skeleton-shimmer" />
            <div className="h-3 w-14 rounded-md skeleton-shimmer-subtle" />
          </div>
          <div className="h-6 w-24 rounded-md skeleton-shimmer" />
          <div className="h-2.5 w-16 rounded-md skeleton-shimmer-subtle" />
        </div>
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg skeleton-shimmer" />
            <div className="h-3 w-14 rounded-md skeleton-shimmer-subtle" />
          </div>
          <div className="h-6 w-24 rounded-md skeleton-shimmer" />
          <div className="h-2.5 w-16 rounded-md skeleton-shimmer-subtle" />
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-col gap-2">
        <div className="h-3.5 w-24 rounded-md skeleton-shimmer-subtle" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-11 rounded-2xl skeleton-shimmer" />
          <div className="h-11 rounded-2xl skeleton-shimmer" />
        </div>
      </div>

      {/* Recent Transactions Feed */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 rounded-md skeleton-shimmer" />
          <div className="h-4 w-16 rounded-md skeleton-shimmer-subtle" />
        </div>
        <div className="flex flex-col gap-2.5">
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Income Page Skeleton Loader
 */
export function IncomeSkeleton() {
  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 pb-28 gap-4 animate-fade-in">
      {/* Month Selector Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="h-4 w-40 rounded-md skeleton-shimmer-subtle" />
        <div className="h-7 w-28 rounded-full skeleton-shimmer" />
      </div>

      {/* Top Hero Inflow Card */}
      <div className="rounded-3xl p-5 sm:p-6 bg-surface-container-low border border-outline-variant/20 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-3.5 w-24 rounded-md skeleton-shimmer-subtle" />
            <div className="h-9 w-44 rounded-xl skeleton-shimmer" />
          </div>
          <div className="w-11 h-11 rounded-full skeleton-shimmer" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/15">
          <div className="h-6 w-32 rounded-full skeleton-shimmer-subtle" />
          <div className="h-4 w-28 rounded-md skeleton-shimmer-subtle" />
        </div>
      </div>

      {/* Primary + Add Income Button */}
      <div className="h-12 rounded-2xl skeleton-shimmer" />

      {/* Category Grid Section */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="h-4 w-24 rounded-md skeleton-shimmer" />
          <div className="h-3.5 w-20 rounded-md skeleton-shimmer-subtle" />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl p-3 bg-surface-container-low border border-outline-variant/15 flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full skeleton-shimmer" />
              <div className="h-3.5 w-14 rounded-md skeleton-shimmer" />
              <div className="h-3 w-10 rounded-md skeleton-shimmer-subtle" />
            </div>
          ))}
        </div>
      </div>

      {/* Income Records Feed */}
      <div className="flex flex-col gap-2.5 pt-2">
        <div className="h-4 w-28 rounded-md skeleton-shimmer" />
        <div className="flex flex-col gap-2">
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Expense Page Skeleton Loader
 */
export function ExpenseSkeleton() {
  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 pb-28 gap-4 animate-fade-in">
      {/* Time Scope Segmented Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="h-4 w-40 rounded-md skeleton-shimmer-subtle" />
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface-container-low border border-outline-variant/15">
          <div className="h-6 w-14 rounded-full skeleton-shimmer" />
          <div className="h-6 w-16 rounded-full skeleton-shimmer-subtle" />
          <div className="h-6 w-12 rounded-full skeleton-shimmer-subtle" />
        </div>
      </div>

      {/* Top Hero Outflow Card */}
      <div className="rounded-3xl p-5 sm:p-6 bg-surface-container-low border border-outline-variant/20 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-3.5 w-24 rounded-md skeleton-shimmer-subtle" />
            <div className="h-9 w-44 rounded-xl skeleton-shimmer" />
          </div>
          <div className="w-11 h-11 rounded-full skeleton-shimmer" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/15">
          <div className="h-6 w-32 rounded-full skeleton-shimmer-subtle" />
          <div className="h-4 w-28 rounded-md skeleton-shimmer-subtle" />
        </div>
      </div>

      {/* Primary + Add Expense Button */}
      <div className="h-12 rounded-2xl skeleton-shimmer" />

      {/* Categories Grid */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="h-4 w-24 rounded-md skeleton-shimmer" />
          <div className="h-3.5 w-20 rounded-md skeleton-shimmer-subtle" />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl p-3 bg-surface-container-low border border-outline-variant/15 flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full skeleton-shimmer" />
              <div className="h-3.5 w-14 rounded-md skeleton-shimmer" />
              <div className="h-3 w-10 rounded-md skeleton-shimmer-subtle" />
            </div>
          ))}
        </div>
      </div>

      {/* Expense Records Feed */}
      <div className="flex flex-col gap-2.5 pt-2">
        <div className="h-4 w-28 rounded-md skeleton-shimmer" />
        <div className="flex flex-col gap-2">
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Records Page Skeleton Loader
 */
export function RecordsSkeleton() {
  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 pb-28 gap-4 animate-fade-in">
      {/* Header & Subtitle */}
      <div className="flex flex-col gap-1.5">
        <div className="h-6 w-44 rounded-lg skeleton-shimmer" />
        <div className="h-3.5 w-60 rounded-md skeleton-shimmer-subtle" />
      </div>

      {/* Search Input Bar */}
      <div className="h-11 rounded-2xl bg-surface-container-low border border-outline-variant/20 skeleton-shimmer-subtle" />

      {/* Segmented Type Switcher & Count Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface-container-low border border-outline-variant/15">
          <div className="h-7 w-16 rounded-full skeleton-shimmer" />
          <div className="h-7 w-20 rounded-full skeleton-shimmer-subtle" />
          <div className="h-7 w-20 rounded-full skeleton-shimmer-subtle" />
        </div>
        <div className="h-7 w-24 rounded-full skeleton-shimmer" />
      </div>

      {/* Transaction Cards List */}
      <div className="flex flex-col gap-3 pt-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <TransactionItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * 5. Reports Page Skeleton Loader
 */
export function ReportsSkeleton() {
  return (
    <div className="w-full max-w-xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 animate-fade-in pb-20">
      {/* 1. Header & Action Buttons Skeleton */}
      <div className="flex flex-col gap-1 sm:gap-1.5">
        <div className="flex items-center justify-between gap-2">
          {/* Left Title & Status */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="h-6 sm:h-7 w-24 rounded-lg skeleton-shimmer" />
            <div className="h-5 w-14 rounded-full skeleton-shimmer-subtle" />
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div className="h-8 sm:h-9 w-16 sm:w-20 rounded-full skeleton-shimmer" />
            <div className="h-8 sm:h-9 w-16 sm:w-20 rounded-full skeleton-shimmer" />
          </div>
        </div>
        <div className="h-3.5 w-60 rounded-md skeleton-shimmer-subtle" />
      </div>

      {/* 2. Time-Period Segmented Control Skeleton */}
      <div className="w-full p-1 rounded-full bg-surface-container-high flex items-center justify-between shadow-inner">
        <div className="flex-1 h-7 rounded-full skeleton-shimmer mx-0.5" />
        <div className="flex-1 h-7 rounded-full skeleton-shimmer-subtle mx-0.5" />
        <div className="flex-1 h-7 rounded-full skeleton-shimmer-subtle mx-0.5" />
        <div className="flex-1 h-7 rounded-full skeleton-shimmer-subtle mx-0.5" />
      </div>

      {/* 3. Date Navigation Bar Skeleton */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
        <div className="w-8 h-8 rounded-full skeleton-shimmer" />
        <div className="h-5 w-36 rounded-md skeleton-shimmer" />
        <div className="w-8 h-8 rounded-full skeleton-shimmer" />
      </div>

      {/* Financial Matrix Summary Cards (Income, Expense, Net Bal) */}
      <div className="grid grid-cols-3 gap-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex flex-col gap-2">
            <div className="h-3 w-14 rounded-md skeleton-shimmer-subtle" />
            <div className="h-5 w-20 rounded-md skeleton-shimmer" />
            <div className="h-2.5 w-12 rounded-md skeleton-shimmer-subtle" />
          </div>
        ))}
      </div>

      {/* Daily Breakdown & Stacked Bar */}
      <div className="rounded-3xl p-5 bg-surface-container-low border border-outline-variant/20 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 rounded-md skeleton-shimmer" />
          <div className="h-5 w-24 rounded-full skeleton-shimmer-subtle" />
        </div>
        <div className="h-3.5 w-full rounded-full skeleton-shimmer" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-surface-container flex flex-col gap-1.5">
            <div className="h-3 w-16 rounded-md skeleton-shimmer-subtle" />
            <div className="h-5 w-24 rounded-md skeleton-shimmer" />
          </div>
          <div className="p-3 rounded-xl bg-surface-container flex flex-col gap-1.5">
            <div className="h-3 w-16 rounded-md skeleton-shimmer-subtle" />
            <div className="h-5 w-24 rounded-md skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Category Breakdown List */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="h-4 w-36 rounded-md skeleton-shimmer" />
          <div className="h-3.5 w-20 rounded-md skeleton-shimmer-subtle" />
        </div>
        <div className="flex flex-col gap-2">
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * 5b. Reports Content Transition Skeleton (Used when toggling Daily, Monthly, Yearly, All Time)
 */
export function ReportsContentSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-fade-in w-full">
      {/* Date Navigation Bar */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-surface-container-low border border-outline-variant/15">
        <div className="w-8 h-8 rounded-full skeleton-shimmer" />
        <div className="h-5 w-40 rounded-md skeleton-shimmer" />
        <div className="w-8 h-8 rounded-full skeleton-shimmer" />
      </div>

      {/* Financial Matrix Summary Cards (Income, Expense, Net Bal) */}
      <div className="grid grid-cols-3 gap-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex flex-col gap-2">
            <div className="h-3 w-14 rounded-md skeleton-shimmer-subtle" />
            <div className="h-5 w-20 rounded-md skeleton-shimmer" />
            <div className="h-2.5 w-12 rounded-md skeleton-shimmer-subtle" />
          </div>
        ))}
      </div>

      {/* Daily Breakdown & Stacked Bar */}
      <div className="rounded-3xl p-5 bg-surface-container-low border border-outline-variant/20 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 rounded-md skeleton-shimmer" />
          <div className="h-5 w-24 rounded-full skeleton-shimmer-subtle" />
        </div>
        <div className="h-3.5 w-full rounded-full skeleton-shimmer" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-surface-container flex flex-col gap-1.5">
            <div className="h-3 w-16 rounded-md skeleton-shimmer-subtle" />
            <div className="h-5 w-24 rounded-md skeleton-shimmer" />
          </div>
          <div className="p-3 rounded-xl bg-surface-container flex flex-col gap-1.5">
            <div className="h-3 w-16 rounded-md skeleton-shimmer-subtle" />
            <div className="h-5 w-24 rounded-md skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Category Breakdown List */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="h-4 w-36 rounded-md skeleton-shimmer" />
          <div className="h-3.5 w-20 rounded-md skeleton-shimmer-subtle" />
        </div>
        <div className="flex flex-col gap-2">
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * 6. Form Modal Skeleton Loader (Add Expense / Add Income)
 */
export function FormModalSkeleton({ type = 'expense' }) {
  return (
    <div className="flex flex-col gap-5 p-5 sm:p-6 w-full animate-fade-in">
      {/* Modal Top Bar: Type Switcher & Close */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface-container border border-outline-variant/15">
          <div className="h-8 w-24 rounded-full skeleton-shimmer" />
          <div className="h-8 w-24 rounded-full skeleton-shimmer-subtle" />
        </div>
        <div className="w-8 h-8 rounded-full skeleton-shimmer" />
      </div>

      {/* Amount Hero Input Box */}
      <div className="rounded-2xl p-5 bg-surface-container-low border border-outline-variant/20 flex flex-col items-center justify-center gap-2">
        <div className="h-3.5 w-24 rounded-md skeleton-shimmer-subtle" />
        <div className="h-10 w-44 rounded-xl skeleton-shimmer" />
      </div>

      {/* Quick Amount Chips */}
      <div className="flex items-center justify-center gap-2">
        <div className="h-8 w-16 rounded-full skeleton-shimmer" />
        <div className="h-8 w-16 rounded-full skeleton-shimmer" />
        <div className="h-8 w-16 rounded-full skeleton-shimmer" />
        <div className="h-8 w-16 rounded-full skeleton-shimmer" />
      </div>

      {/* Title & Note Inputs */}
      <div className="flex flex-col gap-3">
        <div className="h-11 rounded-xl bg-surface-container-low border border-outline-variant/15 skeleton-shimmer-subtle" />
        <div className="h-11 rounded-xl bg-surface-container-low border border-outline-variant/15 skeleton-shimmer-subtle" />
      </div>

      {/* Category Grid Section */}
      <div className="flex flex-col gap-2">
        <div className="h-3.5 w-28 rounded-md skeleton-shimmer-subtle" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-surface-container-low border border-outline-variant/15 p-2 flex flex-col items-center justify-center gap-1">
              <div className="w-5 h-5 rounded-full skeleton-shimmer" />
              <div className="h-2.5 w-12 rounded-md skeleton-shimmer-subtle" />
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Save Button */}
      <div className="h-12 rounded-2xl skeleton-shimmer mt-2" />
    </div>
  );
}

/**
 * 7. Filter Modal Skeleton Loader (Filter & Sort Records)
 */
export function FilterModalSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 p-4 w-full animate-fade-in">
      {/* Search Input Skeleton */}
      <div className="flex flex-col gap-1">
        <div className="h-3 w-24 rounded-md skeleton-shimmer-subtle" />
        <div className="h-8 rounded-xl bg-surface-container-low border border-outline-variant/15 skeleton-shimmer" />
      </div>

      {/* Transaction Type Segmented Skeleton */}
      <div className="flex flex-col gap-1">
        <div className="h-3 w-28 rounded-md skeleton-shimmer-subtle" />
        <div className="grid grid-cols-3 gap-1.5">
          <div className="h-7 rounded-xl skeleton-shimmer" />
          <div className="h-7 rounded-xl skeleton-shimmer-subtle" />
          <div className="h-7 rounded-xl skeleton-shimmer-subtle" />
        </div>
      </div>

      {/* Payment Modes Skeleton */}
      <div className="flex flex-col gap-1">
        <div className="h-3 w-24 rounded-md skeleton-shimmer-subtle" />
        <div className="flex flex-wrap gap-1">
          <div className="h-6 w-16 rounded-full skeleton-shimmer" />
          <div className="h-6 w-14 rounded-full skeleton-shimmer-subtle" />
          <div className="h-6 w-14 rounded-full skeleton-shimmer-subtle" />
          <div className="h-6 w-20 rounded-full skeleton-shimmer-subtle" />
          <div className="h-6 w-20 rounded-full skeleton-shimmer-subtle" />
        </div>
      </div>

      {/* Categories Dropdown Skeleton */}
      <div className="flex flex-col gap-1">
        <div className="h-3 w-20 rounded-md skeleton-shimmer-subtle" />
        <div className="h-8 rounded-xl bg-surface-container-low border border-outline-variant/15 skeleton-shimmer" />
      </div>

      {/* Sort Order Grid Skeleton */}
      <div className="flex flex-col gap-1">
        <div className="h-3 w-20 rounded-md skeleton-shimmer-subtle" />
        <div className="grid grid-cols-2 gap-1.5">
          <div className="h-7 rounded-xl skeleton-shimmer" />
          <div className="h-7 rounded-xl skeleton-shimmer-subtle" />
          <div className="h-7 rounded-xl skeleton-shimmer-subtle" />
          <div className="h-7 rounded-xl skeleton-shimmer-subtle" />
        </div>
      </div>

      {/* Footer Buttons Skeleton */}
      <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-outline-variant/15 mt-0.5">
        <div className="h-8 w-20 rounded-full skeleton-shimmer-subtle" />
        <div className="h-8 flex-1 rounded-full skeleton-shimmer" />
      </div>
    </div>
  );
}

/**
 * 8. View Record Modal Skeleton Loader
 */
export function ViewRecordModalSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-5 sm:p-6 w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
        <div className="flex items-center gap-2">
          <div className="h-5 w-36 rounded-md skeleton-shimmer" />
          <div className="h-5 w-16 rounded-full skeleton-shimmer-subtle" />
        </div>
        <div className="w-8 h-8 rounded-full skeleton-shimmer" />
      </div>

      {/* Hero Amount Box */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 flex flex-col items-center gap-2">
        <div className="h-3 w-28 rounded-md skeleton-shimmer-subtle" />
        <div className="h-9 w-40 rounded-xl skeleton-shimmer" />
        <div className="h-4 w-48 rounded-md skeleton-shimmer-subtle" />
      </div>

      {/* Metadata Grid */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/20 flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-3.5 w-24 rounded-md skeleton-shimmer-subtle" />
            <div className="h-3.5 w-32 rounded-md skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <div className="h-11 flex-1 rounded-full skeleton-shimmer-subtle" />
        <div className="h-11 flex-1 rounded-full skeleton-shimmer" />
      </div>
    </div>
  );
}

/**
 * 9. Export Modal Skeleton Loader
 */
export function ExportModalSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-5 w-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full skeleton-shimmer" />
          <div className="h-5 w-32 rounded-md skeleton-shimmer" />
        </div>
        <div className="w-8 h-8 rounded-full skeleton-shimmer" />
      </div>

      {/* Options */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
          <div className="w-10 h-10 rounded-xl skeleton-shimmer flex-shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-4 w-36 rounded-md skeleton-shimmer" />
            <div className="h-3 w-48 rounded-md skeleton-shimmer-subtle" />
          </div>
        </div>
      ))}
    </div>
  );
}

