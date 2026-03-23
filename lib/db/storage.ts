import { promises as fs } from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), '.data');

// Ensure data directory exists
export async function ensureDbDir() {
  try {
    await fs.access(DB_DIR);
  } catch {
    await fs.mkdir(DB_DIR, { recursive: true });
  }
}

// Read database file
export async function readDb<T>(filename: string): Promise<T> {
  try {
    await ensureDbDir();
    const filePath = path.join(DB_DIR, `${filename}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {} as T;
  }
}

// Write database file
export async function writeDb<T>(filename: string, data: T): Promise<void> {
  await ensureDbDir();
  const filePath = path.join(DB_DIR, `${filename}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Initialize database
export async function initializeDb() {
  await ensureDbDir();
  
  const usersDb = await readDb<Record<string, any>>('users');
  if (Object.keys(usersDb).length === 0) {
    // Create default admin user
    await writeDb('users', {
      admin: {
        id: 'admin',
        email: 'admin@aguas.com',
        password: '$2b$10$YourHashedPasswordHere', // Will be updated with proper hash
        name: 'Administrador',
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString(),
      }
    });
  }

  const clientsDb = await readDb<Record<string, any>>('clients');
  if (Object.keys(clientsDb).length === 0) {
    await writeDb('clients', {});
  }

  const salesDb = await readDb<Record<string, any>>('sales');
  if (Object.keys(salesDb).length === 0) {
    await writeDb('sales', {});
  }

  const paymentsDb = await readDb<Record<string, any>>('payments');
  if (Object.keys(paymentsDb).length === 0) {
    await writeDb('payments', {});
  }

  const deliveriesDb = await readDb<Record<string, any>>('deliveries');
  if (Object.keys(deliveriesDb).length === 0) {
    await writeDb('deliveries', {});
  }
}
