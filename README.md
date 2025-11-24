# MSRIT Facilities

A simple facilities management application for MSRIT — backend API (FastAPI) with a React frontend.

## Features
- REST API built with FastAPI (Python)
- React frontend (Create React App)
- Easy local setup for development

## Tech stack
- Python 3.8+
- FastAPI
- Uvicorn
- React (Create React App)
- Node.js / npm

## Prerequisites
- git
- Python 3.8 or later
- Node.js and npm
- (Optional) virtualenv or python -m venv for an isolated Python environment

## Clone the repository

```bash
git clone https://github.com/swaroopms658/MSRIT-FACILITIES.git
cd MSRIT-FACILITIES
```

## Backend (API)

1. Create and activate a Python virtual environment (recommended):

```bash
python3 -m venv .venv
# macOS / Linux
source .venv/bin/activate
# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the development server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: http://localhost:8000

## Frontend (React)

1. Change to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

2. Start the frontend dev server:

```bash
npm start
```

The React app will open at http://localhost:3000 (or the next available port).

Notes:
- The frontend expects the backend API to be running (default: http://localhost:8000). If your API runs on a different host/port, update the frontend configuration or environment variables accordingly.

## Environment and configuration
- If your project uses environment variables, create a .env file in the appropriate folder (backend or frontend) and add the required variables. Refer to the source code for expected variable names.

## Development workflow
- Run the backend and frontend concurrently during development.
- Use the FastAPI interactive docs at http://localhost:8000/docs to explore and test API endpoints.

## Contributing
Contributions, issues and feature requests are welcome. Please open an issue to discuss what you would like to change.

