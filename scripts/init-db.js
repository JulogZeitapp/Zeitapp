import { connectToDatabase } from '../src/lib/db.js';
import bcrypt from 'bcryptjs';

async function initializeDatabase() {
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
    
    console.log('Testdaten erfolgreich initialisiert!');
    console.log('Testbenutzer:');
    console.log('- Chef: chef@zeitapp.de / test123');
    console.log('- Fahrer: fahrer@zeitapp.de / test123');
    
    process.exit(0);
  } catch (error) {
    console.error('Fehler bei der Initialisierung:', error);
    process.exit(1);
  }
}

initializeDatabase(); 