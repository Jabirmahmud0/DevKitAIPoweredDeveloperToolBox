// Regex Web Worker - runs xregexp matching off the main thread
// Used via Comlink from RegexLab component

import * as Comlink from "comlink";
import XRegExp from "xregexp";

export interface MatchGroup {
    name: string | null;
    value: string;
    start: number;
    end: number;
}

export interface RegexMatch {
    fullMatch: string;
    start: number;
    end: number;
    groups: MatchGroup[];
    index: number;
}

export interface RegexResult {
    matches: RegexMatch[];
    executionTime: number;
    hasBacktrackingRisk: boolean;
    error?: string;
}

const BACKTRACKING_PATTERNS = [
    /(\w+)+/,
    /(\d+)*\d/,
    /(a+)+b/,
    /(.*){2,}/,
];

function detectBacktrackingRisk(pattern: string): boolean {
    return BACKTRACKING_PATTERNS.some((risk) => risk.test(pattern));
}

function runRegex(
    pattern: string,
    flags: string,
    testString: string
): RegexResult {
    const start = performance.now();
    try {
        const regex = XRegExp(pattern, flags);
        const matches: RegexMatch[] = [];
        let idx = 0;

        XRegExp.forEach(testString, regex, (match) => {
            const groups: MatchGroup[] = [];
            for (let i = 1; i < match.length; i++) {
                groups.push({
                    name: null,
                    value: match[i] ?? "",
                    start: -1,
                    end: -1,
                    index: i,
                } as MatchGroup & { index: number });
            }
            // Named groups
            if (match.groups) {
                for (const [name, value] of Object.entries(match.groups)) {
                    groups.push({ name, value: value ?? "", start: -1, end: -1 });
                }
            }
            matches.push({
                fullMatch: match[0],
                start: match.index ?? 0,
                end: (match.index ?? 0) + match[0].length,
                groups,
                index: idx++,
            });
        });

        return {
            matches,
            executionTime: performance.now() - start,
            hasBacktrackingRisk: detectBacktrackingRisk(pattern),
        };
    } catch (err) {
        return {
            matches: [],
            executionTime: performance.now() - start,
            hasBacktrackingRisk: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}

Comlink.expose({ runRegex });
