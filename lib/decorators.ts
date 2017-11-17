import {assert} from './utils';

const {isArray} = Array;

export function assertHasType(target, key, descriptor): any {
  if (descriptor === undefined) {
    descriptor = Object.getOwnPropertyDescriptor(target, key);
  }
  const originalMethod = descriptor.value;
  descriptor.value = function(...args) {
    const type = args[0];
    assert(`"${type}"-type doesn't exist in the database`, this.hasType(type));
    return originalMethod.apply(this, args);
  };
  return descriptor;
}

export function assertCrudOptions(target, key, descriptor): any {
  if (descriptor === undefined) {
    descriptor = Object.getOwnPropertyDescriptor(target, key);
  }
  const originalMethod = descriptor.value;
  descriptor.value = function(...args) {
    const crudOptions = args[args.length - 1];
    if (crudOptions && crudOptions.ignoreRelated) {
      crudOptions.ignoreRelated.forEach(type => assert(`"ignoreRelated" contains type "${type}" which doesn't exist in the database`, this.hasType(type)));
    }
    return originalMethod.apply(this, args);
  };
  return descriptor;
}

/* tslint:disable:no-console */
export function verbose(target, key, descriptor): any {
  if (descriptor === undefined) {
    descriptor = Object.getOwnPropertyDescriptor(target, key);
  }
  const originalMethod = descriptor.value;
  descriptor.value = function(...args) {
    const strArgs = args.map(arg => arg instanceof Function ? 'callback' : `${JSON.stringify(arg)}`).join(', ');
    const msg = `${key} (args - [${strArgs}]) execution time`;
    console.time(msg);
    const result = originalMethod.apply(this, args);
    if (this.verbose) {
      console.timeEnd(msg);
      if (isArray(result)) {
        console.log(`Result: ${result.length} item(s)`);
      }
    }
    return result;
  };
  return descriptor;
}
/* tslint:enable:no-console */

export function getLastItemsCount(list: string[], neededValue: string): number {
  let count = 0;
  let index = list.length - 1;
  while (index >= 0) {
    if (list[index] === neededValue) {
      count++;
      index--;
    } else {
      return count;
    }
  }
  return count;
}

export function assertLoops(factoryName: string, relatedChain: string[]) {
  assert(`Loop is detected in the "createRelated". Chain is ${JSON.stringify(relatedChain)}. You try to create records for "${factoryName}" again.`, relatedChain.indexOf(factoryName) === -1);
}
