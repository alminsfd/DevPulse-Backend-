# DevPulse 🚼

> Internal Tech Issue & Feature Tracker

DevPulse is a collaborative platform designed for software development teams to report bugs, suggest features, and coordinate resolutions efficiently. It features robust role-based access controls (RBAC) to distinguish permissions between contributors and maintainers.

### 🌐 Live Links
- **Live API Deployment:** [https://dev-pulse-backend-six.vercel.app/](https://dev-pulse-backend-six.vercel.app/) 
- **GitHub Repository:** [https://github.com/alminsfd/DevPulse-Backend-](https://github.com/alminsfd/DevPulse-Backend-) 

---

## ✨ Features

- **Role-Based Access Control (RBAC):** Distinct permissions for `contributor` and `maintainer` roles.
- **Secure Authentication:** JWT-based authentication system with password hashing using `bcrypt`.
- **Issue Tracking Workflow:** Create, view, update, and delete bug reports or feature requests.
- **Advanced Filtering & Sorting:** Fetch issues with dynamic filtering by `type` and `status`, along with date-based sorting (`newest`/`oldest`).
- **No-JOIN Database Architecture:** High-performance data retrieval using independent, optimized raw SQL queries instead of heavy relational JOINs.
- **Strict Type Safety:** Entire backend built from scratch using TypeScript for robust compile-time error checking.

---

## 🛠️ Technology Stack

| Technology | Purpose |
| --- | --- |
| **Node.js** | Scalable LTS JavaScript runtime (v24.x+) |
| **TypeScript** | Strict type safety and modern JavaScript features |
| **Express.js** | Minimalist web framework with modular router architecture |
| **PostgreSQL** | Relational database management system |
| **Raw SQL (`pg`)** | Direct database communication using native `pool.query()` |
| **JSON Web Tokens (JWT)**| Secure, stateless authentication flow |
| **Bcrypt** | Secure password encryption (10 salt rounds) |

---

## 🗄️ Database Schema Summary

The database uses a clean, two-table relational structure optimized for performance without using hard foreign key constraints or JOINs.

### 1. `users` Table
| Field | Type | Modifiers / Rules |
| --- | --- | --- |
| `id` | SERIAL | PRIMARY KEY, Auto-incrementing |
| `name` | VARCHAR(255) | NOT NULL |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE |
| `password` | VARCHAR(255) | NOT NULL (Encrypted, never returned in API) |
| `role` | VARCHAR(50) | DEFAULT 'contributor' (`contributor` \| `maintainer`) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 2. `issues` Table
| Field | Type | Modifiers / Rules |
| --- | --- | --- |
| `id` | SERIAL | PRIMARY KEY, Auto-incrementing |
| `title` | VARCHAR(150) | NOT NULL, Max 150 chars |
| `description`| TEXT | NOT NULL, Min 20 chars |
| `type` | VARCHAR(50) | NOT NULL (`bug` \| `feature_request`) |
| `status` | VARCHAR(50) | DEFAULT 'open' (`open` \| `in_progress` \| `resolved`) |
| `reporter_id` | INT | Validated via application logic (No FK Constraint) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

## 🌐 API Endpoint List

### 🔹 Authentication Module (`/api/auth`)
- **`POST /api/auth/signup`** - Register a new account (`contributor` or `maintainer`). *Access: Public*
- **`POST /api/auth/login`** - Authenticate user and receive a JWT. *Access: Public*

### 🔹 Issues Module (`/api/issues`)
- **`POST /api/issues`** - Create a new issue report. *Access: Authenticated (`contributor` / `maintainer`)*
- **`GET /api/issues`** - Retrieve all issues with optional filtering & sorting. *Access: Public*
  - *Query Params:* `sort` (`newest`\|`oldest`), `type` (`bug`\|`feature_request`), `status` (`open`\|`in_progress`\|`resolved`)
- **`GET /api/issues/:id`** - Retrieve a single issue by ID. *Access: Public*
- **`PATCH /api/issues/:id`** - Update title, description, or type. *Access: Maintainer (Any) OR Contributor (Own issue, only if status is `open`)*
- **`DELETE /api/issues/:id`** - Permanently delete an issue. *Access: Maintainer Only*

---

## 🚀 Setup & Installation Instructions

Follow these steps to set up the project locally on your machine:

### 1. Clone the Repository
```bash
git clone [https://github.com/alminsfd/DevPulse-Backend-](https://github.com/alminsfd/DevPulse-Backend-)
cd devpulse