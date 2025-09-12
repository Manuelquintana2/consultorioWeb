# Usamos Node 18 Alpine
FROM node:18-alpine

# Carpeta de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar todo el código
COPY . .

# Exponer puerto
EXPOSE 3000

# Iniciar backend apuntando a src/index.js
CMD ["node", "src/index.js"]
