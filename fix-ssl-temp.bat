@echo off
echo 🔧 Aplicando solución temporal para SSL...

echo ⏹️ Deteniendo contenedores...
docker-compose down

echo 🔨 Reconstruyendo y levantando servicios...
docker-compose up -d --build

echo ✅ Verificando servicios...
timeout /t 15 /nobreak > nul

echo 🔍 Verificando conectividad HTTP...
curl -I http://consultorioaguero.duckdns.org 2>nul && echo ✅ HTTP funciona || echo ❌ HTTP no responde

echo 🔍 Verificando API...
curl -f http://consultorioaguero.duckdns.org/api/health 2>nul && echo ✅ API funciona || echo ❌ API no responde

echo.
echo 🎉 Solución temporal aplicada!
echo 📝 Cambios realizados:
echo    - nginx ahora sirve HTTP en puerto 80
echo    - Configuración duplicada para HTTP y HTTPS
echo    - Los PDFs deberían funcionar ahora

echo.
echo 🔗 Para probar:
echo    - Frontend HTTP: http://consultorioaguero.duckdns.org
echo    - API Health: http://consultorioaguero.duckdns.org/api/health

echo.
echo ⚠️ IMPORTANTE: Esta es una solución temporal
echo Para producción, necesitas configurar SSL correctamente:
echo 1. Generar certificados con Let's Encrypt
echo 2. Restaurar la redirección HTTPS
echo 3. Configurar renovación automática

pause
