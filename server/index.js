import express from 'express';
import cors from 'cors';
import pwnedCheckRouter from './routes/pwnedCheck.js';
import emailCheckRouter from './routes/emailCheck.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*'
}));

app.use(express.json());

// Routes
app.use('/api', pwnedCheckRouter);
app.use('/api', emailCheckRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Password Strength Analyzer Server running on http://localhost:${PORT}`);
});
