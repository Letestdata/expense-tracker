import React, { useState, useMemo, useEffect } from 'react';
import {
  isIncomeTransaction,
  parseTransactionAmount,
  normalizePaymentMethod,
  formatTransactionDateTime,
} from '../utils/transactionUtils';
import { TransactionItemSkeleton } from './PageSkeletons';

const CATEGORY_ICONS = {
  Food: 'restaurant',
  'Food & Dining': 'restaurant',
  Shopping: 'shopping_bag',
  Transport: 'commute',
  Bills: 'receipt_long',
  'Bills & Utilities': 'receipt_long',
  Health: 'favorite',
  'Health & Medical': 'favorite',
  Education: 'menu_book',
  Leisure: 'movie',
  'Fun & Leisure': 'movie',
  Salary: 'payments',
  Freelance: 'laptop_mac',
  Business: 'storefront',
  Investment: 'trending_up',
  Gift: 'redeem',
  Other: 'savings',
};

export default function RecordsHistory({
  transactions = [],
  isLoading = false,
  isSheetConnected = true,
  initialTypeFilter = 'all',
  onViewRecord,
  onAddExpense,
  onAddIncome,
}) {
  const [typeFilter, setTypeFilter] = useState(initialTypeFilter); // 'all' | 'income' | 'expense'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [amountSort, setAmountSort] = useState(null); // null | 'desc' | 'asc'
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);

  const handleTypeFilter = (val) => {
    if (val === typeFilter) return;
    setIsFilterTransitioning(true);
    setTypeFilter(val);
    setTimeout(() => setIsFilterTransitioning(false), 200);
  };

  const handleCategoryFilter = (val) => {
    if (val === categoryFilter) return;
    setIsFilterTransitioning(true);
    setCategoryFilter(val);
    setTimeout(() => setIsFilterTransitioning(false), 200);
  };

  // Synchronize typeFilter when navigated with a specific filter (e.g. from Home View All Records)
  React.useEffect(() => {
    if (initialTypeFilter) {
      setTypeFilter(initialTypeFilter);
    }
  }, [initialTypeFilter]);

  // Parse amount helper
  const parseAmount = (item) => parseTransactionAmount(item);

  const isIncome = (item) => isIncomeTransaction(item);

  // Compute live Totals across all transactions
  const { totalIn, totalOut, netBalance, retentionRate } = useMemo(() => {
    let tin = 0;
    let tout = 0;
    transactions.forEach((item) => {
      const amt = parseAmount(item);
      if (isIncome(item)) {
        tin += amt;
      } else {
        tout += amt;
      }
    });
    const net = tin - tout;
    const rate = tin > 0 ? Math.max(0, Math.min(100, Math.round((net / tin) * 100))) : 0;
    return {
      totalIn: tin,
      totalOut: tout,
      netBalance: net,
      retentionRate: rate,
    };
  }, [transactions]);

  // Unique categories for filtering
  const allCategories = useMemo(() => {
    const set = new Set();
    transactions.forEach((t) => {
      const cat = t.category || t.sheetName;
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [transactions]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return transactions
      .filter((item) => {
        // 1. Type filter
        if (typeFilter === 'income' && !isIncome(item)) return false;
        if (typeFilter === 'expense' && isIncome(item)) return false;

        // 2. Category filter
        if (categoryFilter !== 'all') {
          const itemCat = (item.category || item.sheetName || '').toLowerCase();
          if (itemCat !== categoryFilter.toLowerCase()) return false;
        }

        // 3. Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (item.title || '').toLowerCase().includes(q);
          const matchCategory = (item.category || item.sheetName || '').toLowerCase().includes(q);
          const matchDesc = (item.description || '').toLowerCase().includes(q);
          if (!matchTitle && !matchCategory && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (amountSort === 'desc') {
          return parseAmount(b) - parseAmount(a);
        }
        if (amountSort === 'asc') {
          return parseAmount(a) - parseAmount(b);
        }
        return 0; // Natural chronological order
      });
  }, [transactions, typeFilter, categoryFilter, searchQuery, amountSort]);

  // Group items by date: Today, Yesterday, Earlier
  const groupedSections = useMemo(() => {
    const todayStr = new Date().toDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    const groups = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    filteredItems.forEach((item) => {
      if (!item.timestamp) {
        groups.Earlier.push(item);
        return;
      }
      const itemDate = new Date(item.timestamp);
      if (isNaN(itemDate.getTime())) {
        if (item.timestamp.toLowerCase().includes('today') || item.timestamp.toLowerCase().includes('just now')) {
          groups.Today.push(item);
        } else if (item.timestamp.toLowerCase().includes('yesterday')) {
          groups.Yesterday.push(item);
        } else {
          groups.Earlier.push(item);
        }
        return;
      }

      const itemDateStr = itemDate.toDateString();
      if (itemDateStr === todayStr) {
        groups.Today.push(item);
      } else if (itemDateStr === yesterdayStr) {
        groups.Yesterday.push(item);
      } else {
        groups.Earlier.push(item);
      }
    });

    const result = [];
    if (groups.Today.length > 0) result.push({ title: 'Today', items: groups.Today });
    if (groups.Yesterday.length > 0) result.push({ title: 'Yesterday', items: groups.Yesterday });
    if (groups.Earlier.length > 0) result.push({ title: 'Earlier', items: groups.Earlier });

    return result;
  }, [filteredItems]);

  const cleanTitle = (title) =>
    title ? title.replace(/\s*\(₹[\d,]+(?:\.\d+)?\)\s*$/, '') : 'Transaction';

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 pb-28 gap-4 animate-fade-in">
      
      {/* 1. Summary Status Strip */}
      <div className="flex items-center justify-between bg-surface-container-low px-4 py-2.5 rounded-full border border-outline-variant/15">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isSheetConnected ? 'bg-primary animate-pulse' : 'bg-outline'}`} />
          <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
            {isSheetConnected ? 'Ledger Synchronized' : 'Offline Ledger'}
          </span>
        </div>
        <span className="font-label-sm text-[11px] text-secondary font-semibold bg-surface-container-lowest px-3 py-1 rounded-full shadow-sm">
          {transactions.length} records
        </span>
      </div>

      {/* 2. Segmented Type Selector (All | Income | Expense) */}
      <div className="bg-surface-container-high p-1 rounded-full flex items-center shadow-inner">
        <button
          type="button"
          onClick={() => handleTypeFilter('all')}
          className={`flex-1 py-2 text-center rounded-full font-label-md text-[13px] transition-all duration-200 ${
            typeFilter === 'all'
              ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
              : 'text-on-surface-variant hover:text-on-surface font-medium'
          }`}
        >
          All ({transactions.length})
        </button>
        <button
          type="button"
          onClick={() => handleTypeFilter('income')}
          className={`flex-1 py-2 text-center rounded-full font-label-md text-[13px] transition-all duration-200 ${
            typeFilter === 'income'
              ? 'bg-primary-container text-on-primary shadow-sm font-bold'
              : 'text-on-surface-variant hover:text-on-surface font-medium'
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => handleTypeFilter('expense')}
          className={`flex-1 py-2 text-center rounded-full font-label-md text-[13px] transition-all duration-200 ${
            typeFilter === 'expense'
              ? 'bg-primary-container text-on-primary shadow-sm font-bold'
              : 'text-on-surface-variant hover:text-on-surface font-medium'
          }`}
        >
          Expense
        </button>
      </div>

      {/* 3. Search & Secondary Filter Chips */}
      <div className="flex flex-col gap-2">
        <div className="relative w-full flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name or category"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-[13px] pl-10 pr-9 py-2.5 rounded-2xl shadow-sm border border-outline-variant/20 focus:outline-none focus:bg-surface-container-low transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Quick Attribute Chips */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
          {/* Category Chip / Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => handleCategoryFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-full font-label-sm text-[11px] font-semibold shadow-sm border transition-colors cursor-pointer focus:outline-none ${
              categoryFilter !== 'all'
                ? 'bg-primary-container text-on-primary border-primary'
                : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border-outline-variant/20'
            }`}
          >
            <option value="all">Category: All</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Amount Sort Pill */}
          <button
            type="button"
            onClick={() => {
              if (amountSort === null) setAmountSort('desc');
              else if (amountSort === 'desc') setAmountSort('asc');
              else setAmountSort(null);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-label-sm text-[11px] font-semibold shadow-sm border transition-colors flex-shrink-0 ${
              amountSort !== null
                ? 'bg-primary-container text-on-primary border-primary'
                : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border-outline-variant/20'
            }`}
          >
            <span>
              {amountSort === 'desc' ? 'Amount: High → Low' : amountSort === 'asc' ? 'Amount: Low → High' : 'Sort Amount'}
            </span>
            <span className="material-symbols-outlined text-[14px]">swap_vert</span>
          </button>

          {/* Reset Filters (if any applied) */}
          {(categoryFilter !== 'all' || amountSort !== null || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('all');
                setAmountSort(null);
                setSearchQuery('');
              }}
              className="px-2.5 py-1.5 rounded-full text-primary hover:underline text-[11px] font-semibold flex-shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 4. Weekly Overview Metric Chiplets */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-sm text-[11px] uppercase font-semibold">Total In</span>
            <span className="material-symbols-outlined text-primary text-[18px]">arrow_downward</span>
          </div>
          <span className="font-headline-sm text-[18px] sm:text-[20px] font-extrabold text-primary mt-1">
            +₹{totalIn.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-sm text-[11px] uppercase font-semibold">Total Out</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">arrow_upward</span>
          </div>
          <span className="font-headline-sm text-[18px] sm:text-[20px] font-extrabold text-on-surface mt-1">
            -₹{totalOut.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* 5. Chronological Grouped Transaction Feed */}
      {isLoading || isFilterTransitioning ? (
        <div className="flex flex-col gap-2.5 animate-fade-in">
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
          <TransactionItemSkeleton />
        </div>
      ) : groupedSections.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-8 bg-surface-container-lowest rounded-2xl shadow-sm text-center border border-dashed border-outline-variant/30 animate-fade-in my-2">
          <div className="w-14 h-14 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary mb-3">
            <span className="material-symbols-outlined text-[28px]">receipt_long</span>
          </div>
          <h4 className="font-headline-sm text-[16px] font-bold text-on-surface">
            No Records Found
          </h4>
          <p className="font-body-sm text-[12px] text-on-surface-variant max-w-[240px] mt-1 mb-4">
            {searchQuery || categoryFilter !== 'all'
              ? 'No transactions matched your filter criteria.'
              : 'Your transaction records will appear here as soon as you record an entry.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAddIncome}
              className="px-4 py-2 rounded-full bg-primary-fixed text-primary font-label-md text-[12px] font-semibold shadow-sm hover:bg-primary-fixed-dim transition-colors"
            >
              + Add Income
            </button>
            <button
              type="button"
              onClick={onAddExpense}
              className="px-4 py-2 rounded-full bg-primary-container text-on-primary font-label-md text-[12px] font-semibold shadow-sm hover:bg-primary transition-colors"
            >
              + Add Expense
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {groupedSections.map((sec) => (
            <div key={sec.title} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                  {sec.title}
                </span>
                <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">
                  {sec.items.length} {sec.items.length === 1 ? 'record' : 'records'}
                </span>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/20 divide-y divide-outline-variant/15">
                {sec.items.map((item) => {
                  const amt = parseAmount(item);
                  const inc = isIncome(item);
                  const cat = item.category || item.sheetName || 'Other';
                  const icon = CATEGORY_ICONS[cat] || (inc ? 'payments' : 'receipt_long');

                  return (
                    <div
                      key={item.id}
                      onClick={() => onViewRecord(item)}
                      className="flex items-center justify-between p-3.5 hover:bg-surface-container-low transition-colors duration-150 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${
                            inc
                              ? 'bg-primary-fixed text-primary'
                              : 'bg-surface-container text-secondary'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">{icon}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-headline-sm text-[14px] font-bold text-on-surface leading-tight truncate group-hover:text-primary transition-colors">
                            {cleanTitle(item.title)}
                          </span>
                          <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-[11px] mt-0.5">
                            <span className="text-secondary font-medium">{cat}</span>
                            <span className="w-1 h-1 rounded-full bg-outline-variant" />
                            <span>{formatTransactionDateTime(item)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0 pl-2 text-right">
                        <span
                          className={`font-headline-sm text-[15px] font-extrabold ${
                            inc ? 'text-primary' : 'text-on-surface'
                          }`}
                        >
                          {inc ? '+' : '-'}₹{amt.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`font-label-sm text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full mt-1 ${
                            inc
                              ? 'bg-primary-fixed text-primary'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {normalizePaymentMethod(item.paymentMethod, inc)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. Net Balance Summary Footer Card */}
      <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between gap-3 mt-1 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-[20px]">trending_up</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-[14px] font-bold text-on-surface">
              Net Balance: {netBalance >= 0 ? '+' : '-'}₹{Math.abs(netBalance).toLocaleString('en-IN')}
            </span>
            <span className="font-body-sm text-[11px] text-on-surface-variant">
              {retentionRate}% retained from earnings
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
      </div>

    </div>
  );
}
