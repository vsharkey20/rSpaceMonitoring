// Billing rates
export const RATES = {
  student: {
    hourly: 79,
    "4hours": 225,
    "8hours": 405,
    "12hours": 612,
  },
  regular: {
    hourly: 85,
    "4hours": 250,
    "8hours": 450,
    "12hours": 680,
  },
};

export const HOUR_OPTIONS = [
  { label: "1 Hour", value: "hourly" },
  { label: "4 Hours", value: "4hours" },
  { label: "8 Hours", value: "8hours" },
  { label: "12 Hours", value: "12hours" },
];

export const PAYMENT_METHODS = ["Cash", "GCash", "Maya", "Bank Transfer"];

/**
 * Calculate bill based on client type and hours
 * @param {string} clientTypeKey - 'student' or 'regular'
 * @param {string} hoursKey - 'hourly'|'4hours'|'8hours'|'12hours'
 */
export function calculateBill(clientTypeKey, hoursKey) {
  const isStudent = clientTypeKey?.toLowerCase() === "student";
  const rates = isStudent ? RATES.student : RATES.regular;
  return rates[hoursKey] ?? 0;
}

/**
 * Compute hours from timeIn and timeOut strings (HH:MM)
 * Rounds up: if past 20 min over an hour boundary, counts as next hour
 */
export function computeHours(timeIn, timeOut) {
  if (!timeIn || !timeOut) return null;
  const [inH, inM] = timeIn.split(":").map(Number);
  const [outH, outM] = timeOut.split(":").map(Number);
  const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
  if (totalMinutes <= 0) return null;
  const wholeHours = Math.floor(totalMinutes / 60);
  const remainingMin = totalMinutes % 60;
  return remainingMin > 20 ? wholeHours + 1 : wholeHours;
}

/**
 * Map raw hours number to the nearest billing tier
 */
export function mapHoursToBillingTier(hours) {
  if (!hours) return "hourly";
  if (hours >= 12) return "12hours";
  if (hours >= 8) return "8hours";
  if (hours >= 4) return "4hours";
  return "hourly";
}

export function formatCurrency(amount) {
  return `₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric"
  });
}

export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}
