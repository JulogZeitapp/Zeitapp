import express from 'express';
import cors from 'cors';
import { connectToDatabase } from './src/lib/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// CORS-Konfiguration für Railway
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.RAILWAY_PUBLIC_DOMAIN, 'https://zeitapp.up.railway.app']
    : 'http://localhost:5173',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Statische Dateien im Produktionsmodus
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Alle nicht-API Routen zur index.html weiterleiten
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
      next();
    }
  });
}

// Middleware zur Authentifizierung
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { email, password } = req.body;

    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id,
        email: user.email, 
        role: user.role,
        name: user.name 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Serverfehler' });
  }
});

// Benutzer abrufen Route (nur für Chef-Benutzer)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'chef') {
      return res.status(403).json({ message: 'Nicht autorisiert' });
    }

    const db = await connectToDatabase();
    const users = await db.collection('users')
      .find({ role: 'driver' })
      .project({ password: 0 })
      .toArray();

    res.json(users);
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer:', error);
    res.status(500).json({ message: 'Serverfehler' });
  }
});

// Initialisierungs-Route für Testdaten
app.post('/api/init', async (req, res) => {
  try {
    const db = await connectToDatabase();
    
    // Lösche bestehende Benutzer
    await db.collection('users').deleteMany({});
    
    // Erstelle Test-Benutzer
    const users = [
      {
        email: 'chef@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'chef',
        name: 'Chef User'
      },
      {
        email: 'driver1@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'driver',
        name: 'Max Mustermann'
      },
      {
        email: 'driver2@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'driver',
        name: 'Anna Schmidt'
      }
    ];
    
    await db.collection('users').insertMany(users);
    
    res.json({ message: 'Testdaten erfolgreich initialisiert' });
  } catch (error) {
    console.error('Initialisierungsfehler:', error);
    res.status(500).json({ message: 'Serverfehler bei der Initialisierung' });
  }
});

// Geschützte Route für Fahrer-Dashboard
app.get('/api/driver/dashboard', authenticateToken, async (req, res) => {
  if (req.user.role !== 'driver') {
    return res.status(403).json({ message: 'Nicht autorisiert' });
  }
  res.json({ message: 'Fahrer-Dashboard-Daten' });
});

// Geschützte Route für Chef-Dashboard
app.get('/api/chef/dashboard', authenticateToken, async (req, res) => {
  if (req.user.role !== 'chef') {
    return res.status(403).json({ message: 'Nicht autorisiert' });
  }
  res.json({ message: 'Chef-Dashboard-Daten' });
});

// Datenbank-Inspektor Route
app.get('/api/db-inspect', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collections = ['users']; // Hier können weitere Collections hinzugefügt werden
    const result = {};

    for (const collection of collections) {
      result[collection] = await db.collection(collection).find({}).toArray();
    }

    res.json(result);
  } catch (error) {
    console.error('Fehler beim Abrufen der Datenbankdaten:', error);
    res.status(500).json({ message: 'Serverfehler' });
  }
});

// Verbesserte Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(err.status || 500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? 'Ein Serverfehler ist aufgetreten' 
      : err.message,
    status: err.status || 500
  });
});

// Health Check Route für Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Server starten
const server = app.listen(PORT, () => {
  console.log(`
🚀 Server gestartet:
   Port: ${PORT}
   Mode: ${process.env.NODE_ENV || 'development'}
   URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || `http://localhost:${PORT}`}
  `);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM Signal empfangen. Server wird heruntergefahren...');
  server.close(() => {
    console.log('Server heruntergefahren');
    process.exit(0);
  });
}); 