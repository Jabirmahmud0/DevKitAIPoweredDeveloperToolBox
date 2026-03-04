// JSON Diff Web Worker - runs jsdiff off the main thread
// Used via Comlink from JsonToolkit component

import * as Comlink from "comlink";
import { diffJson } from "diff";

export interface DiffLine {
    value: string;
    added: boolean;
    removed: boolean;
    count: number;
}

export interface DiffResult {
    lines: DiffLine[];
    additions: number;
    removals: number;
    executionTime: number;
    error?: string;
}

function runDiff(left: string, right: string): DiffResult {
    const start = performance.now();
    try {
        let leftObj: unknown, rightObj: unknown;
        try {
            leftObj = JSON.parse(left);
            rightObj = JSON.parse(right);
        } catch {
            return {
                lines: [],
                additions: 0,
                removals: 0,
                executionTime: performance.now() - start,
                error: "Invalid JSON in one or both inputs",
            };
        }

        const changes = diffJson(leftObj as object, rightObj as object);

        let additions = 0;
        let removals = 0;
        const lines: DiffLine[] = changes.map((change) => {
            if (change.added) additions += change.count ?? 0;
            if (change.removed) removals += change.count ?? 0;
            return {
                value: change.value,
                added: change.added ?? false,
                removed: change.removed ?? false,
                count: change.count ?? 0,
            };
        });

        return {
            lines,
            additions,
            removals,
            executionTime: performance.now() - start,
        };
    } catch (err) {
        return {
            lines: [],
            additions: 0,
            removals: 0,
            executionTime: performance.now() - start,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}

Comlink.expose({ runDiff });
