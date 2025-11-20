@echo off
REM Переходим в папку проекта
cd /d "%~dp0"

REM Сразу открываем браузер
start "" "http://localhost:5173"

REM Запускаем dev-сервер
npm run dev

REM После завершения npm run dev закрываем окно
exit
