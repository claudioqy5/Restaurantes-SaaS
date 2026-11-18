# Etapa 1: Compilacion de React con Node 20
FROM node:20-alpine AS build
WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json* ./
RUN npm install

# Copiar codigo fuente y compilar bundle de produccion
COPY . .
RUN npm run build

# Etapa 2: Servidor web ultraligero Nginx
FROM nginx:1.27-alpine AS final

# Copiar configuracion optimizada de Nginx con soporte de proxy y websockets
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar compilado de React
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
