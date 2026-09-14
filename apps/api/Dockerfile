FROM registry.redhat.io/ubi9/nodejs-20-minimal:latest

WORKDIR /app

# Copiar apenas os manifests primeiro para aproveitar cache de layer do Docker
COPY apps/api/package.json ./apps/api/package.json
COPY package.json package-lock.json ./
COPY packages/types/package.json ./packages/types/package.json

# Instalar apenas dependencias de producao (sem devDependencies)
RUN npm ci --workspace=apps/api --workspace=packages/types --omit=dev

# Copiar o codigo ja compilado (o build deve ser feito antes do docker build)
COPY apps/api/dist ./apps/api/dist
COPY packages/types/dist ./packages/types/dist

WORKDIR /app/apps/api

# Usuario nao-root — UID 1001 e o padrao no Red Hat UBI
USER 1001

EXPOSE 3001

CMD ["node", "dist/index.js"]
