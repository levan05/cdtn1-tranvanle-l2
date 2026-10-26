# Giai doan 1: build giao dien React
FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Giai doan 2: backend + giao dien da build
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY scripts ./scripts
COPY migrations ./migrations
COPY seeds ./seeds
COPY --from=web /web/dist ./frontend/dist
EXPOSE 8000
# Dung migration va seed (chay lai nhieu lan khong loi, khong nhan doi) roi moi mo may chu
CMD ["sh", "-c", "npm run migrate && npm run seed && npm start"]