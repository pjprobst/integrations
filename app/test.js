import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync('./my_database.db');

const insert = db.prepare('INSERT INTO videos (id, datetime) VALUES (?, ?)');

insert.run(934898420, 'date');

const query = db.prepare(`
   SELECT COUNT(*) FROM videos WHERE id = 934898420;
`);

console.log(JSON.stringify(query.all()).charAt(13) === '0');
