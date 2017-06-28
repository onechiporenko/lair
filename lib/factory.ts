import {Record} from './record';
import {assert} from './utils';

const {keys, defineProperty} = Object;

export enum MetaAttrType {
  FIELD,
  HAS_ONE,
  HAS_MANY,
}
export interface FactoryData {
  factory: Factory;
  id: number;
}
export interface Meta {
  [p: string]: MetaAttr;
}
export interface MetaAttr {
  type: MetaAttrType;
  [prop: string]: any;
}
export interface RelationshipMetaAttr extends MetaAttr {
  factoryName: string;
  invertedAttrName: string;
  reflexive: boolean;
  reflexiveDepth: number;
  type: MetaAttrType;
}
export interface RelationshipOptions {
  reflexive: boolean;
  depth: number;
}

export interface CreateOptions {
  attrs?: any;
  createRelated?: any;
  afterCreate?: (record: Record) => Record;
  afterCreateRelationshipsDepth?: number;
}

function getVal(obj, key, defaultVal) {
  return obj && obj.hasOwnProperty(key) ? obj[key] : defaultVal;
}

/**
 * Factories are used for data-generation. Each generated data-item is called 'record'.
 * First you need to create a child-class of Factory with filled `attrs`-property.
 * Each `attrs`-field represents one property of the record.
 *
 * Value for each field may be one of the 3 types - static, dynamic and relationship:
 *  - Static field has value that is the same for all generated records for current factory
 *  - Dynamic field is recalculated for every generated record
 *  - Relationship field is used to show that value is a record of the another factory.
 *    Relationship may be "has_one" (single record) and "has_many" (array of records)
 * @class Factory
 */
export class Factory {

  /**
   * Use `Factory.hasOne` for relationship-fields
   * Used for 'one-to-one' and 'one-to-many'
   * @param {string} factoryName
   * @param {string} invertedAttrName
   * @param {RelationshipOptions} options
   * @returns {RelationshipMetaAttr}
   */
  public static hasOne(factoryName: string, invertedAttrName: string, options?: RelationshipOptions): RelationshipMetaAttr {
    const reflexive = getVal(options, 'reflexive', false);
    const reflexiveDepth = reflexive ? getVal(options, 'depth', 2) : 2;
    return {factoryName, invertedAttrName, type: MetaAttrType.HAS_ONE, reflexive, reflexiveDepth};
  }

  /**
   * Use `Factory.hasMany` for relationship-fields
   * Used for 'many-to-one' and 'many-to-many'
   * @param {string} factoryName
   * @param {string} invertedAttrName
   * @param {RelationshipOptions} options
   * @returns {RelationshipMetaAttr}
   */
  public static hasMany(factoryName: string, invertedAttrName: string, options?: RelationshipOptions): RelationshipMetaAttr {
    const reflexive = getVal(options, 'reflexive', false);
    const reflexiveDepth = reflexive ? getVal(options, 'depth', 2) : 2;
    return {factoryName, invertedAttrName, type: MetaAttrType.HAS_MANY, reflexive, reflexiveDepth};
  }

  public static create(options: CreateOptions): Factory {
    const factory = new Factory();
    factory.attrs = options.attrs || {};
    factory.createRelated = options.createRelated || {};
    factory.afterCreate = options.afterCreate || (r => r);
    factory.afterCreateRelationshipsDepth = options.afterCreateRelationshipsDepth || Infinity;
    return factory;
  }

  public attrs = {};
  public afterCreateRelationshipsDepth = Infinity;
  public createRelated: { [attrName: string]: number | ((id: string) => number) } = {};
  get meta() {
    if (!this.internalMeta) {
      this.getMeta();
    }
    return this.internalMeta;
  }

  private internalMeta: Meta = null;
  private internalFactory = null;

  private constructor() {}

  /**
   * Forget about this. It's only for Lair
   * @param {string} id
   * @returns {Record}
   */
  public createRecord(id: number): Record {
    this.checkAttrs();
    const attrs = this.attrs;
    const newRecord = {id: String(id)} as Record;
    const n = new this.internalFactory(id);
    keys(attrs).forEach(attrName => newRecord[attrName] = n[attrName]);
    return newRecord;
  }

  public afterCreate(record: Record): Record {
    return record;
  }

  public init(): void {
    this.getMeta();
    this.checkAttrs();
    this.initInternalFactory();
  }

  protected initInternalFactory(): void {
    const attrs = this.attrs;
    function internalFactory(id) {
      this.id = String(id);
      this.cache = {};
      keys(attrs).forEach(attrName => {
        const attr = attrs[attrName];
        const options: PropertyDescriptor = {enumerable: true};
        if (attr.type === MetaAttrType.HAS_ONE) {
          options.value = null;
        }
        if (attr.type === MetaAttrType.HAS_MANY) {
          options.value = [];
        }
        if (!attr.type) {
          if (attr instanceof Function) {
            const self = this;
            options.get = function() {
              if (!self.cache.hasOwnProperty(attrName)) {
                self.cache[attrName] = attr.call(this);
              }
              return self.cache[attrName];
            };
          } else {
            options.value = attr;
          }
        }
        defineProperty(this, attrName, options);
      });
    }
    this.internalFactory = internalFactory;
  }

  protected getMeta(): void {
    if (this.internalMeta) {
      return;
    }
    this.internalMeta = {};
    const attrs = this.attrs;
    keys(attrs).forEach(attrName => {
      const val = attrs[attrName];
      // dummy way to check that val is relation declaration
      if (val.type && val.factoryName) {
        this.internalMeta[attrName] = val;
      } else {
        this.internalMeta[attrName] = {type: MetaAttrType.FIELD};
      }
    });
  }

  protected checkAttrs(): void {
    assert(`Don't add "id" to the "attrs"`, !this.attrs.hasOwnProperty('id'));
  }

}
