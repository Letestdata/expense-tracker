import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FormModalSkeleton } from './PageSkeletons';
import { parseTransactionDate } from '../utils/transactionUtils';

const EXPENSE_CATEGORIES = [
  { id: 'Food', label: 'Food & Dining', emoji: '🍔', icon: 'restaurant' },
  { id: 'Shopping', label: 'Shopping', emoji: '🛍', icon: 'shopping_bag' },
  { id: 'Transport', label: 'Transport', emoji: '🚗', icon: 'commute' },
  { id: 'Bills', label: 'Bills & Utilities', emoji: '💡', icon: 'lightbulb' },
  { id: 'Health', label: 'Health & Medical', emoji: '❤️', icon: 'favorite' },
  { id: 'Education', label: 'Education', emoji: '📚', icon: 'menu_book' },
];

const INCOME_CATEGORIES = [
  { id: 'Salary', label: 'Salary', emoji: '💼', icon: 'payments' },
  { id: 'Freelance', label: 'Freelance', emoji: '💻', icon: 'laptop_mac' },
  { id: 'Business', label: 'Business', emoji: '🏢', icon: 'storefront' },
  { id: 'Investment', label: 'Investment', emoji: '📈', icon: 'trending_up' },
  { id: 'Gift', label: 'Gift', emoji: '🎁', icon: 'redeem' },
  { id: 'Other', label: 'Other', emoji: '💰', icon: 'savings' },
];

const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI Linked', icon: 'account_balance_wallet' },
  { id: 'Cash', label: 'Cash', icon: 'payments' },
  { id: 'Debit Card', label: 'Debit Card', icon: 'credit_card' },
  { id: 'Credit Card', label: 'Credit Card', icon: 'credit_card_clock' },
  { id: 'Net Banking', label: 'Net Banking', icon: 'account_balance' },
];

