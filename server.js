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

// CORS-Konfiguration für Produktion
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://zeitapp.onrender.com',
        'https://www.zeitapp.onrender.com',
        /\.onrender\.com$/,  // Erlaubt alle Render-URLs
        process.env.RENDER_EXTERNAL_URL,
        process.env.RAILWAY_PUBLIC_DOMAIN
      ].filter(Boolean)
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Logging Middleware mit mehr Details
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, {
    origin: req.headers.origin,
    host: req.headers.host,
    userAgent: req.headers['user-agent']
  });
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
    console.log('Login-Versuch:', { email: req.body.email });
    
    const db = await connectToDatabase();
    const { email, password } = req.body;

    // Prüfe ob Benutzer existiert
    const user = await db.collection('users').findOne({ email });
    console.log('Benutzer gefunden:', user ? { email: user.email, role: user.role } : 'Nein');

    if (!user) {
      console.log('Login fehlgeschlagen: Benutzer nicht gefunden');
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    // Prüfe Passwort
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Passwort validiert:', validPassword ? 'Ja' : 'Nein');

    if (!validPassword) {
      console.log('Login fehlgeschlagen: Falsches Passwort');
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login erfolgreich:', { email: user.email, role: user.role });

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
    console.error('Login-Fehler:', error);
    res.status(500).json({ 
      message: 'Serverfehler',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
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

// Verbesserte Datenbank-Status Route
app.get('/api/db-status', async (req, res) => {
  try {
    console.log('Datenbank-Status wird geprüft...');
    const db = await connectToDatabase();
    
    // Prüfe Verbindung
    const collections = await db.listCollections().toArray();
    console.log('Verfügbare Collections:', collections.map(c => c.name));
    
    // Zähle Benutzer
    const userCount = await db.collection('users').countDocuments();
    console.log('Anzahl Benutzer:', userCount);
    
    // Hole Benutzer-Details (ohne Passwörter)
    const users = await db.collection('users')
      .find({})
      .project({ password: 0 })
      .toArray();
    
    res.json({ 
      status: 'ok',
      userCount,
      collections: collections.map(c => c.name),
      users: users,
      message: userCount === 0 ? 'Keine Benutzer gefunden. Bitte initialisieren.' : `${userCount} Benutzer gefunden.`
    });
  } catch (error) {
    console.error('Datenbank-Status-Fehler:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Datenbankfehler',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
});

// Initialisierungs-Route für Testdaten (ohne Authentifizierung)
app.post('/api/init-db', async (req, res) => {
  try {
    const db = await connectToDatabase();
    
    // Lösche bestehende Benutzer
    await db.collection('users').deleteMany({});
    
    // Erstelle Test-Benutzer
    const users = [
      {
        email: 'chef@zeitapp.de',
        password: await bcrypt.hash('test123', 10),
        role: 'chef',
        name: 'Chef User'
      },
      {
        email: 'fahrer@zeitapp.de',
        password: await bcrypt.hash('test123', 10),
        role: 'driver',
        name: 'Max Mustermann'
      }
    ];
    
    await db.collection('users').insertMany(users);
    
    res.json({ 
      status: 'success',
      message: 'Testdaten erfolgreich initialisiert',
      users: users.map(u => ({ email: u.email, role: u.role, name: u.name }))
    });
  } catch (error) {
    console.error('Initialisierungsfehler:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Fehler bei der Initialisierung',
      error: error.message 
    });
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