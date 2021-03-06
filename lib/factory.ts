import {Record} from './record';
import {assert, copy, getOrCalcValue, getVal} from './utils';

const {keys, defineProperty} = Object;

export enum MetaAttrType {
  NONE,
  FIELD,
  HAS_ONE,
  HAS_MANY,
  SEQUENCE_ITEM,
}

export interface FactoryData {
  factory: Factory;
  id: number;
}

export interface Meta {
  [p: string]: MetaAttr | FieldMetaAttr<any> | SequenceMetaAttr<any> | RelationshipMetaAttr;
}

export interface MetaAttr {
  type: MetaAttrType;
  [prop: string]: any;
}

export interface SequenceMetaAttr<T> extends MetaAttr {
  initialValue: T;
  getNextValue: (prevItems: T[]) => T;
  prevValues: T[];
  lastValuesCount: number;
}

export interface RelationshipMetaAttr extends MetaAttr {
  factoryName: string;
  invertedAttrName: string;
  reflexive: boolean;
  reflexiveDepth: number;
}

export interface FieldMetaAttr<T> extends MetaAttr {
  defaultValue?: T;
  allowedValues?: T[]; // something like enum
  preferredType?: string;
  value: T | (() => T);
}

export interface RelationshipOptions {
  reflexive: boolean;
  depth: number;
}

export interface SequenceItemOptions {
  lastValuesCount: number;
}

export interface FieldOptions<T> {
  defaultValue?: T;
  value: T | (() => T);
  preferredType?: string;
  allowedValues?: T[];
}

export interface Attrs {
  [prop: string]: any;
}

export interface CreateOptions {
  name?: string;
  attrs?: Attrs;
  createRelated?: CreateRelatedOptions;
  allowCustomIds?: boolean;
  afterCreate?: (record: Record, extraData?: CreateRecordExtraData) => Record;
  afterCreateRelationshipsDepth?: number;
  afterCreateIgnoreRelated?: string[];
}

export interface CreateRelatedOptions {
  [attrName: string]: number | ((id: string) => number);
}

export interface CreateRecordExtraData {
  relatedTo?: RelatedToData;
  [key: string]: any;
}

export interface RelatedToData {
  currentRecordNumber: number;
  factoryName: string;
  recordsCount: number;
}

