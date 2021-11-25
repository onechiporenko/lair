import { expect } from 'chai';
import { Factory, field, hasMany, hasOne } from '../../../lib/factory';
import { Lair } from '../../../lib/lair';
import { LairRecord } from '../../../lib/record';

let lair;

class FactoryToTestAfterCreate1Case extends Factory {
  static factoryName = 'a';
  @field() a = '1';
  @field() b = '2';
  @field() c = '3';
  afterCreate(record: LairRecord): LairRecord {
    record.a = 'a';
    record.b = 'b';
    record.c = 'c';
    return record;
  }
}

class FactoryToTestAfterCreate2aCase extends Factory {
  static factoryName = 'a';
  @field() a = 'a';
  @hasOne('b', 'propA', {
    createRelated: 1,
  })
  propB;
  afterCreate(record: LairRecord): LairRecord {
    expect(record).to.be.eql({
      id: '1',
      a: 'a',
      propB: {
        id: '1',
        b: 'b',
        propA: '1',
        propC: [{ id: '1', propB: '1', c: 'c' }],
      },
    });
    return record;
  }
}
class FactoryToTestAfterCreate2bCase extends Factory {
  static factoryName = 'b';
  @field() b = 'b';
  @hasOne('a', 'propB') propA;
  @hasMany('c', 'propB', {
    createRelated: 1,
  })
  propC;
  afterCreate(record: LairRecord): LairRecord {
    expect(record).to.be.eql({
      id: '1',
      b: 'b',
      propA: {
        id: '1',
        a: 'a',
        propB: '1',
      },
      propC: [{ id: '1', propB: '1', c: 'c' }],
    });
    return record;
  }
}
class FactoryToTestAfterCreate2cCase extends Factory {
  static factoryName = 'c';
  @field() c = 'c';
  @hasOne('b', 'propC') propB;
  afterCreate(record: LairRecord): LairRecord {
    expect(record).to.be.eql({
      id: '1',
      c: 'c',
      propB: {
        id: '1',
        b: 'b',
        propA: {
          id: '1',
          a: 'a',
          propB: '1',
        },
        propC: ['1'],
      },
    });
    return record;
  }
}

class FactoryToTestAfterCreate3aCase extends Factory {
  static factoryName = 'a';
  @field() a = 'a';
  @hasOne('b', 'propA', {
    createRelated: 1,
  })
  propB;
  afterCreateIgnoreRelated = ['b'];
  afterCreate(record: LairRecord): LairRecord {
    expect(record).to.be.eql({
      id: '1',
      a: 'a',
    });
    return record;
  }
}
class FactoryToTestAfterCreate3bCase extends Factory {
  static factoryName = 'b';
  @field() b = 'b';
  @hasOne('a', 'propB') propA;
  @hasMany('c', 'propB', {
    createRelated: 1,
  })
  propC;
  afterCreateIgnoreRelated = ['c'];
  afterCreate(record: LairRecord): LairRecord {
    expect(record).to.be.eql({
      id: '1',
      b: 'b',
      propA: {
        id: '1',
        a: 'a',
        propB: '1',
      },
    });
    return record;
  }
}
class FactoryToTestAfterCreate3cCase extends Factory {
  static factoryName = 'c';
  @field() c = 'c';
  @hasOne('b', 'propC') propB;
  afterCreateIgnoreRelated = ['b'];
  afterCreate(record: LairRecord): LairRecord {
    expect(record).to.be.eql({
      id: '1',
      c: 'c',
    });
    return record;
  }
}

class FactoryToTestAfterCreate4aCase extends Factory {
  static factoryName = 'a';
  afterCreate(record: LairRecord): LairRecord {
    record.id = '100500';
    return record;
  }
}

