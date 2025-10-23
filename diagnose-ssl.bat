@echo off
echo 🔍 Diagnosticando problema de certificado SSL...

echo 📋 Estado de contenedores:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 🔐 Verificando certificados SSL...

REM Verificar si los certificados existen
if exist "C:\etc\letsencrypt\live\consultorioaguero.duckdns.org" (
    echo ✅ Certificados encontrados en el host
) else (
    echo ❌ Certificados NO encontrados en el host
    echo 💡 Necesitas generar certificados SSL
)

echo.
echo 🌐 Verificando conectividad:
echo 🔗 Probando HTTP (puerto 80):
curl -I http://consultorioaguero.duckdns.org 2>nul || echo ❌ HTTP no responde

echo 🔗 Probando HTTPS (puerto 443):
curl -I https://consultorioaguero.duckdns.org 2>nul || echo ❌ HTTPS no responde

echo.
echo 🔧 Soluciones posibles:
echo 1. Si no tienes certificados: Generar con Let's Encrypt
echo 2. Si los certificados están vencidos: Renovar
echo 3. Si hay problemas de DNS: Verificar configuración
echo 4. Si el contenedor no puede acceder: Verificar montaje de volúmenes

echo.
echo 📝 Para generar certificados SSL en Linux:
echo sudo certbot certonly --standalone -d consultorioaguero.duckdns.org

pause
