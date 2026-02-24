import type { Db, Collection } from 'mongodb';
import { randomUUID } from 'crypto';

export type User = { id: string; email: string; passwordHash: string; createdAt: string };

export function createUsersRepo(db: Db) {
  const col: Collection<User> = db.collection('users');
  col.createIndex({ email: 1 }, { unique: true }).catch(()=>{});

  return {
    async create(email: string, passwordHash: string): Promise<User> {
      const user: User = { id: randomUUID(), email, passwordHash, createdAt: new Date().toISOString() };
      await col.insertOne(user);
      return user;
    },
    async findByEmail(email: string): Promise<User | null> {
      return await col.findOne({ email });
    },
    async findById(id: string): Promise<User | null> {
      return await col.findOne({ id });
    }
  };
}
