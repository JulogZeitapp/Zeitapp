import express from 'express';
import cors from 'cors';
import { connectToDatabase } from './src/lib/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { ObjectId } from 'mongodb';

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
    
    // Lösche bestehende Daten
    await db.collection('users').deleteMany({});
    await db.collection('arbeitszeiten').deleteMany({});
    
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
    
    // Erstelle Collections mit Indizes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('arbeitszeiten').createIndex({ fahrerId: 1, startZeit: -1 });
    await db.collection('arbeitszeiten').createIndex({ status: 1 });
    
    await db.collection('users').insertMany(users);
    
    res.json({ 
      status: 'success',
      message: 'Datenbank erfolgreich initialisiert',
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

// Arbeitszeit-Routen
app.post('/api/arbeitszeiten', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Nur Fahrer können Arbeitszeiten erfassen' });
    }

    const db = await connectToDatabase();
    const { datum, startZeit, endZeit, pause, beschreibung, arbeitszeitMinuten } = req.body;

    // Validiere die Daten
    if (!datum || !startZeit || !endZeit) {
      return res.status(400).json({ message: 'Datum, Start- und Endzeit sind erforderlich' });
    }

    const arbeitszeit = {
      fahrerId: req.user.id,
      fahrerEmail: req.user.email,
      fahrerName: req.user.name,
      datum: new Date(datum),
      startZeit,
      endZeit,
      pause: Number(pause) || 0,
      arbeitszeitMinuten: Number(arbeitszeitMinuten) || 0,
      beschreibung: beschreibung || '',
      status: 'pending',
      erstelltAm: new Date(),
      aktualisiertAm: new Date()
    };

    console.log('Speichere Arbeitszeit:', {
      fahrerId: arbeitszeit.fahrerId,
      datum: arbeitszeit.datum,
      startZeit: arbeitszeit.startZeit,
      endZeit: arbeitszeit.endZeit,
      arbeitszeitMinuten: arbeitszeit.arbeitszeitMinuten
    });

    const result = await db.collection('arbeitszeiten').insertOne(arbeitszeit);
    
    if (!result.acknowledged) {
      throw new Error('Fehler beim Speichern der Arbeitszeit');
    }

    res.status(201).json({
      message: 'Arbeitszeit erfolgreich gespeichert',
      arbeitszeit: { ...arbeitszeit, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Fehler beim Speichern der Arbeitszeit:', error);
    res.status(500).json({ 
      message: 'Serverfehler beim Speichern der Arbeitszeit',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// Arbeitszeiten eines Fahrers abrufen
app.get('/api/arbeitszeiten/fahrer/:fahrerId', authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { fahrerId } = req.params;

    // Nur der eigene Fahrer oder der Chef darf die Daten sehen
    if (req.user.role !== 'chef' && req.user.id !== fahrerId) {
      return res.status(403).json({ message: 'Nicht autorisiert' });
    }

    const arbeitszeiten = await db.collection('arbeitszeiten')
      .find({ fahrerId })
      .sort({ startZeit: -1 })
      .toArray();

    res.json(arbeitszeiten);
  } catch (error) {
    console.error('Fehler beim Abrufen der Arbeitszeiten:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Arbeitszeiten' });
  }
});

// Alle Arbeitszeiten für Chef abrufen
app.get('/api/arbeitszeiten', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'chef') {
      return res.status(403).json({ message: 'Nur der Chef kann alle Arbeitszeiten sehen' });
    }

    const db = await connectToDatabase();
    const arbeitszeiten = await db.collection('arbeitszeiten')
      .find({})
      .sort({ startZeit: -1 })
      .toArray();

    // Gruppiere nach Fahrern
    const gruppierteArbeitszeiten = arbeitszeiten.reduce((acc, zeit) => {
      const fahrerId = zeit.fahrerId;
      if (!acc[fahrerId]) {
        acc[fahrerId] = {
          fahrer: {
            id: zeit.fahrerId,
            email: zeit.fahrerEmail,
            name: zeit.fahrerName
          },
          zeiten: []
        };
      }
      acc[fahrerId].zeiten.push(zeit);
      return acc;
    }, {});

    res.json(Object.values(gruppierteArbeitszeiten));
  } catch (error) {
    console.error('Fehler beim Abrufen aller Arbeitszeiten:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Arbeitszeiten' });
  }
});

// Arbeitszeit aktualisieren
app.put('/api/arbeitszeiten/:id', authenticateToken, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { id } = req.params;
    const { startZeit, endZeit, pause, beschreibung, status } = req.body;

    // Prüfe Berechtigung
    const arbeitszeit = await db.collection('arbeitszeiten').findOne({ _id: new ObjectId(id) });
    if (!arbeitszeit) {
      return res.status(404).json({ message: 'Arbeitszeit nicht gefunden' });
    }

    if (req.user.role !== 'chef' && req.user.id !== arbeitszeit.fahrerId) {
      return res.status(403).json({ message: 'Nicht autorisiert' });
    }

    const update = {
      ...(startZeit && { startZeit: new Date(startZeit) }),
      ...(endZeit && { endZeit: new Date(endZeit) }),
      ...(pause !== undefined && { pause: Number(pause) }),
      ...(beschreibung !== undefined && { beschreibung }),
      ...(status && { status }),
      aktualisiertAm: new Date()
    };

    const result = await db.collection('arbeitszeiten')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: update }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Arbeitszeit nicht gefunden' });
    }

    res.json({ message: 'Arbeitszeit erfolgreich aktualisiert' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Arbeitszeit:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren der Arbeitszeit' });
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