function _attrsToFields(attrs: Meta): Meta {
  keys(attrs).forEach(attrName => {
    if (!attrs[attrName].type) {
      attrs[attrName] = {
        type: MetaAttrType.FIELD,
        value: attrs[attrName],
      };
    }
  });
  return attrs;
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
 *  - Sequence item which value is based on previously generated values (for older records)
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
    const reflexive = getVal<boolean>(options, 'reflexive', false);
    const reflexiveDepth = reflexive ? getVal<number>(options, 'depth', 2) : 2;
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
    const reflexive = getVal<boolean>(options, 'reflexive', false);
    const reflexiveDepth = reflexive ? getVal<number>(options, 'depth', 2) : 2;
    return {factoryName, invertedAttrName, type: MetaAttrType.HAS_MANY, reflexive, reflexiveDepth};
  }

  /**
   * Use `Factory.sequenceItem` for fields that depends on previously generated values
   * @param {*|Function} initialValue
   * @param {Function} getNextValue
   * @param {SequenceItemOptions} options
   * @returns {SequenceMetaAttr}
   */
  public static sequenceItem<T>(initialValue: T, getNextValue: (prevValues: T[]) => T, options?: SequenceItemOptions): SequenceMetaAttr<T> {
    return {
      getNextValue,
      initialValue: getOrCalcValue<T>(initialValue),
      lastValuesCount: options && options.hasOwnProperty('lastValuesCount') ? options.lastValuesCount : Infinity,
      prevValues: [],
      type: MetaAttrType.SEQUENCE_ITEM,
    };
  }

  /**
   *
   * @param {FieldOptions} fieldOptions
   * @returns {FieldMetaAttr}
   */
  public static field<T>(fieldOptions: FieldOptions<T>): FieldMetaAttr<T> {
    assert(`"defaultValue" can't be a function`, !(fieldOptions.defaultValue instanceof Function));
    if (!fieldOptions.hasOwnProperty('defaultValue') && !(fieldOptions.value instanceof Function)) {
      fieldOptions.defaultValue = copy<T>(fieldOptions.value);
    }
    const allowedValues = fieldOptions.allowedValues || [];
    if (!(fieldOptions.value instanceof Function)) {
      assert(`"value" must be one of the "allowedValues". You passed "${fieldOptions.value}"`, !allowedValues.length || allowedValues.indexOf(fieldOptions.value) !== -1);
    }
    const ret = {
      allowedValues,
      type: MetaAttrType.FIELD,
      value: fieldOptions.value,
    };

    ['defaultValue', 'preferredType'].map(prop => {
      if (fieldOptions.hasOwnProperty(prop)) {
        ret[prop] = fieldOptions[prop];
      }
    });
    return ret;
  }

  /**
   *
   * @param {CreateOptions} options
   * @returns {Factory}
   */
  public static create(options: CreateOptions): Factory {
    const factory = new Factory();
    factory.internalName = options.name;
    factory.attrs = _attrsToFields(options.attrs || {});
    factory.createRelated = options.createRelated || {};
    factory.afterCreate = options.afterCreate || (r => r);
    factory.allowCustomIds = options.allowCustomIds || false;
    factory.afterCreateRelationshipsDepth = getVal<number>(options, 'afterCreateRelationshipsDepth', Infinity);
    factory.afterCreateIgnoreRelated = getVal<string[]>(options, 'afterCreateIgnoreRelated', []);
    return factory;
  }

  /**
   *
   * @param {Factory} source
   * @param {CreateOptions} options
   * @returns {Factory}
   */
  public static extend(source: Factory, options: CreateOptions): Factory {
    const factory = new Factory();
    factory.attrs = _attrsToFields({...source.attrs, ...(options.attrs || {})});
    // drop prevValues for all sequence attrs
    keys(factory.attrs).forEach(attrName => {
      if (factory.attrs[attrName].type === MetaAttrType.SEQUENCE_ITEM) {
        factory.attrs[attrName].prevValues = [];
      }
    });
    factory.createRelated = {...source.createRelated, ...(options.createRelated || {})};
    // check if some attrs were relations in the source-factory and become not-relations in the new factory
    // such attrs should be removed from `createRelated`
    keys(factory.createRelated).forEach(attrName => {
      const type = factory.attrs[attrName].type;
      if (type !== MetaAttrType.HAS_MANY && type !== MetaAttrType.HAS_ONE) {
        delete factory.createRelated[attrName];
      }
    });
    factory.internalName = options.name;
    factory.allowCustomIds = options.allowCustomIds || source.allowCustomIds;
    factory.afterCreate = options.afterCreate || source.afterCreate;
    factory.afterCreateRelationshipsDepth = getVal<number>(options, 'afterCreateRelationshipsDepth', source.afterCreateRelationshipsDepth);
    factory.afterCreateIgnoreRelated = getVal<string[]>(options, 'afterCreateIgnoreRelated', source.afterCreateIgnoreRelated);
    return factory;
  }

  public attrs: Attrs = {};
  public afterCreateRelationshipsDepth: number = Infinity;
  public afterCreateIgnoreRelated: string[] = [];
  public allowCustomIds: boolean = false;
  public createRelated: CreateRelatedOptions = {};

  get meta(): Meta {
    if (!this.internalMeta) {
      this.getMeta();
    }
    return this.internalMeta;
  }

  public get name(): string {
    return this.internalName;
  }

  private internalMeta: Meta = null;
  private internalFactory: (id: number, extraData: CreateRecordExtraData) => void = null;
  private internalName: string = '';

  private constructor() {
  }

  /**
   * Forget about this. It's only for Lair
   * @param {string} id
   * @param {CreateRecordExtraData} [extraData]
   * @returns {Record}
   */
  public createRecord(id: number, extraData: CreateRecordExtraData = {}): Record {
    this.checkAttrs();
    const attrs = this.attrs;
    const newRecord = {id: String(id)} as Record;
    const n = new this.internalFactory(id, extraData);
    keys(attrs).forEach(attrName => newRecord[attrName] = n[attrName]);
    return newRecord;
  }

  public afterCreate(record: Record, extraData: CreateRecordExtraData): Record {
    return record;
  }

  /**
   * Return object with default values for attributes
   * Only attributes with type `FIELD` and provided `defaultValue` are affected
   * @returns {Object}
   */
  public getDefaults(): object {
    return keys(this.meta).reduce((defaults, attrName) => {
      const attrMeta = this.meta[attrName] as FieldMetaAttr<any>;
      if (attrMeta.hasOwnProperty('defaultValue')) {
        defaults[attrName] = copy(attrMeta.defaultValue);
      }
      return defaults;
    }, {});
  }

  public init(): void {
    this.checkAttrs();
    this.getMeta();
    this.initInternalFactory();
  }

  protected initInternalFactory(): void {
    const attrs = this.attrs;

    function internalFactory(id: number, extraData: CreateRecordExtraData = {}): void {
      this.id = String(id);
      this.extraData = extraData;
      this.cache = {}; // you can get it from the dynamic attributes but I hope you will only read it
      keys(attrs).forEach(attrName => {
        const attr = attrs[attrName];
        const options: PropertyDescriptor = {enumerable: true};
        if (attr.type === MetaAttrType.HAS_ONE) {
          options.value = null;
        }
        if (attr.type === MetaAttrType.HAS_MANY) {
          options.value = [];
        }
        if (attr.type === MetaAttrType.SEQUENCE_ITEM) {
          const self = this;
          options.get = function(): any {
            if (!self.cache.hasOwnProperty(attrName)) {
              self.cache[attrName] = id === 1 ?
                attr.initialValue :
                attr.getNextValue.call(this, copy(attr.prevValues.slice(-attr.lastValuesCount)));
              attr.prevValues.push(self.cache[attrName]);
            }
            return self.cache[attrName];
          };
        }
        if (attr.type === MetaAttrType.FIELD) {
          const v = attr.value;
          if (v instanceof Function) {
            const self = this;
            options.get = function(): any {
              if (!self.cache.hasOwnProperty(attrName)) {
                self.cache[attrName] = v.call(this, attr.defaultValue);
              }
              return self.cache[attrName];
            };
          } else {
            options.value = copy(v);
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
      this.internalMeta[attrName] = val.type ? val : {type: MetaAttrType.FIELD};
    });
  }

  protected checkAttrs(): void {
    assert(`Don't add "id" to the "attrs"`, !this.attrs.hasOwnProperty('id'));
  }

}
