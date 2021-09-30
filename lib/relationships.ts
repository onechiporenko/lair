import { MetaAttrType, RelationshipMetaAttr } from './factory';
import { InternalMetaStore } from './lair';
import { LairRecord } from './record';
import { arrayDiff, assert, isId, uniq } from './utils';

const { isArray } = Array;
const { keys } = Object;

interface InternalRelationships {
  [factoryName: string]: {
    [recordId: string]: RecordRelationShips;
  };
}

export interface RecordRelationShips {
  [attrName: string]: string | string[] | null;
}

function mapIds(val: string[]): string[] {
  return uniq<string>(
    val.filter((v) => v !== null && v !== undefined).map((v) => v['id'] || v)
  );
}

export class Relationships {
  private relationships: InternalRelationships = {};
  private meta: InternalMetaStore = {};

  public updateMeta(newMeta: InternalMetaStore): void {
    this.meta = newMeta;
  }

  public addFactory(factoryName: string): void {
    if (!this.relationships[factoryName]) {
      this.relationships[factoryName] = {};
    }
  }

  public addRecord(factoryName: string, id: string): void {
    this.addFactory(factoryName);
    if (!this.relationships[factoryName][id]) {
      this.relationships[factoryName][id] = {};
      const meta = this.meta[factoryName];
      keys(meta).forEach((attrName) => {
        if (meta[attrName].type === MetaAttrType.HAS_ONE) {
          this.relationships[factoryName][id][attrName] = null;
        }
        if (meta[attrName].type === MetaAttrType.HAS_MANY) {
          this.relationships[factoryName][id][attrName] = [];
        }
      });
    }
  }

  public recalculateRelationshipsForRecord(
    factoryName: string,
    record: LairRecord
  ): void {
    keys(this.meta[factoryName]).forEach((attrName) =>
      this.recalculateRelationshipForAttr(factoryName, record, attrName)
    );
  }

  public recalculateRelationshipForAttr(
    factoryName: string,
    record: LairRecord,
    attrName: string
  ): void {
    const sourceMeta = this.meta[factoryName];
    const attrMeta = sourceMeta[attrName] as RelationshipMetaAttr;
    if (
      attrMeta.type !== MetaAttrType.HAS_ONE &&
      attrMeta.type !== MetaAttrType.HAS_MANY
    ) {
      return;
    }
    const distMeta = this.meta[attrMeta.factoryName][attrMeta.invertedAttrName];
    const val = record[attrName];
    if (attrMeta.type === MetaAttrType.HAS_ONE) {
      const distRecordId = isId(val) || !val ? val : val.id;
      if (distMeta) {
        if (distMeta.type === MetaAttrType.HAS_ONE) {
          // ONE TO ONE
          this.updateOneToOne(
            factoryName,
            record.id,
            attrName,
            attrMeta.factoryName,
            distRecordId,
            attrMeta.invertedAttrName
          );
        }
        if (distMeta.type === MetaAttrType.HAS_MANY) {
          // ONE TO MANY
          this.updateOneToMany(
            factoryName,
            record.id,
            attrName,
            attrMeta.factoryName,
            distRecordId,
            attrMeta.invertedAttrName
          );
        }
      } else {
        this.setOne(factoryName, record.id, attrName, distRecordId);
      }
    }
    if (attrMeta.type === MetaAttrType.HAS_MANY) {
      const distRecordIds = isArray(val) ? mapIds(val) : [];
      if (distMeta) {
        if (distMeta.type === MetaAttrType.HAS_ONE) {
          // MANY TO ONE
          this.updateManyToOne(
            factoryName,
            record.id,
            attrName,
            attrMeta.factoryName,
            distRecordIds,
            attrMeta.invertedAttrName
          );
        }
        if (distMeta.type === MetaAttrType.HAS_MANY) {
          // MANY TO MANY
          this.updateManyToMany(
            factoryName,
            record.id,
            attrName,
            attrMeta.factoryName,
            distRecordIds,
            attrMeta.invertedAttrName
          );
        }
      } else {
        this.setMany(factoryName, record.id, attrName, distRecordIds);
      }
    }
  }

  public deleteRelationshipsForRecord(factoryName: string, id: string): void {
    keys(this.meta[factoryName]).forEach((attrName) =>
      this.deleteRelationshipForAttr(factoryName, id, attrName)
    );
    delete this.relationships[factoryName][id];
  }

