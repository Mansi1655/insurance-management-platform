# Insurance Management Platform

The **Insurance Management Platform** is a secure, responsive, full-stack web application designed to simplify and digitize insurance operations. It enables administrators, agents, and customers to manage profiles, policies, claims, premium payments, and documents from a centralized web interface.

---

## Technical Stack

- **Backend**: Node.js & Express.js API
- **Database & ORM**: Prisma ORM with SQLite (for zero-configuration local execution)
- **Frontend**: React.js (built with Vite)
- **Styling**: Tailwind CSS v3 (custom glassmorphism dark-mode theme)
- **Visualizations**: Chart.js & React-Chartjs-2
- **Document Management**: Multer (file uploads)
- **PDF Generation**: PDFKit (on-the-fly certificate generation)

---

## Features

1. **Role-Based Workspaces**:
   - **Administrator**: Access business analytics charts, review premium collections, and inspect client growth records.
   - **Insurance Agent**: Register new customer accounts, create insurance coverage terms, and verify and approve or reject claims.
   - **Customer**: Settle premiums using an interactive checkout form, submit claim requests with supporting files, download PDF certificates, and trace chronological account histories.
2. **Interactive Reports Dashboard**: Displays active/expired policies, claim stats, premium collection progress, and monthly metrics charts.
3. **Automated Premium Calculations**: Bilis premium payment invoices dynamically upon policy generation or renewal, and alerts users of overdue balances.
4. **Mock Secure Payment Gateway**: Integrated credit card checkout screen simulating charge authorization.

---

## Default Login Credentials

The application includes a **Quick Role Switch** panel on the Login page for one-click access. You can also log in manually with the following credentials:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@antigravity.com` | `Admin123!` |
| **Insurance Agent** | `agent@antigravity.com` | `Agent123!` |
| **Customer** | `customer@antigravity.com` | `Customer123!` |

---

## Setup & Running Locally

### 1. Install Dependencies
Run the installation script in the root directory to set up both the backend and frontend packages:
```bash
npm run install:all
```

### 2. Configure Database & Seed Data
Initialize the database using Prisma migrations and populate it with sample policies, billing statements, and claim records:
```bash
npm run db:migrate
npm run db:seed
```

### 3. Run Dev Server
Launch both the backend server and Vite dev client concurrently:
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend Client**: `http://localhost:5173`
