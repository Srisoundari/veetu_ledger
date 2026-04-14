@echo off
setlocal

set CMD=%1

if "%CMD%"=="dev"          goto dev
if "%CMD%"=="prod"         goto prod
if "%CMD%"=="build"        goto build
if "%CMD%"=="down"         goto down
if "%CMD%"=="logs"         goto logs
if "%CMD%"=="logs-backend" goto logs_backend
if "%CMD%"=="logs-frontend"goto logs_frontend
if "%CMD%"=="install"      goto install
if "%CMD%"=="run-backend"  goto run_backend
if "%CMD%"=="run-frontend" goto run_frontend

echo Usage: veedu.bat [command]
echo.
echo   dev            Start dev mode (hot reload)
echo   prod           Start production mode
echo   build          Build Docker images
echo   down           Stop all containers
echo   logs           Stream all logs
echo   logs-backend   Stream backend logs only
echo   logs-frontend  Stream frontend logs only
echo   install        Install backend deps with uv
echo   run-backend    Run backend locally with uv
echo   run-frontend   Run frontend locally with npm
goto end

:dev
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
goto end

:prod
docker compose up --build -d
goto end

:build
docker compose build
goto end

:down
docker compose down
goto end

:logs
docker compose logs -f
goto end

:logs_backend
docker compose logs -f backend
goto end

:logs_frontend
docker compose logs -f frontend
goto end

:install
pushd %~dp0backend
uv sync
popd
goto end

:run_backend
pushd %~dp0backend
uv run uvicorn main:app --reload --port 8000
popd
goto end

:run_frontend
pushd %~dp0frontend
npm install
npm run dev
popd
goto end

:end
endlocal
