# CareSignal

CareSignal is a disease monitoring and hospital reporting system designed to track and forecast disease outbreaks. It features a React-based frontend for visualization and reporting, and a Python/FastAPI backend for data management and prediction.

## Features
- **Dashboard**: Real-time visualization of disease trends and hospital data.
- **Reporting**: Interface for hospitals to submit daily case reports.
- **Forecasting**: Predictive modeling for disease outbreaks.
- **Interactive Map**: Geospatial view of disease spread.

## Prerequisites
- **Python 3.8+**
- **Node.js 16+**
- **Git**

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/care-signal-project.git
cd care-signal-project
```

### 2. Backend Setup (Python)
Navigate to the server directory and set up the virtual environment.

```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Initialize the database with seed data:
```bash
python seed.py
```

### 3. Frontend Setup (React)
Open a new terminal, navigate to the client directory, and install dependencies.

```bash
cd client
npm install
```

## Running the Application

### Start the Backend Server
In your **server** terminal (with venv activated):
```bash
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.

### Start the Frontend Client
In your **client** terminal:
```bash
npm run dev
```
The application will run at `http://localhost:5173`.

## Project Structure
- `client/`: React frontend application.
- `server/`: FastAPI backend and SQLite database.
- `seed.py`: Script to populate the database with initial test data.

## Note on Git Authentication
If you encounter authentication errors when pushing to GitHub (`fatal: Authentication failed`), ensure you are using a **Personal Access Token (PAT)** instead of your password, or set up **SSH keys**.
