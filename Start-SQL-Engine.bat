@echo off
echo Starting Text-to-SQL Environment...

:: 1. Start n8n and ChromaDB via Docker
echo Booting Docker containers...
docker start n8n chromadb

:: Wait 5 seconds to let the containers fully initialize
timeout /t 5 /nobreak > nul

:: 2. Navigate to your React project and start Vite
:: IMPORTANT: Replace this path with the actual path to your VS Code project folder!
cd /d "C:\Users\Jyothi N\text-to-sql-client"

echo Booting React Dashboard...
start /min cmd /c "npm run dev"

:: Wait 3 seconds for Vite to compile
timeout /t 3 /nobreak > nul

:: 3. Open your default browser to the React app
start http://localhost:5173

exit