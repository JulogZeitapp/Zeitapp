import { MongoClient } from 'mongodb';

const uri = "mongodb://JulogZeit:Teddye123.@localhost:27017/zeitapp?authSource=admin";
const client = new MongoClient(uri);

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return client.db('zeitapp');
  }

  try {
    await client.connect();
    isConnected = true;
    console.log('Verbunden mit MongoDB');
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