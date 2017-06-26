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
  type: MetaAttrType;
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
   * @returns {{factoryName: string, invertedAttrName: string, type: MetaAttrType}}
   */
  public static hasOne(factoryName: string, invertedAttrName: string): RelationshipMetaAttr {
    return {factoryName, invertedAttrName, type: MetaAttrType.HAS_ONE};
  }

  /**
   * Use `Factory.hasMany` for relationship-fields
   * Used for 'many-to-one' and 'many-to-many'
   * @param {string} factoryName
   * @param {string} invertedAttrName
   * @returns {{factoryName: string, invertedAttrName: string, type: MetaAttrType}}
   */
  public static hasMany(factoryName: string, invertedAttrName: string): RelationshipMetaAttr {
    return {factoryName, invertedAttrName, type: MetaAttrType.HAS_MANY};
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
            options.get = function() {
              return attr.call(this);
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