describe('Lair', () => {
  beforeEach(() => {
    lair = Lair.getLair();
  });
  afterEach(() => {
    Lair.cleanLair();
  });

  describe('#createRecords', () => {
    describe('#afterCreate', () => {
      describe('should allow update record fields', () => {
        beforeEach(() => {
          lair.registerFactory(new FactoryToTestAfterCreate1Case());
          lair.createRecords('a', 1);
        });

        it('fields are updated', () => {
          const r = lair.getOne('a', '1');
          expect(r.a).to.be.equal('a');
          expect(r.b).to.be.equal('b');
          expect(r.c).to.be.equal('c');
        });
      });

      describe('should receive record with related data', () => {
        it('record has all related data', () => {
          lair.registerFactory(new FactoryToTestAfterCreate2aCase());
          lair.registerFactory(new FactoryToTestAfterCreate2bCase());
          lair.registerFactory(new FactoryToTestAfterCreate2cCase());
          lair.createRecords('a', 1);
        });
      });

      describe('should not receive ignored related data', () => {
        it('record does not have ignored related data', () => {
          lair.registerFactory(new FactoryToTestAfterCreate3aCase());
          lair.registerFactory(new FactoryToTestAfterCreate3bCase());
          lair.registerFactory(new FactoryToTestAfterCreate3cCase());
          lair.createRecords('a', 1);
        });
      });

      describe('should ignore updating related data', () => {
        class FactoryToTestAfterCreate4aCase extends Factory {
          static factoryName = 'a';
          @field() a = 'a';
          @hasMany('b', 'propA', {
            createRelated: 2,
          })
          propB;
          @hasOne('c', 'propA', {
            createRelated: 1,
          })
          propC;
          afterCreate(record: LairRecord): LairRecord {
            record.propC.id = '100500';
            delete record.propB;
            return record;
          }
        }
        class FactoryToTestAfterCreate4bCase extends Factory {
          static factoryName = 'b';
          @field() b = 'b';
          @hasOne('a', 'propB') propA;
        }
        class FactoryToTestAfterCreate4cCase extends Factory {
          static factoryName = 'c';
          @field() c = 'c';
          @hasMany('a', 'propC') propA;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryToTestAfterCreate4aCase());
          lair.registerFactory(new FactoryToTestAfterCreate4bCase());
          lair.registerFactory(new FactoryToTestAfterCreate4cCase());
          lair.createRecords('a', 1);
        });
        it('a1 relationships are not changed', () => {
          expect(lair.getOne('a', '1')).to.be.eql({
            id: '1',
            a: 'a',
            propB: [
              { id: '1', propA: '1', b: 'b' },
              { id: '2', propA: '1', b: 'b' },
            ],
            propC: { id: '1', propA: ['1'], c: 'c' },
          });
        });
        it('b1 relationships are not changed', () => {
          expect(lair.getOne('b', '1')).to.be.eql({
            id: '1',
            b: 'b',
            propA: {
              id: '1',
              a: 'a',
              propB: ['1', '2'],
              propC: { id: '1', propA: ['1'], c: 'c' },
            },
          });
        });
        it('b2 relationships are not changed', () => {
          expect(lair.getOne('b', '2')).to.be.eql({
            id: '2',
            b: 'b',
            propA: {
              id: '1',
              a: 'a',
              propB: ['1', '2'],
              propC: { id: '1', propA: ['1'], c: 'c' },
            },
          });
        });
        it('c1 relationships are not changed', () => {
          expect(lair.getOne('c', '1')).to.be.eql({
            id: '1',
            c: 'c',
            propA: [
              {
                id: '1',
                a: 'a',
                propB: [
                  { id: '1', propA: '1', b: 'b' },
                  { id: '2', propA: '1', b: 'b' },
                ],
                propC: '1',
              },
            ],
          });
        });
      });

      describe('should not update id', () => {
        beforeEach(() => {
          lair.registerFactory(FactoryToTestAfterCreate4aCase);
          lair.createRecords('a', 1);
        });

        it('id is not updated', () => {
          expect(lair.getOne('a', '1').id).to.be.equal('1');
        });
      });
    });
  });
});
