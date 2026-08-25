const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const redis = require('redis');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'myjwtsecretkey';

// 1. PostgreSQL Setup
const pgPool = new Pool({
  host: process.env.DB_HOST || 'postgres-service',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'supersecretpassword',
  database: process.env.DB_NAME || 'authdb',
  port: 5432,
});

// Auto-create users table on startup
pgPool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch(err => console.error('Error initializing PG DB:', err));

// 2. Redis Setup
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || 'redis-service'}:${process.env.REDIS_PORT || 6379}`
});
redisClient.connect().catch(console.error);

// 3. Register Route
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Missing fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pgPool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed or user already exists', error: err.message });
  }
});

// 4. Login Route (Generates JWT & Saves to Redis)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const userResult = await pgPool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) return res.status(400).json({ message: 'User not found' });

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate Token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    // Save Token in Redis with 1-hour expiration (3600 seconds)
    await redisClient.setEx(`token:${user.username}`, 3600, token);

    res.json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
