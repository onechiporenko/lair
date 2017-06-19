import {Record} from './record';
import {assert} from './utils';

const {keys} = Object;

export enum MetaAttrType {
  FIELD,
  HAS_ONE,
  HAS_MANY
}
export interface FactoryData {
  factory: Factory;
  id: number;
}
export interface Meta {
  [p: string]: MetaAttr;
}
export interface MetaAttr {
  type: MetaAttrType,
  [prop: string]: any
}
export interface RelationshipMetaAttr extends MetaAttr {
  factoryName: string,
  invertedAttrName: string,
  type: MetaAttrType
}

/**
 * Factories are used for data-generation. Each generated data-item is called 'record'.
 * First you need to create a child-class of Factory with filled `attrs`-property. Each `attrs`-field represents one property of the record.
 * Value for each field may be one of the 3 types - static, dynamic and relationship:
 *  - Static field has value that is the same for all generated records for current factory
 *  - Dynamic field is recalculated for every generated record
 *  - Relationship field is used to show that value is a record of the another factory. Relationship may be "has_one" (single record) and "has_many" (array of records)
 * @class Factory
 */
export default class Factory {
  public attrs = {};
  public createRelated: { [attrName: string]: number | ((id: string) => number) } = {};
  private _meta: Meta = null;

  get meta() {
    if (!this._meta) {
      this.getMeta();
    }
    return this._meta;
  }

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

  protected parseAttr(val, id: number) {
    return val instanceof Function ? val.call(null, id) : val;
  }

  protected getMeta(): void {
    if (this._meta) {
      return;
    }
    this._meta = {};
    const attrs = this.attrs;
    keys(attrs).forEach(attrName => {
      const val = attrs[attrName];
      // dummy way to check that val is relation declaration
      if (val.type && val.factoryName) {
        this._meta[attrName] = val;
      }
      else {
        this._meta[attrName] = {type: MetaAttrType.FIELD};
      }
    });
  }

  protected checkAttrs(): void {
    assert(`Don't add "id" to the "attrs"`, !this.attrs['id']);
  }

  /**
   * Forget about this. It's only for Lair
   * @param {string} id
   * @returns {Record}
   */
  public createRecord(id: number): Record {
    this.getMeta();
    this.checkAttrs();
    const attrs = this.attrs;
    const newRecord = <Record>{id: String(id)};
    keys(attrs).forEach(attrName => newRecord[attrName] = this.parseAttr(attrs[attrName], id));
    return newRecord;
  }
}
