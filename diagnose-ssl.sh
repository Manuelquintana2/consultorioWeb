#!/bin/bash

echo "🔍 Diagnosticando problema de certificado SSL..."

# Verificar si los contenedores están corriendo
echo "📋 Estado de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔐 Verificando certificados SSL..."

# Verificar si los certificados existen en el host
if [ -d "/etc/letsencrypt/live/consultorioaguero.duckdns.org" ]; then
    echo "✅ Certificados encontrados en el host"
    echo "📅 Información del certificado:"
    openssl x509 -in /etc/letsencrypt/live/consultorioaguero.duckdns.org/fullchain.pem -text -noout | grep -E "(Not Before|Not After|Subject:|Issuer:)"
else
    echo "❌ Certificados NO encontrados en el host"
    echo "💡 Necesitas generar certificados SSL"
fi

echo ""
echo "🌐 Verificando conectividad:"
echo "🔗 Probando HTTP (puerto 80):"
curl -I http://consultorioaguero.duckdns.org 2>/dev/null | head -1 || echo "❌ HTTP no responde"

echo "🔗 Probando HTTPS (puerto 443):"
curl -I https://consultorioaguero.duckdns.org 2>/dev/null | head -1 || echo "❌ HTTPS no responde"

echo ""
echo "🔧 Soluciones posibles:"
echo "1. Si no tienes certificados: Generar con Let's Encrypt"
echo "2. Si los certificados están vencidos: Renovar"
echo "3. Si hay problemas de DNS: Verificar configuración"
echo "4. Si el contenedor no puede acceder: Verificar montaje de volúmenes"

echo ""
echo "📝 Para generar certificados SSL:"
echo "sudo certbot certonly --standalone -d consultorioaguero.duckdns.org"
