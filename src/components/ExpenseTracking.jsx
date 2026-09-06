import React, { useState, useMemo } from 'react';
import {
  isExpenseTransaction,
  parseTransactionAmount,
  parseTransactionDate,
  cleanTransactionRow,
  normalizePaymentMethod,
  formatTransactionDateTime,
} from '../utils/transactionUtils';
import { TransactionItemSkeleton } from './PageSkeletons';

const EXPENSE_CATEGORIES_CONFIG = [
  { id: 'Food', label: 'Food & Dining', icon: 'restaurant', color: 'bg-secondary-container/60 text-secondary' },
  { id: 'Shopping', label: 'Shopping', icon: 'shopping_bag', color: 'bg-primary-fixed/50 text-primary' },
  { id: 'Bills', label: 'Bills & Utilities', icon: 'receipt_long', color: 'bg-surface-container-high text-secondary' },
  { id: 'Transport', label: 'Transport', icon: 'directions_car', color: 'bg-secondary-fixed/70 text-on-secondary-fixed-variant' },
  { id: 'Health', label: 'Health & Medical', icon: 'favorite', color: 'bg-error-container/50 text-error' },
  { id: 'Education', label: 'Education', icon: 'menu_book', color: 'bg-tertiary-fixed/60 text-tertiary' },
];

