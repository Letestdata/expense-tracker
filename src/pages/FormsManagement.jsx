import React, { useState, useEffect, useCallback, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import Header from '../components/Header';
import CreateFormModal from '../components/CreateFormModal';
import ViewRecordModal from '../components/ViewRecordModal';

import HomeOverview from '../components/HomeOverview';
import IncomeTracking from '../components/IncomeTracking';
import ExpenseTracking from '../components/ExpenseTracking';
import RecordsHistory from '../components/RecordsHistory';
import ReportsBreakdown from '../components/ReportsBreakdown';
import BottomNav from '../components/BottomNav';
import Sidebar from '../components/Sidebar';
import {
  HomeSkeleton,
  IncomeSkeleton,
  ExpenseSkeleton,
  RecordsSkeleton,
  ReportsSkeleton,
} from '../components/PageSkeletons';
import { isIncomeTransaction, cleanTransactionRow, parseTransactionDate } from '../utils/transactionUtils';
import {
  saveOfflineTransactions,
  loadOfflineTransactions,
  enqueueOfflineAction,
  syncPendingOfflineActions,
} from '../utils/offlineStorage';

// ❌ Google Sheet temporarily DISCONNECTED for offline device checking
// To reconnect later, restore the URL below:
// const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbybrh7wvYvw12c8voIMngDhqPJ5WiqxgxWUTW8BmEC0YrDD1V7mpqVi0C5BIipjUvDz/exec';
const SHEET_API_URL = '';

const AVATAR_URL = '/avatar.png';

export default function FormsManagement() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'income' | 'expense' | 'records' | 'reports'
  const [tabHistory, setTabHistory] = useState(['home']);
  const [exitToast, setExitToast] = useState(false);
  const lastBackPressTimeRef = useRef(0);
  const lastBackActionTimeRef = useRef(0);
  const exitToastTimeoutRef = useRef(null);
  const subModalCloserRef = useRef(null);

  const [recordsFilter, setRecordsFilter] = useState('all'); // 'all' | 'income' | 'expense'
  const [modalInitialType, setModalInitialType] = useState('expense'); // 'expense' | 'income'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formsData, setFormsData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSheetConnected, setIsSheetConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssetsLoading, setIsAssetsLoading] = useState(true);
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Keep an up-to-date ref of state to prevent stale closures in event handlers
  const stateRef = useRef({
    isModalOpen,
    viewingRecord,
    isSidebarOpen,
    activeTab,
    tabHistory,
  });

  useEffect(() => {
    stateRef.current = {
      isModalOpen,
      viewingRecord,
      isSidebarOpen,
      activeTab,
      tabHistory,
    };
  });

  // Smooth tab switching handler that triggers page & button skeleton loader effect
  const handleSelectTab = useCallback((tab, isBack = false) => {
    if (tab === activeTab) return;
    setIsTabTransitioning(true);
    setActiveTab(tab);
    if (!isBack) {
      if (tab === 'home') {
        setTabHistory(['home']);
      } else {
        setTabHistory((prev) => {
          if (prev[prev.length - 1] === tab) return prev;
          return [...prev, tab];
        });
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
      setIsTabTransitioning(false);
    }, 320);
  }, [activeTab]);

  // Comprehensive Android hardware back button handler
  const handleBackAction = useCallback(() => {
    const current = stateRef.current;

    // 1. Child modal inside active page (Filter drawer or Export modal in Reports)
    if (subModalCloserRef.current && subModalCloserRef.current()) {
      return;
    }

    // 2. Sidebar navigation drawer open
    if (current.isSidebarOpen) {
      setIsSidebarOpen(false);
      return;
    }

    // 3. View Record detail modal open
    if (current.viewingRecord) {
      setViewingRecord(null);
      return;
    }

    // 4. Create/Edit transaction modal open
    if (current.isModalOpen) {
      setIsModalOpen(false);
      setEditingRecord(null);
      return;
    }

    // 5. Navigate backwards through tab history
    if (current.tabHistory.length > 1) {
      const newHistory = [...current.tabHistory];
      newHistory.pop(); // remove current tab
      const previousTab = newHistory[newHistory.length - 1] || 'home';
      setTabHistory(newHistory);
      handleSelectTab(previousTab, true);
      return;
    }

    // 6. If currently on a non-home tab without history, return to home
    if (current.activeTab !== 'home') {
      setTabHistory(['home']);
      handleSelectTab('home', true);
      return;
    }

    // 7. On Home screen with no modals open: double-press back to exit app
    const now = Date.now();
    if (now - lastBackPressTimeRef.current < 2000) {
      if (exitToastTimeoutRef.current) clearTimeout(exitToastTimeoutRef.current);
      setExitToast(false);
      CapApp.exitApp();
    } else {
      lastBackPressTimeRef.current = now;
      setExitToast(true);
      if (exitToastTimeoutRef.current) clearTimeout(exitToastTimeoutRef.current);
      exitToastTimeoutRef.current = setTimeout(() => {
        setExitToast(false);
      }, 2000);
    }
  }, [handleSelectTab]);

  // Android hardware back button & web popstate listener
  useEffect(() => {
    // Debounced runner to prevent double-firing if both native and web popstate trigger
    const triggerBack = () => {
      const now = Date.now();
      if (now - lastBackActionTimeRef.current < 250) return;
      lastBackActionTimeRef.current = now;
      handleBackAction();
    };

    // Web browser back button integration (Chrome/Safari on Android)
    if (window.history && window.history.pushState) {
      window.history.pushState({ app: 'sheetflow' }, '');
    }

    const handlePopState = () => {
      if (window.history && window.history.pushState) {
        window.history.pushState({ app: 'sheetflow' }, '');
      }
      triggerBack();
    };

    window.addEventListener('popstate', handlePopState);

    // Native Capacitor Android back button listener
    let capListenerHandle = null;
    const setupCapacitorBack = async () => {
      try {
        capListenerHandle = await CapApp.addListener('backButton', () => {
          triggerBack();
        });
      } catch (err) {
        console.warn('Capacitor App backButton listener not active:', err);
      }
    };
    setupCapacitorBack();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (capListenerHandle && capListenerHandle.remove) {
        capListenerHandle.remove();
      }
    };
  }, [handleBackAction]);

  const handleOpenAddExpense = () => {
    setEditingRecord(null);
    setModalInitialType('expense');
    setIsModalOpen(true);
  };

  const handleOpenAddIncome = () => {
    setEditingRecord(null);
    setModalInitialType('income');
    setIsModalOpen(true);
  };

  // Fetch all expenses from Google Sheet
  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    // 1. Immediately load whatever was stored in Android device memory so user has data instantly
    try {
      const offlineRecords = await loadOfflineTransactions();
      if (offlineRecords && offlineRecords.length > 0) {
        setFormsData(offlineRecords);
      }
    } catch (e) {
      console.warn('Error reading offline transactions initially:', e);
    }

    // If Google Sheet is disconnected, run purely from Android device memory
    if (!SHEET_API_URL) {
      setIsSheetConnected(false);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(SHEET_API_URL);
      const json = await res.json();
      if (json.data) {
        // Deduplicate records by ID (keeping newest version) so duplicate cards never appear
        const seen = new Set();
        const mapped = [];
        for (let i = json.data.length - 1; i >= 0; i--) {
          const row = json.data[i];
          if (!row.id) continue;
          const strId = String(row.id);
          if (seen.has(strId)) continue;
          seen.add(strId);
          const cleaned = cleanTransactionRow(row);
          mapped.unshift({
            id: cleaned.id,
            title: cleaned.title || '',
            description: cleaned.description || cleaned.note || '',
            note: cleaned.note || '',
            sheetName: cleaned.category,
            category: cleaned.category,
            status: cleaned.status,
            type: cleaned.type,
            amount: cleaned.amount || '',
            paymentMethod: cleaned.payment_method || cleaned.paymentMethod || '',
            date: cleaned.date || '',
            time: cleaned.time || '',
            rawTimestamp: cleaned.timestamp || (cleaned.id ? new Date(cleaned.id).toISOString() : ''),
            timestamp: cleaned.timestamp || (cleaned.id ? new Date(cleaned.id).toISOString() : ''),
            fieldsCount: 0,
            submissionsCount: 0,
            isPulse: false,
          });
        }

        // Merge with any local offline-created transactions that haven't reached the sheet yet
        const currentOffline = await loadOfflineTransactions();
        const sheetIds = new Set(mapped.map((m) => String(m.id)));
        const localOnly = currentOffline.filter((c) => !sheetIds.has(String(c.id)));
        const combined = [...localOnly, ...mapped];

        setFormsData(combined);
        await saveOfflineTransactions(combined);
        setIsSheetConnected(true);

        // Sync any queued items to sheet in background
        syncPendingOfflineActions(SHEET_API_URL);
      }
    } catch (err) {
      console.warn('Google Sheets not reachable, running in offline mode from device memory:', err);
      setIsSheetConnected(false);
      // Data is already loaded from device memory above!
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On mount: wait until all assets (fonts, images, sheet data) are loaded
  useEffect(() => {
    const startTime = Date.now();

    const fontPromise = document.fonts ? document.fonts.ready : Promise.resolve();
    const imagePromise = new Promise((resolve) => {
      const img = new Image();
      img.src = AVATAR_URL;
      img.onload = resolve;
      img.onerror = resolve;
    });

    Promise.all([fontPromise, imagePromise, fetchExpenses()]).finally(() => {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 750 - elapsed);
      setTimeout(() => {
        setIsAssetsLoading(false);
      }, remainingTime);
    });
  }, [fetchExpenses]);

  // Manual "Connect" click — re-try fetching
  const handleConnectSheet = () => {
    setIsConnecting(true);
    fetchExpenses().finally(() => setIsConnecting(false));
  };

  // View Record Detail Modal
  const handleViewRecord = (record) => {
    setViewingRecord(record);
  };

  // Open Edit Modal with selected record prefilled
  const handleEditRecord = (record) => {
    setViewingRecord(null);
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  // Delete a record (both locally and on Google Sheets)
  const handleDeleteRecord = async (id) => {
    const updatedList = formsData.filter((item) => String(item.id) !== String(id));
    setFormsData(updatedList);
    if (viewingRecord && String(viewingRecord.id) === String(id)) {
      setViewingRecord(null);
    }

    // Save immediately to Android persistent storage (survives phone reboot)
    await saveOfflineTransactions(updatedList);

    if (SHEET_API_URL) {
      try {
        await fetch(SHEET_API_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action: 'delete' }),
        });
      } catch (err) {
        console.warn('Network offline: queued delete action for sync:', err);
        await enqueueOfflineAction({
          type: 'delete',
          payload: { id, action: 'delete' },
        });
      }
    } else {
      await enqueueOfflineAction({
        type: 'delete',
        payload: { id, action: 'delete' },
      });
    }
  };

  // Submit a new expense OR update an existing one strictly in place with offline persistence
  const handleCreateOrUpdate = async (submittedForm) => {
    setIsSaving(true);
    setErrorMessage('');
    const currentEditing = editingRecord;
    try {
      if (currentEditing) {
        const recordId = currentEditing.id;
        const updatedList = formsData.map((item) =>
          String(item.id) === String(recordId)
            ? {
                ...item,
                ...submittedForm,
                id: recordId,
                sheetName: submittedForm.category || submittedForm.sheetName || item.sheetName,
              }
            : item
        );
        setFormsData(updatedList);
        setIsModalOpen(false);
        setEditingRecord(null);

        // Save immediately to Android persistent storage (survives phone reboot)
        await saveOfflineTransactions(updatedList);

        // Sync update to Google Apps Script or queue if offline
        if (SHEET_API_URL) {
          try {
            await fetch(SHEET_API_URL, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...submittedForm,
                id: recordId,
                sheetName: submittedForm.category || submittedForm.sheetName,
                action: 'update',
              }),
            });
          } catch (netErr) {
            console.warn('Network offline: queued update action for sync:', netErr);
            await enqueueOfflineAction({
              type: 'update',
              payload: {
                ...submittedForm,
                id: recordId,
                sheetName: submittedForm.category || submittedForm.sheetName,
                action: 'update',
              },
            });
          }
        } else {
          await enqueueOfflineAction({
            type: 'update',
            payload: {
              ...submittedForm,
              id: recordId,
              sheetName: submittedForm.category || submittedForm.sheetName,
              action: 'update',
            },
          });
        }
      } else {
        // Create new record
        const newId = Date.now();
        const parsedDate = submittedForm.date ? parseTransactionDate({ date: submittedForm.date }) : null;
        const chosenDateIso = submittedForm.rawTimestamp || (parsedDate ? parsedDate.toISOString() : new Date().toISOString());
        const optimisticCard = {
          ...submittedForm,
          id: newId,
          rawTimestamp: chosenDateIso,
          timestamp: submittedForm.date || 'Just now',
          fieldsCount: 0,
          submissionsCount: 0,
          isPulse: false,
        };
        const updatedList = [optimisticCard, ...formsData];
        setFormsData(updatedList);
        setIsModalOpen(false);

        // Save immediately to Android persistent storage (survives phone reboot)
        await saveOfflineTransactions(updatedList);

        // Sync create to Google Apps Script or queue if offline
        if (SHEET_API_URL) {
          try {
            await fetch(SHEET_API_URL, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...submittedForm, id: newId }),
            });
          } catch (netErr) {
            console.warn('Network offline: queued create action for sync:', netErr);
            await enqueueOfflineAction({
              type: 'create',
              payload: { ...submittedForm, id: newId },
            });
          }
        } else {
          await enqueueOfflineAction({
            type: 'create',
            payload: { ...submittedForm, id: newId },
          });
        }
      }

      // Re-fetch after 4s if sheet connected
      if (isSheetConnected && SHEET_API_URL) {
        setTimeout(() => fetchExpenses(), 4000);
      }
    } catch (err) {
      console.error('Failed to save transaction:', err);
      setErrorMessage('Failed to save transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isPageLoading = isLoading || isAssetsLoading || isTabTransitioning;

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <div className="w-full transition-all duration-300">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onAddExpense={handleOpenAddExpense}
          isLoading={isPageLoading}
          isSheetConnected={isSheetConnected}
        />

        <Header
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onCreateFormClick={handleOpenAddExpense}
          isConnected={isSheetConnected}
          onConnectClick={handleConnectSheet}
          isConnecting={isConnecting}
          isAssetsLoading={isAssetsLoading}
          isLoading={isPageLoading}
        />

        <main className="w-full pt-16 bg-surface min-h-[calc(100vh-64px)] pb-16">
          {/* Error Banner */}
          {errorMessage && (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
              <div className="flex items-center gap-space-xs p-space-md rounded-xl bg-error-container text-on-error-container font-body-sm animate-fade-in">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {isPageLoading ? (
            /* Dedicated Page Skeleton Loaders */
            activeTab === 'home' ? (
              <HomeSkeleton />
            ) : activeTab === 'income' ? (
              <IncomeSkeleton />
            ) : activeTab === 'expense' ? (
              <ExpenseSkeleton />
            ) : activeTab === 'records' ? (
              <RecordsSkeleton />
            ) : (
              <ReportsSkeleton />
            )
          ) : activeTab === 'home' ? (
            /* Home - Financial Overview View */
            <HomeOverview
              transactions={formsData}
              isLoading={false}
              onAddIncome={handleOpenAddIncome}
              onAddExpense={handleOpenAddExpense}
              onViewAllRecords={(filterType = 'all') => {
                setRecordsFilter(filterType);
                handleSelectTab('records');
              }}
              onViewRecord={handleViewRecord}
            />
          ) : activeTab === 'income' ? (
            /* Income Tracking View */
            <IncomeTracking
              transactions={formsData}
              isLoading={false}
              onAddIncome={handleOpenAddIncome}
              onViewRecord={handleViewRecord}
            />
          ) : activeTab === 'expense' ? (
            /* Expense Tracking View */
            <ExpenseTracking
              transactions={formsData}
              isLoading={false}
              onAddExpense={handleOpenAddExpense}
              onViewRecord={handleViewRecord}
            />
          ) : activeTab === 'records' ? (
            /* Records & History View */
            <RecordsHistory
              transactions={formsData}
              isLoading={false}
              isSheetConnected={isSheetConnected}
              initialTypeFilter={recordsFilter}
              onViewRecord={handleViewRecord}
              onAddExpense={handleOpenAddExpense}
              onAddIncome={handleOpenAddIncome}
            />
          ) : (
            /* Reports Breakdown View */
            <ReportsBreakdown
              transactions={formsData}
              isLoading={false}
              isSheetConnected={isSheetConnected}
              sheetUrl={SHEET_API_URL}
              onViewRecord={handleViewRecord}
              onAddExpense={handleOpenAddExpense}
              onAddIncome={handleOpenAddIncome}
              onFilterMenuToggle={setIsFilterMenuOpen}
              subModalCloserRef={subModalCloserRef}
            />
          )}
        </main>
      </div>

      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onAddIncome={handleOpenAddIncome}
        onAddExpense={handleOpenAddExpense}
        isHidden={isModalOpen || !!viewingRecord || isFilterMenuOpen}
        isLoading={isPageLoading}
        isAssetsLoading={isAssetsLoading}
        isTabTransitioning={isTabTransitioning}
      />

      <ViewRecordModal
        isOpen={!!viewingRecord}
        record={viewingRecord}
        onClose={() => setViewingRecord(null)}
        onEdit={handleEditRecord}
        onDelete={handleDeleteRecord}
        isSheetConnected={isSheetConnected}
      />

      <CreateFormModal
        isOpen={isModalOpen}
        initialType={modalInitialType}
        editItem={editingRecord}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        onSubmit={handleCreateOrUpdate}
        isSaving={isSaving}
        isSheetConnected={isSheetConnected}
      />

      {/* Android Native-Style Exit Confirmation Toast */}
      {exitToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
          <div className="bg-[#0f172a]/95 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-lg border border-white/15 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">arrow_back</span>
            <span>Press back again to exit</span>
          </div>
        </div>
      )}
    </div>
  );
}
