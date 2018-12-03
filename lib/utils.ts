export function isId(id: string): boolean {
  return !isNaN(parseInt(id, 10));
}

export function hasId(obj: string|{id: string}): boolean {
  return typeof obj === 'string' ? isId(obj) : isId(obj.id);
}

export function getId(obj: string|{id: string}): string {
  return typeof obj === 'string' ? obj : obj.id;
}

export function assert(msg: string, condition: boolean): void {
  if (!condition) {
    throw new Error(msg);
  }
}

export function warn(msg: string, condition: boolean): void {
  if (!condition) {
    /* tslint:disable:no-console */
    console.warn(msg);
    /* tslint:enable:no-console */
  }
}

export function arrayDiff(arr1: string[], arr2: string[]): string[] {
  return arr1.filter(x => arr2.indexOf(x) < 0);
}

export function uniq<T>(list: T[]): T[] {
  return list.filter((item, index, collection) => collection.indexOf(item) === index);
}

export function copy<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

// tslint:disable-next-line:no-any
export function getOrCalcValue<T>(v: ((...args: any[]) => T)|T, context: object = {}, ...args: any[]): T {
  return v instanceof Function ? v.apply(context, args) : v;
}

export function getVal<T>(obj: any, key: string, defaultVal: T): T {
  return obj && obj.hasOwnProperty(key) ? obj[key] : defaultVal;
}