  public deleteRelationshipForAttr(
    factoryName: string,
    id: string,
    attrName: string
  ): void {
    const meta = this.meta[factoryName];
    const attrMeta = meta[attrName] as RelationshipMetaAttr;
    if (
      attrMeta.type !== MetaAttrType.HAS_ONE &&
      attrMeta.type !== MetaAttrType.HAS_MANY
    ) {
      return;
    }
    const distMeta = this.meta[attrMeta.factoryName][attrMeta.invertedAttrName];
    if (!distMeta) {
      // relation looks like `Factory.hasOne('bar1', null)` or Factory.hasMany('bar1', null)
      return;
    }
    if (attrMeta.type === MetaAttrType.HAS_ONE) {
      if (distMeta.type === MetaAttrType.HAS_ONE) {
        // ONE TO ONE
        this.updateOneToOne(
          factoryName,
          id,
          attrName,
          attrMeta.factoryName,
          null,
          attrMeta.invertedAttrName
        );
      }
      if (distMeta.type === MetaAttrType.HAS_MANY) {
        // ONE TO MANY
        this.updateOneToMany(
          factoryName,
          id,
          attrName,
          attrMeta.factoryName,
          null,
          attrMeta.invertedAttrName
        );
      }
    }
    if (meta[attrName].type === MetaAttrType.HAS_MANY) {
      if (distMeta.type === MetaAttrType.HAS_ONE) {
        // MANY TO ONE
        this.updateManyToOne(
          factoryName,
          id,
          attrName,
          attrMeta.factoryName,
          null,
          attrMeta.invertedAttrName
        );
      }
      if (distMeta.type === MetaAttrType.HAS_MANY) {
        // MANY TO MANY
        this.updateManyToMany(
          factoryName,
          id,
          attrName,
          attrMeta.factoryName,
          null,
          attrMeta.invertedAttrName
        );
      }
    }
  }

  public getOne(factoryName: string, id: string, attrName: string): string {
    if (!this.recordRelationshipsExist(factoryName, id)) {
      return null;
    }
    const val = this.relationships[factoryName][id][attrName];
    return !isArray(val) ? val : null;
  }

  public getMany(factoryName: string, id: string, attrName: string): string[] {
    if (!this.recordRelationshipsExist(factoryName, id)) {
      return [];
    }
    const val = this.relationships[factoryName][id][attrName];
    return isArray(val) ? val : [];
  }

  public removeFromMany(
    factoryName: string,
    id: string,
    attrName: string,
    valueToRemove: string
  ): void {
    assert(
      `"removeFromMany" should be used only for HAS_MANY relationships. You try to use for "${factoryName}.${attrName}"`,
      this.meta[factoryName][attrName].type === MetaAttrType.HAS_MANY
    );
    const oldDistRelationships = this.getMany(factoryName, id, attrName) || [];
    this.addRecord(factoryName, id);
    const newValue =
      oldDistRelationships.indexOf(valueToRemove) === -1
        ? oldDistRelationships
        : oldDistRelationships.filter((v) => v !== valueToRemove);
    this.setMany(factoryName, id, attrName, newValue);
  }

  public addToMany(
    factoryName: string,
    id: string,
    attrName: string,
    valueToAdd: string
  ): void {
    assert(
      `"addToMany" should be used only for HAS_MANY relationships. You try to use for "${factoryName}.${attrName}"`,
      this.meta[factoryName][attrName].type === MetaAttrType.HAS_MANY
    );
    const newDistRelationships = this.getMany(factoryName, id, attrName) || [];
    if (newDistRelationships.indexOf(valueToAdd) === -1) {
      newDistRelationships.push(valueToAdd);
    }
    this.addRecord(factoryName, id);
    this.setMany(factoryName, id, attrName, newDistRelationships);
  }

  public setOne(
    factoryName: string,
    id: string,
    attrName: string,
    valueToSet: string
  ): void {
    assert(
      `"setOne" should be used only for HAS_ONE relationships. You try to use for "${factoryName}.${attrName}"`,
      this.meta[factoryName][attrName].type === MetaAttrType.HAS_ONE
    );
    if (!this.recordRelationshipsExist(factoryName, id)) {
      return;
    }
    this.relationships[factoryName][id][attrName] = valueToSet;
  }

