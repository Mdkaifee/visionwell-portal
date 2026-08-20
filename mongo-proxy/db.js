import { MongoClient } from "mongodb";

let clientPromise;

function getClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

export async function getDb() {
  const client = await getClient();
  return client.db();
}

export async function getCollection(name) {
  const db = await getDb();
  return db.collection(name);
}

export function toPublic(doc) {
  if (!doc) return doc;
  const { _id, passwordHash, ...rest } = doc;
  return { id: _id?.toString(), ...rest };
}
