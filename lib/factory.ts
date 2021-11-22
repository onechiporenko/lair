import 'reflect-metadata';
import { LairRecord } from './record';
import { assert, copy, getOrCalcValue, getVal } from './utils';

const { keys, defineProperty, hasOwnProperty } = Object;

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
  [p: string]:
    | MetaAttr
    | FieldMetaAttr<any>
    | SequenceMetaAttr<any>
    | RelationshipMetaAttr;
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
  createRelated?: number | ((id: string) => number);
}

export interface FieldMetaAttr<T> extends MetaAttr {
  defaultValue?: T;
  allowedValues?: T[]; // something like enum
  preferredType?: string;
  value: T | (() => T);
  getter?: (...args: any[]) => any;
}

export interface RelationshipOptions {
  reflexive?: boolean;
  depth?: number;
  createRelated?: number | ((id: string) => number);
}

export interface SequenceItemOptions {
  lastValuesCount: number;
}

export interface FieldOptions<T> {
  defaultValue?: T;
  preferredType?: string;
  allowedValues?: T[];
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

export const FACTORY_META_KEY = Symbol('FACTORY_META_KEY');

const setupFactoryMeta = (classConstructor: any): void => {
  if (!Reflect.hasOwnMetadata(FACTORY_META_KEY, classConstructor)) {
    Reflect.defineMetadata(FACTORY_META_KEY, {}, classConstructor);
  }
};

const updateFactoryMeta = (
  classConstructor: any,
  propertyKey: string,
  propertyKeyMeta: MetaAttr,
  force = false
) => {
  const meta = Reflect.getOwnMetadata(FACTORY_META_KEY, classConstructor);
  if (force) {
    meta[propertyKey] = propertyKeyMeta;
  } else {
    meta[propertyKey] = meta[propertyKey] || propertyKeyMeta;
  }
  Reflect.defineMetadata(FACTORY_META_KEY, meta, classConstructor);
};

export function field<T>(fieldOptions: FieldOptions<T> = {}): any {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): any {
    assert(
      `Decorator "field" must be used only for instance properties (now it's used for "${propertyKey}")`,
      !!target.constructor
    );
    setupFactoryMeta(target.constructor);
    assert(
      `"defaultValue" can't be a function`,
      !(fieldOptions.defaultValue instanceof Function)
    );
    const allowedValues =
      'allowedValues' in fieldOptions ? fieldOptions.allowedValues : null;
    const propertyKeyMeta = {
      type: MetaAttrType.FIELD,
    } as FieldMetaAttr<any>;
    if (descriptor?.get) {
      propertyKeyMeta.getter = descriptor?.get;
    }
    if (allowedValues) {
      propertyKeyMeta.allowedValues = allowedValues;
    }

    ['defaultValue', 'preferredType'].map((prop) => {
      if (hasOwnProperty.call(fieldOptions, prop)) {
        propertyKeyMeta[prop] = fieldOptions[prop];
      }
    });
    updateFactoryMeta(target.constructor, propertyKey, propertyKeyMeta);
    if (descriptor) {
      descriptor.get = function () {
        if (!this.cache.has(this.currentRecordId)) {
          this.cache.set(this.currentRecordId, {});
        }
        const recordCache = this.cache.get(this.currentRecordId);
        if (recordCache[propertyKey]) {
          return recordCache[propertyKey];
        }
        if (propertyKeyMeta.getter) {
          recordCache[propertyKey] = propertyKeyMeta.getter?.call(this);
        }
        this.cache.set(this.currentRecordId, recordCache);
        return recordCache[propertyKey];
      };
      descriptor.set = function (v: any) {
        if (!this.cache.has(this.currentRecordId)) {
          this.cache.set(this.currentRecordId, {});
        }
        const recordCache = this.cache.get(this.currentRecordId);
        recordCache[propertyKey] = v;
        this.cache.set(this.currentRecordId, recordCache);
      };
    }
  };
}

/**
 * Use `hasOne` for relationship-fields
 * Used for 'one-to-one' and 'one-to-many'
 */
export function hasOne(
  factoryName: string,
  invertedAttrName: string,
  options?: RelationshipOptions
): any {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): any {
    assert(
      `Decorator "hasOne" must be used only for instance properties (now it's used for "${propertyKey}")`,
      !!target.constructor
    );
    setupFactoryMeta(target.constructor);
    const reflexive = getVal<boolean>(options, 'reflexive', false);
    const reflexiveDepth = reflexive ? getVal<number>(options, 'depth', 2) : 2;
    const propertyKeyMeta = {
      factoryName,
      invertedAttrName,
      type: MetaAttrType.HAS_ONE,
      reflexive,
      reflexiveDepth,
    } as RelationshipMetaAttr;
    if (options?.createRelated) {
      propertyKeyMeta.createRelated = options?.createRelated;
    }
    updateFactoryMeta(target.constructor, propertyKey, propertyKeyMeta);
  };
}

/**
 * Use `hasMany` for relationship-fields
 * Used for 'many-to-one' and 'many-to-many'
 */
