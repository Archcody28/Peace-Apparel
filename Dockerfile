FROM node:22-alpine AS client-build
WORKDIR /workspace
# Child packages reference file:..; preserve that layout during npm ci.
COPY package.json ./
WORKDIR /workspace/client
COPY client/package*.json ./
RUN npm ci --no-audit --no-fund
COPY client/ ./
# Browser-safe build inputs only. Backend secrets belong in runtime env.
ARG VITE_API_URL=""
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ARG VITE_PAYSTACK_PUBLIC_KEY=""
RUN npm run build

FROM node:22-alpine AS server-build
WORKDIR /workspace
COPY package.json ./
WORKDIR /workspace/server
COPY server/package*.json ./
RUN npm ci --include=dev --no-audit --no-fund
COPY server/ ./
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /workspace
COPY package.json ./
WORKDIR /workspace/server
COPY server/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY --from=server-build /workspace/server/dist ./dist
COPY --from=client-build /workspace/client/dist ./public
ENV NODE_ENV=production
USER node
EXPOSE 3001
CMD ["node", "./dist/start.js"]
