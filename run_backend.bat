@echo off
echo =========================================
echo    Starting PathFindR V2 Backend...
echo =========================================

:: Activate the virtual environment
call venv\Scripts\activate.bat

:: Change directory to backend and run the app
cd backend
python app.py

pause
