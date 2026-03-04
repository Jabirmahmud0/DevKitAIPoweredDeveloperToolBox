import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface HistoryEntry {
    id?: number;
    toolId: string;
    input: unknown;
    output: string;
    timestamp: number;
    starred: boolean;
    label?: string;
}

interface DevKitDB extends DBSchema {
    history: {
        key: number;
        value: HistoryEntry;
        indexes: {
            "by-tool": string;
            "by-timestamp": number;
            "by-starred": number;
        };
    };
}

let dbInstance: IDBPDatabase<DevKitDB> | null = null;

async function getDB(): Promise<IDBPDatabase<DevKitDB>> {
    if (dbInstance) return dbInstance;
    dbInstance = await openDB<DevKitDB>("devkit", 1, {
        upgrade(db) {
            const store = db.createObjectStore("history", {
                keyPath: "id",
                autoIncrement: true,
            });
            store.createIndex("by-tool", "toolId");
            store.createIndex("by-timestamp", "timestamp");
            store.createIndex("by-starred", "starred");
        },
    });
    return dbInstance;
}

/** Add a new history entry (keeps only last 20 per tool) */
export async function addHistoryEntry(
    entry: Omit<HistoryEntry, "id" | "starred" | "timestamp">
): Promise<void> {
    const db = await getDB();
    const full: HistoryEntry = {
        ...entry,
        timestamp: Date.now(),
        starred: false,
    };
    await db.add("history", full);

    // Prune to last 20 entries for this tool
    const all = await db.getAllFromIndex("history", "by-tool", entry.toolId);
    if (all.length > 20) {
        const sorted = all.sort((a, b) => a.timestamp - b.timestamp);
        const toDelete = sorted.slice(0, all.length - 20);
        for (const item of toDelete) {
            if (item.id) await db.delete("history", item.id);
        }
    }
}

/** Get last N history entries for a tool, newest first */
export async function getToolHistory(
    toolId: string,
    limit = 20
): Promise<HistoryEntry[]> {
    const db = await getDB();
    const all = await db.getAllFromIndex("history", "by-tool", toolId);
    return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

/** Toggle starred status */
export async function toggleStar(id: number): Promise<void> {
    const db = await getDB();
    const entry = await db.get("history", id);
    if (entry) {
        entry.starred = !entry.starred;
        await db.put("history", entry);
    }
}

/** Get all starred entries across tools */
export async function getStarredEntries(): Promise<HistoryEntry[]> {
    const db = await getDB();
    const all = await db.getAll("history");
    return all.filter((e) => e.starred).sort((a, b) => b.timestamp - a.timestamp);
}

/** Clear all history for a tool */
export async function clearToolHistory(toolId: string): Promise<void> {
    const db = await getDB();
    const all = await db.getAllFromIndex("history", "by-tool", toolId);
    for (const item of all) {
        if (item.id) await db.delete("history", item.id);
    }
}

/** Delete a single entry */
export async function deleteEntry(id: number): Promise<void> {
    const db = await getDB();
    await db.delete("history", id);
}
