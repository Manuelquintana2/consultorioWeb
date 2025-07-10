#!/bin/bash

echo "========================================"
echo "Instalacion del Sistema de Consultorio"
echo "========================================"
echo

echo "Instalando dependencias del Backend..."
cd backendConsul
npm install
if [ $? -ne 0 ]; then
    echo "Error al instalar dependencias del backend"
    exit 1
fi

echo
echo "Configurando variables de entorno del Backend..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "Variables de entorno configuradas"
else
    echo "Archivo .env ya existe"
fi

echo
echo "Instalando dependencias del Frontend..."
cd ../consultorio
npm install
if [ $? -ne 0 ]; then
    echo "Error al instalar dependencias del frontend"
    exit 1
fi

echo
echo "========================================"
echo "Instalacion completada exitosamente!"
echo "========================================"
echo
echo "Para iniciar el sistema:"
echo
echo "1. Iniciar Backend:"
echo "   cd backendConsul"
echo "   npm run dev"
echo
echo "2. En otra terminal, iniciar Frontend:"
echo "   cd consultorio"
echo "   ng serve"
echo
echo "3. Abrir navegador en: http://localhost:4200"
echo
echo "Credenciales de prueba:"
echo "- Kinesiologa: kinesiologa@consultorio.com / kinesiologa123"
echo "- Odontologo: odontologo@consultorio.com / odontologo123"
echo 