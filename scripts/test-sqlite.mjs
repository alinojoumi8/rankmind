import Database from "better-sqlite3";

const db = new Database("C:/Users/world/OneDrive/Documents/myprojects/rankmind/dev.db");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", tables);
db.close();
