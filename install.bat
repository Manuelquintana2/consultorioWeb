@echo off
echo ========================================
echo Instalacion del Sistema de Consultorio
echo ========================================
echo.

echo Instalando dependencias del Backend...
cd backendConsul
call npm install
if %errorlevel% neq 0 (
    echo Error al instalar dependencias del backend
    pause
    exit /b 1
)

echo.
echo Configurando variables de entorno del Backend...
if not exist .env (
    copy env.example .env
    echo Variables de entorno configuradas
) else (
    echo Archivo .env ya existe
)

echo.
echo Instalando dependencias del Frontend...
cd ..\consultorio
call npm install
if %errorlevel% neq 0 (
    echo Error al instalar dependencias del frontend
    pause
    exit /b 1
)

echo.
echo ========================================
echo Instalacion completada exitosamente!
echo ========================================
echo.
echo Para iniciar el sistema:
echo.
echo 1. Iniciar Backend:
echo    cd backendConsul
echo    npm run dev
echo.
echo 2. En otra terminal, iniciar Frontend:
echo    cd consultorio
echo    ng serve
echo.
echo 3. Abrir navegador en: http://localhost:4200
echo.
echo Credenciales de prueba:
echo - Kinesiologa: kinesiologa@consultorio.com / kinesiologa123
echo - Odontologo: odontologo@consultorio.com / odontologo123
echo.
pause 