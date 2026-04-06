@echo off
cd /d "%~dp0"
set DATABASE_URL=file:./app.db
npm run dev
