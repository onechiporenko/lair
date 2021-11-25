import { expect } from 'chai';
import { Factory, field, hasMany, hasOne, sequenceItem } from '../lib/factory';
import { Lair } from '../lib/lair';
import { LairRecord } from '../lib/record';

let lair;
let record;

describe('Lair create records', () => {
  beforeEach(() => (lair = Lair.getLair()));
  afterEach(() => Lair.cleanLair());

  describe('for extended factory', () => {
    describe('without attrs overrides', () => {
      class FactoryWithoutAttrsOverridesA extends Factory {
        static factoryName = 'parent';
        @field() first = 'static';
        @field()
        get second(): string {
          return `dynamic ${this.id}`;
        }
        @field()
        get third(): string {
          return `third is ${this.second}`;
        }
        @field()
        get rand(): number {
          return Math.random();
        }
        @field()
        get r1(): number {
          return this.rand;
        }
        @field()
        get r2(): number {
          return this.rand;
        }
        @hasOne('b', 'oneA', {
          createRelated: 1,
        })
        oneB;
        @hasMany('b', 'manyA', {
          createRelated: 2,
        })
        manyB;
        @sequenceItem(1, (prevValues) => {
          return prevValues.reduce((x, y) => x + y, 0);
        })
        sequenceItem;
      }
      class FactoryWithoutAttrsOverridesAChild extends FactoryWithoutAttrsOverridesA {
        static factoryName = 'a';
      }
      class FactoryWithoutAttrsOverridesB extends Factory {
        static factoryName = 'b';
        @hasOne('a', 'oneB') oneA;
        @hasMany('a', 'manyB') manyA;
      }
      beforeEach(() => {
        lair.registerFactory(new FactoryWithoutAttrsOverridesA());
        lair.registerFactory(new FactoryWithoutAttrsOverridesAChild());
        lair.registerFactory(new FactoryWithoutAttrsOverridesB());
        FactoryWithoutAttrsOverridesA.resetMeta();
        FactoryWithoutAttrsOverridesAChild.resetMeta();
        FactoryWithoutAttrsOverridesB.resetMeta();
        lair.createRecords('a', 1);
        record = lair.getOne('a', '1');
      });

      it('should copy static field', () => {
        expect(record.first).to.be.equal('static');
      });

      it('should copy dynamic field', () => {
        expect(record.second).to.be.equal('dynamic 1');
        expect(record.third).to.be.equal('third is dynamic 1');
      });

      it('should copy dynamic field related with other fields', () => {
        expect(record.r1).to.be.equal(record.r2);
      });

      it('should copy hasOne-relationship', () => {
        expect(record.oneB).to.be.eql({
          id: '1',
          oneA: '1',
          manyA: [],
        });
      });

      it('should copy hasMany-relationship', () => {
        expect(record.manyB).to.be.eql([
          { id: '2', manyA: ['1'], oneA: null },
          { id: '3', manyA: ['1'], oneA: null },
        ]);
      });

      it('should copy sequence items', () => {
        expect(record.sequenceItem).to.be.equal(1);
        lair.createRecords('a', 4);
        expect(lair.getAll('a').map((c) => c.sequenceItem)).to.be.eql([
          1, 1, 2, 4, 8,
        ]);
      });
    });

    describe('with attrs overrides', () => {
      describe('static field', () => {
        class FactoryWithStaticFieldA extends Factory {
          static factoryName = 'a';
          @field() field = 'a';
        }
        class FactoryWithStaticFieldB extends FactoryWithStaticFieldA {
          static factoryName = 'b';
          @field() field = 'b';
        }
        beforeEach(() => {
          lair.registerFactory(FactoryWithStaticFieldA);
          lair.registerFactory(FactoryWithStaticFieldB);
          lair.createRecords('b', 1);
        });
        it('should override field', () => {
          expect(lair.getOne('b', '1').field).to.be.equal('b');
        });
      });

      describe('dynamic field', () => {
        class FactoryWithDynamicFieldA extends Factory {
          static factoryName = 'a';
          @field()
          get field(): string {
            return this.id + 'a';
          }
        }
        class FactoryWithDynamicFieldB extends FactoryWithDynamicFieldA {
          static factoryName = 'b';
          @field()
          get field(): string {
            return 'b';
          }
        }
        beforeEach(() => {
          lair.registerFactory(FactoryWithDynamicFieldA);
          lair.registerFactory(FactoryWithDynamicFieldB);
          lair.createRecords('b', 1);
        });
        it('should override field', () => {
          console.error(JSON.stringify(lair.getAll('b'), null, 2));
          expect(lair.getOne('b', '1').field).to.be.equal('b');
        });
      });

      describe('hasOne field', () => {
        class FactoryWithHasOneFieldA extends Factory {
          static factoryName = 'a';
          @hasOne('b', 'oneA', {
            createRelated: 1,
          })
          oneB;
        }
        class FactoryWithHasOneFieldB extends Factory {
          static factoryName = 'b';
          @hasOne('a', 'oneB') oneA;
        }
        class FactoryWithHasOneFieldC extends FactoryWithHasOneFieldA {
          static factoryName = 'c';
          @field() oneB = 'oneB';
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryWithHasOneFieldA());
          lair.registerFactory(new FactoryWithHasOneFieldB());
          lair.registerFactory(new FactoryWithHasOneFieldC());
          lair.createRecords('a', 1);
          lair.createRecords('c', 1);
        });

        it('a-record is valid', () => {
          expect(lair.getOne('a', '1')).to.be.eql({
            id: '1',
            oneB: {
              id: '1',
              oneA: '1',
            },
          });
        });

        it('b-record is valid', () => {
          expect(lair.getOne('b', '1')).to.be.eql({
            id: '1',
            oneA: {
              id: '1',
              oneB: '1',
            },
          });
        });

        it('c-record is valid', () => {
          expect(lair.getOne('c', '1')).to.be.eql({
            id: '1',
            oneB: 'oneB',
          });
        });
      });

      describe('hasMany field', () => {
        class FactoryWithHasManyFieldA extends Factory {
          static factoryName = 'a';
          @hasMany('b', 'manyA', {
            createRelated: 1,
          })
          manyB;
        }
        class FactoryWithHasManyFieldB extends Factory {
          static factoryName = 'b';
          @hasMany('a', 'manyB') manyA;
        }
        class FactoryWithHasManyFieldC extends FactoryWithHasManyFieldA {
          static factoryName = 'c';
          @field() manyB = 'manyB';
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryWithHasManyFieldA());
          lair.registerFactory(new FactoryWithHasManyFieldB());
          lair.registerFactory(new FactoryWithHasManyFieldC());
          lair.createRecords('a', 1);
          lair.createRecords('c', 1);
        });

        it('a-record is valid', () => {
          expect(lair.getOne('a', '1')).to.be.eql({
            id: '1',
            manyB: [
              {
                id: '1',
                manyA: ['1'],
              },
            ],
          });
        });

        it('b-record is valid', () => {
          expect(lair.getOne('b', '1')).to.be.eql({
            id: '1',
            manyA: [
              {
                id: '1',
                manyB: ['1'],
              },
            ],
          });
        });

        it('c-record is valid', () => {
          expect(lair.getOne('c', '1')).to.be.eql({
            id: '1',
            manyB: 'manyB',
          });
        });
      });

      describe('sequenceItem field', () => {
        class FactoryWithSequenceItemA extends Factory {
          static factoryName = 'a';
          @sequenceItem(
            1,
            (prevValues) => prevValues.reduce((a, b) => a + b, 0),
            { lastValuesCount: 2 }
          )
          a;
        }
        class FactoryWithSequenceItemB extends FactoryWithSequenceItemA {
          static factoryName = 'b';
          @sequenceItem(2, (prevValues) =>
            prevValues.reduce((a, b) => a * b, 1)
          )
          a;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryWithSequenceItemA());
          lair.registerFactory(new FactoryWithSequenceItemB());
          FactoryWithSequenceItemA.resetMeta();
          FactoryWithSequenceItemB.resetMeta();
          lair.createRecords('a', 8);
          lair.createRecords('b', 5);
        });

        it('a-records are valid', () => {
          expect(lair.getAll('a').map((r) => r.a)).to.be.eql([
            1, 1, 2, 3, 5, 8, 13, 21,
          ]);
        });

        it('b-records are valid', () => {
          expect(lair.getAll('b').map((r) => r.a)).to.be.eql([
            2, 2, 4, 16, 256,
          ]);
        });
      });
    });

    describe('afterCreate && afterCreateRelationshipsDepth && afterCreateIgnoreRelated', () => {
      class FactoryA extends Factory {
        static factoryName = 'a';
        @hasOne('a1', null, {
          createRelated: 1,
        })
        a1;
        afterCreateRelationshipsDepth = 5;
        afterCreate(r: LairRecord): LairRecord {
          expect(false).to.be.ok;
          return r;
        }
      }
      class FactoryA1 extends Factory {
        static factoryName = 'a1';
        @hasOne('a2', null, {
          createRelated: 1,
        })
        a2;
      }
      class FactoryA2 extends Factory {
        static factoryName = 'a2';
        @hasOne('a3', null, {
          createRelated: 1,
        })
        a3;
      }
      class FactoryA3 extends Factory {
        static factoryName = 'a3';
        @hasOne('a4', null, {
          createRelated: 1,
        })
        a4;
      }
      class FactoryA4 extends Factory {
        static factoryName = 'a4';
      }
      beforeEach(() => {
        lair.registerFactory(new FactoryA());
        lair.registerFactory(new FactoryA1());
        lair.registerFactory(new FactoryA2());
        lair.registerFactory(new FactoryA3());
        lair.registerFactory(new FactoryA4());
      });

      it('should be correctly overridden', () => {
        class FactoryAChild extends FactoryA {
          static factoryName = 'a-child';
          afterCreateRelationshipsDepth = 2;
          afterCreateIgnoreRelated = ['a2'];
          afterCreate(r: LairRecord): LairRecord {
            expect(r).to.be.eql({
              id: '1',
              a1: { id: '1', a2: '1' },
            });
            return r;
          }
        }
        lair.registerFactory(new FactoryAChild());
        lair.createRecords('a-child', 1);
      });
    });

    describe('createRelated', () => {
      class FactoryCreateRelatedA extends Factory {
        static factoryName = 'a';
        @hasMany('a1', null, {
          createRelated: 1,
        })
        a1;
        @hasMany('a2', null, {
          get createRelated(): number {
            return 2;
          },
        })
        a2;
      }
      class FactoryCreateRelatedA1 extends Factory {
        static factoryName = 'a1';
      }
      class FactoryCreateRelatedA2 extends Factory {
        static factoryName = 'a2';
      }
      class FactoryCreateRelatedB extends FactoryCreateRelatedA {
        static factoryName = 'b';
        @hasMany('a1', null, {
          get createRelated(): number {
            return 2;
          },
        })
        a1;
        @hasMany('a2', null, {
          createRelated: 1,
        })
        a2;
      }
      beforeEach(() => {
        lair.registerFactory(new FactoryCreateRelatedA());
        lair.registerFactory(new FactoryCreateRelatedA1());
        lair.registerFactory(new FactoryCreateRelatedA2());
        lair.registerFactory(new FactoryCreateRelatedB());
        lair.createRecords('b', 1);
      });

      it('b-record is valid', () => {
        expect(lair.getOne('b', '1')).to.be.eql({
          id: '1',
          a1: [{ id: '1' }, { id: '2' }],
          a2: [{ id: '1' }],
        });
      });
    });

    describe('allowCustomIds', () => {
      it('field is mapped from parent', () => {
        class FactoryCustomIdParent extends Factory {
          static factoryName = 'parent';
          allowCustomIds = true;
        }
        class FactoryCustomIdChild extends FactoryCustomIdParent {
          static factoryName = 'child';
        }
        expect(new FactoryCustomIdParent().allowCustomIds).to.be.true;
        expect(new FactoryCustomIdChild().allowCustomIds).to.be.true;
      });
      it('field is overridden', () => {
        class FactoryCustomIdOverrideParent extends Factory {
          static factoryName = 'parent';
          allowCustomIds = false;
        }
        class FactoryCustomIdOverrideChild extends Factory {
          static factoryName = 'child';
          allowCustomIds = true;
        }
        expect(new FactoryCustomIdOverrideParent().allowCustomIds).to.be.false;
        expect(new FactoryCustomIdOverrideChild().allowCustomIds).to.be.true;
      });
    });
  });
});
