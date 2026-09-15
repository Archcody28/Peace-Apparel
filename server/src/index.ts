import app from './app.js';

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
}

export default app;
