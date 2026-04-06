import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { handleRoute } from './routes/route.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
})

app.post('/api/route', handleRoute);

app.get('/health', (_, res) => res.json({ status: 'ok' }));



app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

