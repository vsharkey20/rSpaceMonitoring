import { databases, DB_ID, COLLECTIONS, Query, ID } from "./appwrite.js";

// ─── MONITORING ──────────────────────────────────────────────────────────────

export async function getMonitoringRecords(filters = {}) {
  const queries = [Query.orderDesc("$createdAt"), Query.limit(200)];
  if (filters.date) queries.push(Query.equal("Date", filters.date));
  return databases.listDocuments(DB_ID, COLLECTIONS.MONITORING, queries);
}

export async function createMonitoringRecord(data) {
  return databases.createDocument(DB_ID, COLLECTIONS.MONITORING, ID.unique(), data);
}

export async function updateMonitoringRecord(docId, data) {
  return databases.updateDocument(DB_ID, COLLECTIONS.MONITORING, docId, data);
}

export async function deleteMonitoringRecord(docId) {
  return databases.deleteDocument(DB_ID, COLLECTIONS.MONITORING, docId);
}

export async function searchClientNames(name) {
  if (!name || name.length < 1) return [];
  try {
    const res = await databases.listDocuments(DB_ID, COLLECTIONS.MONITORING, [
      Query.startsWith("ClientName", name),
      Query.limit(10),
    ]);
    const seen = new Set();
    return res.documents.filter(d => {
      if (seen.has(d.ClientName)) return false;
      seen.add(d.ClientName);
      return true;
    });
  } catch {
    return [];
  }
}

// ─── SERVICES ────────────────────────────────────────────────────────────────

export async function getServices() {
  return databases.listDocuments(DB_ID, COLLECTIONS.SERVICES);
}

export async function createService(name) {
  return databases.createDocument(DB_ID, COLLECTIONS.SERVICES, ID.unique(), { Name: name });
}

export async function updateService(docId, name) {
  return databases.updateDocument(DB_ID, COLLECTIONS.SERVICES, docId, { Name: name });
}

export async function deleteService(docId) {
  return databases.deleteDocument(DB_ID, COLLECTIONS.SERVICES, docId);
}

// ─── CLIENT TYPES ────────────────────────────────────────────────────────────

export async function getClientTypes() {
  return databases.listDocuments(DB_ID, COLLECTIONS.CLIENT_TYPES);
}

export async function createClientType(name) {
  return databases.createDocument(DB_ID, COLLECTIONS.CLIENT_TYPES, ID.unique(), { Name: name });
}

export async function updateClientType(docId, name) {
  return databases.updateDocument(DB_ID, COLLECTIONS.CLIENT_TYPES, docId, { Name: name });
}

export async function deleteClientType(docId) {
  return databases.deleteDocument(DB_ID, COLLECTIONS.CLIENT_TYPES, docId);
}

// ─── BILLING TYPES ───────────────────────────────────────────────────────────

export async function getBillingTypes() {
  return databases.listDocuments(DB_ID, COLLECTIONS.BILLING_TYPES);
}

export async function createBillingType(name) {
  return databases.createDocument(DB_ID, COLLECTIONS.BILLING_TYPES, ID.unique(), { Name: name });
}

export async function updateBillingType(docId, name) {
  return databases.updateDocument(DB_ID, COLLECTIONS.BILLING_TYPES, docId, { Name: name });
}

export async function deleteBillingType(docId) {
  return databases.deleteDocument(DB_ID, COLLECTIONS.BILLING_TYPES, docId);
}
