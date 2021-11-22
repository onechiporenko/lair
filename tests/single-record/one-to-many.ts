import { expect } from 'chai';
import { Factory, field, hasMany, hasOne } from '../../lib/factory';
import { Lair } from '../../lib/lair';

import { oneToManyFoo, oneToManyBar, oneToManyBaz } from '../expects';

let lair;

describe('single record', () => {
  beforeEach(() => (lair = Lair.getLair()));
  afterEach(() => Lair.cleanLair());

  describe('one-to-many', () => {
    class FactoryOneToManyFoo extends Factory {
      static factoryName = 'foo';
      @hasOne('bar', 'propFoo', {
        createRelated: 1,
      })
      propBar;
      @hasOne('baz', 'propFoo', {
        createRelated: 1,
      })
      propBaz;
      @field() sFoo = 'static foo';
    }
    class FactoryOneToManyBar extends Factory {
      static factoryName = 'bar';
      @hasMany('foo', 'propBar') propFoo;
      @field() sBar = 'static bar';
    }
    class FactoryOneToManyBaz extends Factory {
      static factoryName = 'baz';
      @hasMany('foo', 'propBaz') propFoo;
      @field() sBaz = 'static baz';
    }
    beforeEach(() => {
      lair.registerFactory(new FactoryOneToManyFoo());
      lair.registerFactory(new FactoryOneToManyBar());
      lair.registerFactory(new FactoryOneToManyBaz());
      lair.createRecords('foo', 2);
    });

    describe('#getOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(lair.getOne('foo', '1')).to.be.eql(oneToManyFoo('1'));
      });

      it('should return `bar` record with relationships', () => {
        expect(lair.getOne('bar', '1')).to.be.eql(oneToManyBar('1'));
      });

      it('should return `baz` record with relationships', () => {
        expect(lair.getOne('baz', '1')).to.be.eql(oneToManyBaz('1'));
      });
    });

    describe('#queryOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(lair.queryOne('foo', (r) => r.id === '1')).to.be.eql(
          oneToManyFoo('1')
        );
      });

      it('should return `bar` record with relationships', () => {
        expect(lair.queryOne('bar', (r) => r.id === '1')).to.be.eql(
          oneToManyBar('1')
        );
      });

      it('should return `baz` record with relationships', () => {
        expect(lair.queryOne('baz', (r) => r.id === '1')).to.be.eql(
          oneToManyBaz('1')
        );
      });
    });

    describe('#updateOne', () => {
      it('should drop relation', () => {
        const expectedFoo = oneToManyFoo('1');
        const expectedBar = oneToManyBar('1');
        expectedFoo.propBar = null;
        expectedBar.propFoo = [];
        expect(lair.updateOne('foo', '1', { propBar: null })).to.be.eql(
          expectedFoo
        );
        expect(lair.getOne('bar', '1')).to.be.eql(expectedBar);
      });

      it("should throw an error if updated record doesn't exist in the db", () => {
        expect(() => lair.updateOne('foo', '100500', {})).to.throw(
          'Record of "foo" with id "100500" doesn\'t exist'
        );
      });

      it('should throw an error if relation-value contains some not id-like values', () => {
        expect(() => lair.updateOne('foo', '1', { propBar: 'abc' })).to.throw(
          `"abc" is invalid identifier for record of "bar" [one-to-many relationship]`
        );
      });

      it("should throw an error if relation-value doesn't exist in the db", () => {
        expect(() =>
          lair.updateOne('foo', '1', { propBar: '100500' })
        ).to.throw(
          `Record of "bar" with id "100500" doesn't exist. Create it first [one-to-many relationship]`
        );
      });

      describe('should update relationships (id passed)', () => {
        class FactoryIdPassedA extends Factory {
          static factoryName = 'a';
          @hasOne('b', 'propA') propB;
        }
        class FactoryIdPassedB extends Factory {
          static factoryName = 'b';
          @hasMany('a', 'propB', {
            createRelated: 1,
          })
          propA;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryIdPassedA());
          lair.registerFactory(new FactoryIdPassedB());
          lair.createRecords('b', 1);
          lair.createRecords('a', 1);
        });

        it('check initial state', () => {
          expect(lair.getOne('a', '1').propB.id).to.be.equal('1');
          expect(lair.getOne('a', '2').propB).to.be.null;
          expect(lair.getOne('b', '1').propA.map((c) => c.id)).to.be.eql(['1']);
        });

        describe('record is updated (relations are updated too)', () => {
          beforeEach(() => {
            lair.updateOne('a', '2', { propB: '1' });
          });
          it('a1 updated', () => {
            expect(lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: { id: '1', propA: ['1', '2'] },
            });
          });

          it('a2 updated', () => {
            expect(lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: { id: '1', propA: ['1', '2'] },
            });
          });

          it('b1 updated', () => {
            expect(lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [
                { id: '1', propB: '1' },
                { id: '2', propB: '1' },
              ],
            });
          });
        });
      });

      describe('should update relationships (object passed)', () => {
        class FactoryObjectPassedA extends Factory {
          static factoryName = 'a';
          @hasOne('b', 'propA') propB;
        }
        class FactoryObjectPassedB extends Factory {
          static factoryName = 'b';
          @hasMany('a', 'propB', {
            createRelated: 1,
          })
          propA;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryObjectPassedA());
          lair.registerFactory(new FactoryObjectPassedB());
          lair.createRecords('b', 1);
          lair.createRecords('a', 1);
        });

        it('check initial state', () => {
          expect(lair.getOne('a', '1').propB.id).to.be.equal('1');
          expect(lair.getOne('a', '2').propB).to.be.null;
          expect(lair.getOne('b', '1').propA.map((c) => c.id)).to.be.eql(['1']);
        });

        describe('record is updated (relations are updated too)', () => {
          beforeEach(() => {
            lair.updateOne('a', '2', { propB: { id: '1' } });
          });
          it('a1 updated', () => {
            expect(lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: { id: '1', propA: ['1', '2'] },
            });
          });

          it('a2 updated', () => {
            expect(lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: { id: '1', propA: ['1', '2'] },
            });
          });

          it('b1 updated', () => {
            expect(lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [
                { id: '1', propB: '1' },
                { id: '2', propB: '1' },
              ],
            });
          });
        });
      });

      describe('should update cross-relationships', () => {
        beforeEach(() => {
          class FactoryCrossRelA extends Factory {
            static factoryName = 'a';
            @hasOne('b', 'propA') propB;
          }
          class FactoryCrossRelB extends Factory {
            static factoryName = 'b';
            @hasMany('a', 'propB', {
              createRelated: 2,
            })
            propA;
          }
          lair.registerFactory(new FactoryCrossRelA());
          lair.registerFactory(new FactoryCrossRelB());
          lair.createRecords('b', 2);
        });

        it('check initial state', () => {
          expect(lair.getOne('a', '1').propB.id).to.be.equal('1');
          expect(lair.getOne('a', '2').propB.id).to.be.equal('1');
          expect(lair.getOne('a', '3').propB.id).to.be.equal('2');
          expect(lair.getOne('a', '4').propB.id).to.be.equal('2');
          expect(lair.getOne('b', '1').propA.map((c) => c.id)).to.be.eql([
            '1',
            '2',
          ]);
          expect(lair.getOne('b', '2').propA.map((c) => c.id)).to.be.eql([
            '3',
            '4',
          ]);
        });

        describe('one-to-one relation update (id is passed)', () => {
          beforeEach(() => {
            lair.updateOne('a', '1', { propB: '2' });
          });
          it('a#1 updated', () => {
            // a1.b -> b2
            expect(lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: {
                id: '2',
                propA: ['1', '3', '4'],
              },
            });
          });
          it('a#2 is not updated', () => {
            expect(lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: {
                id: '1',
                propA: ['2'],
              },
            });
          });
          it('b#1 updated', () => {
            // b1.a -> [a2]
            expect(lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [{ id: '2', propB: '1' }],
            });
          });
          it('b#2 updated', () => {
            // b2.a -> [a1, a3, a4]
            expect(lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: [
                { id: '1', propB: '2' },
                { id: '3', propB: '2' },
                { id: '4', propB: '2' },
              ],
            });
          });
        });
      });
    });

    describe('#createOne', () => {
      it('should throw an error if relation-value contains some not id-like values', () => {
        expect(() => lair.createOne('foo', { propBar: 'abc' })).to.throw(
          `"abc" is invalid identifier for record of "bar" [one-to-many relationship]`
        );
      });

      it("should throw an error if relation-value doesn't exist in the db", () => {
        expect(() => lair.createOne('foo', { propBar: '100500' })).to.throw(
          `Record of "bar" with id "100500" doesn't exist. Create it first [one-to-many relationship]`
        );
      });

      it('should create record without relationship', () => {
        expect(
          lair.createOne('foo', { propBar: null, propBaz: null })
        ).to.be.eql({
          id: '3',
          propBar: null,
          propBaz: null,
        });
      });

      it('should create record without relationship (property not set)', () => {
        expect(lair.createOne('foo', {})).to.be.eql({
          id: '3',
          propBar: null,
          propBaz: null,
        });
      });

      describe('should create relationships (id passed)', () => {
        class FactoryCreateOneIdPassedA extends Factory {
          static factoryName = 'a';
          @hasOne('b', 'propA', {
            createRelated: 1,
          })
          propB;
        }
        class FactoryCreateOneIdPassedB extends Factory {
          static factoryName = 'b';
          @hasMany('a', 'propB') propA;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryCreateOneIdPassedA());
          lair.registerFactory(new FactoryCreateOneIdPassedB());
          lair.createRecords('a', 1);
        });

        it('check initial state', () => {
          expect(lair.getOne('a', '1').propB.id).to.be.equal('1');
          expect(lair.getOne('b', '1').propA.map((c) => c.id)).to.be.eql(['1']);
        });

        describe('one-to-one relation update (id is passed)', () => {
          beforeEach(() => {
            lair.createOne('a', { propB: '1' });
          });

          it('a2 is created', () => {
            expect(lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: { id: '1', propA: ['1', '2'] },
            });
          });

          it('a1 is updated', () => {
            expect(lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: { id: '1', propA: ['1', '2'] },
            });
          });

          it('b1 is updated', () => {
            expect(lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [
                { id: '1', propB: '1' },
                { id: '2', propB: '1' },
              ],
            });
          });
        });
      });

      describe('should create relationships (object is passed)', () => {
        class FactoryCreateOneObjectPassedA extends Factory {
          static factoryName = 'a';
          @hasOne('b', 'propA', {
            createRelated: 1,
          })
          propB;
        }
        class FactoryCreateOneObjectPassedB extends Factory {
          static factoryName = 'b';
          @hasMany('a', 'propB') propA;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryCreateOneObjectPassedA());
          lair.registerFactory(new FactoryCreateOneObjectPassedB());
          lair.createRecords('a', 1);
        });

        it('check initial state', () => {
          expect(lair.getOne('a', '1').propB.id).to.be.equal('1');
          expect(lair.getOne('b', '1').propA.map((c) => c.id)).to.be.eql(['1']);
        });

        describe('one-to-one relation update (object passed)', () => {
          beforeEach(() => {
            lair.createOne('a', { propB: { id: '1' } });
          });

          it('a2 is created', () => {
            expect(lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: { id: '1', propA: ['1', '2'] },
            });
          });

          it('a1 is updated', () => {
            expect(lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: { id: '1', propA: ['1', '2'] },
            });
          });

          it('b1 is updated', () => {
            expect(lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [
                { id: '1', propB: '1' },
                { id: '2', propB: '1' },
              ],
            });
          });
        });
      });
    });
  });
});
