# Barron's US Financial Advisor Intelligence Dashboard (Part-2)

An interactive, business-ready analytics and exploration dashboard built on the complete Barron's Financial Advisor dataset (2,042 advisor records).

---

## 🚀 Live Demo / GitHub Deployment
This project is built purely with client-side web technologies (**HTML5, Tailwind CSS, Vanilla JavaScript, Chart.js, Lucide Icons**). It has **no backend dependency** and runs instantly via **GitHub Pages**, **Vercel**, or **Netlify**.

### How to Deploy via GitHub Pages:
1. Create a new GitHub repository (e.g. `barrons-advisor-dashboard`).
2. Push or upload all repository files (`index.html`, `app.js`, `advisors_data.js`, `README.md`).
3. In your GitHub repository:
   - Go to **Settings** > **Pages**
   - Under **Build and deployment > Branch**, select `main` (or `master`) and folder `/ (root)`.
   - Click **Save**.
4. Within 1 minute, your live URL will be active at: `https://<your-username>.github.io/<repo-name>/`

---

## 📊 Features & Deliverables Checklist

### 1. Step 1 - Data Preparation & Helper Fields
- Source: `Barrons_list.xlsx` (Part-1 submission dataset).
- Enriched attributes:
  - Extracted **State**, **City**, and **ZIP** from composite address strings.
  - Added contact flags: `has_website`, `has_email`.
  - Normalized fields: `Team Assets`, `Account Minimum`, `Typical Account Size`, `Typical Net Worth`, `Financial Planning`.

### 2. Step 2 - Comprehensive Multi-Filter Controls
- **Global Search**: Instant debounced search matching Advisor Name, Firm/Team, City, State, Address, Title, or Email.
- **Header Field Filters**:
  1. **State** (All 50+ US states/territories)
  2. **City** (All metro & regional cities)
  3. **Account Minimum** (No minimum, \$500k, \$1M, \$5M, \$10M, etc.)
  4. **Typical Account Size**
  5. **Financial Planning** (Yes / No)
  6. **Website Status** (Has Website / Missing Website)
  7. **Email Status** (Has Email / Missing Email)
  8. **Typical Net Worth**
  9. **Client Base**
  10. **Phone Available** (Yes / No)
  11. **LinkedIn Profile** (Yes / No)
  12. **Top Firm / Team Name**

### 3. Step 3 - Real-Time Dynamic KPIs
- **Total Advisor Firms**: Baseline Part-1 count (2,042 firms).
- **Filtered Advisor Count**: Dynamically calculated with % of total dataset.
- **Unique States**: Unique states present in active filter scope.
- **Unique Cities**: Unique cities represented.
- **Unique ZIP Codes**: Postal code coverage.
- **Firms with Website**: Real-time count and coverage percentage.
- **Firms with Emails**: Real-time count and outreach readiness percentage.

### 4. Interactive Data Visualizations
- **Top 10 States Bar Chart**: Real-time distribution of advisors across top US states.
- **Account Minimum Tiers Doughnut Chart**: High-net-worth tier distribution.
- **Digital Presence & Outreach Bar Chart**: Availability rates for Website, Direct Email, Phone, and LinkedIn.

### 5. Detailed Advisor Listing Table & Profiles
- **Sortable Columns**: Clickable table headers for instant ascending/descending order.
- **Pagination**: Configurable page size (15, 25, 50, 100 items per page) with page jump controls.
- **Dual View Modes**: Switch seamlessly between **Table View** and **Cards View**.
- **Advisor Detailed Modal**: Click "View Profile" or "Details" to open a full card with all metrics, firm experience, about summary, and direct links.
- **CSV Data Export**: Single-click export of currently filtered records into CSV.

