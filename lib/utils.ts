export function isId(id: string): boolean {
  return !isNaN(parseInt(id, 10));
}

export function assert(msg: string, condition: boolean) {
  if (!condition) {
    throw new Error(msg);
  }
}

export function arrayDiff(arr1: string[], arr2: string[]): string[] {
  return arr1.filter(x => arr2.indexOf(x) < 0);
}

export function uniq(list: any[]): any[] {
  return list.filter((item, index, collection) => collection.indexOf(item) === index);
}

export function copy(val: any): any {
  return JSON.parse(JSON.stringify(val));
}

export function getOrCalcValue(v: any, ...args): any {
  return v instanceof Function ? v.apply(null, args) : v;
}
