import Factory, {FactoryData, Meta, MetaAttrType} from './factory';
import {Record} from './record';
import Relationships from './relationships';
import {isId, assert} from './utils';

const {keys} = Object;
const {isArray} = Array;

function assertHasType(target, key, descriptor): any {
  if (descriptor === undefined) {
    descriptor = Object.getOwnPropertyDescriptor(target, key);
  }
  const originalMethod = descriptor.value;
  descriptor.value = function (...args) {
    const type = args[0];
    assert(`"${type}"-type doesn't exist in the database`, this.hasType(type));
    return originalMethod.apply(this, args);
  };
  return descriptor;
}

export interface InternalDb {
  [factoryName: string]: {
    [recordId: string]: Record;
  }
}

interface internalMetaStore {
  [factoryName: string]: Meta;
}

/**
 * @class Lair
 */
export default class Lair {
  private factories: { [id: string]: FactoryData } = {};
  private relationships: Relationships;
  private db: InternalDb = {};
  private meta: internalMetaStore = {};

  private constructor() {
    this.relationships = new Relationships();
  }
  private hasType(type: string): boolean {
    return !!this.db[type];
  }
  private addType(type: string): void {
    this.db[type] = {};
  }
  private getMetaFor(factoryName: string): Meta {
    return this.meta[factoryName];
  }

  private static instance: Lair;

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

