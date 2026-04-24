# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL=/api
ARG VITE_WS_URL=wss://hipo.site/ws
ARG VITE_VAPID_PUBLIC_KEY="BGOzM3OUqvTIHaloRzmpHBz2YCkv6PmuaVV7VE0gqDcxehOCx8ZueVDOYMwVxQT9TXOIbGjef5uga0PPa96sfX0"
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY
RUN npx vite build

# Stage 2: Serve
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