  public setMany(
    factoryName: string,
    id: string,
    attrName: string,
    valueToSet: string[]
  ): void {
    assert(
      `"setMany" should be used only for HAS_MANY relationships. You try to use for "${factoryName}.${attrName}"`,
      this.meta[factoryName][attrName].type === MetaAttrType.HAS_MANY
    );
    if (!this.recordRelationshipsExist(factoryName, id)) {
      return;
    }
    this.relationships[factoryName][id][attrName] = uniq(valueToSet.sort());
  }

  public getRelationshipsForRecord(
    factoryName: string,
    id: string
  ): RecordRelationShips {
    return this.relationships[factoryName][id];
  }

  public createOneToOne(
    factoryName: string,
    id: string,
    attrName: string,
    newDistId: string,
    distFactoryName: string,
    distAttrName: string
  ): void {
    const oldDistId = this.getOne(factoryName, id, attrName);
    if (oldDistId) {
      this.setOne(distFactoryName, oldDistId, distAttrName, null);
      const oldSourceId = this.getOne(distFactoryName, oldDistId, distAttrName);
      if (oldSourceId) {
        this.setOne(factoryName, oldSourceId, attrName, null);
      }
    }
    const oldSourceId2 = this.getOne(distFactoryName, newDistId, distAttrName);
    this.setOne(factoryName, oldSourceId2, attrName, null);
    this.setOne(factoryName, id, attrName, newDistId);
    this.setOne(distFactoryName, newDistId, distAttrName, id);
  }

  public createManyToOne(
    factoryName: string,
    id: string,
    attrName: string,
    newDistIds: string[],
    distFactoryName: string,
    distAttrName: string
  ): void {
    const currentIds = this.getMany(factoryName, id, attrName);
    const toAdd = currentIds ? arrayDiff(newDistIds, currentIds) : [];
    const toRemove = currentIds ? arrayDiff(currentIds, newDistIds) : [];
    toAdd.map((newId) => {
      const oldSourceId = this.getOne(distFactoryName, newId, distAttrName);
      if (oldSourceId) {
        this.removeFromMany(factoryName, oldSourceId, attrName, newId);
      }
      this.setOne(distFactoryName, newId, distAttrName, id);
    });
    toRemove.map((newId) =>
      this.setOne(distFactoryName, newId, distAttrName, null)
    );
    this.setMany(factoryName, id, attrName, newDistIds);
  }

  public createOneToMany(
    factoryName: string,
    id: string,
    attrName: string,
    newDistId: string,
    distFactoryName: string,
    distAttrName: string
  ): void {
    const oldDistId = this.getOne(factoryName, id, attrName);
    if (oldDistId) {
      this.removeFromMany(distFactoryName, oldDistId, distAttrName, id);
    }
    this.addToMany(distFactoryName, newDistId, distAttrName, id);
    this.setOne(factoryName, id, attrName, newDistId);
  }

  public createManyToMany(
    factoryName: string,
    id: string,
    attrName: string,
    newDistIds: string[],
    distFactoryName: string,
    distAttrName: string
  ): void {
    const currentIds = this.getMany(factoryName, id, attrName);
    const toAdd = currentIds ? arrayDiff(newDistIds, currentIds) : [];
    const toRemove = currentIds ? arrayDiff(currentIds, newDistIds) : [];
    toAdd.map((newId) =>
      this.addToMany(distFactoryName, newId, distAttrName, id)
    );
    toRemove.map((newId) =>
      this.removeFromMany(distFactoryName, newId, distAttrName, id)
    );
    this.setMany(factoryName, id, attrName, newDistIds);
  }

  protected recordRelationshipsExist(factoryName: string, id: string): boolean {
    const f = this.relationships[factoryName];
    if (!f) {
      return false;
    }
    return !!f[id];
  }

  protected updateOneToOne(
    sourceFactoryName: string,
    sourceRecordId: string,
    sourceAttrName: string,
    distFactoryName: string,
    distRecordId: string,
    distAttrName: string
  ): void {
    this.addRecord(sourceFactoryName, sourceRecordId);
    this.setOne(
      sourceFactoryName,
      sourceRecordId,
      sourceAttrName,
      distRecordId
    );
    if (distRecordId) {
      this.addRecord(distFactoryName, distRecordId);
      this.setOne(distFactoryName, distRecordId, distAttrName, sourceRecordId);
    } else {
      this.dropRelationship(distFactoryName, distAttrName, sourceRecordId);
    }
  }

