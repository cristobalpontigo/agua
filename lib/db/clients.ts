import { readDb, writeDb } from './storage';
import { Client } from '@/lib/types';
import { generateId } from '@/lib/utils';

export interface ClientDBRecord extends Omit<Client, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export interface ClientDB {
  [id: string]: ClientDBRecord;
}

export async function getClients(): Promise<Client[]> {
  const db = await readDb<ClientDB>('clients');
  return Object.values(db).map(client => ({
    ...client,
    createdAt: new Date(client.createdAt),
    updatedAt: new Date(client.updatedAt),
  } as Client));
}

export async function getClientById(id: string): Promise<Client | null> {
  const db = await readDb<ClientDB>('clients');
  const client = db[id];
  if (!client) return null;
  return {
    ...client,
    createdAt: new Date(client.createdAt),
    updatedAt: new Date(client.updatedAt),
  } as Client;
}

export async function getClientByName(name: string): Promise<Client | null> {
  const db = await readDb<ClientDB>('clients');
  const client = Object.values(db).find(c => c.name.toLowerCase() === name.toLowerCase());
  if (!client) return null;
  return {
    ...client,
    createdAt: new Date(client.createdAt),
    updatedAt: new Date(client.updatedAt),
  } as Client;
}

export async function createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
  const db = await readDb<ClientDB>('clients');
  
  const now = new Date();
  const clientData = {
    id: generateId(),
    ...data,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  
  db[clientData.id] = clientData as any;
  await writeDb('clients', db);
  
  return {
    ...clientData,
    createdAt: now,
    updatedAt: now,
  } as Client;
}

export async function updateClient(id: string, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Client | null> {
  const db = await readDb<ClientDB>('clients');
  
  if (!db[id]) return null;
  
  const updatedData: ClientDBRecord = {
    ...db[id],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  db[id] = updatedData;
  await writeDb('clients', db);
  
  return {
    ...updatedData,
    createdAt: new Date(updatedData.createdAt),
    updatedAt: new Date(updatedData.updatedAt),
  } as Client;
}

export async function deleteClient(id: string): Promise<boolean> {
  const db = await readDb<ClientDB>('clients');
  
  if (!db[id]) return false;
  
  delete db[id];
  await writeDb('clients', db);
  
  return true;
}
