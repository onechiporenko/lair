const { hasOwnProperty } = Object;

export function isId(id: string): boolean {
  return !isNaN(parseInt(id, 10));
}

export function hasId(obj: string | { id: string }): boolean {
  return typeof obj === 'string' ? isId(obj) : isId(obj.id);
}

export function getId(obj: string | { id: string }): string {
  return typeof obj === 'string' ? obj : obj.id;
}

export function assert(msg: string, condition: boolean): void {
  if (!condition) {
    throw new Error(msg);
  }
}

export function warn(msg: string, condition: boolean): void {
  if (!condition) {
    console.warn(msg);
  }
}

export function arrayDiff(arr1: string[], arr2: string[]): string[] {
  return arr1.filter((x) => arr2.indexOf(x) < 0);
}

export function uniq<T>(list: T[]): T[] {
  return list.filter(
    (item, index, collection) => collection.indexOf(item) === index
  );
}

export function copy<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

export function getOrCalcValue<T>(
  v: ((...args: any[]) => T) | T,
  context: Record<string, unknown> = {},
  ...args: any[]
): T {
  return v instanceof Function ? v.apply(context, args) : v;
}

export function getVal<T>(obj: any, key: string, defaultVal: T): T {
  return obj && hasOwnProperty.call(obj, key) ? obj[key] : defaultVal;
}
