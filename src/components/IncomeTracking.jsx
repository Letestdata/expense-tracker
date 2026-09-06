import React, { useState, useMemo } from 'react';
import {
  isIncomeTransaction,
  parseTransactionAmount,
  cleanTransactionRow,
  normalizePaymentMethod,
  formatTransactionDateTime,
} from '../utils/transactionUtils';
import { TransactionItemSkeleton } from './PageSkeletons';

const INCOME_CATEGORIES_CONFIG = [
  { id: 'Salary', label: 'Salary', icon: 'payments' },
  { id: 'Freelance', label: 'Freelance', icon: 'laptop_mac' },
  { id: 'Business', label: 'Business', icon: 'storefront' },
  { id: 'Investment', label: 'Investment', icon: 'query_stats' },
  { id: 'Gift', label: 'Gift', icon: 'redeem' },
  { id: 'Other', label: 'Other', icon: 'more_horiz' },
];

export default function IncomeTracking({
  transactions = [],
  isLoading = false,
  onAddIncome,
  onViewRecord,
}) {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);

  const handleCategorySelect = (catId) => {
    setIsFilterTransitioning(true);
    setSelectedCategoryFilter((prev) => (prev === catId ? 'all' : catId));
    setTimeout(() => setIsFilterTransitioning(false), 200);
  };

  // Month label (e.g., "Sep 2026")
  const monthLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, []);

  // Helper to parse amount
  const parseAmount = (item) => parseTransactionAmount(item);

  // Filter ALL income transactions using comprehensive classification
  const incomeTransactions = useMemo(() => {
    return transactions.map(cleanTransactionRow).filter(isIncomeTransaction);
  }, [transactions]);

  // Total Inflow computation
  const totalInflow = useMemo(() => {
    return incomeTransactions.reduce((sum, item) => sum + parseTransactionAmount(item), 0);
  }, [incomeTransactions]);

  // Dynamically include all income categories present in the user's data
  const activeIncomeCategories = useMemo(() => {
    const list = [...INCOME_CATEGORIES_CONFIG];
    incomeTransactions.forEach((item) => {
      const cat = (item.category || item.sheetName || '').trim();
      if (cat && !list.some((c) => c.id.toLowerCase() === cat.toLowerCase())) {
        list.splice(list.length - 1, 0, {
          id: cat,
          label: cat,
          icon: 'payments',
        });
      }
    });
    return list;
  }, [incomeTransactions]);

  // Aggregate by Category
  const categoryTotals = useMemo(() => {
    const map = {};
    activeIncomeCategories.forEach((c) => {
      map[c.id] = 0;
    });

    incomeTransactions.forEach((item) => {
      const cat = (item.category || item.sheetName || 'Other').trim();
      const amt = parseTransactionAmount(item);
      const matched = activeIncomeCategories.find(
        (c) => c.id.toLowerCase() === cat.toLowerCase()
      );
      const key = matched ? matched.id : 'Other';
      map[key] = (map[key] || 0) + amt;
    });

    return map;
  }, [incomeTransactions, activeIncomeCategories]);

  // Filtered Income History list
  const filteredHistory = useMemo(() => {
    if (selectedCategoryFilter === 'all') return incomeTransactions;
    return incomeTransactions.filter((item) => {
      const cat = (item.category || item.sheetName || 'Other').toLowerCase().trim();
      return cat === selectedCategoryFilter.toLowerCase().trim();
    });
  }, [incomeTransactions, selectedCategoryFilter]);

  const cleanTitle = (title) =>
    title ? title.replace(/\s*\(₹[\d,]+(?:\.\d+)?\)\s*$/, '') : 'Income Deposit';

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 pb-28 gap-4 animate-fade-in">
      
      {/* 1. Micro Sub-Header & Month Selector */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="font-body-md text-[14px] text-on-surface-variant font-medium">
            Track the money coming in.
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-container-high px-3 py-1 rounded-full border border-outline-variant/20">
          <span
            className="material-symbols-outlined text-[16px] text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            calendar_today
          </span>
          <span className="font-label-sm text-[12px] text-on-surface font-semibold">
            {monthLabel}
          </span>
        </div>
      </div>

      {/* 2. Top Hero Income Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-container-low via-surface-container to-secondary-container/30 p-5 sm:p-6 shadow-sm border border-outline-variant/20">
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-primary-fixed/25 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="font-label-md text-[13px] text-on-surface-variant font-semibold block mb-1">
              Total Inflow
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-[34px] sm:text-[40px] font-black text-on-surface tracking-tight leading-none">
                ₹{totalInflow.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </span>
              <span className="font-body-sm text-[14px] text-on-surface-variant font-medium">
                .00
              </span>
            </div>
          </div>

          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-[26px]">savings</span>
          </div>
        </div>

        <div className="mt-4 pt-2 flex items-center justify-between relative z-10 flex-wrap gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest shadow-sm border border-outline-variant/15">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-label-sm text-[11px] text-primary font-bold">
              This Month ₹{totalInflow.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="font-label-sm text-[12px] text-secondary font-medium flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[15px]">trending_up</span>
            <span>+14.2% vs last month</span>
          </span>
        </div>
      </div>

      {/* 3. Primary Action Button */}
      <button
        type="button"
        onClick={onAddIncome}
        className="w-full h-12 bg-primary-container hover:bg-primary active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-2 text-on-primary shadow-md font-label-md text-[14px] font-bold tracking-wide"
      >
        <span className="material-symbols-outlined text-[20px]">add_circle</span>
        <span>+ Add Income</span>
      </button>

      {/* 4. Categories Breakdown Section */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-headline-sm text-[16px] sm:text-[17px] font-bold text-on-surface">
            Categories
          </h2>
          <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">
            {activeIncomeCategories.length} Active Sources
          </span>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {activeIncomeCategories.map((cat) => {
            const amt = categoryTotals[cat.id] || 0;
            const isSelected = selectedCategoryFilter === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`rounded-2xl p-3 flex flex-col items-center text-center transition-all border ${
                  isSelected
                    ? 'bg-primary-container text-on-primary border-primary shadow-md ring-2 ring-primary/30'
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/20 hover:bg-surface-container-low shadow-sm'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                    isSelected
                      ? 'bg-white/20 text-on-primary'
                      : 'bg-secondary-container/60 text-secondary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[19px]">
                    {cat.icon}
                  </span>
                </div>
                <span
                  className={`font-label-sm text-[12px] font-semibold truncate w-full ${
                    isSelected ? 'text-on-primary' : 'text-on-surface'
                  }`}
                >
                  {cat.label}
                </span>
                <span
                  className={`font-headline-sm text-[13px] font-bold mt-0.5 ${
                    isSelected
                      ? 'text-on-primary'
                      : amt > 0
                      ? 'text-primary'
                      : 'text-on-surface-variant font-normal'
                  }`}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Income History Feed */}
      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-headline-sm text-[16px] sm:text-[17px] font-bold text-on-surface">
              Income History
            </h3>
            {selectedCategoryFilter !== 'all' && (
              <span className="text-[11px] font-semibold text-primary bg-primary-fixed/40 px-2 py-0.5 rounded-full">
                {selectedCategoryFilter}
              </span>
            )}
          </div>

          {selectedCategoryFilter !== 'all' ? (
            <button
              type="button"
              onClick={() => handleCategorySelect(selectedCategoryFilter)}
              className="font-label-sm text-[11px] text-primary hover:underline font-semibold"
            >
              Clear Filter
            </button>
          ) : (
            <div className="flex items-center gap-1 text-on-surface-variant text-[11px] font-medium">
              <span className="material-symbols-outlined text-[15px]">filter_list</span>
              <span>Showing all inflows</span>
            </div>
          )}
        </div>

        {/* History List or Empty State or Skeleton */}
        {isLoading || isFilterTransitioning ? (
          <div className="flex flex-col gap-2.5 animate-fade-in">
            <TransactionItemSkeleton />
            <TransactionItemSkeleton />
            <TransactionItemSkeleton />
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-surface-container-lowest rounded-2xl shadow-sm text-center border border-dashed border-outline-variant/30 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-primary-fixed/30 flex items-center justify-center text-primary mb-3">
              <span className="material-symbols-outlined text-[28px]">payments</span>
            </div>
            <h4 className="font-headline-sm text-[16px] font-bold text-on-surface">
              {selectedCategoryFilter !== 'all'
                ? `No ${selectedCategoryFilter} entries`
                : 'No income logged yet'}
            </h4>
            <p className="font-body-sm text-[12px] text-on-surface-variant max-w-[240px] mt-1 mb-4">
              Click below to record your first income deposit!
            </p>
            <button
              type="button"
              onClick={onAddIncome}
              className="flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary-container text-on-primary font-label-md text-[12px] font-semibold shadow-sm hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">add</span>
              <span>+ Add Income</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/20 divide-y divide-outline-variant/15">
            {filteredHistory.map((item) => {
              const amt = parseAmount(item);
              const cat = item.category || item.sheetName || 'Other';
              const matchedIcon =
                INCOME_CATEGORIES_CONFIG.find(
                  (c) => c.id.toLowerCase() === cat.toLowerCase()
                )?.icon || 'payments';

              return (
                <div
                  key={item.id}
                  onClick={() => onViewRecord && onViewRecord(item)}
                  className="flex items-center justify-between p-3.5 hover:bg-surface-container-low transition-colors duration-150 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        {matchedIcon}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-headline-sm text-[14px] font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                        {cleanTitle(item.title)}
                      </span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">
                        {cat} • {formatTransactionDateTime(item)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0 pl-2">
                    <span className="font-headline-sm text-[15px] font-extrabold text-primary">
                      +₹{amt.toLocaleString('en-IN')}
                    </span>
                    <span className="font-label-sm text-[10px] uppercase font-semibold text-primary bg-primary-fixed/50 px-2 py-0.5 rounded-full mt-1">
                      {normalizePaymentMethod(item.paymentMethod, true)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
