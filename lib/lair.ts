import {Factory, FactoryData, Meta, MetaAttrType} from './factory';
import {Record} from './record';
import {Relationships} from './relationships';
import {assert, copy, isId} from './utils';

const {keys} = Object;
const {isArray} = Array;

function assertHasType(target, key, descriptor): any {
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

/* tslint:disable:no-console */
function verbose(target, key, descriptor): any {
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

export interface InternalDb {
  [factoryName: string]: {
    [recordId: string]: Record;
  };
}

interface InternalMetaStore {
  [factoryName: string]: Meta;
}

interface AfterCreateItem {
  factoryName: string;
  id: string;
}

export interface CRUDOptions {
  depth: number;
}

/**
 * @class Lair
 */
export class Lair {

  /**
   * Lair implements singleton-pattern
   * Use this method to get it's instance
   * @returns {Lair}
   */
  public static getLair(): Lair {
    if (!Lair.instance) {
      Lair.instance = new Lair();
    }
    return Lair.instance;
  }

  /**
   * It will drop existing database and unregister all factories
   */
  public static cleanLair(): void {
    Lair.instance = new Lair();
  }

  private static instance: Lair;

  public verbose = false;

  private factories: { [id: string]: FactoryData } = {};
  private relationships: Relationships;
  private db: InternalDb = {};
  private meta: InternalMetaStore = {};
  private afterCreateQueue: AfterCreateItem[] = [];

  private constructor() {
    this.relationships = new Relationships();
  }

  /**
   * Register factory instance in the Lair
   * Lair works only with registered factories
   * @param {Factory} factory
   * @param {string} factoryName
   */
  public registerFactory(factory: Factory, factoryName: string): void {
    const fName = factoryName || factory.constructor['name'].toLowerCase();
    assert(`Factory with name "${fName}" is already registered`, !this.factories[fName]);
    this.factories[fName] = {factory, id: 1} as FactoryData;
    this.meta[factoryName] = factory.meta;
    this.relationships.addFactory(fName);
    this.relationships.updateMeta(this.meta);
    this.addType(fName);
  }

  /**
   * Create number of records for needed factory and put then to the db
   * This method should be used only for initial db filling
   * @param {string} factoryName
   * @param {number} count
   */
  @verbose
  public createRecords(factoryName: string, count: number): void {
    this.afterCreateQueue = [];
    this.internalCreateRecords(factoryName, count, {}, []);
    while (this.afterCreateQueue.length) {
      const {factoryName: fName, id} = this.afterCreateQueue.shift();
      const factory = this.factories[fName].factory;
      const newData = factory.afterCreate.call(null, this.getRecordWithRelationships(fName, id, [], {maxDepth: factory.afterCreateRelationshipsDepth, currentDepth: 1}));
      keys(factory.meta).forEach(attrName => {
        if (newData.hasOwnProperty(attrName) && factory.meta[attrName].type === MetaAttrType.FIELD) {
          this.db[fName][id][attrName] = newData[attrName];
        }
      });
    }
  }

  /**
   * Filter records of needed factory
   * Callback is called with one parameter - record
   * @param {string} factoryName
   * @param {Function} clb
   * @param {CRUDOptions} options
   * @returns {Record[]}
   */
  @verbose
  @assertHasType
  public queryMany(factoryName: string, clb: (record: Record) => boolean, options: CRUDOptions = {depth: Infinity}): Record[] {
    const opts = {maxDepth: options.depth, currentDepth: 1};
    return keys(this.db[factoryName])
      .filter(id => clb.call(null, this.db[factoryName][id]))
      .map(id => this.getRecordWithRelationships(factoryName, id, [], opts));
  }

  /**
   * Get all records of needed factory
   * @param {string} factoryName
   * @param {CRUDOptions} options
   * @returns {Record[]}
   */
  @verbose
  @assertHasType
  public getAll(factoryName: string, options: CRUDOptions = {depth: Infinity}): Record[] {
    const opts = {maxDepth: options.depth, currentDepth: 1};
    return keys(this.db[factoryName]).map(id => this.getRecordWithRelationships(factoryName, id, [], opts));
  }

  /**
   * Get one record of needed factory by its id
   * @param {string} factoryName
   * @param {string} id
   * @param {CRUDOptions} options
   * @returns {Record}
   */
  @verbose
  @assertHasType
  public getOne(factoryName: string, id: string, options: CRUDOptions = {depth: Infinity}): Record {
    const opts = {maxDepth: options.depth, currentDepth: 1};
    return this.getRecordWithRelationships(factoryName, id, [], opts);
  }

  /**
   * Filter one record of needed factory
   * Callback is called with one parameter - record
   * @param {string} factoryName
   * @param {Function} clb
   * @param {CRUDOptions} options
   * @returns {Record}
   */
  @verbose
  @assertHasType
  public queryOne(factoryName: string, clb: (record: Record) => boolean, options: CRUDOptions = {depth: Infinity}): Record {
    const opts = {maxDepth: options.depth, currentDepth: 1};
    const records = this.db[factoryName];
    const ids = keys(records);
    for (const id of ids) {
      if (clb.call(null, records[id])) {
        return this.getRecordWithRelationships(factoryName, id, [], opts);
      }
    }
    return null;
  }

  /**
   * Create one record of needed factory
   * ID is auto generated for new record. Don't include it to `data` (`data.id` will be skipped)
   * All `data`-fields than not declared in the factory will be skipped
   * Relationships with records of other factories will be automatically updated.
   * Important! All related records should already be in the db
   * @param {string} factoryName
   * @param {object} data
   * @param {CRUDOptions} options
   * @returns {Record}
   */
  @verbose
  @assertHasType
  public createOne(factoryName: string, data: any, options: CRUDOptions = {depth: Infinity}): Record {
    const opts = {maxDepth: options.depth, currentDepth: 1};
    const meta = this.getMetaFor(factoryName);
    const id = String(this.factories[factoryName].id);
    this.relationships.addRecord(factoryName, id);
    const newRecord = {id};
    keys(meta).forEach(attrName => {
      if (data.hasOwnProperty(attrName)) {
        newRecord[attrName] = this.createAttrValue(factoryName, id, attrName, data[attrName]);
      }
    });
    this.db[factoryName][id] = newRecord;
    this.factories[factoryName].id++;
    return this.getRecordWithRelationships(factoryName, newRecord.id, [], opts);
  }

  /**
   * Update one record of needed factory
   * ID and any field from `data` which doesn't exist in the factory's meta will be skipped (same as for `createOne`)
   * Relationships with records of other factories will be automatically updated.
   * Important! All related records should already be in the db
   * @param {string} factoryName
   * @param {string} id
   * @param {object} data
   * @param {CRUDOptions} options
   * @returns {Record}
   */
  @verbose
  @assertHasType
  public updateOne(factoryName: string, id: string, data: any, options: CRUDOptions = {depth: Infinity}): Record {
    const opts = {maxDepth: options.depth, currentDepth: 1};
    const record = this.getOne(factoryName, id);
    assert(`Record of "${factoryName}" with id "${id}" doesn't exist`, !!record);
    const meta = this.getMetaFor(factoryName);
    keys(meta).forEach(attrName => {
      if (data.hasOwnProperty(attrName)) {
        record[attrName] = this.createAttrValue(factoryName, id, attrName, data[attrName]);
      }
    });
    this.db[factoryName][id] = record;
    return this.getRecordWithRelationships(factoryName, record.id, [], opts);
  }

  /**
   * Delete one record of needed factory
   * Relationships with records of other factories will be automatically updated
   * @param {string} factoryName
   * @param {string} id
   */
  @verbose
  @assertHasType
  public deleteOne(factoryName: string, id: string): void {
    delete this.db[factoryName][id];
    this.relationships.deleteRelationshipsForRecord(factoryName, id);
  }

  private hasType(type: string): boolean {
    return !!this.db[type];
  }

  private addType(type: string): void {
    this.db[type] = {};
  }

  private internalCreateRecords(factoryName: string, count: number, extraData: any = {}, relatedChain: string[] = []): Record[] {
    assert(`Factory with name "${factoryName}" is not registered`, !!this.factories[factoryName]);
    assert(`Loop is detected in the "createRelated". Chain is ${JSON.stringify(relatedChain)}. You try to create records for "${factoryName}" again.`, relatedChain.indexOf(factoryName) === -1);
    const factoryData = this.factories[factoryName];
    const {meta, createRelated} = factoryData.factory;
    const limit = factoryData.id + count;
    const newRecords = [];
    for (let i = factoryData.id; i < limit; i++) {
      const record = factoryData.factory.createRecord(i);
      this.relationships.addRecord(factoryName, record.id);
      keys(extraData).forEach(k => record[k] = extraData[k]);
      this.db[factoryName][record.id] = record;
      newRecords.push(record);
      this.factories[factoryName].id = i + 1;
      this.afterCreateQueue.push({factoryName, id: record.id});
      if (createRelated) {
        keys(createRelated).forEach(attrName => {
          const fName = meta[attrName].factoryName;
          const isHasMany = meta[attrName].type === MetaAttrType.HAS_MANY;
          const relatedCount = isHasMany ? this.getNeededRelatedRecordsCount(createRelated[attrName], record.id) : 1;
          const eData = {};
          if (meta[attrName].invertedAttrName) {
            eData[meta[attrName].invertedAttrName] = record.id;
          }
          const relatedRecords = this.internalCreateRecords(fName, relatedCount, eData, [...relatedChain, factoryName]);
          this.db[factoryName][record.id][attrName] = isHasMany ? relatedRecords : relatedRecords[0];
        });
      }
      this.relationships.recalculateRelationshipsForRecord(factoryName, this.db[factoryName][record.id]);
    }
    return newRecords;
  }

  private getNeededRelatedRecordsCount(v: any, id: string): number {
    return v instanceof Function ? v.call(null, id) : v;
  }

  private getRecordWithRelationships(factoryName: string, id: string, relatedFor: any = [], options: any = {maxDepth: Infinity, currentDepth: 1}): Record {
    const recordRelationships = this.relationships.getRelationshipsForRecord(factoryName, id);
    const meta = this.getMetaFor(factoryName);
    let record = this.db[factoryName][id];
    if (!record) {
      return null;
    }
    record = copy(record);
    if (options.currentDepth >= options.maxDepth) {
      return {...record, ...recordRelationships};
    }
    if (recordRelationships) {
      keys(recordRelationships).forEach(attrName => {
        const relatedIds = recordRelationships[attrName];
        const relatedFactoryName = meta[attrName].factoryName;
        if (this.isRelated(factoryName, attrName, relatedFor)) {
          record[attrName] = relatedIds;
        } else {
          const isRelatedFor = [...relatedFor, {factoryName, id, attrName}];
          const opts = {...options};
          opts.currentDepth++;
          record[attrName] = isArray(relatedIds) ?
            relatedIds.map(relatedId => this.getRecordWithRelationships(relatedFactoryName, relatedId, isRelatedFor, opts)) :
            (relatedIds ? this.getRecordWithRelationships(relatedFactoryName, relatedIds, isRelatedFor, opts) : null);
        }
      });
    }
    return record;
  }

  private isRelated(factoryName, attrName, relatedFor: any = []) {
    const meta = this.getMetaFor(factoryName);
    const relatedFactoryName = meta[attrName].factoryName;
    return relatedFor.some(r => r.factoryName === relatedFactoryName && r.attrName && r.attrName === meta[attrName].invertedAttrName);
  }

  private createAttrValue(factoryName: string, id: string, attrName: string, val: any): string | string[] | null {
    const meta = this.getMetaFor(factoryName);
    const attrMeta = meta[attrName];
    const {factoryName: distFactoryName, invertedAttrName: distAttrName} = attrMeta;
    const distMeta = this.getMetaFor(distFactoryName);
    if (attrMeta.type === MetaAttrType.HAS_MANY) {
      if (distMeta[distAttrName]) {
        if (distMeta[distAttrName].type === MetaAttrType.HAS_ONE) {
          return this.createManyToOneAttrValue(factoryName, id, attrName, val, distFactoryName, distAttrName);
        }
        if (distMeta[distAttrName].type === MetaAttrType.HAS_MANY) {
          return this.createManyToManyAttrValue(factoryName, id, attrName, val, distFactoryName, distAttrName);
        }
      } else {
        this.relationships.setMany(factoryName, id, attrName, val);
      }
    }
    if (attrMeta.type === MetaAttrType.HAS_ONE) {
      if (distMeta[distAttrName]) {
        if (distMeta[distAttrName].type === MetaAttrType.HAS_ONE) {
          return this.createOneToOneAttrValue(factoryName, id, attrName, val, distFactoryName, distAttrName);
        }
        if (distMeta[distAttrName].type === MetaAttrType.HAS_MANY) {
          return this.createOneToManyAttrValue(factoryName, id, attrName, val, distFactoryName, distAttrName);
        }
      } else {
        this.relationships.setOne(factoryName, id, attrName, val);
      }
    }
    return val;
  }

  private createOneToOneAttrValue(factoryName: string, id: string, attrName: string, newDistId: string, distFactoryName: string, distAttrName: string): string | null {
    if (newDistId === null) {
      this.relationships.deleteRelationshipForAttr(factoryName, id, attrName);
      return null;
    }
    assert(`"${newDistId}" is invalid identifier for record of "${distFactoryName}" [one-to-one relationship]`, isId(newDistId));
    assert(`Record of "${distFactoryName}" with id "${newDistId}" doesn't exist. Create it first [one-to-one relationship]`, !!this.db[distFactoryName][newDistId]);
    this.relationships.createOneToOne(factoryName, id, attrName, newDistId, distFactoryName, distAttrName);
    return newDistId;
  }

  private createManyToOneAttrValue(factoryName: string, id: string, attrName: string, newDistIds: string[], distFactoryName: string, distAttrName: string): string [] | null {
    assert(`Array of ids should be provided for value of "${attrName}" [many-to-one relationship]`, isArray(newDistIds) || newDistIds === null);
    if (newDistIds === null || newDistIds.length === 0) {
      this.relationships.deleteRelationshipForAttr(factoryName, id, attrName);
      return [];
    }
    newDistIds.map(newDistId => {
      assert(`"${newDistId}" is invalid identifier for record of "${distFactoryName}" [many-to-one relationship]`, isId(newDistId));
      assert(`Record of "${distFactoryName}" with id "${newDistId}" doesn't exist. Create it first [many-to-one relationship]`, !!this.db[distFactoryName][newDistId]);
    });
    this.relationships.createManyToOne(factoryName, id, attrName, newDistIds, distFactoryName, distAttrName);
    return newDistIds;
  }

  private createOneToManyAttrValue(factoryName: string, id: string, attrName: string, newDistId: string, distFactoryName: string, distAttrName: string): string | null {
    if (newDistId === null) {
      this.relationships.deleteRelationshipForAttr(factoryName, id, attrName);
      return null;
    }
    assert(`"${newDistId}" is invalid identifier for record of "${distFactoryName}" [one-to-many relationship]`, isId(newDistId));
    assert(`Record of "${distFactoryName}" with id "${newDistId}" doesn't exist. Create it first [one-to-many relationship]`, !!this.db[distFactoryName][newDistId]);
    this.relationships.createOneToMany(factoryName, id, attrName, newDistId, distFactoryName, distAttrName);
    return newDistId;
  }

  private createManyToManyAttrValue(factoryName: string, id: string, attrName: string, newDistIds: string[], distFactoryName: string, distAttrName: string): string[] | null {
    assert(`Array of ids should be provided for value of "${attrName}" [many-to-many relationship]`, isArray(newDistIds) || newDistIds === null);
    if (newDistIds === null || newDistIds.length === 0) {
      this.relationships.deleteRelationshipForAttr(factoryName, id, attrName);
      return [];
    }
    newDistIds.map(newDistId => {
      assert(`"${newDistId}" is invalid identifier for record of "${distFactoryName}" [many-to-many relationship]`, isId(newDistId));
      assert(`Record of "${distFactoryName}" with id "${newDistId}" doesn't exist. Create it first [many-to-many relationship]`, !!this.db[distFactoryName][newDistId]);
    });
    this.relationships.createManyToMany(factoryName, id, attrName, newDistIds, distFactoryName, distAttrName);
    return newDistIds;
  }

  private getMetaFor(factoryName: string): Meta {
    return this.meta[factoryName];
  }

}
