# Appwrite Database Setup Guide for rSpace

## Project Info
- **Project ID:** `69fa289a0036afd8c0cd`
- **Endpoint:** `https://sgp.cloud.appwrite.io/v1`
- **Database Name:** `tblRSpace`

---

## Collections to Create

### 1. `tblMonitoring` — Main tracking table
| Attribute    | Type    | Required | Notes                              |
|-------------|---------|----------|------------------------------------|
| Date        | String  | Yes      | Format: YYYY-MM-DD                 |
| ClientName  | String  | Yes      | Full text search enabled           |
| TimeIn      | String  | No       | Format: HH:MM                      |
| TimeOut     | String  | No       | Format: HH:MM                      |
| Service     | String  | No       |                                    |
| Hours       | String  | No       | hourly / 4hours / 8hours / 12hours |
| ClientType  | String  | No       |                                    |
| BillingType | String  | No       |                                    |
| Bill        | Float   | No       |                                    |
| PaymentMethod | String | No      | Cash / GCash / Maya / Bank Transfer|
| FirstTime   | String  | No       | Yes / No                           |
| AmountPaid  | Float   | No       |                                    |
| Notes       | String  | No       | Size: 2000                         |

**Indexes to add:**
- `Date` — Key index
- `ClientName` — Fulltext index (for autocomplete search)

### 2. `tblServices` — Service types maintenance
| Attribute | Type   | Required |
|-----------|--------|----------|
| Name      | String | Yes      |

**Suggested initial values:**
- Day Pass
- Hot Desk
- Private Room
- Meeting Room
- Virtual Office
- Printing

### 3. `tblClientTypes` — Client type maintenance
| Attribute | Type   | Required |
|-----------|--------|----------|
| Name      | String | Yes      |

**Suggested initial values:**
- Student
- Regular
- Corporate
- Freelancer

### 4. `tblBillingTypes` — Billing type maintenance
| Attribute | Type   | Required |
|-----------|--------|----------|
| Name      | String | Yes      |

**Suggested initial values:**
- Hourly
- Daily
- Monthly
- Package

---

## Permissions (for each collection)
Set to allow **any** read/write for development, or configure role-based access for production:
- Read: `any`
- Create: `any`
- Update: `any`
- Delete: `any`

---

## Running the App

```bash
cd rspace-tracker
npm install
npm run dev
```

App will be available at: http://localhost:5173