export default function CreateFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSaving = false, 
  editItem = null,
  initialType = 'expense',
  isSheetConnected = false,
}) {
  const dateInputRef = useRef(null);
  const [type, setType] = useState(initialType); // 'expense' | 'income'
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategoryOpen, setIsCustomCategoryOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const toIsoDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toReadableDateString = (d) => {
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const [isoDate, setIsoDate] = useState(() => toIsoDateString(new Date()));
  const [date, setDate] = useState(() => toReadableDateString(new Date()));
  const [time, setTime] = useState('');
  const [useCurrentDateTime, setUseCurrentDateTime] = useState(true);
  const [note, setNote] = useState('');

  const isDateToday = useMemo(() => {
    const todayIso = toIsoDateString(new Date());
    return isoDate === todayIso;
  }, [isoDate]);

  const isDateYesterday = useMemo(() => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    return isoDate === toIsoDateString(yest);
  }, [isoDate]);

  const handleDateChange = (newIso) => {
    if (!newIso) return;
    setIsoDate(newIso);
    setUseCurrentDateTime(false);
    const [y, m, d] = newIso.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    setDate(toReadableDateString(dateObj));
  };

  const handleSetQuickDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const iso = toIsoDateString(d);
    handleDateChange(iso);
  };

  const handleOpenDatePicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker();
        } catch (e) {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  // Validation feedback state
  const [validationError, setValidationError] = useState('');

  // Skeleton loader effect state before opening modal
  const [isModalOpening, setIsModalOpening] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsModalOpening(true);
      const timer = setTimeout(() => {
        setIsModalOpening(false);
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Success state after saving
  const [successData, setSuccessData] = useState(null);

  // Sync editItem if provided
  useEffect(() => {
    if (editItem && isOpen) {
      let parsedAmt = '';
      if (editItem.amount) {
        parsedAmt = editItem.amount.toString();
      } else {
        const m = editItem.title ? editItem.title.match(/\(₹([\d,]+(?:\.\d+)?)\)/) : null;
        if (m) parsedAmt = m[1].replace(/,/g, '');
      }
      setAmount(parsedAmt);
      
      const cleanTitle = editItem.title 
        ? editItem.title.replace(/\s*\(₹[\d,]+(?:\.\d+)?\)\s*$/, '') 
        : '';
      setTitle(cleanTitle);

      const cat = editItem.category || editItem.sheetName || 'Food';
      setSelectedCategory(cat);

      const isInc = editItem.type === 'income' || editItem.status === 'draft';
      setType(isInc ? 'income' : 'expense');

      setPaymentMethod(editItem.paymentMethod || editItem.payment_method || 'UPI');
      
      // Clean note: strip out automatically appended "Paid via..." and "Date:..."
      let rawDesc = editItem.note || editItem.description || '';
      let cleanNote = rawDesc
        .replace(/\s*•\s*Paid via [^•]+/gi, '')
        .replace(/\s*•\s*Date:\s*[^•]+/gi, '')
        .replace(/^Paid via [^•]+(?:\s*•\s*)?/gi, '')
        .replace(/^Date:\s*[^•]+(?:\s*•\s*)?/gi, '')
        .trim();
      setNote(cleanNote);
      setUseCurrentDateTime(false);
      if (editItem.date || editItem.rawTimestamp || editItem.timestamp) {
        const parsed = parseTransactionDate(editItem);
        if (parsed) {
          setIsoDate(toIsoDateString(parsed));
          setDate(toReadableDateString(parsed));
        } else if (editItem.date) {
          setDate(editItem.date);
        }
      }
      setSuccessData(null);
      setValidationError('');
    } else if (!editItem && isOpen) {
      // New record defaults
      setType(initialType);
      setSelectedCategory(initialType === 'income' ? 'Salary' : 'Food');
      setAmount('');
      setTitle('');
      setNote('');
      setUseCurrentDateTime(true);
      const now = new Date();
      setIsoDate(toIsoDateString(now));
      setDate(toReadableDateString(now));
      setSuccessData(null);
      setValidationError('');
    }
  }, [editItem, isOpen, initialType]);

  // Sync current date & time if useCurrentDateTime is true
  useEffect(() => {
    if (useCurrentDateTime) {
      const now = new Date();
      setIsoDate(toIsoDateString(now));
      setDate(toReadableDateString(now));
      const formattedTime = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setTime(formattedTime);
    }
  }, [useCurrentDateTime, isOpen]);

  // When switching type (expense/income), set appropriate default category
  const handleTypeChange = (newType) => {
    setType(newType);
    setValidationError('');
    setIsCustomCategoryOpen(false);
    setCustomCategory('');
    if (newType === 'income') {
      setSelectedCategory('Salary');
    } else {
      setSelectedCategory('Food');
    }
  };

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const activeCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const currentCategoryObj = activeCategories.find((c) => c.id === selectedCategory);
  const currentCategoryLabel = isCustomCategoryOpen && customCategory.trim() 
    ? customCategory.trim() 
    : (currentCategoryObj ? currentCategoryObj.label : selectedCategory);

  const parsedAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const formattedComputedAmount = parsedAmount > 0
    ? `${type === 'expense' ? '-' : '+'}₹${parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '₹0.00';

  const addQuickAmount = (val) => {
    setValidationError('');
    const current = parseFloat(amount.replace(/,/g, '')) || 0;
    setAmount((current + val).toString());
  };

  const clearAmount = () => {
    setAmount('');
    setValidationError('');
  };

  const resetForm = () => {
    setAmount('');
    setTitle('');
    setNote('');
    setValidationError('');
    if (type === 'income') {
      setSelectedCategory('Salary');
    } else {
      setSelectedCategory('Food');
    }
    setCustomCategory('');
    setIsCustomCategoryOpen(false);
    setUseCurrentDateTime(true);
    const now = new Date();
    setIsoDate(toIsoDateString(now));
    setDate(toReadableDateString(now));
    setSuccessData(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e, keepOpen = false) => {
    if (e) e.preventDefault();
    
    // Inline validation check
    if (!amount || parsedAmount <= 0) {
      setValidationError('Please enter an amount greater than 0');
      return;
    }
    setValidationError('');

    const finalTitle = title.trim() || `${currentCategoryLabel} ${type === 'expense' ? 'Expense' : 'Income'}`;
    const cleanNote = note.trim();
    const compositeDescription = cleanNote
      ? `${cleanNote} • Paid via ${paymentMethod} • Date: ${date} • ${time}`
      : `Paid via ${paymentMethod} • Date: ${date} • ${time}`;

    const [y, m, d] = isoDate ? isoDate.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];
    const chosenDateObj = isoDate ? new Date(y, m - 1, d) : (parseTransactionDate({ date }) || new Date());

    const submittedRecord = {
      ...(editItem ? { id: editItem.id } : {}),
      title: `${finalTitle} (₹${parsedAmount.toLocaleString('en-IN')})`,
      description: compositeDescription,
      note: cleanNote,
      sheetName: currentCategoryLabel,
      category: currentCategoryLabel,
      status: type === 'expense' ? 'active' : 'draft',
      amount: parsedAmount,
      type,
      paymentMethod,
      payment_method: paymentMethod,
      date,
      time,
      rawTimestamp: chosenDateObj.toISOString(),
      timestamp: chosenDateObj.toISOString(),
      amountFormatted: `₹${parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    };

    onSubmit(submittedRecord);

    if (keepOpen) {
      resetForm();
    } else {
      setSuccessData(submittedRecord);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#092328]/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fade-in">
      {/* MOBILE SHEET / DESKTOP DIALOG CONTAINER */}
      <div 
        className="relative w-full sm:max-w-[640px] bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] border-t sm:border border-outline-variant/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Bar Indicator */}
        <div className="w-full pt-2.5 pb-1 flex justify-center sm:hidden flex-shrink-0 bg-surface">
          <div className="w-12 h-1.5 rounded-full bg-outline-variant/60" />
        </div>

        {/* Saving Skeleton Overlay */}
        {isSaving && (
          <div className="absolute inset-0 bg-surface/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-6 shadow-xl border border-outline-variant/30 flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-[22px] animate-spin">sync</span>
                <span className="font-headline-sm text-[16px] text-on-surface font-bold">Committing to Ledger…</span>
              </div>
              <div className="h-5 w-3/4 rounded-lg skeleton-shimmer mb-1" />
              <div className="h-3.5 w-full rounded skeleton-shimmer" />
              <div className="h-3.5 w-4/5 rounded skeleton-shimmer" />
              <div className="h-3.5 w-2/3 rounded skeleton-shimmer" />
              <div className="mt-2 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <div className="h-4 w-28 rounded-full skeleton-shimmer" />
                <div className="h-4 w-16 rounded-full skeleton-shimmer" />
              </div>
            </div>
          </div>
        )}

        {/* Skeleton Shimmer Effect Before Opening Form Content */}
        {isModalOpening ? (
          <FormModalSkeleton type={type} />
        ) : (
          <>
            {/* Modal Header */}
            <header className="px-3 sm:px-6 pt-2.5 sm:pt-4 pb-3 bg-surface flex items-center justify-between gap-2 flex-shrink-0 border-b border-outline-variant/20">
              {/* Left: Close Button + Title */}
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <button
                  onClick={handleClose}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors flex-shrink-0"
                  title="Close (Esc)"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px]">close</span>
                </button>
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <h1 className="font-headline-sm text-[15px] xs:text-[16px] sm:text-[19px] text-on-surface font-bold tracking-tight whitespace-nowrap truncate">
                    {editItem 
                      ? (type === 'income' ? 'Edit Income' : 'Edit Expense') 
                      : (type === 'income' ? 'Add Income' : 'Add Expense')}
                  </h1>
                  <span className={`px-2 py-0.5 rounded-full font-label-sm text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap flex-shrink-0 hidden xs:inline-block ${
                    editItem 
                      ? 'bg-secondary-container text-on-secondary-container' 
                      : type === 'income' 
                      ? 'bg-primary-fixed text-on-primary-fixed' 
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {editItem ? 'Editing' : type === 'income' ? 'Inflow' : 'Ready'}
                  </span>
                </div>
              </div>

              {/* Right: Storage / Sync Indicator */}
              <div className="flex items-center flex-shrink-0">
                <div className="flex items-center gap-1.5 bg-surface-container-low px-2 sm:px-2.5 py-1 rounded-full text-secondary font-label-sm text-[11px] whitespace-nowrap border border-outline-variant/15">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSheetConnected ? 'bg-primary animate-pulse' : 'bg-outline'}`} />
                  <span className="hidden sm:inline">{isSheetConnected ? 'Google Sheet' : 'Phone Memory'}</span>
                  <span className="sm:hidden font-medium">{isSheetConnected ? 'Synced' : 'Offline'}</span>
                </div>
              </div>
            </header>

        {/* Segmented Type Selector */}
        <div className="px-4 sm:px-6 pt-3 pb-2 flex-shrink-0 bg-surface">
          <div className="bg-surface-container-high p-1 rounded-full flex items-center shadow-sm">
            <button
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-2 rounded-full font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                type === 'expense'
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
              <span>Expense</span>
            </button>
            <button
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-2 rounded-full font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-all ${
                type === 'income'
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'text-secondary hover:text-on-surface'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              <span>Income</span>
            </button>
          </div>
        </div>

        {/* State 2: Successful Submission Sheet Modal / Toast Preview */}
        {successData ? (
          <div className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto animate-fade-in">
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-md flex flex-col items-center text-center relative overflow-hidden border border-outline-variant/20">
              {/* Ambient Decorative Accent */}
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary-fixed/30 rounded-full blur-xl pointer-events-none"></div>

              {/* Success Glyph Badge */}
              <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center mb-3 shadow-md">
                <span className="material-symbols-outlined text-[30px]">check_circle</span>
              </div>

              <h2 className="font-headline-md text-[20px] sm:text-headline-md text-on-surface mb-0.5 font-bold">
                {successData.type === 'income' ? 'Income Added Successfully' : 'Expense Added Successfully'}
              </h2>
              <p className="font-body-md text-body-md text-secondary font-semibold">
                {successData.amountFormatted} • {successData.category}
              </p>

              {/* Ledger Confirmation Pill Details */}
              <div className="mt-4 w-full bg-surface-container-low rounded-xl p-3 flex flex-col gap-2 text-left">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-on-surface-variant font-medium">Payment Method</span>
                  <span className="font-semibold text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-primary">credit_card</span>
                    <span>{successData.paymentMethod}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-on-surface-variant font-medium">Recorded At</span>
                  <span className="font-semibold text-on-surface">{successData.date} • {successData.time}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-on-surface-variant font-medium">Storage Location</span>
                  <span className={`font-semibold flex items-center gap-1 ${isSheetConnected ? 'text-primary' : 'text-secondary'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isSheetConnected ? 'bg-primary animate-pulse' : 'bg-outline'}`} />
                    <span>{isSheetConnected ? 'Synced to Google Sheets' : 'Saved in Phone Memory (Offline)'}</span>
                  </span>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex flex-col w-full gap-2 mt-5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full h-11 bg-primary-container hover:bg-primary text-on-primary rounded-full font-label-md text-label-md uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm active:scale-[0.99] transition-transform font-semibold"
                >
                  Done / Return to Dashboard
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full h-11 bg-surface-container hover:bg-surface-container-high text-primary rounded-full font-label-md text-label-md uppercase tracking-wider flex items-center justify-center gap-1 transition-colors font-semibold"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Add Another Transaction</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* State 1: Active Entry Form with Inline Validation Feedback */
          <form onSubmit={(e) => handleSubmit(e, false)} className="px-4 sm:px-6 py-3 overflow-y-auto flex flex-col gap-3.5 pb-6 flex-1">
            
            {/* 1. HERO AMOUNT CARD with Inline Field Validation */}
            <div className={`w-full bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center border transition-colors ${
              validationError ? 'border-error/70 ring-1 ring-error/40' : 'border-outline-variant/20'
            }`}>
              <div className="w-full flex items-center justify-between mb-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
                  {type === 'income' ? 'Amount Received' : 'Amount'} <span className="text-error">*</span>
                </span>
                <div className="flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="font-label-sm text-label-sm text-secondary font-medium">INR (₹)</span>
                </div>
              </div>

              {/* Display & Input */}
              <div className="flex items-baseline justify-center py-1 w-full">
                <span className="font-headline-lg text-headline-lg text-secondary font-bold mr-1">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  autoFocus
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  className="w-full max-w-[260px] bg-transparent text-center font-display-hero-mobile text-[32px] sm:text-[38px] text-on-surface font-black tracking-tight focus:outline-none placeholder:text-outline/40"
                />
              </div>

              {/* Amount Micro-validation Feedback from Stitch */}
              {validationError ? (
                <div className="mt-2 w-full flex items-center gap-1.5 bg-error-container text-on-error-container p-2 rounded-lg font-body-sm text-[12px] animate-fade-in font-medium">
                  <span className="material-symbols-outlined text-[17px] text-error flex-shrink-0">info</span>
                  <span>{validationError}</span>
                </div>
              ) : null}

              {/* Quick Amount Increment Chips */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-2 w-full justify-center overflow-x-auto py-1">
                <button
                  type="button"
                  onClick={() => addQuickAmount(100)}
                  className="bg-secondary-fixed/40 active:bg-secondary-fixed text-secondary font-label-md text-[12px] px-3 py-1 rounded-full transition-transform active:scale-95 font-semibold flex-shrink-0"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => addQuickAmount(500)}
                  className="bg-secondary-fixed/40 active:bg-secondary-fixed text-secondary font-label-md text-[12px] px-3 py-1 rounded-full transition-transform active:scale-95 font-semibold flex-shrink-0"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => addQuickAmount(1000)}
                  className="bg-secondary-fixed/40 active:bg-secondary-fixed text-secondary font-label-md text-[12px] px-3 py-1 rounded-full transition-transform active:scale-95 font-semibold flex-shrink-0"
                >
                  +1,000
                </button>
                <button
                  type="button"
                  onClick={clearAmount}
                  className="bg-error-container/60 active:bg-error-container text-on-error-container font-label-md text-[12px] px-2.5 py-1 rounded-full transition-transform active:scale-95 font-semibold flex-shrink-0 flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[13px]">backspace</span>
                  <span>Clear</span>
                </button>
              </div>

              {type === 'income' && (
                <div className="mt-2 text-primary font-body-sm text-[12px] flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[15px]">savings</span>
                  <span>Allocated to primary liquid savings account</span>
                </div>
              )}
            </div>

            {/* 2. CATEGORY SELECTOR with Required Badge */}
            <div className="w-full bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-outline-variant/20">
              <div className="flex items-center justify-between mb-2 px-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
                    Select Category
                  </span>
                  <span className="font-label-sm text-[10px] text-error bg-error-container/40 px-2 py-0.5 rounded-full font-semibold">
                    Required
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomCategoryOpen(!isCustomCategoryOpen)}
                  className="font-body-sm text-body-sm text-secondary hover:underline cursor-pointer font-medium text-[12px]"
                >
                  {isCustomCategoryOpen ? 'Show Presets' : '+ Custom Category'}
                </button>
              </div>

              {isCustomCategoryOpen ? (
                <div className="h-10 px-3 rounded-xl bg-surface-container-low flex items-center gap-2 border border-outline-variant/30 focus-within:border-primary shadow-sm transition-colors">
                  <span className="material-symbols-outlined text-secondary text-[18px]">category</span>
                  <input
                    type="text"
                    placeholder="Enter custom category name..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none placeholder:text-outline"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {activeCategories.slice(0, 6).map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all active:scale-95 group ${
                          isSelected
                            ? 'bg-primary-fixed/50 text-on-primary-fixed-variant ring-1 ring-primary/40 font-semibold shadow-sm'
                            : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                          isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-secondary'
                        }`}>
                          <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                        </span>
                        <span className="font-label-sm text-[11px] truncate w-full text-center">
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. PAYMENT ACCOUNT & DATE COMPACT GRID */}
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Payment Account */}
                <div className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex flex-col gap-1 border border-outline-variant/20">
                  <span className="font-label-sm text-[11px] text-secondary uppercase font-semibold">Account</span>
                  <div className="flex items-center justify-between text-on-surface pt-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="material-symbols-outlined text-primary text-[17px]">account_balance_wallet</span>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="bg-transparent font-body-sm text-[12px] font-semibold text-on-surface focus:outline-none cursor-pointer truncate max-w-[100px]"
                      >
                        {PAYMENT_METHODS.map((pm) => (
                          <option key={pm.id} value={pm.id}>{pm.label}</option>
                        ))}
                      </select>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-[16px] pointer-events-none">unfold_more</span>
                  </div>
                </div>

                {/* Interactive Date & Time Card */}
                <div 
                  onClick={handleOpenDatePicker}
                  className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex flex-col gap-1 border border-outline-variant/20 cursor-pointer hover:border-primary/60 transition-all relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-[11px] text-secondary uppercase font-semibold">Date &amp; Time</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isDateToday 
                        ? 'bg-primary/15 text-primary' 
                        : isDateYesterday 
                        ? 'bg-secondary-fixed/50 text-secondary' 
                        : 'bg-surface-container-highest text-on-surface-variant font-medium'
                    }`}>
                      {isDateToday ? 'Today' : isDateYesterday ? 'Yesterday' : 'Past Date'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface pt-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="material-symbols-outlined text-primary text-[17px]">calendar_month</span>
                      <span className="font-body-sm text-[12px] font-semibold text-on-surface truncate">
                        {date || 'Select Date'}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-[16px] group-hover:text-primary transition-colors">
                      edit_calendar
                    </span>
                  </div>
                  {/* Invisible HTML5 date input overlay: clicking anywhere on the card opens native Android / iOS / Web calendar dialog */}
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={isoDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    aria-label="Select transaction date"
                  />
                </div>
              </div>

              {/* Quick Date Chips for Fast Previous Day Selection */}
              <div className="flex items-center gap-1.5 px-0.5 overflow-x-auto py-0.5">
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(0)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                    isDateToday
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">today</span>
                  <span>Today</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(1)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                    isDateYesterday
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">history</span>
                  <span>Yesterday</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(2)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer"
                >
                  <span>2 Days Ago</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenDatePicker}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                    !isDateToday && !isDateYesterday
                      ? 'bg-primary/20 text-primary border border-primary/40 font-bold'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">calendar_month</span>
                  <span>Pick Date 📅</span>
                </button>
              </div>
            </div>

            {/* 4. TITLE / NOTE FIELD */}
            <div className="w-full bg-surface-container-lowest rounded-xl p-3 shadow-sm border border-outline-variant/20">
              <label className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold block mb-1">
                {type === 'income' ? 'Income Memo (Optional)' : 'Note / Purpose (Optional)'}
              </label>
              <div className="h-9 px-3 rounded-lg bg-surface-container-low flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[17px]">edit_note</span>
                <input
                  type="text"
                  placeholder={type === 'income' ? "e.g. Monthly consulting retainer credit" : "e.g. Lunch with product team, fuel..."}
                  value={note || title}
                  onChange={(e) => {
                    setNote(e.target.value);
                    setTitle(e.target.value);
                  }}
                  className="w-full bg-transparent font-body-sm text-on-surface focus:outline-none placeholder:text-outline"
                />
              </div>
            </div>

            {/* 5. COMPACT SUMMARY BAR */}
            <div className="w-full bg-surface-container-high rounded-xl p-2.5 flex items-center justify-between border border-outline-variant/20">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${type === 'income' ? 'bg-primary' : 'bg-primary-container'}`} />
                <span className="font-body-sm text-[12px] text-secondary font-medium flex-shrink-0">Review:</span>
                <span className="font-body-sm text-[12px] text-on-surface font-bold truncate">
                  {type === 'income' ? 'Income' : 'Expense'} • {formattedComputedAmount} • {currentCategoryLabel} • {paymentMethod}
                </span>
              </div>
              <span className="material-symbols-outlined text-secondary text-[18px] flex-shrink-0 ml-1">verified</span>
            </div>

            {/* 6. SCROLLABLE BOTTOM ACTION BAR (Scrolls with form content) */}
            <div className="pt-3 pb-4 border-t border-outline-variant/20 w-full mt-2">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-[13px] font-medium transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  {!editItem && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSubmit(null, true)}
                      className="h-11 px-3 sm:px-4 rounded-full bg-surface-container-high text-on-surface font-label-md text-[12px] hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed hidden xs:inline-flex items-center"
                    >
                      + Another
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 sm:flex-initial h-11 px-6 rounded-full bg-primary-container text-on-primary font-headline-sm text-[14px] sm:text-[15px] font-semibold shadow-md active:bg-primary transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                        <span>Saving…</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check</span>
                        <span>{editItem ? 'Update Record' : (type === 'income' ? 'Save Income' : 'Save Transaction')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </form>
        )}
          </>
        )}
      </div>
    </div>
  );
}
