# Small Alpine Linux image with Node.js 20
FROM node:20-alpine

# Working directory inside the container
WORKDIR /usr/src/app

# Copy dependency manifest first so this layer is cached
COPY --chown=node:node package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy the app code, owned by the node user
COPY --chown=node:node . .

# Run as the node user, not root
USER node

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
