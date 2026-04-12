# 🧊 Smart Cold Chain Tracking System

A full-stack IoT-powered cold chain monitoring system that tracks temperature-sensitive shipments in real time, generates compliance reports, and sends email alerts on temperature excursions.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Spring Boot 3.4, Java 17, MySQL,Hibernate |
| **Frontend** | React 18, Vite,CSS |
| **Email** | Spring Mail (Gmail SMTP) |
| **API Docs** | Swagger |

## 📁 Project Structure

```
Coldchain-tracking-system/
├── coldchain-backend/       # Spring Boot REST API
│   ├── src/main/java/       # Controllers, Services, Entities, Repositories
│   └── src/main/resources/  # application.properties
├── coldchain-frontend/      # React + Vite SPA
│   ├── src/pages/           # Dashboard, Tracking, Alerts, Reports, etc.
│   └── src/components/      # Navbar
└── README.md
```

## ✨ Features

- **Real-Time IoT Simulation** — Auto-generates temperature & GPS readings every 30 seconds for active shipments
- **Live Tracking Dashboard** — Polls the backend every 30s to display current temp, location, and compliance status
- **Excursion Alerts** — Detects out-of-range temperatures, creates alerts with severity levels (WARNING / CRITICAL / SEVERE)
- **Email Notifications** — Sends SMTP alerts to logistics manager and driver on temperature excursions
- **Compliance Reports** — Generates pass/fail reports based on % of compliant readings and excursion count
- **Fleet Management** — Add and manage cold chain assets (trucks, coolers) with availability tracking
- **Driver Assignment** — Prevents double-assignment of drivers already on active shipments
- **Shipment Lifecycle** — Full flow: Created → In Transit → Arrived → Delivered, with cascading cleanup on delete
- **Role-Based Access** — Admin, Logistics Manager, and Driver roles

## Getting Started

### Prerequisites

- Java 17+
- Node.js 18+
- MySQL 8+
- Maven

### Backend Setup

```bash
cd coldchain-backend

# Update DB credentials in src/main/resources/application.properties
# spring.datasource.username=root
# spring.datasource.password=YOUR_PASSWORD

mvn spring-boot:run
```

Backend runs on **http://localhost:8082**

### Frontend Setup

```bash
cd coldchain-frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shipments` | Create a new shipment |
| GET | `/api/shipments` | List all shipments |
| GET | `/api/shipments/{id}` | Get shipment details |
| PUT | `/api/shipments/{id}/assign` | Assign asset & driver |
| PUT | `/api/shipments/{id}/deliver` | Mark as delivered |
| DELETE | `/api/shipments/{id}` | Delete shipment (cascading) |
| GET | `/api/temperature-readings/shipment/{id}` | Get temperature log |
| GET | `/api/alerts/open` | Get open excursion alerts |
| PUT | `/api/alerts/{id}/acknowledge` | Acknowledge an alert |
| POST | `/api/compliance/report` | Generate compliance report |
| GET | `/api/compliance/reports` | List all reports |
| GET | `/api/assets/available` | List available assets |
| POST | `/api/assets` | Add a new asset |
| GET | `/api/users/role/{role}/available` | Get available drivers |

**Swagger UI:** http://localhost:8082/swagger-ui/index.html

## 🗄️ Database

The app uses MySQL with `spring.jpa.hibernate.ddl-auto=update`, so tables are auto-created on first run. Database name: `coldchain_db`


Built for Hackathon 2026
