import {CreateRecordExtraData, Factory, FactoryData, Meta, MetaAttrType} from './factory';
import {Record} from './record';
import {Relationships} from './relationships';
import {assert, copy, getOrCalcValue, isId} from './utils';

import {assertCrudOptions, assertHasType, assertLoops, getLastItemsCount, verbose} from './decorators';

function getDefaultCrudOptions(options) {
  return {maxDepth: options.depth || Infinity, currentDepth: 1, ignoreRelated: options.ignoreRelated || []};
}

const {keys} = Object;
const {isArray} = Array;

export interface InternalDb {
  [factoryName: string]: {
    [recordId: string]: Record;
  };
}

export interface InternalMetaStore {
  [factoryName: string]: Meta;
}

interface AfterCreateItem {
  factoryName: string;
  id: string;
}

export interface CRUDOptions {
  depth?: number;
  ignoreRelated?: string[];
  handleNotAttrs?: boolean;
}

export interface DevInfoItem {
  count: number;
  id: number;
  meta: InternalMetaStore;
}

export interface DevInfo {
  [factoryName: string]: DevInfoItem;
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
    assert(`Factory with name "${factoryName}" is already registered`, !this.factories[factoryName]);
    this.factories[factoryName] = {factory, id: 1} as FactoryData;
    this.meta[factoryName] = factory.meta;
    this.relationships.addFactory(factoryName);
    this.relationships.updateMeta(this.meta);
    this.addType(factoryName);
    factory.init();
  }

  /**
   * Create number of records for needed factory and put then to the db
   * This method can be used only for initial db filling
   * @param {string} factoryName
   * @param {number} count
   */
  @verbose
  public createRecords(factoryName: string, count: number): void {
    this.afterCreateQueue = [];
    this.internalCreateRecords(factoryName, count);
    while (this.afterCreateQueue.length) {
      const {factoryName: fName, id} = this.afterCreateQueue.shift();
      const factory = this.factories[fName].factory;
      const newData = factory.afterCreate.call(null, this.getRecordWithRelationships(fName, id, [], {maxDepth: factory.afterCreateRelationshipsDepth, currentDepth: 1, ignoreRelated: factory.afterCreateIgnoreRelated || []}));
      keys(factory.meta).forEach(attrName => {
        if (newData.hasOwnProperty(attrName) && factory.meta[attrName].type === MetaAttrType.FIELD) {
          this.db[fName][id][attrName] = newData[attrName];
        }
      });
    }
  }

  /**
   * Load records data from the predefined JSON's to the db
   * This method can be used only for initial db filling
   * @param {string} factoryName
   * @param {object[]} data
   */
  @verbose
  @assertHasType
  public loadRecords(factoryName: string, data: object[]): void {
    assert(`"${factoryName}" must have "allowCustomIds" set to "true"`, this.factories[factoryName].factory.allowCustomIds);
    data.forEach(item => {
      this.createOne(factoryName, item);
    });
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
  @assertCrudOptions
  public queryMany(factoryName: string, clb: (record: Record) => boolean, options: CRUDOptions = {}): Record[] {
    const opts = getDefaultCrudOptions(options);
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
  @assertCrudOptions
  public getAll(factoryName: string, options: CRUDOptions = {}): Record[] {
    const opts = getDefaultCrudOptions(options);
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
  @assertCrudOptions
  public getOne(factoryName: string, id: string, options: CRUDOptions = {}): Record {
    const opts = getDefaultCrudOptions(options);
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
  @assertCrudOptions
  public queryOne(factoryName: string, clb: (record: Record) => boolean, options: CRUDOptions = {}): Record {
    const opts = getDefaultCrudOptions(options);
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
  @assertCrudOptions
  public createOne(factoryName: string, data: any, options: CRUDOptions = {}): Record {
    const opts = getDefaultCrudOptions(options);
    const meta = this.getMetaFor(factoryName);
    const id = this.factories[factoryName].factory.allowCustomIds ? data.id : String(this.factories[factoryName].id);
    const factory = this.factories[factoryName].factory;
    this.relationships.addRecord(factoryName, id);
    const newRecord = {id, ...factory.getDefaults()};
    keys(data).forEach(attrName => {
      if (meta.hasOwnProperty(attrName)) {
        newRecord[attrName] = this.createAttrValue(factoryName, id, attrName, data[attrName]);
      } else {
        if (options.handleNotAttrs && attrName !== 'id') {
          newRecord[attrName] = data[attrName];
        }
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
  @assertCrudOptions
  public updateOne(factoryName: string, id: string, data: any, options: CRUDOptions = {}): Record {
    const opts = getDefaultCrudOptions(options);
    const record = this.getOne(factoryName, id);
    assert(`Record of "${factoryName}" with id "${id}" doesn't exist`, !!record);
    const meta = this.getMetaFor(factoryName);
    keys(data).forEach(attrName => {
      if (meta.hasOwnProperty(attrName)) {
        record[attrName] = this.createAttrValue(factoryName, id, attrName, data[attrName]);
      } else {
        if (options.handleNotAttrs && attrName !== 'id') {
          record[attrName] = data[attrName];
        }
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

  /**
   * Get info about current Lair state:
   *  - Registered factories
   *  - ID-value for each factory
   *  - Records count for each factory
   *  - Meta-info for each factory
   * @returns {DevInfo}
   */
  public getDevInfo(): DevInfo {
    const ret = {};
    Object.keys(this.factories).forEach(factoryName => {
      ret[factoryName] = {
        count: Object.keys(this.db[factoryName]).length,
        id: this.factories[factoryName].id,
        meta: copy(this.getMetaFor(factoryName)),
      };
    });
    return ret;
  }

  private hasType(type: string): boolean {
    return !!this.db[type];
  }

  private addType(type: string): void {
    this.db[type] = {};
  }

  private internalCreateRecords(factoryName: string, count: number, parentData: any = {factoryName: '', attrName: ''}, relatedChain: string[] = []): Record[] {
    assert(`Factory with name "${factoryName}" is not registered`, !!this.factories[factoryName]);
    if (factoryName === parentData.factoryName) {
      // try to check reflexive relationships
      const m = this.getMetaFor(parentData.factoryName);
      const attrMeta = m[parentData.attrName];
      if (attrMeta.reflexive) {
        const depth = attrMeta.reflexiveDepth;
        const alreadyCreatedCount = getLastItemsCount(relatedChain, factoryName);
        if (depth === alreadyCreatedCount) {
          return [];
        }
      } else {
        assertLoops(parentData.factoryName, relatedChain);
      }
    } else {
      // check factories as usual
      assertLoops(factoryName, relatedChain);
    }
    const factoryData = this.factories[factoryName];
    const {meta, createRelated} = factoryData.factory;
    const newRecords = [];
    let counter = 1;
    for (let i = 0; i < count; i++) {
      const relatedTo = relatedChain.length ? {
        currentRecordNumber: counter,
        factoryName: relatedChain[relatedChain.length - 1],
        recordsCount: count,
      } : {};
      const record = factoryData.factory.createRecord(this.factories[factoryName].id, {relatedTo} as CreateRecordExtraData);
      this.relationships.addRecord(factoryName, record.id);
      this.db[factoryName][record.id] = record;
      newRecords.push(record);
      this.factories[factoryName].id++;
      this.afterCreateQueue.push({factoryName, id: record.id});
      if (createRelated) {
        keys(createRelated).forEach(attrName => {
          const fName = meta[attrName].factoryName;
          const isHasMany = meta[attrName].type === MetaAttrType.HAS_MANY;
          const relatedCount = isHasMany ? getOrCalcValue(createRelated[attrName], record, record.id) : 1;
          const relatedRecords = this.internalCreateRecords(fName, relatedCount, {factoryName, attrName}, [...relatedChain, factoryName]);
          this.db[factoryName][record.id][attrName] = isHasMany ? relatedRecords : relatedRecords[0];
        });
      }
      this.relationships.recalculateRelationshipsForRecord(factoryName, this.db[factoryName][record.id]);
      counter++;
    }
    return newRecords;
  }

  private getRecordWithRelationships(factoryName: string, id: string, relatedFor: any = [], options: any = {maxDepth: Infinity, currentDepth: 1, ignoreRelated: []}): Record {
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
        if ((options.ignoreRelated || []).indexOf(relatedFactoryName) !== -1) {
          delete record[attrName];
          return;
        }
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
    assert(`"${newDistId}" is invalid identifier for record of "${distFactoryName}" [one-to-one relationship]`, isId(newDistId) || this.factories[factoryName].factory.allowCustomIds);
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
      assert(`"${newDistId}" is invalid identifier for record of "${distFactoryName}" [many-to-one relationship]`, isId(newDistId) || this.factories[factoryName].factory.allowCustomIds);
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
    assert(`"${newDistId}" is invalid identifier for record of "${distFactoryName}" [one-to-many relationship]`, isId(newDistId) || this.factories[factoryName].factory.allowCustomIds);
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
      assert(`"${newDistId}" is invalid identifier for record of "${distFactoryName}" [many-to-many relationship]`, isId(newDistId) || this.factories[factoryName].factory.allowCustomIds);
      assert(`Record of "${distFactoryName}" with id "${newDistId}" doesn't exist. Create it first [many-to-many relationship]`, !!this.db[distFactoryName][newDistId]);
    });
    this.relationships.createManyToMany(factoryName, id, attrName, newDistIds, distFactoryName, distAttrName);
    return newDistIds;
  }

  private getMetaFor(factoryName: string): Meta {
    return this.meta[factoryName];
  }

}
