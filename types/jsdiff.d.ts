declare module 'jsdiff' {
  export interface Change {
    count?: number;
    added?: boolean;
    removed?: boolean;
    value: string;
  }

  export function diffJson(oldObj: object, newObj: object): Change[];
}
