import env from "./env.js";
import { DatabaseSync } from 'node:sqlite';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const databasePath = env.DATABASE_PATH || fileURLToPath(
    new URL('./data/my_database.db', import.meta.url)
);

mkdirSync(dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);

database.exec(`
    CREATE TABLE IF NOT EXISTS hardcover (
        id INTEGER PRIMARY KEY,
        status TEXT NOT NULL,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        pages INTEGER,
        updatedAt INTEGER NOT NULL,
        image TEXT,
        url TEXT,
        finishedAt TEXT,
        startedAt TEXT,
        progressPages INTEGER
    );

    CREATE TABLE IF NOT EXISTS youtube (
        id TEXT PRIMARY KEY,
        postedAt INTEGER NOT NULL,
        title TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS substack (
        url TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        postedAt INTEGER NOT NULL
    );
`);

export default database;
