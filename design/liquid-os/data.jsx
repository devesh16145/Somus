// Mixed-international sample data for Somus prototypes.
// Four currencies, eight countries — mirrors the "40+ banks across 15 countries" pitch.

const SAMPLE_TXNS = [
  { id: 't01', merchant: 'Nando\'s Peri Peri',  category: 'FOOD_DINING',    type: 'DEBIT',  amount: 24.80,   ccy: 'GBP', sender: 'BARCLAYS',  when: 'Today, 1:12 PM',     city: 'London'     },
  { id: 't02', merchant: 'Salary — Studio Co.', category: 'TRANSFER',       type: 'CREDIT', amount: 4850.00, ccy: 'EUR', sender: 'REVOLUT',   when: 'Today, 9:02 AM',     city: 'Berlin'     },
  { id: 't03', merchant: 'Uber',                category: 'TRANSPORT',      type: 'DEBIT',  amount: 412,     ccy: 'INR', sender: 'HDFC BK',   when: 'Today, 8:47 AM',     city: 'Mumbai'     },
  { id: 't04', merchant: 'Whole Foods',         category: 'GROCERIES',      type: 'DEBIT',  amount: 87.42,   ccy: 'USD', sender: 'CHASE',     when: 'Yesterday',          city: 'New York'   },
  { id: 't05', merchant: 'Spotify',             category: 'SUBSCRIPTION',   type: 'DEBIT',  amount: 10.99,   ccy: 'USD', sender: 'AMEX',      when: 'Yesterday',          city: '—'          },
  { id: 't06', merchant: 'Shell',               category: 'FUEL',           type: 'DEBIT',  amount: 58.30,   ccy: 'EUR', sender: 'N26',       when: '2 days ago',         city: 'Munich'     },
  { id: 't07', merchant: 'Blue Bottle Coffee',  category: 'FOOD_DINING',    type: 'DEBIT',  amount: 7.25,    ccy: 'USD', sender: 'CHASE',     when: '2 days ago',         city: 'SF'         },
  { id: 't08', merchant: 'Amazon.in',           category: 'SHOPPING',       type: 'DEBIT',  amount: 2349,    ccy: 'INR', sender: 'ICICI',     when: '3 days ago',         city: 'Bengaluru'  },
  { id: 't09', merchant: 'Refund — Zara',       category: 'SHOPPING',       type: 'CREDIT', amount: 79.00,   ccy: 'EUR', sender: 'N26',       when: '3 days ago',         city: '—'          },
  { id: 't10', merchant: 'TfL Underground',     category: 'TRANSPORT',      type: 'DEBIT',  amount: 3.40,    ccy: 'GBP', sender: 'MONZO',     when: '4 days ago',         city: 'London'     },
  { id: 't11', merchant: 'Swiggy',              category: 'FOOD_DINING',    type: 'DEBIT',  amount: 648,     ccy: 'INR', sender: 'HDFC BK',   when: '5 days ago',         city: 'Mumbai'     },
  { id: 't12', merchant: 'E.ON Energy',         category: 'UTILITIES',      type: 'DEBIT',  amount: 94.50,   ccy: 'EUR', sender: 'DKB',       when: '6 days ago',         city: 'Berlin'     },
  { id: 't13', merchant: 'ATM Withdrawal',      category: 'ATM_CASH',       type: 'DEBIT',  amount: 200.00,  ccy: 'USD', sender: 'CHASE',     when: '1 week ago',         city: 'Brooklyn'   },
  { id: 't14', merchant: 'Kindle — Murakami',   category: 'EDUCATION',      type: 'DEBIT',  amount: 14.99,   ccy: 'GBP', sender: 'BARCLAYS',  when: '1 week ago',         city: '—'          },
  { id: 't15', merchant: 'Rent — Hauptstr. 42', category: 'RENT',           type: 'DEBIT',  amount: 1200.00, ccy: 'EUR', sender: 'DKB',       when: '2 weeks ago',        city: 'Berlin'     },
];

// Rolled-up stats (same across all three directions so viewer can compare).
const SOMUS_METRICS = {
  monthSpend: 3284,        // USD-equivalent rollup
  monthIncome: 4850,
  monthCcy: 'USD',
  budget: 4000,
  topCats: [
    { key: 'GROCERIES',    label: 'Groceries',    pct: 28, amount: 920,  icon: 'basket' },
    { key: 'FOOD_DINING',  label: 'Food & Dining',pct: 22, amount: 722,  icon: 'fork' },
    { key: 'TRANSPORT',    label: 'Transport',    pct: 14, amount: 460,  icon: 'bus' },
    { key: 'SHOPPING',     label: 'Shopping',     pct: 12, amount: 394,  icon: 'bag' },
    { key: 'RENT',         label: 'Rent',         pct: 10, amount: 328,  icon: 'home' },
    { key: 'UTILITIES',    label: 'Utilities',    pct:  6, amount: 197,  icon: 'bolt' },
    { key: 'SUBSCRIPTION', label: 'Subscriptions',pct:  4, amount: 131,  icon: 'disc' },
    { key: 'OTHER',        label: 'Other',        pct:  4, amount: 132,  icon: 'dots' },
  ],
  weekTrend: [42, 78, 61, 95, 48, 112, 82],       // last 7 days
  monthTrend: [2100, 2850, 3100, 3284],           // last 4 weeks
  pending: 7,                                       // unprocessed SMS
  inference: '~60–90s / SMS on-device',
};

// Lightweight currency format — small & ccy-aware, avoids $0 edge-case noise.
function fmtCcy(n, ccy) {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: ccy, maximumFractionDigits: n < 10 ? 2 : 0 }).format(n);
  } catch { return `${ccy} ${n}`; }
}

Object.assign(window, { SAMPLE_TXNS, SOMUS_METRICS, fmtCcy });
