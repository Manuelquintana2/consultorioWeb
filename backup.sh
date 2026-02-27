#!/bin/bash

# Configuración
BACKUP_DIR="./backups"
DATE=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_NAME="backup_consultorio_$DATE.tar.gz"

# Crear carpeta de backups si no existe
mkdir -p $BACKUP_DIR

echo "Iniciando respaldo de base de datos y certificados..."

# 1. Backup de PostgreSQL (usando docker exec)
docker exec db pg_dump -U Manuti12174328 consultorio_db > $BACKUP_DIR/db_backup_$DATE.sql

# 2. Comprimir base de datos y carpeta de certificados
tar -czf $BACKUP_DIR/$BACKUP_NAME $BACKUP_DIR/db_backup_$DATE.sql ./certbot/conf

# 3. Limpiar el archivo SQL suelto
rm $BACKUP_DIR/db_backup_$DATE.sql

echo "Respaldo completado: $BACKUP_DIR/$BACKUP_NAME"
