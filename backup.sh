#!/bin/bash

# Configuración
BACKUP_DIR="./backups"
DATE=$(date +"%Y-%m-%d_%H%M%S")
# Cambiamos la extensión interna a .dump para identificarlo
DB_FILE="db_full_$DATE.dump"
BACKUP_NAME="backup_consultorio_$DATE.tar.gz"

# Crear carpeta de backups si no existe
mkdir -p "$BACKUP_DIR"

echo "---------------------------------------------------------"
echo "Iniciando respaldo total: $(date)"
echo "---------------------------------------------------------"

# 1. Backup de PostgreSQL en formato Custom (Binario completo)
# -F c: Formato custom (el más seguro de Postgres)
# --blobs: Incluye objetos grandes (fotos/archivos si los hay)
# --clean: Incluye comandos para limpiar tablas antes de restaurar
echo "Respaldando Base de Datos (Tablas, Datos, Secuencias)..."
docker exec db pg_dump -U Manuti12174328 -F c --blobs consultorio_db > "$BACKUP_DIR/$DB_FILE"

# 2. Comprimir base de datos y carpeta de certificados
echo "Comprimiendo con certificados de Certbot..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME" "$BACKUP_DIR/$DB_FILE" ./certbot/conf

# 3. Limpiar el archivo temporal
rm "$BACKUP_DIR/$DB_FILE"

echo "---------------------------------------------------------"
echo "✅ Respaldo completado con éxito"
echo "Archivo: $BACKUP_DIR/$BACKUP_NAME"
echo "---------------------------------------------------------"