export default function ExpenseTracking({
  transactions = [],
  isLoading = false,
  onAddExpense,
  onViewRecord,
}) {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('month'); // 'today' | 'month' | 'all'
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);

  const handleTimeFilter = (val) => {
    if (timeFilter === val) return;
    setIsFilterTransitioning(true);
    setTimeFilter(val);
    setTimeout(() => setIsFilterTransitioning(false), 200);
  };

  const handleCategorySelect = (catId) => {
    setIsFilterTransitioning(true);
    setSelectedCategoryFilter((prev) => (prev === catId ? 'all' : catId));
    setTimeout(() => setIsFilterTransitioning(false), 200);
  };

  // Month label (e.g., "SEPTEMBER 2026")
  const monthLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  }, []);

  // Helper to parse amount
  const parseAmount = (item) => parseTransactionAmount(item);

  // Filter expense transactions based on active time scope and classification
  const expenseTransactions = useMemo(() => {
    const today = new Date();
    return transactions
      .map(cleanTransactionRow)
      .filter(isExpenseTransaction)
      .filter((item) => {
        if (timeFilter === 'all') return true;
        const d = parseTransactionDate(item);
        if (!d || isNaN(d.getTime())) return true;
        if (timeFilter === 'today') {
          return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
          );
        }
        if (timeFilter === 'month') {
          return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth()
          );
        }
        return true;
      });
  }, [transactions, timeFilter]);

  // Total Expenses computation
  const totalExpense = useMemo(() => {
    return expenseTransactions.reduce((sum, item) => sum + parseTransactionAmount(item), 0);
  }, [expenseTransactions]);

  // Baseline budget pace (defaults to ₹20,000 or scales with total)
  const budgetTarget = 20000;
  const budgetPacePct = Math.min(100, Math.round((totalExpense / budgetTarget) * 100));
  const budgetLeft = Math.max(0, budgetTarget - totalExpense);

  // Dynamically include all categories present in the user's expense transactions
  const activeExpenseCategories = useMemo(() => {
    const list = [...EXPENSE_CATEGORIES_CONFIG];
    expenseTransactions.forEach((item) => {
      const cat = (item.category || item.sheetName || '').trim();
      if (
        cat &&
        !list.some(
          (c) =>
            c.id.toLowerCase() === cat.toLowerCase() ||
            c.label.toLowerCase() === cat.toLowerCase()
        )
      ) {
        list.push({
          id: cat,
          label: cat,
          icon: 'receipt_long',
          color: 'bg-surface-container-high text-secondary',
        });
      }
    });
    return list;
  }, [expenseTransactions]);

  // Aggregate by Category
  const categoryTotals = useMemo(() => {
    const map = {};
    activeExpenseCategories.forEach((c) => {
      map[c.id] = 0;
    });

    expenseTransactions.forEach((item) => {
      const cat = (item.category || item.sheetName || 'Other').trim();
      const matched = activeExpenseCategories.find(
        (c) =>
          c.id.toLowerCase() === cat.toLowerCase() ||
          c.label.toLowerCase() === cat.toLowerCase()
      );
      const key = matched ? matched.id : 'Other';
      map[key] = (map[key] || 0) + parseTransactionAmount(item);
    });

    return map;
  }, [expenseTransactions, activeExpenseCategories]);

  // Filtered Expense History list
  const filteredExpenses = useMemo(() => {
    if (selectedCategoryFilter === 'all') return expenseTransactions;
    return expenseTransactions.filter((item) => {
      const cat = (item.category || item.sheetName || '').toLowerCase().trim();
      const targetConfig = activeExpenseCategories.find((c) => c.id === selectedCategoryFilter);
      return (
        cat === selectedCategoryFilter.toLowerCase().trim() ||
        (targetConfig && cat === targetConfig.label.toLowerCase().trim())
      );
    });
  }, [expenseTransactions, selectedCategoryFilter, activeExpenseCategories]);

  const cleanTitle = (title) =>
    title ? title.replace(/\s*\(₹[\d,]+(?:\.\d+)?\)\s*$/, '') : 'Expense';

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 pb-28 gap-4 animate-fade-in">
      
      {/* 1. Header Subtitle & Context Indicator */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="font-body-md text-[14px] text-on-surface-variant font-medium">
            Track where your money goes.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/50 border border-outline-variant/15">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-label-sm text-[11px] text-on-secondary-container font-semibold tracking-wide uppercase">
            {monthLabel}
          </span>
        </div>
      </div>

      {/* 2. Top Hero Expense Summary Card */}
      <div className="relative overflow-hidden rounded-3xl bg-surface-container-low p-5 sm:p-6 shadow-sm border border-outline-variant/20">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-primary-fixed/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-[13px] text-on-surface-variant font-semibold tracking-wide">
              Total Expenses
            </span>
            <div className="flex items-center gap-1 bg-surface-container-highest/80 p-0.5 rounded-full text-[11px] font-semibold">
              {[
                { id: 'today', label: 'Today' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'All' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTimeFilter(t.id)}
                  className={`px-2 py-0.5 rounded-full transition-all ${
                    timeFilter === t.id
                      ? 'bg-primary text-on-primary font-bold shadow-sm'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[34px] sm:text-[40px] font-black text-on-surface tracking-tight leading-none">
              ₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
            <span className="font-body-sm text-[13px] text-secondary font-medium">
              settled
            </span>
          </div>

          {/* Monthly Budget Pace Meter */}
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex justify-between items-center font-label-sm text-[12px]">
              <span className="text-on-surface-variant">
                Monthly Pace ({budgetPacePct}% of ₹{budgetTarget.toLocaleString('en-IN')} budget)
              </span>
              <span className="text-primary font-bold">
                ₹{budgetLeft.toLocaleString('en-IN')} left
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-container transition-all duration-700 ease-out"
                style={{ width: `${Math.max(6, budgetPacePct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. High Visibility Primary Action Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onAddExpense}
          className="flex-1 h-12 rounded-2xl bg-primary-container text-on-primary font-label-md text-[14px] font-bold flex items-center justify-center gap-2 shadow-md hover:bg-primary active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>+ Add Expense</span>
        </button>
        <button
          type="button"
          onClick={() => handleCategorySelect('Food')}
          className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-all border ${
            selectedCategoryFilter !== 'all'
              ? 'bg-primary-container text-on-primary border-primary'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border-outline-variant/20'
          }`}
          title="Filter Categories"
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </button>
      </div>

      {/* 4. Expense Categories Carousel / Grid */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-headline-sm text-[16px] sm:text-[17px] font-bold text-on-surface">
            Categories
          </h2>
          {selectedCategoryFilter !== 'all' ? (
            <button
              type="button"
              onClick={() => handleCategorySelect(selectedCategoryFilter)}
              className="font-label-sm text-[12px] text-primary font-semibold hover:underline"
            >
              Reset Filter
            </button>
          ) : (
            <span className="font-label-sm text-[12px] text-secondary font-medium">
              Tap card to filter
            </span>
          )}
        </div>

        {/* Scrollable / Grid Category Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {activeExpenseCategories.map((cat) => {
            const amt = categoryTotals[cat.id] || 0;
            const isSelected = selectedCategoryFilter === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`p-3 rounded-2xl flex flex-col justify-between text-left transition-all border ${
                  isSelected
                    ? 'bg-primary-container text-on-primary border-primary shadow-md ring-2 ring-primary/30'
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/20 hover:bg-surface-container-low shadow-sm'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    isSelected ? 'bg-white/20 text-on-primary' : cat.color
                  }`}
                >
                  <span className="material-symbols-outlined text-[19px]">
                    {cat.icon}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-body-sm text-[12px] truncate ${
                      isSelected ? 'text-on-primary/90' : 'text-on-surface-variant'
                    }`}
                  >
                    {cat.label}
                  </span>
                  <span
                    className={`font-headline-sm text-[14px] font-bold mt-0.5 ${
                      isSelected ? 'text-on-primary' : amt > 0 ? 'text-on-surface' : 'text-outline font-normal'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Recent Expenses Section */}
      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-headline-sm text-[16px] sm:text-[17px] font-bold text-on-surface">
              Recent Expenses
            </h3>
            {selectedCategoryFilter !== 'all' && (
              <span className="text-[11px] font-semibold text-secondary bg-secondary-container/60 px-2 py-0.5 rounded-full">
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
            <span className="font-label-sm text-[11px] text-on-surface-variant">
              {filteredExpenses.length} entries
            </span>
          )}
        </div>

        {/* Expenses List or Empty State or Skeleton */}
        {isLoading || isFilterTransitioning ? (
          <div className="flex flex-col gap-2.5 animate-fade-in">
            <TransactionItemSkeleton />
            <TransactionItemSkeleton />
            <TransactionItemSkeleton />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-surface-container-lowest rounded-2xl shadow-sm text-center border border-dashed border-outline-variant/30 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary mb-3">
              <span className="material-symbols-outlined text-[28px]">receipt_long</span>
            </div>
            <h4 className="font-headline-sm text-[16px] font-bold text-on-surface">
              {selectedCategoryFilter !== 'all'
                ? `No ${selectedCategoryFilter} expenses`
                : 'No expenses logged yet'}
            </h4>
            <p className="font-body-sm text-[12px] text-on-surface-variant max-w-[240px] mt-1 mb-4">
              Click below to record your first expense!
            </p>
            <button
              type="button"
              onClick={onAddExpense}
              className="flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary-container text-on-primary font-label-md text-[12px] font-semibold shadow-sm hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">add</span>
              <span>+ Add Expense</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/20 divide-y divide-outline-variant/15">
            {filteredExpenses.map((item) => {
              const amt = parseAmount(item);
              const cat = item.category || item.sheetName || 'Other';
              const matchedConfig = EXPENSE_CATEGORIES_CONFIG.find(
                (c) => c.id.toLowerCase() === cat.toLowerCase() || c.label.toLowerCase() === cat.toLowerCase()
              );
              const icon = matchedConfig ? matchedConfig.icon : 'receipt_long';

              return (
                <div
                  key={item.id}
                  onClick={() => onViewRecord && onViewRecord(item)}
                  className="flex items-center justify-between p-3.5 hover:bg-surface-container-low transition-colors duration-150 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        {icon}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-headline-sm text-[14px] font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                          {cleanTitle(item.title)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary-container/50 text-secondary flex-shrink-0">
                          {cat}
                        </span>
                      </div>
                      <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                        {formatTransactionDateTime(item)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0 pl-2">
                    <span className="font-headline-sm text-[15px] font-extrabold text-on-surface">
                      -₹{amt.toLocaleString('en-IN')}
                    </span>
                    <span className="font-label-sm text-[10px] uppercase font-semibold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full mt-1">
                      {normalizePaymentMethod(item.paymentMethod, false)}
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
