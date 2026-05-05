import { Client, Account, Databases, Query, ID } from "appwrite";

const client = new Client()
  .setEndpoint("https://sgp.cloud.appwrite.io/v1")
  .setProject("69fa289a0036afd8c0cd");

const account = new Account(client);
const databases = new Databases(client);

// Database & Collection IDs
export const DB_ID = "69fa29a8000c919ad708";
export const COLLECTIONS = {
  MONITORING: "tblMonitoring",
  SERVICES: "tblServices",
  CLIENT_TYPES: "tblClientTypes",
  BILLING_TYPES: "tblBillingTypes",
};

// Ping to verify setup
export async function pingAppwrite() {
  try {
    await client.ping();
    console.log("✅ Appwrite connected successfully");
    return true;
  } catch (e) {
    console.warn("⚠️ Appwrite ping failed:", e.message);
    return false;
  }
}

export { client, account, databases, Query, ID };
