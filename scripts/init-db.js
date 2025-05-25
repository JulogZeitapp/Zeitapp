import { connectToDatabase } from '../src/lib/db.js';
import bcrypt from 'bcryptjs';

async function initializeDatabase() {
  try {
    const db = await connectToDatabase();
    
    // Testbenutzer erstellen
    const users = [
      {
        email: 'fahrer@zeitapp.de',
        password: await bcrypt.hash('test123', 10),
        role: 'driver',
        name: 'Max Mustermann'
      },
      {
        email: 'chef@zeitapp.de',
        password: await bcrypt.hash('test123', 10),
        role: 'chef',
        name: 'Anna Schmidt'
      }
    ];

    // Benutzer in die Datenbank einfügen
    await db.collection('users').insertMany(users);
    console.log('Testbenutzer wurden erfolgreich erstellt!');
    
    process.exit(0);
  } catch (error) {
    console.error('Fehler beim Initialisieren der Datenbank:', error);
    process.exit(1);
  }
}

initializeDatabase(); 