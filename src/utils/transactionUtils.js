/**
 * Utility functions to reliably classify and parse transactions
 * across all components (Home, Income, Expense, Records, Reports).
 */

export const INCOME_KEYWORD_CATEGORIES = [
  'salary', 'income', 'freelance', 'business', 'investment', 'gift', 
  'dividend', 'deposit', 'bonus', 'rental', 'interest', 'consulting', 
  'commission', 'side hustle', 'cashback', 'refund', 'inflow', 'profit', 
  'stipend', 'royalty', 'allowance'
];

/**
 * Normalizes all object keys by trimming whitespace (e.g. "category " -> "category", "amount " -> "amount").
 * Also intelligently extracts category from title if missing or "General".
 */
export function cleanTransactionRow(row) {
  if (!row) return {};
  const cleaned = {};
  Object.keys(row).forEach((key) => {
    const trimmedKey = key.trim();
    cleaned[trimmedKey] = row[key];
  });

  // Check category
  let category = cleaned.category || cleaned.sheetName;
  if (!category || String(category).trim().toLowerCase() === 'general' || String(category).trim() === '') {
    // Attempt inferring category from title
    const title = String(cleaned.title || '').trim();
    const knownCategories = [
      'Food & Dining', 'Food', 'Shopping', 'Bills & Utilities', 'Bills',
      'Transport', 'Health & Medical', 'Health', 'Education', 'Fun & Leisure',
      'Leisure', 'Business', 'Salary', 'Freelance', 'Investment', 'Gift'
    ];
    for (const cat of knownCategories) {
      if (title.toLowerCase().startsWith(cat.toLowerCase())) {
        category = cat;
        break;
      }
    }
  }

  const isInc = isIncomeTransaction({ ...cleaned, category });
  const finalCategory = category || (isInc ? 'Salary' : 'Food & Dining');

  // Intelligent payment method extraction
  let rawPayment =
    cleaned.paymentMethod ||
    cleaned.payment_method ||
    cleaned['payment method'] ||
    cleaned['Payment Method'] ||
    cleaned.paymentMode ||
    cleaned['payment_mode'] ||
    cleaned.mode ||
    cleaned['mode '] ||
    '';

  if (!rawPayment) {
    const text = `${cleaned.description || ''} ${cleaned.note || ''}`;
    const match = text.match(/Paid via\s+([^•\n\r]+)/i);
    if (match) {
      rawPayment = match[1].trim();
    } else {
      const lower = text.toLowerCase();
      if (lower.includes('cash')) rawPayment = 'Cash';
      else if (lower.includes('upi')) rawPayment = 'UPI';
      else if (lower.includes('debit')) rawPayment = 'Debit Card';
      else if (lower.includes('credit')) rawPayment = 'Credit Card';
      else if (lower.includes('net banking') || lower.includes('netbanking')) rawPayment = 'Net Banking';
    }
  }

  const finalPaymentMethod = normalizePaymentMethod(rawPayment, isInc);

  return {
    ...cleaned,
    category: finalCategory,
    sheetName: finalCategory,
    type: isInc ? 'income' : 'expense',
    status: cleaned.status || (isInc ? 'draft' : 'active'),
    paymentMethod: finalPaymentMethod,
    payment_method: finalPaymentMethod,
  };
}

/**
 * Robustly checks whether a transaction represents an Income.
 * Checks explicit type, status, category, title, description, and sign.
 */
export function isIncomeTransaction(item) {
  if (!item) return false;

  // 1. Explicit type check
  const rawType = String(item.type || item['type '] || '').toLowerCase().trim();
  if (rawType === 'income') return true;
  if (rawType === 'expense') return false;

  // 2. Status check (legacy draft was income in earlier form version)
  const rawStatus = String(item.status || item['status '] || '').toLowerCase().trim();
  if (rawStatus === 'draft') return true;

  // 3. Category / Sheet Name check
  const cat = String(item.category || item['category '] || item.sheetName || '').toLowerCase().trim();
  if (INCOME_KEYWORD_CATEGORIES.some((keyword) => cat.includes(keyword))) {
    return true;
  }

  // 4. Title keyword check
  const title = String(item.title || '').toLowerCase().trim();
  if (
    title.includes('salary') ||
    title.includes('income') ||
    title.includes('deposit') ||
    title.includes('bonus') ||
    title.includes('freelance') ||
    title.includes('dividend') ||
    title.includes('interest') ||
    title.includes('stipend') ||
    title.includes('cashback') ||
    title.startsWith('+')
  ) {
    return true;
  }

  // 5. Description / Note check
  const desc = String(item.description || item.note || '').toLowerCase().trim();
  if (
    desc.includes('income') || 
    desc.includes('salary deposit') || 
    desc.includes('credit')
  ) {
    return true;
  }

  return false;
}

