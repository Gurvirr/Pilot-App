@echo off
echo Starting System Monitor Backend...
echo.
echo This will install dependencies and start the server.
echo Make sure you have Node.js installed.
echo.
pause

cd backend

echo Installing dependencies...
npm install

echo.
echo Starting system monitor server...
echo Server will be available at ws://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

pause 