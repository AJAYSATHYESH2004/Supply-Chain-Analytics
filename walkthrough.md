# Smart Supply Chain AI - Walkthrough

Welcome to your new AI-powered Supply Chain Management system. This document explains how to set up and run the platform.

## 1. Project Structure
```text
├── backend/
│   ├── app/                # FastAPI application
│   ├── seed_data.py        # Database population script
│   └── requirements.txt    # Python dependencies
└── frontend/
    ├── src/                # React application
    ├── public/             # Static assets
    └── tailwind.config.js  # Theme configuration
```

## 2. Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL Server (Running on localhost:3306)

## 3. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Configure your database:
   - Create a database in MySQL named `supply_chain_db`.
   - Update `.env` (or `app/core/config.py`) with your MySQL credentials.
4. Seed the database with sample data:
   ```bash
   python seed_data.py
   ```
5. Start the API server:
   ```bash
   uvicorn app.main:app --reload
   ```

## 4. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 5. Key Features to Explore
- **Dashboard**: View high-level KPIs and interactive sales trends.
- **Product Management**: Real-time stock level monitoring with health indicators.
- **AI Forecasting**: Explore how the system predicts future demand using machine learning.
- **Alert Center**: See how HODs receive automated notifications for critical issues.

---

> [!TIP]
> The AI forecasting models perform better as more sales data is recorded. Use the "Retrain" button in the Forecasting module after adding new sales records.

> [!IMPORTANT]
> Change the `SECRET_KEY` in `backend/app/core/config.py` before deploying to production.
