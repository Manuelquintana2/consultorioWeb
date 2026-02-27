# ETAPA 1: Compilar la aplicación
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx ng build --configuration production

# ETAPA 2: Servir con Nginx
FROM nginx:alpine
# Agregamos /browser al final de la ruta de origen
COPY --from=build /app/dist/consultorio/browser /usr/share/nginx/html 
EXPOSE 80
