import { MongoClient } from 'mongodb';

// MongoDB Atlas Connection String
const uri = process.env.MONGODB_URI || "mongodb+srv://zeitapp:Teddye123.@zeitapp.ptlihjl.mongodb.net/zeitapp?retryWrites=true&w=majority&appName=ZeitApp";
const client = new MongoClient(uri);

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return client.db('zeitapp');
  }

  try {
    await client.connect();
    isConnected = true;
    console.log('Verbunden mit MongoDB Atlas');
    return client.db('zeitapp');
  } catch (error) {
    console.error('Fehler bei der Verbindung zur Datenbank:', error);
    throw new Error('Datenbankverbindung fehlgeschlagen');
  }
}

export async function closeDatabaseConnection() {
  if (!isConnected) {
    return;
  }

  try {
    await client.close();
    isConnected = false;
    console.log('Datenbankverbindung geschlossen');
  } catch (error) {
    console.error('Fehler beim Schließen der Datenbankverbindung:', error);
    throw error;
  }
} 