  /**
   * Register factory instance in the Lair
   * Lair works only with registered factories
   * @param {Factory} factory
   * @param {string} factoryName
   */
  public registerFactory(factory: Factory, factoryName: string): void {
    const fName = factoryName || factory.constructor['name'].toLowerCase();
    assert(`Factory with name "${fName}" is already registered`, !this.factories[fName]);
    this.factories[fName] = <FactoryData>{factory, id: 1};
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
  public createRecords(factoryName: string, count: number): void {
    this.internalCreateRecords(factoryName, count, {}, []);
  }

  private internalCreateRecords(factoryName: string, count: number, extraData: any = {}, relatedChain: string[] = []): Record[] {
    assert(`Factory with name "${factoryName}" is not registered`, !!this.factories[factoryName]);
    assert(`Loop is detected in the "createRelated". Chain is ${JSON.stringify(relatedChain)}. You try to create records for "${factoryName}" again.`, relatedChain.indexOf(factoryName) === -1);
    const factoryData = this.factories[factoryName];
    const related = factoryData.factory.createRelated;
    const meta = factoryData.factory.meta;
    const limit = factoryData.id + count;
    const newRecords = [];
    for (let i = factoryData.id; i < limit; i++) {
      const record = factoryData.factory.createRecord(i);
      this.relationships.addRecord(factoryName, record.id);
      keys(extraData).forEach(k => record[k] = extraData[k]);
      this.db[factoryName][record.id] = record;
      newRecords.push(record);
      this.factories[factoryName].id = i + 1;
      if(related) {
        keys(related).forEach(attrName => {
          const fName = meta[attrName].factoryName;
          const isHasMany = meta[attrName].type === MetaAttrType.HAS_MANY;
          const relatedCount = isHasMany ? this.getNeededRelatedRecordsCount(related[attrName], record.id) : 1;
          const extraData = {};
          if (meta[attrName].invertedAttrName) {
            extraData[meta[attrName].invertedAttrName] = record.id;
          }
          const relatedRecords = this.internalCreateRecords(fName, relatedCount, extraData, [...relatedChain, factoryName]);
          this.db[factoryName][record.id][attrName] = isHasMany ? relatedRecords : relatedRecords[0];
        });
      }
      this.relationships.recalculateRelationshipsForRecord(factoryName, record);
    }
    return newRecords;
  }

  private getNeededRelatedRecordsCount(v: any, id: string): number {
    return v instanceof Function ? v.call(null, id) : v;
  }

  private getRecordWithRelationships(factoryName: string, id: string, relatedFor: any = {}): Record {
    const recordRelationships = this.relationships.getRelationshipsForRecord(factoryName, id);
    const meta = this.getMetaFor(factoryName);
    let record = this.db[factoryName][id];
    if (!record) {
      return null;
    }
    record = JSON.parse(JSON.stringify(record));
    if (recordRelationships) {
      keys(recordRelationships).forEach(attrName => {
        const relatedIds = recordRelationships[attrName];
        const relatedFactoryName = meta[attrName].factoryName;
        if (relatedFor.factoryName === relatedFactoryName && relatedFor.attrName && relatedFor.attrName === meta[attrName].invertedAttrName) {
          record[attrName] = relatedIds;
        }
        else {
          const isRelatedFor = {factoryName, id, attrName};
          record[attrName] = isArray(relatedIds) ?
            relatedIds.map(relatedId => this.getRecordWithRelationships(relatedFactoryName, relatedId, isRelatedFor)) :
            (relatedIds ? this.getRecordWithRelationships(relatedFactoryName, relatedIds, isRelatedFor) : null);
        }
      });
    }
    return record;
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
      }
      else {
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
      }
      else {
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

  /**
   * Filter records of needed factory
   * Callback is called with one parameter - record
   * @param {string} factoryName
   * @param {Function} clb
   * @returns {Record[]}
   */
  @assertHasType
  public queryMany(factoryName: string, clb: Function): Record[] {
    return keys(this.db[factoryName])
      .filter(id => clb.call(null, this.db[factoryName][id]))
      .map(id => this.getRecordWithRelationships(factoryName, id));
  }

  /**
   * Get all records of needed factory
   * @param {string} factoryName
   * @returns {Record[]}
   */
  @assertHasType
  public getAll(factoryName: string): Record[] {
    return keys(this.db[factoryName]).map(id => this.getRecordWithRelationships(factoryName, id));
  }

  /**
   * Get one record of needed factory by its id
   * @param {string} factoryName
   * @param {string} id
   * @returns {Record}
   */
  @assertHasType
  public getOne(factoryName: string, id: string): Record {
    return this.getRecordWithRelationships(factoryName, id);
  }

  /**
   * Filter one record of needed factory
   * Callback is called with one parameter - record
   * @param {string} factoryName
   * @param {Function} clb
   * @returns {Record}
   */
  @assertHasType
  public queryOne(factoryName: string, clb: Function): Record {
    const records = this.db[factoryName];
    const ids = keys(records);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (clb.call(null, records[id])) {
        return this.getRecordWithRelationships(factoryName, id);
      }
    }
    return null;
  }

  /**
   * Create one record of needed factory
   * ID is auto generated for new record. Don't include it to `data` (`data.id` will be skipped)
   * All `data`-fields than not declared in the factory will be skipped
   * Relationships with records of other factories will be automatically updated. Important! All related records should already be in the db
   * @param {string} factoryName
   * @param {object} data
   * @returns {Record}
   */
  @assertHasType
  public createOne(factoryName: string, data: any): Record {
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
    return this.getRecordWithRelationships(factoryName, newRecord.id);
  }

  /**
   * Update one record of needed factory
   * ID and any field from `data` which doesn't exist in the factory's meta will be skipped (same as for `createOne`)
   * Relationships with records of other factories will be automatically updated. Important! All related records should already be in the db
   * @param {string} factoryName
   * @param {string} id
   * @param {object} data
   * @returns {Record}
   */
  @assertHasType
  public updateOne(factoryName: string, id: string, data: any): Record {
    const record = this.getOne(factoryName, id);
    assert(`Record of "${factoryName}" with id "${id}" doesn't exist`, !!record);
    const meta = this.getMetaFor(factoryName);
    keys(meta).forEach(attrName => {
      if (data.hasOwnProperty(attrName)) {
        record[attrName] = this.createAttrValue(factoryName, id, attrName, data[attrName]);
      }
    });
    this.db[factoryName][id] = record;
    return this.getRecordWithRelationships(factoryName, record.id);
  }

  /**
   * Delete one record of needed factory
   * Relationships with records of other factories will be automatically updated
   * @param {string} factoryName
   * @param {string} id
   */
  @assertHasType
  public deleteOne(factoryName: string, id: string): void {
    delete this.db[factoryName][id];
    this.relationships.deleteRelationshipsForRecord(factoryName, id);
  }

}