export function hasMany(
  factoryName: string,
  invertedAttrName: string,
  options?: RelationshipOptions
): any {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): any {
    assert(
      `Decorator "hasMany" must be used only for instance properties (now it's used for "${propertyKey}")`,
      !!target.constructor
    );
    setupFactoryMeta(target.constructor);
    const reflexive = getVal<boolean>(options, 'reflexive', false);
    const reflexiveDepth = reflexive ? getVal<number>(options, 'depth', 2) : 2;
    const propertyKeyMeta = {
      factoryName,
      invertedAttrName,
      type: MetaAttrType.HAS_MANY,
      reflexive,
      reflexiveDepth,
    } as RelationshipMetaAttr;
    if (options?.createRelated) {
      propertyKeyMeta.createRelated = options?.createRelated;
    }
    updateFactoryMeta(target.constructor, propertyKey, propertyKeyMeta);
  };
}

/**
 * Use `sequenceItem` for fields that depend on previously generated values
 */
export function sequenceItem<T>(
  initialValue: T,
  getNextValue: (prevValues: T[]) => T,
  options?: SequenceItemOptions
): any {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): any {
    assert(
      `Decorator "sequenceItem" must be used only for instance properties (now it's used for "${propertyKey}")`,
      !!target.constructor
    );
    setupFactoryMeta(target.constructor);
    updateFactoryMeta(target.constructor, propertyKey, {
      getNextValue,
      initialValue: getOrCalcValue<T>(initialValue),
      lastValuesCount:
        options && hasOwnProperty.call(options, 'lastValuesCount')
          ? options.lastValuesCount
          : Infinity,
      prevValues: [],
      type: MetaAttrType.SEQUENCE_ITEM,
    });
  };
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
 */
export class Factory {
  static factoryName = '';
  static internalMeta: Meta;

  // for internal use
  static resetMeta(): void {
    const meta = Reflect.getOwnMetadata(FACTORY_META_KEY, this);
    keys(meta).forEach((attrName) => {
      if (meta[attrName].type === MetaAttrType.SEQUENCE_ITEM) {
        updateFactoryMeta(
          this,
          attrName,
          {
            ...meta[attrName],
            prevValues: [],
          },
          true
        );
      }
    });
  }

  public afterCreateRelationshipsDepth = Infinity;
  public afterCreateIgnoreRelated: string[] = [];
  public allowCustomIds = false;

  protected cache = new Map();
  protected currentRecordId;

  @field() id;

  get meta(): Meta {
    return Reflect.getOwnMetadata(
      FACTORY_META_KEY,
      this['__proto__'].constructor
    );
  }

  /**
   * Forget about this. It's only for Lair
   */
  public createRecord(
    id: number,
    extraData: CreateRecordExtraData = {}
  ): LairRecord {
    const newRecord = this.getNewRecord(id, extraData);
    return {
      ...newRecord,
    };
  }

  public afterCreate(
    record: LairRecord,
    extraData: CreateRecordExtraData
  ): LairRecord {
    return record;
  }

  public getFactoryName(): string {
    return this['__proto__'].constructor.factoryName;
  }

  /**
   * Return object with default values for attributes
   * Only attributes with type `FIELD` and provided `defaultValue` are affected
   */
  public getDefaults(): Record<string, unknown> {
    return keys(this.meta).reduce((defaults, attrName) => {
      const attrMeta = this.meta[attrName] as FieldMetaAttr<any>;
      if (hasOwnProperty.call(attrMeta, 'defaultValue')) {
        defaults[attrName] = copy(attrMeta.defaultValue);
      }
      return defaults;
    }, {});
  }

  public constructor() {
    setupFactoryMeta(this['__proto__'].constructor);
    this.mergeMetaWithParent();
  }

  protected mergeMetaWithParent(): void {
    const parentClass = this['__proto__']['__proto__'];
    if (parentClass) {
      const parentMeta =
        Reflect.getOwnMetadata(FACTORY_META_KEY, parentClass.constructor) || {};
      keys(parentMeta).forEach((attrName) => {
        if (!this.meta[attrName]) {
          updateFactoryMeta(
            this['__proto__'].constructor,
            attrName,
            parentMeta[attrName]
          );
        }
      });
    }
  }

  protected getNewRecord(
    id: number,
    extraData: CreateRecordExtraData = {}
  ): LairRecord {
    this.currentRecordId = id;
    const _id = String(id);
    this.id = _id;
    const record = {
      id: _id,
      extraData,
    } as LairRecord;
    keys(this.meta).forEach((attrName) => {
      const attrMeta = this.meta[attrName];
      const options: PropertyDescriptor = { enumerable: true };
      if (attrMeta.type === MetaAttrType.HAS_ONE) {
        options.value = null;
      }
      if (attrMeta.type === MetaAttrType.HAS_MANY) {
        options.value = [];
      }
      if (attrMeta.type === MetaAttrType.SEQUENCE_ITEM) {
        const v =
          id === 1
            ? attrMeta.initialValue
            : attrMeta.getNextValue.call(
                record,
                attrMeta.prevValues.slice(-attrMeta.lastValuesCount)
              );
        attrMeta.prevValues.push(v);
        options.value = copy(v);
      }
      if (attrMeta.type === MetaAttrType.FIELD) {
        options.value = copy(this[attrName]);
      }
      defineProperty(record, attrName, options);
    });
    this.cache.delete(this.currentRecordId);
    delete record.extraData;
    return record;
  }
}
