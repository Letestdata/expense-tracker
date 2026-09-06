import React, { useState, useMemo } from 'react';
import {
  isIncomeTransaction,
  parseTransactionAmount,
  parseTransactionDate,
  cleanTransactionRow,
  normalizePaymentMethod,
  formatTransactionDateTime,
} from '../utils/transactionUtils';
import { TransactionItemSkeleton } from './PageSkeletons';

const CATEGORY_ICONS = {
  Food: 'restaurant',
  'Food & Dining': 'restaurant',
  Shopping: 'shopping_bag',
  Transport: 'commute',
  Bills: 'lightbulb',
  'Bills & Utilities': 'lightbulb',
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

const AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAnkfFZGqnKn76vIuOA9ZnZZaAOxrMz__XZFIcpYbsbuBu-gIhiWHKCP34W-ZleCXwXEcDRt2FJeNoIsUnLt2wiYhFOd4ORjupSmF9MEj4NDoms_pzjoEogoKIjP2-8muyFkSU0ZvD65K-VNqflqjCuwHsUcktxFhxF0InJiRiM2HiY-NCUGssTREBeSk5mUJEJt3R016pID5rtBgvrZ4UJuChrio-knA-Q5XEjeR4mvlHP1_kzniPbyw';

export default function HomeOverview({
  transactions = [],
  isLoading = false,
  onAddIncome,
  onAddExpense,
  onViewAllRecords,
  onViewRecord,
}) {
  const [quickFilter, setQuickFilter] = useState('all'); // 'all' | 'income' | 'expense'
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = prev week, +1 = next week
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);

  const handleQuickFilter = (targetVal) => {
    setIsFilterTransitioning(true);
    setQuickFilter(targetVal);
    setTimeout(() => setIsFilterTransitioning(false), 180);
  };

  // Active dataset
  const activeTransactions = useMemo(() => {
    return transactions.map(cleanTransactionRow);
  }, [transactions]);

  // Dynamic Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: 'wb_sunny' };
    if (hour < 17) return { text: 'Good afternoon', icon: 'wb_sunny' };
    return { text: 'Good evening', icon: 'nights_stay' };
  }, []);

  // Compute live financial totals
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;

    activeTransactions.forEach((item) => {
      const amt = parseTransactionAmount(item);
      const isInc = isIncomeTransaction(item);
      if (isInc) {
        income += amt;
      } else {
        expense += amt;
      }
    });

    const balance = income - expense;
    const burnRate = income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : 0;
    const avgDailyOutflow = Math.round(expense / 7);

    return {
      income,
      expense,
      balance,
      burnRate,
      avgDailyOutflow,
    };
  }, [activeTransactions]);

  // Find reference date (latest date with transactions, or today)
  const referenceDate = useMemo(() => {
    let maxDate = null;
    activeTransactions.forEach((tx) => {
      const d = parseTransactionDate(tx);
      if (d && !isNaN(d.getTime())) {
        if (!maxDate || d.getTime() > maxDate.getTime()) {
          maxDate = d;
        }
      }
    });
    return maxDate || new Date();
  }, [activeTransactions]);

  // Compute 7-day bar chart pattern with previous/next week navigation
  const weekData = useMemo(() => {
    // Base date shifted by weekOffset * 7 days
    const base = new Date(referenceDate);
    base.setDate(base.getDate() + weekOffset * 7);

    // Calculate Monday of that week
    const dayOfWeek = base.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        dateObj: d,
        dayName: dayLabels[i],
        dateNum: d.getDate(),
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate(),
        total: 0,
      });
    }

    // Aggregate expense transactions for each of the 7 exact calendar days
    activeTransactions.forEach((item) => {
      if (!isIncomeTransaction(item)) {
        const amt = parseTransactionAmount(item);
        const txDate = parseTransactionDate(item);
        if (txDate && !isNaN(txDate.getTime())) {
          const match = days.find(
            (d) =>
              d.year === txDate.getFullYear() &&
              d.month === txDate.getMonth() &&
              d.day === txDate.getDate()
          );
          if (match) {
            match.total += amt;
          }
        }
      }
    });

    const maxVal = Math.max(...days.map((d) => d.total), 1);
    const totalWeekSpend = days.reduce((sum, d) => sum + d.total, 0);
    const avgDaily = Math.round(totalWeekSpend / 7);

    const today = new Date();
    const isSameDate = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    const startStr = `${days[0].dateNum} ${days[0].dateObj.toLocaleDateString('en-US', { month: 'short' })}`;
    const endStr = `${days[6].dateNum} ${days[6].dateObj.toLocaleDateString('en-US', { month: 'short' })}`;

    return {
      bars: days.map((d) => {
        const pct = d.total > 0 ? Math.max(18, Math.round((d.total / maxVal) * 100)) : 8;
        return {
          ...d,
          heightPct: `${pct}%`,
          isPeak: d.total === maxVal && d.total > 0,
          isToday: isSameDate(d.dateObj, today),
        };
      }),
      totalWeekSpend,
      avgDaily,
      rangeLabel: `${startStr} - ${endStr}`,
    };
  }, [referenceDate, weekOffset, activeTransactions]);

  // Recent transactions filtered by Quick Actions selection ('all' | 'income' | 'expense')
  const recentList = useMemo(() => {
    let list = activeTransactions;
    if (quickFilter === 'income') {
      list = list.filter(isIncomeTransaction);
    } else if (quickFilter === 'expense') {
      list = list.filter((t) => !isIncomeTransaction(t));
    }
    return list.slice(0, 5);
  }, [activeTransactions, quickFilter]);

  const cleanTitle = (title) =>
    title ? title.replace(/\s*\(₹[\d,]+(?:\.\d+)?\)\s*$/, '') : 'Transaction';

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 pb-28 gap-4 animate-fade-in">
      {/* 1. Contextual Greeting & Profile Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-primary">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {greeting.icon}
            </span>
            <span className="font-label-md text-[13px] text-on-surface-variant font-medium">
              {greeting.text}
            </span>
          </div>
          <h2 className="font-headline-sm text-[20px] sm:text-[22px] text-on-surface font-bold tracking-tight mt-0.5">
            Here's your financial overview.
          </h2>
        </div>

        {/* <div className="relative flex items-center justify-center flex-shrink-0">
          <div className="w-11 h-11 rounded-full overflow-hidden shadow-sm ring-2 ring-primary/20">
            <img
              className="w-full h-full object-cover"
              alt="Profile Avatar"
              src={AVATAR_URL}
            />
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-primary ring-2 ring-surface" />
        </div> */}
      </div>

      {/* 2. Hero Total Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest p-5 sm:p-6 shadow-sm border border-outline-variant/20 hover:shadow-md transition-all duration-300">
        <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-secondary-container/30 blur-2xl pointer-events-none" />

        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Total Balance
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container/60 text-secondary font-label-sm text-[11px] font-semibold">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              <span>Safe Zone</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[34px] sm:text-[40px] font-extrabold text-on-surface tracking-tight leading-none">
              ₹{stats.balance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
            <span className="font-label-sm text-[12px] text-primary font-semibold flex items-center">
              <span className="material-symbols-outlined text-[15px]">trending_up</span>
              <span>+8.4%</span>
            </span>
          </div>
        </div>

        {/* Income & Expense Split Counters */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-2 bg-surface-container-low/70 rounded-2xl p-3 sm:p-3.5 border border-outline-variant/15">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">south_west</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-[11px] text-on-surface-variant">Income</span>
              <span className="font-headline-sm text-[14px] sm:text-[15px] font-bold text-primary truncate">
                +₹{stats.income.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center text-secondary flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">north_east</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-[11px] text-on-surface-variant">Expense</span>
              <span className="font-headline-sm text-[14px] sm:text-[15px] font-bold text-secondary truncate">
                -₹{stats.expense.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Burn Rate Progress */}
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-on-surface-variant text-[12px]">
            <span className="font-medium">Monthly Burn Rate</span>
            <span className="font-bold text-on-surface">{stats.burnRate}% of target</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max(8, stats.burnRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Panel */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Quick Actions
            </span>
            {quickFilter !== 'all' && (
              <button
                type="button"
                onClick={() => handleQuickFilter('all')}
                className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                <span>Reset to All</span>
                <span className="material-symbols-outlined text-[13px]">close</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleQuickFilter(quickFilter === 'income' ? 'all' : 'income')}
            className={`flex items-center justify-center gap-2 h-12 px-4 rounded-2xl font-label-md text-[13px] font-bold shadow-sm active:scale-[0.98] transition-all cursor-pointer ${
              quickFilter === 'income'
                ? 'bg-primary text-on-primary ring-2 ring-primary ring-offset-2 ring-offset-surface shadow-md'
                : 'bg-surface-container-lowest text-primary hover:bg-surface-container-low border border-outline-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {quickFilter === 'income' ? 'check_circle' : 'south_west'}
            </span>
            <span>Income</span>
            {quickFilter === 'income' && (
              <span className="text-[10px] bg-on-primary/20 text-on-primary px-1.5 py-0.5 rounded-full uppercase font-extrabold">
                Active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleQuickFilter(quickFilter === 'expense' ? 'all' : 'expense')}
            className={`flex items-center justify-center gap-2 h-12 px-4 rounded-2xl font-label-md text-[13px] font-bold shadow-sm active:scale-[0.98] transition-all cursor-pointer ${
              quickFilter === 'expense'
                ? 'bg-error text-on-error ring-2 ring-error ring-offset-2 ring-offset-surface shadow-md'
                : 'bg-surface-container-lowest text-error hover:bg-surface-container-low border border-outline-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {quickFilter === 'expense' ? 'check_circle' : 'north_east'}
            </span>
            <span>Expense</span>
            {quickFilter === 'expense' && (
              <span className="text-[10px] bg-on-error/20 text-on-error px-1.5 py-0.5 rounded-full uppercase font-extrabold">
                Active
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4. 7-Day Outflow Pattern with Navigation & Day/Date Numbers */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/20 flex flex-col gap-3">
        {/* Card Header & Previous/Next Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-headline-sm text-[14px] font-bold text-on-surface">
              7-Day Outflow Pattern
            </span>
            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-primary hover:bg-primary/20 transition-all cursor-pointer"
              >
                This Week
              </button>
            )}
          </div>

          {/* Previous / Next Week Navigation Pill */}
          <div className="flex items-center gap-1 bg-surface-container-high px-1.5 py-0.5 rounded-full border border-outline-variant/15">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors cursor-pointer active:scale-90"
              title="Previous 7 Days"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>

            <span className="font-label-sm text-[11px] font-semibold text-on-surface px-1.5 select-none whitespace-nowrap">
              {weekData.rangeLabel}
            </span>

            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors cursor-pointer active:scale-90"
              title="Next 7 Days"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Total & Average Outflow Sub-Header */}
        <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-medium">
          <span>Week Total: <strong className="text-on-surface font-bold">₹{weekData.totalWeekSpend.toLocaleString('en-IN')}</strong></span>
          <span>Daily Avg: <strong className="text-on-surface font-bold">₹{weekData.avgDaily.toLocaleString('en-IN')}</strong></span>
        </div>

        {/* 7-Day Perfectly Aligned Chart Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-1">
          {weekData.bars.map((bar, idx) => (
            <div key={idx} className="flex flex-col items-center">
              {/* Fixed-Height Amount Header (guarantees identical vertical baseline) */}
              <div className="h-4 w-full flex items-center justify-center mb-1.5">
                {bar.total > 0 ? (
                  <span className="text-[10px] font-bold text-on-surface whitespace-nowrap">
                    ₹{bar.total >= 1000 ? `${(bar.total / 1000).toFixed(bar.total % 1000 === 0 ? 0 : 1)}k` : bar.total}
                  </span>
                ) : (
                  <span className="text-[10px] text-transparent select-none">-</span>
                )}
              </div>

              {/* Uniform Capsule Track */}
              <div className="w-full max-w-[26px] sm:max-w-[32px] h-14 bg-surface-container-high/30 rounded-full flex flex-col justify-end p-0.5 overflow-hidden">
                <div
                  className={`w-full rounded-full transition-all duration-300 ${
                    bar.isToday
                      ? 'bg-primary shadow-xs'
                      : bar.isPeak
                      ? 'bg-primary-container'
                      : bar.total > 0
                      ? 'bg-secondary-container'
                      : 'h-1 bg-outline-variant/30'
                  }`}
                  style={{ height: bar.total > 0 ? bar.heightPct : '4px' }}
                  title={`${bar.dayName}, ${bar.dateNum}: ₹${bar.total.toLocaleString('en-IN')}`}
                />
              </div>

              {/* Day Name & Date Number (with fixed w-6 h-6 slot for pixel-perfect alignment) */}
              <div className="flex flex-col items-center gap-0.5 mt-2 w-full">
                <span
                  className={`font-label-sm text-[10px] font-semibold uppercase tracking-wider leading-none ${
                    bar.isToday ? 'text-primary font-bold' : 'text-on-surface-variant'
                  }`}
                >
                  {bar.dayName}
                </span>
                <div className="h-6 w-6 flex items-center justify-center">
                  <span
                    className={`text-[11px] font-bold flex items-center justify-center transition-all ${
                      bar.isToday
                        ? 'w-6 h-6 rounded-full bg-primary text-on-primary shadow-xs'
                        : 'text-on-surface'
                    }`}
                  >
                    {bar.dateNum}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Recent Transactions Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-label-md text-[13px] font-semibold text-on-surface">
              {quickFilter === 'income'
                ? 'Recent Income'
                : quickFilter === 'expense'
                ? 'Recent Expenses'
                : 'Recent Transactions'}
            </h3>
            {quickFilter !== 'all' && (
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  quickFilter === 'income'
                    ? 'bg-primary-fixed text-primary'
                    : 'bg-error-container text-error'
                }`}
              >
                {quickFilter}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onViewAllRecords && onViewAllRecords(quickFilter)}
            className="font-label-sm text-[11px] text-primary font-semibold flex items-center gap-0.5 hover:underline group cursor-pointer"
          >
            <span>
              {quickFilter === 'income'
                ? 'View All Income Records'
                : quickFilter === 'expense'
                ? 'View All Expense Records'
                : 'View All Records'}
            </span>
            <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">
              arrow_forward
            </span>
          </button>
        </div>

        {/* Active List, Skeleton Shimmer, or Empty State */}
        {isLoading || isFilterTransitioning ? (
          <div className="flex flex-col gap-2.5 animate-fade-in">
            <TransactionItemSkeleton />
            <TransactionItemSkeleton />
            <TransactionItemSkeleton />
          </div>
        ) : recentList.length === 0 ? (
          /* Delightful Empty State from Stitch */
          <div className="flex flex-col items-center justify-center p-8 bg-surface-container-lowest rounded-2xl shadow-sm text-center border border-dashed border-outline-variant/30 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary mb-3">
              <span className="material-symbols-outlined text-[28px]">spa</span>
            </div>
            <h4 className="font-headline-sm text-[16px] font-bold text-on-surface">
              Pristine Ledger
            </h4>
            <p className="font-body-sm text-[12px] text-on-surface-variant max-w-[240px] mt-1 mb-4">
              No transactions recorded yet. Log your first entry to get started!
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onAddExpense}
                className="flex items-center gap-1.5 h-10 px-4 rounded-full bg-primary-container text-on-primary font-label-md text-[12px] font-semibold shadow-sm hover:bg-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">add</span>
                <span>Log First Entry</span>
              </button>
            </div>
          </div>
        ) : (
          /* Live or Demo Transactions List */
          <div className="flex flex-col bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/20 divide-y divide-outline-variant/15">
            {recentList.map((item) => {
              const amt = parseTransactionAmount(item);
              const isInc = isIncomeTransaction(item);
              const cat = item.category || item.sheetName || 'Other';
              const icon = CATEGORY_ICONS[cat] || (isInc ? 'payments' : 'receipt');

              return (
                <div
                  key={item.id}
                  onClick={() => onViewRecord && onViewRecord(item)}
                  className="flex items-center justify-between p-3.5 hover:bg-surface-container-low transition-colors duration-150 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isInc
                          ? 'bg-primary-fixed text-primary'
                          : 'bg-surface-container text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-headline-sm text-[14px] font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                        {cleanTitle(item.title)}
                      </span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">
                        {formatTransactionDateTime(item)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0 pl-2">
                    <span
                      className={`font-headline-sm text-[15px] font-extrabold ${
                        isInc ? 'text-primary' : 'text-on-surface'
                      }`}
                    >
                      {isInc ? '+' : '-'}₹{amt.toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`font-label-sm text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full mt-1 ${
                        isInc
                          ? 'bg-primary-fixed text-primary'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {normalizePaymentMethod(item.paymentMethod, isInc)}
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
