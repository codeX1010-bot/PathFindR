@echo off
echo =========================================
echo    Starting PathFindR V2 Backend...
echo =========================================

:: Activate the virtual environment
call venv\Scripts\activate.bat

:: Change directory to api and run the app
cd api
python index.py

pause