  protected updateManyToOne(
    sourceFactoryName: string,
    sourceRecordId: string,
    sourceAttrName: string,
    distFactoryName: string,
    distRecordIds: string[],
    distAttrName: string
  ): void {
    distRecordIds = distRecordIds || [];
    this.addRecord(sourceFactoryName, sourceRecordId);
    if (distRecordIds) {
      distRecordIds.forEach((distRecordId) =>
        this.addRecord(distFactoryName, distRecordId)
      );
    }
    const oldDistIds = this.getMany(
      sourceFactoryName,
      sourceRecordId,
      sourceAttrName
    );
    const toRemove = arrayDiff(oldDistIds, distRecordIds);
    const toAdd = arrayDiff(distRecordIds, oldDistIds);
    toRemove.forEach((oldDistId) =>
      this.setOne(distFactoryName, oldDistId, distAttrName, null)
    );
    toAdd.forEach((distRecordId) =>
      this.setOne(distFactoryName, distRecordId, distAttrName, sourceRecordId)
    );
    this.setMany(
      sourceFactoryName,
      sourceRecordId,
      sourceAttrName,
      distRecordIds
    );
  }

  protected updateOneToMany(
    sourceFactoryName: string,
    sourceRecordId: string,
    sourceAttrName: string,
    distFactoryName: string,
    distRecordId: string,
    distAttrName: string
  ): void {
    if (sourceRecordId) {
      this.addRecord(sourceFactoryName, sourceRecordId);
      const oldDistId = this.getOne(
        sourceFactoryName,
        sourceRecordId,
        sourceAttrName
      );
      if (oldDistId) {
        this.removeFromMany(
          distFactoryName,
          oldDistId,
          distAttrName,
          sourceRecordId
        );
      }
      this.setOne(
        sourceFactoryName,
        sourceRecordId,
        sourceAttrName,
        distRecordId
      );
    }
    if (distRecordId) {
      this.addRecord(distFactoryName, distRecordId);
      const currentRelationship =
        this.relationships[distFactoryName][distRecordId][distAttrName];
      if (currentRelationship) {
        const valueToSet =
          isArray(currentRelationship) && currentRelationship.length
            ? currentRelationship.indexOf(sourceRecordId) === -1
              ? currentRelationship
              : currentRelationship.filter((v) => v !== sourceRecordId)
            : [sourceRecordId];
        this.setMany(distFactoryName, distRecordId, distAttrName, valueToSet);
      } else {
        this.addToMany(
          distFactoryName,
          distRecordId,
          distAttrName,
          sourceRecordId
        );
      }
    }
  }

  protected updateManyToMany(
    sourceFactoryName: string,
    sourceRecordId: string,
    sourceAttrName: string,
    distFactoryName: string,
    distRecordIds: string[],
    distAttrName: string
  ): void {
    distRecordIds = distRecordIds || [];
    this.addRecord(sourceFactoryName, sourceRecordId);
    if (isArray(distRecordIds)) {
      distRecordIds.forEach((distRecordId) =>
        this.addRecord(distFactoryName, distRecordId)
      );
    }
    const oldDistIds =
      this.getMany(sourceFactoryName, sourceRecordId, sourceAttrName) || [];
    const toRemove = arrayDiff(oldDistIds, distRecordIds);
    const toAdd = arrayDiff(distRecordIds, oldDistIds);
    toRemove.forEach((distId) => {
      this.removeFromMany(
        distFactoryName,
        distId,
        distAttrName,
        sourceRecordId
      );
    });
    toAdd.forEach((distRecordId) => {
      this.addToMany(
        distFactoryName,
        distRecordId,
        distAttrName,
        sourceRecordId
      );
    });
    this.setMany(
      sourceFactoryName,
      sourceRecordId,
      sourceAttrName,
      isArray(distRecordIds) ? distRecordIds : []
    );
  }

  protected dropRelationship(
    distFactoryName: string,
    distAttrName: string,
    sourceRecordId: string
  ): void {
    keys(this.relationships[distFactoryName]).forEach((rId) => {
      if (
        this.relationships[distFactoryName][rId][distAttrName] ===
        sourceRecordId
      ) {
        this.relationships[distFactoryName][rId][distAttrName] = null;
      }
    });
  }
}
