import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import {
  isIncomeTransaction,
  isExpenseTransaction,
  parseTransactionAmount,
  parseTransactionDate,
  cleanTransactionRow,
  normalizePaymentMethod,
} from '../utils/transactionUtils';
import { FilterModalSkeleton, ExportModalSkeleton, ReportsContentSkeleton } from './PageSkeletons';

export default function ReportsBreakdown({
  transactions = [],
  isLoading = false,
  isSheetConnected = true,
  sheetUrl = 'https://docs.google.com/spreadsheets',
  onViewRecord,
  onAddExpense,
  onAddIncome,
  onFilterMenuToggle,
  subModalCloserRef,
}) {
  const [period, setPeriod] = useState('daily'); // 'daily' | 'monthly' | 'yearly' | 'all'
  const [isPeriodTransitioning, setIsPeriodTransitioning] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleSelectPeriod = (targetPeriod) => {
    if (targetPeriod === period) return;
    setIsPeriodTransitioning(true);
    setPeriod(targetPeriod);
    setTimeout(() => {
      setIsPeriodTransitioning(false);
    }, 240);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'income' | 'expense'
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'UPI' | 'Cash' | 'Net Banking' | 'Debit Card' | 'Credit Card'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'highest' | 'lowest' | 'oldest'
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);

  const handleOpenFilter = () => {
    setIsFilterLoading(true);
    setShowFilterMenu(true);
    if (onFilterMenuToggle) onFilterMenuToggle(true);
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 260);
  };

  const handleCloseFilter = () => {
    setShowFilterMenu(false);
    if (onFilterMenuToggle) onFilterMenuToggle(false);
  };

  const handleOpenExport = () => {
    setIsExportLoading(true);
    setIsExportOpen(true);
    if (onFilterMenuToggle) onFilterMenuToggle(true);
    setTimeout(() => {
      setIsExportLoading(false);
    }, 220);
  };

  const handleCloseExport = () => {
    setIsExportOpen(false);
    if (onFilterMenuToggle) onFilterMenuToggle(false);
  };

  const showToast = (msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  // Register child modal closer (Filter drawer or Export modal) for Android hardware back button
  useEffect(() => {
    if (subModalCloserRef) {
      subModalCloserRef.current = () => {
        if (showFilterMenu) {
          handleCloseFilter();
          return true;
        }
        if (isExportOpen) {
          handleCloseExport();
          return true;
        }
        return false;
      };
    }
    return () => {
      if (subModalCloserRef) {
        subModalCloserRef.current = null;
      }
    };
  }, [showFilterMenu, isExportOpen, subModalCloserRef]);

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Helper to format date label based on active period
  const formattedDateLabel = useMemo(() => {
    if (period === 'all') return 'All Historical Records';
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const month = monthNames[selectedDate.getMonth()];
    const year = selectedDate.getFullYear();

    if (period === 'daily') {
      return `${day} ${month} ${year}`;
    } else if (period === 'monthly') {
      return `${month} ${year}`;
    } else {
      return `${year}`;
    }
  }, [selectedDate, period]);

  // Navigate Date (< and >)
  const handlePrevDate = () => {
    setIsPeriodTransitioning(true);
    setSelectedDate((prev) => {
      const d = new Date(prev);
      if (period === 'daily') {
        d.setDate(d.getDate() - 1);
      } else if (period === 'monthly') {
        d.setMonth(d.getMonth() - 1);
      } else {
        d.setFullYear(d.getFullYear() - 1);
      }
      return d;
    });
    setTimeout(() => setIsPeriodTransitioning(false), 200);
  };

  const handleNextDate = () => {
    setIsPeriodTransitioning(true);
    setSelectedDate((prev) => {
      const d = new Date(prev);
      if (period === 'daily') {
        d.setDate(d.getDate() + 1);
      } else if (period === 'monthly') {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setFullYear(d.getFullYear() + 1);
      }
      return d;
    });
    setTimeout(() => setIsPeriodTransitioning(false), 200);
  };

  // Normalize transactions using our shared robust utility
  const normalizedTransactions = useMemo(() => {
    return transactions.map((item) => {
      const cleaned = cleanTransactionRow(item);
      const numAmt = parseTransactionAmount(cleaned);
      const isInc = isIncomeTransaction(cleaned);
      const category = cleaned.category;
      const time =
        cleaned.time ||
        (cleaned.createdAt
          ? new Date(cleaned.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '12:00 PM');
      const paymentMethod = normalizePaymentMethod(cleaned.paymentMethod || cleaned.payment_method, isInc);
      const dateObj = parseTransactionDate(cleaned);

      return {
        ...cleaned,
        parsedAmount: numAmt,
        isIncome: isInc,
        parsedDate: dateObj,
        displayCategory: category,
        displayTime: time,
        displayPayment: paymentMethod,
      };
    });
  }, [transactions]);

  // Identify latest transaction date in data (maximum timestamp)
  const latestDateWithData = useMemo(() => {
    let maxDate = null;
    for (const tx of normalizedTransactions) {
      if (tx.parsedDate && !isNaN(tx.parsedDate.getTime())) {
        if (!maxDate || tx.parsedDate.getTime() > maxDate.getTime()) {
          maxDate = tx.parsedDate;
        }
      }
    }
    return maxDate || new Date();
  }, [normalizedTransactions]);

  // Formatted string for latest active date
  const latestDateFormatted = useMemo(() => {
    if (!latestDateWithData) return '';
    const day = String(latestDateWithData.getDate()).padStart(2, '0');
    const month = monthNames[latestDateWithData.getMonth()];
    const year = latestDateWithData.getFullYear();
    return `${day} ${month} ${year}`;
  }, [latestDateWithData, monthNames]);

  // List of all active dates with transactions
  const activeDates = useMemo(() => {
    const map = new Map();
    normalizedTransactions.forEach((tx) => {
      if (tx.parsedDate && !isNaN(tx.parsedDate.getTime())) {
        const dayKey = `${tx.parsedDate.getFullYear()}-${String(tx.parsedDate.getMonth() + 1).padStart(2, '0')}-${String(tx.parsedDate.getDate()).padStart(2, '0')}`;
        if (!map.has(dayKey)) {
          map.set(dayKey, {
            date: tx.parsedDate,
            dayKey,
            formatted: `${String(tx.parsedDate.getDate()).padStart(2, '0')} ${monthNames[tx.parsedDate.getMonth()]} ${tx.parsedDate.getFullYear()}`,
            count: 0,
            expenseCount: 0,
            incomeCount: 0,
          });
        }
        const entry = map.get(dayKey);
        entry.count++;
        if (tx.isIncome) entry.incomeCount++;
        else entry.expenseCount++;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [normalizedTransactions, monthNames]);

  // One-time auto-alignment on initial data load if currently selectedDate has 0 transactions
  const [hasAutoAligned, setHasAutoAligned] = useState(false);
  useEffect(() => {
    if (!hasAutoAligned && normalizedTransactions.length > 0 && latestDateWithData) {
      const hasTransactionsOnSelectedDate = normalizedTransactions.some(
        (tx) =>
          tx.parsedDate &&
          tx.parsedDate.getFullYear() === selectedDate.getFullYear() &&
          tx.parsedDate.getMonth() === selectedDate.getMonth() &&
          tx.parsedDate.getDate() === selectedDate.getDate()
      );
      if (!hasTransactionsOnSelectedDate) {
        setSelectedDate(new Date(latestDateWithData));
      }
      setHasAutoAligned(true);
    }
  }, [normalizedTransactions, hasAutoAligned, latestDateWithData, selectedDate]);

  // Check if current selectedDate is the latest date
  const isSelectedDateLatest = useMemo(() => {
    if (!latestDateWithData) return true;
    if (period === 'daily') {
      return (
        selectedDate.getFullYear() === latestDateWithData.getFullYear() &&
        selectedDate.getMonth() === latestDateWithData.getMonth() &&
        selectedDate.getDate() === latestDateWithData.getDate()
      );
    } else if (period === 'monthly') {
      return (
        selectedDate.getFullYear() === latestDateWithData.getFullYear() &&
        selectedDate.getMonth() === latestDateWithData.getMonth()
      );
    }
    return true;
  }, [selectedDate, latestDateWithData, period]);

  // Check if a transaction falls in selected period
  const matchesPeriodCriteria = (tx, activePeriod, targetDate) => {
    if (activePeriod === 'all') return true;
    if (!tx.parsedDate) return true; // Include if date unknown so user never loses view of undated items

    const txDate = tx.parsedDate;
    if (activePeriod === 'daily') {
      return (
        txDate.getFullYear() === targetDate.getFullYear() &&
        txDate.getMonth() === targetDate.getMonth() &&
        txDate.getDate() === targetDate.getDate()
      );
    } else if (activePeriod === 'monthly') {
      return (
        txDate.getFullYear() === targetDate.getFullYear() &&
        txDate.getMonth() === targetDate.getMonth()
      );
    } else if (activePeriod === 'yearly') {
      return txDate.getFullYear() === targetDate.getFullYear();
    }
    return true;
  };

  // Period filtered items
  const periodFiltered = useMemo(() => {
    return normalizedTransactions.filter((tx) =>
      matchesPeriodCriteria(tx, period, selectedDate)
    );
  }, [normalizedTransactions, period, selectedDate]);

  // Extract unique categories for filter with count
  const allCategories = useMemo(() => {
    const set = new Set(normalizedTransactions.map((t) => t.displayCategory).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [normalizedTransactions]);

  // Active filters count helper
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== 'all') count++;
    if (paymentFilter !== 'all') count++;
    if (selectedCategory !== 'all') count++;
    if (sortBy !== 'newest') count++;
    if (searchQuery.trim() !== '') count++;
    return count;
  }, [typeFilter, paymentFilter, selectedCategory, sortBy, searchQuery]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setTypeFilter('all');
    setPaymentFilter('all');
    setSelectedCategory('all');
    setSortBy('newest');
    setSearchQuery('');
    showToast('Filters cleared');
  };

  // Filtered & Sorted transactions
  const displayedTransactions = useMemo(() => {
    let list = periodFiltered.filter((tx) => {
      // Type filter
      if (typeFilter === 'income' && !tx.isIncome) return false;
      if (typeFilter === 'expense' && tx.isIncome) return false;

      // Payment Mode filter
      if (paymentFilter !== 'all') {
        const pNorm = normalizePaymentMethod(tx.displayPayment, tx.isIncome);
        if (pNorm.toLowerCase() !== paymentFilter.toLowerCase()) return false;
      }

      // Category filter
      if (
        selectedCategory !== 'all' &&
        tx.displayCategory?.toLowerCase().trim() !== selectedCategory.toLowerCase().trim()
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = tx.title?.toLowerCase().includes(q);
        const matchesDesc = tx.description?.toLowerCase().includes(q) || tx.note?.toLowerCase().includes(q);
        const matchesCat = tx.displayCategory?.toLowerCase().includes(q);
        const matchesPayment = tx.displayPayment?.toLowerCase().includes(q);
        const matchesAmt = String(tx.parsedAmount).includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesPayment && !matchesAmt) {
          return false;
        }
      }

      return true;
    });

    // Sort
    if (sortBy === 'highest') {
      list.sort((a, b) => b.parsedAmount - a.parsedAmount);
    } else if (sortBy === 'lowest') {
      list.sort((a, b) => a.parsedAmount - b.parsedAmount);
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => {
        const timeA = a.parsedDate ? a.parsedDate.getTime() : (a.id || 0);
        const timeB = b.parsedDate ? b.parsedDate.getTime() : (b.id || 0);
        return timeA - timeB;
      });
    } else {
      // newest first
      list.sort((a, b) => {
        const timeA = a.parsedDate ? a.parsedDate.getTime() : (a.id || 0);
        const timeB = b.parsedDate ? b.parsedDate.getTime() : (b.id || 0);
        return timeB - timeA;
      });
    }

    return list;
  }, [periodFiltered, typeFilter, paymentFilter, selectedCategory, searchQuery, sortBy]);

  // When filters are active, compute financial stats from displayedTransactions so metrics reflect active view
  const activeDatasetForMetrics = activeFiltersCount > 0 ? displayedTransactions : periodFiltered;

  // Financial calculations for period or active filter
  const { totalInflow, totalOutflow, incomeCount, expenseCount, netBalance, savingsPercentage } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    let incCount = 0;
    let expCount = 0;

    activeDatasetForMetrics.forEach((tx) => {
      if (tx.isIncome) {
        inflow += tx.parsedAmount;
        incCount++;
      } else {
        outflow += tx.parsedAmount;
        expCount++;
      }
    });

    const net = inflow - outflow;
    const savingsPct = inflow > 0 ? Math.max(0, Math.min(100, Math.round((net / inflow) * 100))) : 0;

    return {
      totalInflow: inflow,
      totalOutflow: outflow,
      incomeCount: incCount,
      expenseCount: expCount,
      netBalance: net,
      savingsPercentage: savingsPct,
    };
  }, [activeDatasetForMetrics]);

  // Breakdown of expenses by category for active view (respects all active filters including sortBy)
  const periodExpenseCategories = useMemo(() => {
    const map = {};
    activeDatasetForMetrics.forEach((tx) => {
      if (!tx.isIncome) {
        const cat = tx.displayCategory || 'Other';
        const txTime = tx.parsedDate ? tx.parsedDate.getTime() : (Number(tx.id) || 0);
        if (!map[cat]) {
          map[cat] = {
            total: 0,
            latestTime: txTime,
            earliestTime: txTime,
          };
        }
        map[cat].total += tx.parsedAmount;
        if (txTime > map[cat].latestTime) map[cat].latestTime = txTime;
        if (txTime < map[cat].earliestTime) map[cat].earliestTime = txTime;
      }
    });

    const items = Object.entries(map).map(([name, data]) => ({
      name,
      total: data.total,
      latestTime: data.latestTime,
      earliestTime: data.earliestTime,
      percentage: totalOutflow > 0 ? Math.round((data.total / totalOutflow) * 100) : 0,
    }));

    if (sortBy === 'lowest') {
      items.sort((a, b) => a.total - b.total);
    } else if (sortBy === 'highest') {
      items.sort((a, b) => b.total - a.total);
    } else if (sortBy === 'oldest') {
      items.sort((a, b) => {
        if (a.earliestTime && b.earliestTime && a.earliestTime !== b.earliestTime) {
          return a.earliestTime - b.earliestTime;
        }
        return a.total - b.total;
      });
    } else {
      // Default: sort highest amount first
      items.sort((a, b) => b.total - a.total);
    }

    return items;
  }, [activeDatasetForMetrics, totalOutflow, sortBy]);

  // Breakdown of incomes by category for active view (respects all active filters including sortBy)
  const periodIncomeCategories = useMemo(() => {
    const map = {};
    activeDatasetForMetrics.forEach((tx) => {
      if (tx.isIncome) {
        const cat = tx.displayCategory || 'Other';
        const txTime = tx.parsedDate ? tx.parsedDate.getTime() : (Number(tx.id) || 0);
        if (!map[cat]) {
          map[cat] = {
            total: 0,
            latestTime: txTime,
            earliestTime: txTime,
          };
        }
        map[cat].total += tx.parsedAmount;
        if (txTime > map[cat].latestTime) map[cat].latestTime = txTime;
        if (txTime < map[cat].earliestTime) map[cat].earliestTime = txTime;
      }
    });

    const items = Object.entries(map).map(([name, data]) => ({
      name,
      total: data.total,
      latestTime: data.latestTime,
      earliestTime: data.earliestTime,
      percentage: totalInflow > 0 ? Math.round((data.total / totalInflow) * 100) : 0,
    }));

    if (sortBy === 'lowest') {
      items.sort((a, b) => a.total - b.total);
    } else if (sortBy === 'highest') {
      items.sort((a, b) => b.total - a.total);
    } else if (sortBy === 'oldest') {
      items.sort((a, b) => {
        if (a.earliestTime && b.earliestTime && a.earliestTime !== b.earliestTime) {
          return a.earliestTime - b.earliestTime;
        }
        return a.total - b.total;
      });
    } else {
      // Default: sort highest amount first
      items.sort((a, b) => b.total - a.total);
    }

    return items;
  }, [activeDatasetForMetrics, totalInflow, sortBy]);

  // Stacked bar percentages
  const { surplusPct, expensePct } = useMemo(() => {
    const total = totalInflow + totalOutflow;
    if (total === 0) return { surplusPct: 50, expensePct: 50 };
    const exp = Math.round((totalOutflow / total) * 100);
    const sur = 100 - exp;
    return { surplusPct: sur, expensePct: exp };
  }, [totalInflow, totalOutflow]);

  // Date input ref for direct calendar picker
  const dateInputRef = React.useRef(null);
  const handleOpenDatePicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  const handleDateInputChange = (e) => {
    if (!e.target.value) return;
    const parts = e.target.value.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      setSelectedDate(new Date(y, m, d));
    } else if (parts.length === 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      setSelectedDate(new Date(y, m, 1));
    }
  };

  // CSV Export Utility (Android Native + Web)
  const handleExportCSV = async () => {
    setIsExportOpen(false);
    const itemsToExport = displayedTransactions.length > 0 ? displayedTransactions : normalizedTransactions;
    if (itemsToExport.length === 0) {
      showToast('No transactions to export');
      return;
    }

    const headers = ['ID', 'Date', 'Title', 'Type', 'Amount (INR)', 'Category', 'Payment Mode', 'Notes'];
    const rows = itemsToExport.map((tx) => [
      `"${tx.id || ''}"`,
      `"${tx.date || tx.timestamp || ''}"`,
      `"${(tx.title || '').replace(/"/g, '""')}"`,
      `"${tx.isIncome ? 'Income' : 'Expense'}"`,
      tx.parsedAmount,
      `"${(tx.displayCategory || '').replace(/"/g, '""')}"`,
      `"${(tx.displayPayment || '').replace(/"/g, '""')}"`,
      `"${(tx.note || tx.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvText = [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const fileName = `Financial_Report_${period}_${Date.now()}.csv`;

    try {
      if (Capacitor.isNativePlatform()) {
        // Native Android execution via Capacitor Filesystem and Share plugins
        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: csvText,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title: `Financial Report (${period})`,
          text: `Exported ${itemsToExport.length} transactions from Expense Tracker.`,
          url: writeResult.uri,
          dialogTitle: 'Share or Save CSV Report',
        });
        showToast('Report shared successfully!');
      } else {
        // Standard Web browser export
        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Downloaded ${fileName}`);
      }
    } catch (err) {
      console.error('CSV export failed:', err);
      try {
        await navigator.clipboard.writeText(csvText);
        showToast('CSV copied to clipboard');
      } catch {
        showToast('Export failed');
      }
    }
  };

  // Share Summary Text (Android Share sheet or Web clipboard)
  const handleShareSummary = async () => {
    setIsExportOpen(false);
    const summaryText = 
`📊 Financial Report (${period.toUpperCase()})
📅 Period: ${formattedDateLabel}
💰 Total Inflow: +₹${totalInflow.toLocaleString('en-IN')} (${incomeCount} records)
💸 Total Outflow: -₹${totalOutflow.toLocaleString('en-IN')} (${expenseCount} records)
📈 Net Balance: ₹${netBalance.toLocaleString('en-IN')} (${savingsPercentage}% saved)
📋 Active Records: ${displayedTransactions.length}
Generated via Expense Tracker`;

    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: `Financial Summary - ${formattedDateLabel}`,
          text: summaryText,
          dialogTitle: 'Share Financial Summary',
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Financial Summary - ${formattedDateLabel}`,
          text: summaryText,
        });
      } else {
        await navigator.clipboard.writeText(summaryText);
        showToast('Summary copied to clipboard!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(summaryText);
          showToast('Summary copied to clipboard!');
        } catch {
          showToast('Could not share summary');
        }
      }
    }
  };

  const handleOpenGoogleSheets = () => {
    setIsExportOpen(false);
    try {
      window.open(sheetUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = sheetUrl;
    }
  };

  const handlePrintOrPDF = () => {
    setIsExportOpen(false);
    if (Capacitor.isNativePlatform()) {
      handleShareSummary();
    } else {
      window.print();
    }
  };

  // Helper for Category Icons
  const getCategoryIcon = (category, isIncome) => {
    const cat = (category || '').toLowerCase();
    if (isIncome) {
      if (cat.includes('bonus') || cat.includes('salary')) return 'payments';
      if (cat.includes('dividend') || cat.includes('invest')) return 'trending_up';
      if (cat.includes('freelance') || cat.includes('consult')) return 'laptop_mac';
      if (cat.includes('business') || cat.includes('store')) return 'storefront';
      if (cat.includes('gift') || cat.includes('redeem')) return 'redeem';
      return 'account_balance';
    }
    if (cat.includes('food') || cat.includes('dining') || cat.includes('lunch') || cat.includes('dinner')) return 'restaurant';
    if (cat.includes('shopping') || cat.includes('grocer')) return 'shopping_bag';
    if (cat.includes('transport') || cat.includes('cab') || cat.includes('fuel')) return 'local_taxi';
    if (cat.includes('bill') || cat.includes('utilit')) return 'receipt_long';
    if (cat.includes('entertain') || cat.includes('movie') || cat.includes('leisure')) return 'movie';
    if (cat.includes('health') || cat.includes('med')) return 'medical_services';
    if (cat.includes('education') || cat.includes('book')) return 'menu_book';
    return 'receipt';
  };

  // Helper for Category Avatar Colors
  const getCategoryAvatarClasses = (category, isIncome) => {
    if (isIncome) return 'bg-primary-fixed text-on-primary-fixed-variant';
    const cat = (category || '').toLowerCase();
    if (cat.includes('food')) return 'bg-secondary-container text-on-secondary-container';
    if (cat.includes('shopping')) return 'bg-error-container text-on-error-container';
    if (cat.includes('transport')) return 'bg-surface-container-high text-secondary';
    if (cat.includes('health')) return 'bg-error-container/50 text-error';
    return 'bg-secondary-fixed text-on-secondary-fixed-variant';
  };

  return (
    <div className="w-full max-w-xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 animate-fade-in pb-20">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col gap-1 sm:gap-1.5">
        <div className="flex items-center justify-between gap-2">
          {/* Left Title & Status */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <h1 className="font-headline-lg text-[20px] sm:text-[26px] text-on-surface tracking-tight font-extrabold truncate">
              Reports
            </h1>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant/30 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-label-sm text-[10px] sm:text-[11px] text-primary font-semibold">
                Synced
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Export Trigger Button */}
            <button
              type="button"
              onClick={handleOpenExport}
              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface flex items-center gap-1 font-label-md text-[11px] sm:text-[12px] font-semibold active:scale-95 transition-all shadow-sm border border-outline-variant/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] sm:text-[17px] text-primary">ios_share</span>
              <span>Export</span>
            </button>

            {/* Filter Trigger Button */}
            <button
              type="button"
              onClick={handleOpenFilter}
              className={`h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-full flex items-center gap-1 font-label-md text-[11px] sm:text-[12px] active:scale-95 transition-all shadow-sm border cursor-pointer ${
                activeFiltersCount > 0
                  ? 'bg-primary text-on-primary border-primary font-bold shadow-md'
                  : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold border-outline-variant/20'
              }`}
            >
              <span className="material-symbols-outlined text-[15px] sm:text-[17px]">tune</span>
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-on-primary text-primary text-[9px] font-extrabold flex items-center justify-center -mr-0.5">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <p className="font-body-sm text-[11px] sm:text-[13px] text-on-surface-variant font-medium truncate">
          Understand income & expenses with detailed breakdown
        </p>

        {/* Active Filters Pill Bar */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 animate-fade-in">
            <span className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1 flex-shrink-0">
              <span className="material-symbols-outlined text-[14px] text-primary">filter_alt</span>
              Filters:
            </span>
            {typeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary text-[11px] font-semibold flex-shrink-0">
                <span>Type: {typeFilter}</span>
                <button type="button" onClick={() => setTypeFilter('all')} className="hover:opacity-75 cursor-pointer">
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </span>
            )}
            {paymentFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-secondary text-[11px] font-semibold flex-shrink-0">
                <span>Mode: {paymentFilter}</span>
                <button type="button" onClick={() => setPaymentFilter('all')} className="hover:opacity-75 cursor-pointer">
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface text-[11px] font-semibold flex-shrink-0 border border-outline-variant/30">
                <span>Category: {selectedCategory}</span>
                <button type="button" onClick={() => setSelectedCategory('all')} className="hover:opacity-75 cursor-pointer">
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </span>
            )}
            {sortBy !== 'newest' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-semibold flex-shrink-0">
                <span>Sort: {sortBy}</span>
                <button type="button" onClick={() => setSortBy('newest')} className="hover:opacity-75 cursor-pointer">
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </span>
            )}
            {searchQuery.trim() !== '' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-semibold flex-shrink-0">
                <span>Search: "{searchQuery}"</span>
                <button type="button" onClick={() => setSearchQuery('')} className="hover:opacity-75 cursor-pointer">
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-primary hover:underline font-bold px-1.5 flex-shrink-0 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Active Filter Metrics Alert Banner */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-primary-container/20 border border-primary/20 rounded-xl text-[12px] text-primary animate-fade-in -my-1 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span className="font-semibold">
              Showing filtered results: {displayedTransactions.length} of {periodFiltered.length} records
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="font-bold underline text-[11px] cursor-pointer hover:text-primary-dark"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* 2. Time-Period Segmented Control */}
      <div className="w-full p-1 rounded-full bg-surface-container-high flex items-center justify-between shadow-inner">
        {['daily', 'monthly', 'yearly', 'all'].map((p) => {
          const isActive = period === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => handleSelectPeriod(p)}
              className={`flex-1 py-1.5 rounded-full font-label-md text-label-md capitalize text-center transition-all relative overflow-hidden cursor-pointer ${
                isActive
                  ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              <span>{p === 'all' ? 'All Time' : p}</span>
              {/* Skeleton loader effect on button before it finishes loading */}
              {isPeriodTransitioning && (
                <span
                  className={`absolute inset-0 rounded-full skeleton-shimmer pointer-events-none ${
                    isActive ? 'opacity-60 ring-2 ring-primary/40' : 'opacity-25'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {isPeriodTransitioning ? (
        <ReportsContentSkeleton />
      ) : (
        <>
          {/* 3. Date-Period Selector Bar */}
          {period !== 'all' && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
            <button
              type="button"
              onClick={handlePrevDate}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container-low text-secondary active:scale-90 hover:bg-surface-container transition-all cursor-pointer"
              title="Previous Period"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <div
              onClick={handleOpenDatePicker}
              className="flex items-center gap-2 cursor-pointer active:opacity-75 transition-opacity select-none group"
              title="Click to select date from calendar"
            >
              <span className="material-symbols-outlined text-primary text-[20px] group-hover:scale-110 transition-transform">
                calendar_today
              </span>
              <span className="font-headline-sm text-[16px] sm:text-[18px] text-on-surface font-semibold tracking-tight">
                {formattedDateLabel}
              </span>
              <span className="material-symbols-outlined text-secondary text-[16px] opacity-60">
                edit_calendar
              </span>
            </div>
            {/* Hidden native input for date/month picker */}
            <input
              ref={dateInputRef}
              type={period === 'monthly' ? 'month' : 'date'}
              className="sr-only"
              onChange={handleDateInputChange}
              value={
                period === 'monthly'
                  ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
                  : `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
              }
            />
            <button
              type="button"
              onClick={handleNextDate}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container-low text-secondary active:scale-90 hover:bg-surface-container transition-all cursor-pointer"
              title="Next Period"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>

          {/* Quick jump to latest activity pill if viewing an older/different date */}
          {!isSelectedDateLatest && latestDateWithData && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-surface-container-low/80 rounded-xl text-[12px] text-secondary border border-outline-variant/15 animate-fade-in">
              <span>Viewing older records</span>
              <button
                type="button"
                onClick={() => setSelectedDate(new Date(latestDateWithData))}
                className="flex items-center gap-1 font-bold text-primary hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">bolt</span>
                <span>Jump to Latest ({latestDateFormatted})</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Google Sheets Sync / Offline Banner */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 animate-fade-in">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isSheetConnected ? 'bg-surface-container-high text-primary' : 'bg-surface-container text-outline'
          }`}>
            <span className="material-symbols-outlined text-[20px]">
              {isSheetConnected ? 'sync_saved_locally' : 'cloud_off'}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-label-md text-[13px] text-on-surface font-bold truncate">
                {isSheetConnected ? 'Personal_Finance_2026' : 'Offline Phone Memory'}
              </span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isSheetConnected ? 'bg-primary' : 'bg-outline'
              }`} />
            </div>
            <span className="font-body-sm text-[11px] text-secondary truncate">
              {isSheetConnected ? 'Last sync: Live & synced' : 'Sheet Disconnected • Saved in Android Memory'}
            </span>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-[11px] font-bold ${
          isSheetConnected
            ? 'bg-secondary-container text-on-secondary-container'
            : 'bg-surface-container-high text-secondary border border-outline-variant/30'
        }`}>
          {isSheetConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* 5. Summary Metric Cards - Fully responsive without truncation */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Income Card */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-[10px] sm:text-[11px] text-secondary uppercase font-bold tracking-wider">
              Income
            </span>
            <span className="material-symbols-outlined text-primary text-[15px] sm:text-[17px]">
              arrow_downward_alt
            </span>
          </div>
          <span className="font-metric-regular text-[13.5px] xs:text-[15px] sm:text-[19px] text-primary font-extrabold tracking-tighter leading-tight whitespace-nowrap overflow-hidden">
            ₹{totalInflow.toLocaleString('en-IN')}
          </span>
          <span className="font-body-sm text-[10px] sm:text-[11px] text-secondary mt-1 truncate">
            {incomeCount} {incomeCount === 1 ? 'record' : 'records'}
          </span>
        </div>

        {/* Expense Card */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-[10px] sm:text-[11px] text-secondary uppercase font-bold tracking-wider">
              Expense
            </span>
            <span className="material-symbols-outlined text-error text-[15px] sm:text-[17px]">
              arrow_upward_alt
            </span>
          </div>
          <span className="font-metric-regular text-[13.5px] xs:text-[15px] sm:text-[19px] text-on-surface font-extrabold tracking-tighter leading-tight whitespace-nowrap overflow-hidden">
            ₹{totalOutflow.toLocaleString('en-IN')}
          </span>
          <span className="font-body-sm text-[10px] sm:text-[11px] text-secondary mt-1 truncate">
            {expenseCount} {expenseCount === 1 ? 'record' : 'records'}
          </span>
        </div>

        {/* Balance Card */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-primary-fixed shadow-sm border border-primary/20 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-[10px] sm:text-[11px] text-on-primary-fixed-variant uppercase font-bold tracking-wider">
              Net Bal
            </span>
            <span className="material-symbols-outlined text-primary text-[15px] sm:text-[17px]">
              account_balance_wallet
            </span>
          </div>
          <span className="font-metric-regular text-[13.5px] xs:text-[15px] sm:text-[19px] text-on-primary-fixed font-extrabold tracking-tighter leading-tight whitespace-nowrap overflow-hidden">
            {netBalance >= 0
              ? `₹${netBalance.toLocaleString('en-IN')}`
              : `-₹${Math.abs(netBalance).toLocaleString('en-IN')}`}
          </span>
          <span className="font-body-sm text-[10px] sm:text-[11px] text-on-primary-fixed-variant mt-1 font-medium truncate">
            {totalInflow > 0 ? `${savingsPercentage}% saved` : 'Balanced'}
          </span>
        </div>
      </div>

      {/* 6. Period Breakdown & Key Stats Visual Banner */}
      <div className="rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 p-3.5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-headline-sm text-[16px] text-on-surface font-bold">
            {period === 'daily'
              ? 'Daily Breakdown'
              : period === 'monthly'
              ? 'Monthly Breakdown'
              : period === 'yearly'
              ? 'Yearly Breakdown'
              : 'Historical Breakdown'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary font-label-sm text-[11px] font-semibold">
            {displayedTransactions.length} transactions
          </span>
        </div>

        {/* Visual Proportion Bar */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="h-3 w-full rounded-full bg-surface-container-high overflow-hidden flex">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${surplusPct}%` }}
              title={`Net Surplus ${surplusPct}%`}
            />
            <div
              className="h-full bg-error transition-all duration-500"
              style={{ width: `${expensePct}%` }}
              title={`Expense ${expensePct}%`}
            />
          </div>
          <div className="flex items-center justify-between font-label-sm text-[11px] text-secondary">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-primary" /> Net Surplus ({surplusPct}%)
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-error" /> Expense ({expensePct}%)
            </span>
          </div>
        </div>

        {/* Quick Stats Metric Matrix */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col">
            <span className="font-body-sm text-[11px] text-secondary">Total Inflow</span>
            <span className="font-label-md text-[14px] text-primary font-bold mt-0.5">
              +₹{totalInflow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col">
            <span className="font-body-sm text-[11px] text-secondary">Total Outflow</span>
            <span className="font-label-md text-[14px] text-error font-bold mt-0.5">
              -₹{totalOutflow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Category Expense Breakdown */}
        {periodExpenseCategories.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-[12px] text-on-surface font-semibold">
                  Expense by Category
                </span>
                {paymentFilter !== 'all' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary">
                    {paymentFilter}
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="text-[10px] text-primary underline font-semibold cursor-pointer"
                  >
                    Reset Category Filter
                  </button>
                )}
              </div>
              <span className="text-[11px] text-secondary font-medium">
                {periodExpenseCategories.length} {periodExpenseCategories.length === 1 ? 'category' : 'categories'}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {periodExpenseCategories.map((cat) => {
                const isSelected = selectedCategory.toLowerCase().trim() === cat.name.toLowerCase().trim();
                return (
                  <div
                    key={cat.name}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategory('all');
                        showToast('Reset to all categories');
                      } else {
                        setSelectedCategory(cat.name);
                        showToast(`Filtered by ${cat.name}`);
                      }
                    }}
                    className={`flex items-center justify-between text-[12px] px-2.5 py-1.5 rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.99] border ${
                      isSelected
                        ? 'bg-error-container/30 border-error font-bold shadow-xs'
                        : 'bg-surface-container-low/50 hover:bg-surface-container-low border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-error ring-2 ring-error/30' : 'bg-error'}`} />
                      <span className="text-on-surface truncate">{cat.name}</span>
                      <span className="text-secondary text-[11px] font-normal">({cat.percentage}%)</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-error text-[14px]">check</span>
                      )}
                    </div>
                    <span className="text-error font-bold whitespace-nowrap">-₹{cat.total.toLocaleString('en-IN')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Income Breakdown */}
        {periodIncomeCategories.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-[12px] text-on-surface font-semibold">
                  Income by Category
                </span>
                {paymentFilter !== 'all' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary">
                    {paymentFilter}
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="text-[10px] text-primary underline font-semibold cursor-pointer"
                  >
                    Reset Category Filter
                  </button>
                )}
              </div>
              <span className="text-[11px] text-secondary font-medium">
                {periodIncomeCategories.length} {periodIncomeCategories.length === 1 ? 'source' : 'sources'}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {periodIncomeCategories.map((cat) => {
                const isSelected = selectedCategory.toLowerCase().trim() === cat.name.toLowerCase().trim();
                return (
                  <div
                    key={cat.name}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategory('all');
                        showToast('Reset to all sources');
                      } else {
                        setSelectedCategory(cat.name);
                        showToast(`Filtered by ${cat.name}`);
                      }
                    }}
                    className={`flex items-center justify-between text-[12px] px-2.5 py-1.5 rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.99] border ${
                      isSelected
                        ? 'bg-primary-container/30 border-primary font-bold shadow-xs'
                        : 'bg-surface-container-low/50 hover:bg-surface-container-low border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-primary ring-2 ring-primary/30' : 'bg-primary'}`} />
                      <span className="text-on-surface truncate">{cat.name}</span>
                      <span className="text-secondary text-[11px] font-normal">({cat.percentage}%)</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary text-[14px]">check</span>
                      )}
                    </div>
                    <span className="text-primary font-bold whitespace-nowrap">+₹{cat.total.toLocaleString('en-IN')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 7. Transactions Section */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="font-headline-sm text-[16px] text-on-surface font-bold">
            {period === 'daily'
              ? "Today's Transactions"
              : period === 'monthly'
              ? 'Monthly Transactions'
              : period === 'yearly'
              ? 'Yearly Transactions'
              : 'All Transactions'}
          </span>
          <span className="font-body-sm text-[12px] text-secondary font-medium">
            {formattedDateLabel}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[20px]">
            search
          </span>
          <input
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none shadow-sm border border-outline-variant/20 transition-colors"
            placeholder="Search transactions by title, category, or amount..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Transaction Items List */}
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-16 rounded-xl bg-surface-container-lowest p-3 flex items-center justify-between skeleton-shimmer border border-outline-variant/10"
              />
            ))}
          </div>
        ) : displayedTransactions.length > 0 ? (
          <div className="flex flex-col gap-2">
            {displayedTransactions.map((tx) => (
              <div
                key={tx.id || Math.random()}
                onClick={() => onViewRecord && onViewRecord(tx)}
                className="p-3 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex items-center justify-between active:scale-[0.99] hover:border-primary/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getCategoryAvatarClasses(
                      tx.displayCategory,
                      tx.isIncome
                    )}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {getCategoryIcon(tx.displayCategory, tx.isIncome)}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-[13px] text-on-surface font-semibold truncate">
                      {tx.title || 'Untitled Transaction'}
                    </span>
                    <span className="font-body-sm text-[11px] text-secondary truncate">
                      {tx.displayTime} · {tx.displayCategory} · {tx.displayPayment}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`font-headline-sm text-[15px] font-bold ${
                      tx.isIncome ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    {tx.isIncome
                      ? `+₹${tx.parsedAmount.toLocaleString('en-IN')}`
                      : `-₹${tx.parsedAmount.toLocaleString('en-IN')}`}
                  </span>
                  <span className="material-symbols-outlined text-secondary text-[18px]">
                    chevron_right
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-outline-variant mb-2">
              <span className="material-symbols-outlined text-[28px]">
                receipt_long
              </span>
            </div>
            <span className="font-headline-sm text-[16px] text-on-surface font-bold">
              No transactions for {formattedDateLabel}
            </span>
            <p className="font-body-sm text-[12px] text-on-surface-variant max-w-sm mt-1">
              {searchQuery
                ? 'Try adjusting your search query or reset your filters.'
                : period === 'daily'
                ? 'No transactions recorded on this specific day.'
                : period === 'monthly'
                ? 'No transactions recorded in this month.'
                : 'No transactions recorded in this period.'}
            </p>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {latestDateWithData && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date(latestDateWithData))}
                  className="px-3.5 py-2 rounded-full bg-primary-container text-on-primary font-label-md text-[12px] font-bold shadow-sm hover:bg-primary active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">bolt</span>
                  <span>Jump to {latestDateFormatted} ({activeDates[0]?.count || 0} records)</span>
                </button>
              )}

              {period === 'daily' && (
                <button
                  type="button"
                  onClick={() => handleSelectPeriod('monthly')}
                  className="px-3.5 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-[12px] font-semibold active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">calendar_view_month</span>
                  <span>Switch to Monthly ({monthNames[selectedDate.getMonth()]})</span>
                </button>
              )}

              {period !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleSelectPeriod('all')}
                  className="px-3 py-2 rounded-full bg-surface-container-low hover:bg-surface-container text-secondary font-label-md text-[12px] font-semibold active:scale-95 transition-all border border-outline-variant/20"
                >
                  View All Time
                </button>
              )}
            </div>

            {/* Active Date Chips */}
            {period === 'daily' && activeDates.length > 0 && (
              <div className="flex flex-col items-center gap-1.5 mt-4 pt-3 border-t border-outline-variant/20 w-full max-w-sm">
                <span className="text-[11px] text-secondary font-medium">
                  Recent dates with activity:
                </span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {activeDates.slice(0, 3).map((ad) => (
                    <button
                      key={ad.dayKey}
                      type="button"
                      onClick={() => setSelectedDate(new Date(ad.date))}
                      className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-label-sm text-[11px] font-semibold flex items-center gap-1 border border-outline-variant/20 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[13px]">event</span>
                      <span>{ad.formatted} ({ad.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Create Buttons */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-outline-variant/20">
              {onAddExpense && (
                <button
                  type="button"
                  onClick={onAddExpense}
                  className="px-3 py-1.5 rounded-full bg-surface-container-low text-error font-label-md text-[12px] font-semibold border border-error/20 hover:bg-error/10 active:scale-95 transition-all"
                >
                  + Add Expense
                </button>
              )}
              {onAddIncome && (
                <button
                  type="button"
                  onClick={onAddIncome}
                  className="px-3 py-1.5 rounded-full bg-surface-container-low text-primary font-label-md text-[12px] font-semibold border border-primary/20 hover:bg-primary/10 active:scale-95 transition-all"
                >
                  + Add Income
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* Export Action Sheet Modal */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-3 sm:pt-6 px-3 sm:px-4 pb-6 animate-fade-in pointer-events-none">
          {/* Focused Dark Backdrop (dimming background) */}
          <div
            className="fixed inset-0 bg-[#092328]/70 backdrop-blur-md transition-opacity cursor-pointer pointer-events-auto"
            onClick={handleCloseExport}
          />

          {/* Sheet Box */}
          <div className="relative w-full max-w-md max-h-[88vh] bg-surface-container-lowest rounded-3xl shadow-2xl z-10 border border-outline-variant/30 overflow-hidden animate-fade-in flex flex-col p-5 gap-3.5 pointer-events-auto">
            {isExportLoading ? (
              <ExportModalSkeleton />
            ) : (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
                  <div className="flex flex-col">
                    <h3 className="font-headline-sm text-[16px] font-bold text-on-surface">
                      Export Financial Report
                    </h3>
                    <span className="font-body-sm text-[11px] text-on-surface-variant">
                      {displayedTransactions.length} records in active view ({formattedDateLabel})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseExport}
                    className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

            <div className="flex flex-col gap-2">
              {/* Option 1: CSV Export */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all text-left group cursor-pointer border border-outline-variant/15"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">table_view</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-[14px] font-bold text-on-surface">
                      Export CSV Spreadsheet
                    </span>
                    <span className="text-[10px] uppercase font-bold text-primary bg-primary-fixed/50 px-2 py-0.5 rounded-full">
                      Android & Web
                    </span>
                  </div>
                  <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                    Opens Android share sheet (WhatsApp, Drive) or downloads .csv file
                  </span>
                </div>
              </button>

              {/* Option 2: Share Summary Text */}
              <button
                type="button"
                onClick={handleShareSummary}
                className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all text-left group cursor-pointer border border-outline-variant/15"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">share</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-headline-sm text-[14px] font-bold text-on-surface">
                    Share Report Summary
                  </span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                    Share breakdown totals via WhatsApp, SMS, or copy to clipboard
                  </span>
                </div>
              </button>

              {/* Option 3: Google Sheets */}
              <button
                type="button"
                onClick={handleOpenGoogleSheets}
                className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all text-left group cursor-pointer border border-outline-variant/15"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">table_chart</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-headline-sm text-[14px] font-bold text-on-surface">
                    View in Google Sheets
                  </span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                    Open online cloud spreadsheet database
                  </span>
                </div>
              </button>

              {/* Option 4: Print / PDF */}
              <button
                type="button"
                onClick={handlePrintOrPDF}
                className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all text-left group cursor-pointer border border-outline-variant/15"
              >
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">print</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-headline-sm text-[14px] font-bold text-on-surface">
                    Print / PDF Statement
                  </span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                    Printable financial statement document
                  </span>
                </div>
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filter Modal Sheet */}
      {showFilterMenu && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 pt-2 sm:pt-4 animate-fade-in pointer-events-none">
          {/* Focused Dark Backdrop (dimming background completely) */}
          <div
            className="fixed inset-0 bg-[#092328]/75 backdrop-blur-md transition-opacity cursor-pointer pointer-events-auto"
            onClick={handleCloseFilter}
          />

          {/* Drawer Container (Top-Aligned, Fits Fully Without Scrolling) */}
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl sm:rounded-3xl shadow-2xl z-10 border border-outline-variant/30 flex flex-col overflow-hidden animate-fade-in pointer-events-auto">
            {isFilterLoading ? (
              <FilterModalSkeleton />
            ) : (
              <>
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-3 px-4 sm:px-5 border-b border-outline-variant/15 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                    <h3 className="font-headline-sm text-[15px] font-bold text-on-surface">
                      Filter & Sort Records
                    </h3>
                    {activeFiltersCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-primary-fixed text-primary text-[10px] font-bold">
                        {activeFiltersCount} active
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseFilter}
                    className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>

                {/* Drawer Body - All Options Visible Without Scrolling */}
                <div className="px-4 sm:px-5 py-3 flex flex-col gap-2.5">
                  {/* 1. Quick Search */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Search Keyword
                    </span>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-2.5 text-outline text-[16px] pointer-events-none">search</span>
                      <input
                        type="text"
                        placeholder="Search by title, note, category or ₹ amount..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-[12px] text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 text-outline hover:text-on-surface cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Transaction Type */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Transaction Type
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'all', label: 'All Types', icon: 'swap_vert' },
                        { id: 'income', label: 'Income', icon: 'arrow_downward' },
                        { id: 'expense', label: 'Expense', icon: 'arrow_upward' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTypeFilter(t.id)}
                          className={`py-1.5 px-1.5 rounded-xl flex items-center justify-center gap-1 font-label-md text-[11px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                            typeFilter === t.id
                              ? t.id === 'income'
                                ? 'bg-primary text-on-primary border-primary shadow-sm'
                                : t.id === 'expense'
                                ? 'bg-error text-on-error border-error shadow-sm'
                                : 'bg-on-surface text-surface border-on-surface shadow-sm'
                              : 'bg-surface-container-low text-on-surface border-outline-variant/20 hover:bg-surface-container'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px] flex-shrink-0">{t.icon}</span>
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Payment Mode */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Payment Mode
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { id: 'all', label: 'All Modes' },
                        { id: 'UPI', label: 'UPI' },
                        { id: 'Cash', label: 'Cash' },
                        { id: 'Net Banking', label: 'Net Banking' },
                        { id: 'Debit Card', label: 'Debit Card' },
                        { id: 'Credit Card', label: 'Credit Card' },
                      ].map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentFilter(pm.id)}
                          className={`px-2.5 py-1 rounded-full font-label-sm text-[10.5px] font-semibold transition-all border cursor-pointer ${
                            paymentFilter === pm.id
                              ? 'bg-primary text-on-primary border-primary shadow-sm'
                              : 'bg-surface-container-low text-on-surface border-outline-variant/20 hover:bg-surface-container'
                          }`}
                        >
                          {pm.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Category Filter */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Category
                      </span>
                      {selectedCategory !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setSelectedCategory('all')}
                          className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                        >
                          Reset Category
                        </button>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-2.5 text-outline text-[16px] pointer-events-none">
                        category
                      </span>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-[12px] text-on-surface font-medium appearance-none focus:outline-none focus:border-primary capitalize cursor-pointer"
                      >
                        <option value="all">All Categories ({allCategories.length > 1 ? allCategories.length - 1 : 0} available)</option>
                        {allCategories
                          .filter((cat) => cat !== 'all')
                          .map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-2 text-outline text-[18px] pointer-events-none">
                        arrow_drop_down
                      </span>
                    </div>
                  </div>

                  {/* 5. Sort Order */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Sort Order
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'newest', label: 'Newest First', icon: 'schedule' },
                        { id: 'highest', label: 'Highest Amount', icon: 'arrow_upward' },
                        { id: 'lowest', label: 'Lowest Amount', icon: 'arrow_downward' },
                        { id: 'oldest', label: 'Oldest First', icon: 'history' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSortBy(s.id)}
                          className={`py-1.5 px-2 rounded-xl flex items-center gap-1.5 font-label-md text-[11px] font-semibold transition-all border cursor-pointer ${
                            sortBy === s.id
                              ? 'bg-primary text-on-primary border-primary shadow-sm font-bold'
                              : 'bg-surface-container-low text-on-surface border-outline-variant/20 hover:bg-surface-container'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px] flex-shrink-0">{s.icon}</span>
                          <span className="truncate">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-2.5 px-4 sm:px-5 border-t border-outline-variant/15 bg-surface-container-low flex items-center justify-between gap-2.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPeriodTransitioning(true);
                      handleResetFilters();
                      setTimeout(() => setIsPeriodTransitioning(false), 240);
                    }}
                    className="px-3 py-1.5 rounded-full text-primary hover:bg-primary-container/20 font-label-md text-[12px] font-bold transition-all cursor-pointer"
                  >
                    Reset All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPeriodTransitioning(true);
                      handleCloseFilter();
                      showToast(`Applied filters (${displayedTransactions.length} records)`);
                      setTimeout(() => setIsPeriodTransitioning(false), 240);
                    }}
                    className="flex-1 py-2 px-4 rounded-full bg-primary text-on-primary font-label-md text-[12px] font-bold shadow-md hover:bg-primary-dark active:scale-[0.98] transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Apply Filters</span>
                    <span className="opacity-90 font-normal">({displayedTransactions.length})</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-on-surface text-surface text-[12px] font-semibold shadow-2xl flex items-center gap-2 animate-fade-in pointer-events-none">
          <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