/**
 * Robustly checks whether a transaction represents an Expense.
 */
export function isExpenseTransaction(item) {
  return !isIncomeTransaction(item);
}

/**
 * Extracts numeric amount from various string / object formats.
 */
export function parseTransactionAmount(item) {
  if (!item) return 0;
  const amtVal = item.amount !== undefined ? item.amount : item['amount '];
  if (typeof amtVal === 'number' && !isNaN(amtVal)) {
    return Math.abs(amtVal);
  }
  if (amtVal && !isNaN(parseFloat(amtVal))) {
    return Math.abs(parseFloat(amtVal));
  }
  // Try regex match from title e.g. "Lunch (₹350)"
  if (item.title) {
    const match = item.title.match(/\(₹([\d,]+(?:\.\d+)?)\)/);
    if (match) {
      return Math.abs(parseFloat(match[1].replace(/,/g, '')) || 0);
    }
  }
  return 0;
}

/**
 * Safely parses any date string (ISO, "06 Sep 2026", "06/09/2026", timestamp)
 * into a valid JavaScript Date object, or returns null if unparseable.
 */
export function parseTransactionDate(item) {
  if (!item) return null;

  const raw = item.rawTimestamp || item.timestamp || item.createdAt || item.date;
  const numId = Number(item.id);
  const isEpochId = !isNaN(numId) && numId > 1600000000000 && numId < 3000000000000;

  if (raw) {
    if (raw instanceof Date && !isNaN(raw.getTime())) return raw;

    if (typeof raw === 'string') {
      const trimmed = raw.trim();

      // 1. Check YYYY-MM-DD (ISO strings like 2026-09-06T08:04:54.981Z)
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) return d;
      }

      // 2. Check DD/MM/YYYY or DD-MM-YYYY (Day first!)
      const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (dmy) {
        const day = parseInt(dmy[1], 10);
        const month = parseInt(dmy[2], 10) - 1; // 0-indexed
        const year = parseInt(dmy[3], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      }

      // 3. Check text with "Sept" -> "Sep"
      const normalizedStr = trimmed.replace(/\bSept\b/gi, 'Sep');
      const dNorm = new Date(normalizedStr);
      if (!isNaN(dNorm.getTime())) return dNorm;
    }
  }

  // 4. Fallback to epoch millisecond ID (Date.now())
  if (isEpochId) {
    return new Date(numId);
  }

  return null;
}

/**
 * Normalizes payment methods into clean, user-friendly labels:
 * Cash, UPI, Debit Card, Credit Card, Net Banking.
 */
export function normalizePaymentMethod(rawMethod, isIncome = false) {
  if (!rawMethod) return isIncome ? 'Net Banking' : 'Cash';
  const str = String(rawMethod).trim();
  const lower = str.toLowerCase();

  if (lower === 'cash' || lower.includes('cash')) return 'Cash';
  if (lower === 'upi' || lower.includes('upi')) return 'UPI';
  if (lower.includes('debit')) return 'Debit Card';
  if (lower.includes('credit')) return 'Credit Card';
  if (
    lower.includes('net') ||
    lower.includes('banking') ||
    lower.includes('neft') ||
    lower.includes('rtgs') ||
    lower.includes('imps') ||
    lower.includes('transfer')
  ) {
    return 'Net Banking';
  }
  if (lower.includes('deposit')) return 'Direct Deposit';
  if (lower.includes('cheque') || lower.includes('check')) return 'Cheque';

  return str;
}

/**
 * Formats a transaction date/time cleanly:
 * "Today, 1:34 PM", "Yesterday, 9:20 AM", or "06 Sep, 1:34 PM".
 */
export function formatTransactionDateTime(item) {
  if (!item) return 'Recorded';
  const d = parseTransactionDate(item);
  if (!d) return item.timestamp || item.date || 'Recorded';

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;

  const dateStr = d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
  });
  return `${dateStr}, ${timeStr}`;
}

