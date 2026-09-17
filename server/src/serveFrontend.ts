import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { Express } from 'express';

const serverRoot = fileURLToPath(new URL('../', import.meta.url));

// Docker places the client in serverRoot/public; repository builds use client/dist.
export function resolveFrontendPath(root = serverRoot) {
  const bundled = path.join(root, 'public');
  return existsSync(path.join(bundled, 'index.html'))
    ? bundled
    : path.resolve(root, '../client/dist');
}

// Mount AFTER API routers: unknown API paths must never return the SPA.
export default function serveFrontend(app: Express, directory = resolveFrontendPath()) {
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });
  app.use(express.static(directory));
  app.get('*', (req, res, next) => {
    if (!req.accepts('html') || path.extname(req.path)) return next();
    res.sendFile(path.join(directory, 'index.html'), (error) => {
      if (error) next(error);
    });
  });
}
