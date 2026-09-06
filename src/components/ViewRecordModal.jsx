import React, { useState, useEffect } from 'react';
import { ViewRecordModalSkeleton } from './PageSkeletons';

export default function ViewRecordModal({ isOpen, onClose, record, onEdit, onDelete, isSheetConnected = false }) {
  const [isModalOpening, setIsModalOpening] = useState(false);

  useEffect(() => {
    if (isOpen && record) {
      setIsModalOpening(true);
      const timer = setTimeout(() => {
        setIsModalOpening(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, record]);
  if (!isOpen || !record) return null;

  // Helper to extract amount from title if not directly present
  let amountStr = '';
  if (record.amount) {
    amountStr = `₹${parseFloat(record.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  } else {
    const match = record.title.match(/\(₹([\d,]+(?:\.\d+)?)\)/);
    if (match) {
      amountStr = `₹${match[1]}`;
    } else {
      amountStr = '₹0.00';
    }
  }

  // Clean title without amount suffix
  const cleanTitle = record.title.replace(/\s*\(₹[\d,]+(?:\.\d+)?\)\s*$/, '') || record.title;

  const isIncome = record.type === 'income' || record.status === 'draft';

  return (
    <div className="fixed inset-0 bg-[#092328]/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full sm:max-w-[560px] bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[90vh] border-t sm:border border-outline-variant/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Bar */}
        <div className="w-full pt-2.5 pb-1 flex justify-center sm:hidden flex-shrink-0 bg-surface">
          <div className="w-12 h-1.5 rounded-full bg-outline-variant/60" />
        </div>

        {isModalOpening ? (
          <ViewRecordModalSkeleton />
        ) : (
          <>
            {/* Header */}
            <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-3 bg-surface flex items-center justify-between border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-headline-sm text-[18px] sm:text-[20px] text-on-surface font-bold">
              Transaction Details
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-[10px] uppercase tracking-wider font-semibold ${
              isIncome 
                ? 'bg-primary-fixed text-on-primary-fixed' 
                : 'bg-error-container/60 text-on-error-container'
            }`}>
              {isIncome ? 'Income' : 'Expense'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-4">
          
          {/* Hero Amount & Title Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/20 flex flex-col items-center text-center">
            <span className="font-label-sm text-[11px] text-secondary uppercase tracking-widest font-semibold mb-1">
              Transaction Amount
            </span>
            <div className={`text-[32px] sm:text-[36px] font-black tracking-tight mb-1 ${
              isIncome ? 'text-primary' : 'text-on-surface'
            }`}>
              {amountStr}
            </div>
            <h3 className="font-headline-sm text-[17px] text-on-surface font-bold max-w-sm">
              {cleanTitle}
            </h3>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-md text-[12px] font-medium">
              <span className="material-symbols-outlined text-[16px] text-primary">category</span>
              <span>{record.sheetName || record.category || 'General'}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col gap-3">
            
            {/* Payment Method & Date */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-outline-variant/20">
              <div className="flex flex-col">
                <span className="font-label-sm text-[11px] text-on-surface-variant uppercase">Payment Mode</span>
                <span className="font-body-md text-on-surface font-semibold flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[17px] text-primary">payments</span>
                  <span>{record.paymentMethod || 'UPI / Cash'}</span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-[11px] text-on-surface-variant uppercase">Date &amp; Time</span>
                <span className="font-body-md text-on-surface font-semibold flex items-center gap-1 mt-0.5 truncate">
                  <span className="material-symbols-outlined text-[17px] text-primary">calendar_today</span>
                  <span>{record.timestamp || 'Recorded'}</span>
                </span>
              </div>
            </div>

            {/* Description / Notes */}
            <div className="flex flex-col pb-3 border-b border-outline-variant/20">
              <span className="font-label-sm text-[11px] text-on-surface-variant uppercase mb-1">
                Description / Memo
              </span>
              <p className="font-body-md text-on-surface bg-surface-container-low p-2.5 rounded-xl text-[13px] leading-relaxed break-words">
                {record.description || 'No additional memo recorded.'}
              </p>
            </div>

            {/* Cloud Sync / Local Storage State */}
            <div className="flex items-center justify-between text-[12px] pt-1">
              <span className="text-on-surface-variant font-medium">Database Status</span>
              <span className={`font-semibold flex items-center gap-1.5 ${isSheetConnected ? 'text-primary' : 'text-secondary'}`}>
                <span className={`w-2 h-2 rounded-full ${isSheetConnected ? 'bg-primary animate-pulse' : 'bg-outline'}`} />
                <span>{isSheetConnected ? 'Google Sheets Live Record' : 'Android Device Memory (Offline)'}</span>
              </span>
            </div>

            {/* Record ID */}
            <div className="flex items-center justify-between text-[11px] text-outline pt-0.5">
              <span>Record ID</span>
              <span className="font-mono">{record.id}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3 bg-surface border-t border-outline-variant/20 flex items-center justify-between gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this record?')) {
                onDelete(record.id);
                onClose();
              }
            }}
            className="px-3.5 py-2 rounded-full text-error hover:bg-error-container/40 font-label-md text-[13px] flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[17px]">delete</span>
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-on-surface-variant hover:bg-surface-container font-label-md text-[13px] transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              className="px-5 py-2 rounded-full bg-primary-container text-on-primary hover:bg-primary font-label-md text-[13px] font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[17px]">edit</span>
              <span>Edit Record</span>
            </button>
          </div>
        </div>
        </>
      )}
      </div>
    </div>
  );
}
