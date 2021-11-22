import { expect } from 'chai';
import { Factory, field, hasMany, hasOne } from '../../lib/factory';
import { Lair } from '../../lib/lair';

import { manyToOneFoo, manyToOneBar, manyToOneBaz } from '../expects';

let lair;

describe('single record', () => {
  beforeEach(() => (lair = Lair.getLair()));
  afterEach(() => Lair.cleanLair());

  describe('many-to-one', () => {
    class FactoryManyToOneFoo extends Factory {
      static factoryName = 'foo';
      @field() sFoo = 'static foo';
      @hasMany('bar', 'propFoo', {
        createRelated: 2,
      })
      propBar;
      @hasMany('baz', 'propFoo', {
        createRelated: 2,
      })
      propBaz;
    }
    class FactoryManyToOneBar extends Factory {
      static factoryName = 'bar';
      @hasOne('foo', 'propBar') propFoo;
      @field() sBar = 'static bar';
    }
    class FactoryManyToOneBaz extends Factory {
      static factoryName = 'baz';
      @hasOne('foo', 'propBaz') propFoo;
      @field() sBaz = 'static baz';
    }
    beforeEach(() => {
      lair.registerFactory(new FactoryManyToOneFoo());
      lair.registerFactory(new FactoryManyToOneBar());
      lair.registerFactory(new FactoryManyToOneBaz());
      lair.createRecords('foo', 1);
    });

    describe('#getOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(lair.getOne('foo', '1')).to.be.eql(manyToOneFoo('1'));
      });

      it('should return `bar` record with relationships', () => {
        expect(lair.getOne('bar', '1')).to.be.eql(manyToOneBar('1'));
      });

      it('should return `baz` record with relationships', () => {
        expect(lair.getOne('baz', '1')).to.be.eql(manyToOneBaz('1'));
      });
    });

    describe('#queryOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(lair.queryOne('foo', (r) => r.id === '1')).to.be.eql(
          manyToOneFoo('1')
        );
      });

      it('should return `bar` record with relationships', () => {
        expect(lair.queryOne('bar', (r) => r.id === '1')).to.be.eql(
          manyToOneBar('1')
        );
      });

      it('should return `baz` record with relationships', () => {
        expect(lair.queryOne('baz', (r) => r.id === '1')).to.be.eql(
          manyToOneBaz('1')
        );
      });
    });

    describe('#updateOne', () => {
      it('should drop relation', () => {
        const expectedFoo = manyToOneFoo('1');
        const expectedBar = manyToOneBar('1');
        expectedFoo.propBar = [];
        expectedBar.propFoo = null;
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
        expect(() => lair.updateOne('foo', '1', { propBar: ['abc'] })).to.throw(
          `"abc" is invalid identifier for record of "bar" [many-to-one relationship]`
        );
      });

      it("should throw an error if relation-value doesn't exist in the db", () => {
        expect(() =>
          lair.updateOne('foo', '1', { propBar: ['100500'] })
        ).to.throw(
          `Record of "bar" with id "100500" doesn't exist. Create it first [many-to-one relationship]`
        );
      });

      describe('should update cross-relationships (id passed)', () => {
        class FactoryUpdCrossIdPassedA extends Factory {
          static factoryName = 'a';
          @hasMany('b', 'propA', {
            createRelated: 2,
          })
          propB;
        }
        class FactoryUpdCrossIdPassedB extends Factory {
          static factoryName = 'b';
          @hasOne('a', 'propB') propA;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryUpdCrossIdPassedA());
          lair.registerFactory(new FactoryUpdCrossIdPassedB());
          lair.createRecords('a', 1);
          lair.createRecords('b', 1);
        });

        it('check initial state', () => {
          expect(lair.getOne('a', '1').propB.map((c) => c.id)).to.be.eql([
            '1',
            '2',
          ]);
          expect(lair.getOne('b', '1').propA.id).to.be.equal('1');
          expect(lair.getOne('b', '2').propA.id).to.be.equal('1');
          expect(lair.getOne('b', '3').propA).to.be.null;
        });

        describe('one-to-many relation update (list of ids is passed)', () => {
          beforeEach(() => {
            lair.updateOne('a', '1', { propB: ['2', '3'] });
          });
          it('a#1 updated', () => {
            // a1.b -> [b2, b3]
            expect(lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [
                { id: '2', propA: '1' },
                { id: '3', propA: '1' },
              ],
            });
          });
          it('b#1 updated', () => {
            // b1.a -> null
            expect(lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: null,
            });
          });
          it('b#2 is not updated', () => {
            expect(lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: { id: '1', propB: ['2', '3'] },
            });
          });
          it('b#3 updated', () => {
            // b3.a -> a1
            expect(lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: { id: '1', propB: ['2', '3'] },
            });
          });
        });
      });

      describe('should update cross-relationships (object passed)', () => {
        class FactoryUpdCrossObjectPassedA extends Factory {
          static factoryName = 'a';
          @hasMany('b', 'propA', {
            createRelated: 2,
          })
          propB;
        }
        class FactoryUpdCrossObjectPassedB extends Factory {
          static factoryName = 'b';
          @hasOne('a', 'propB') propA;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryUpdCrossObjectPassedA());
          lair.registerFactory(new FactoryUpdCrossObjectPassedB());
          lair.createRecords('a', 1);
          lair.createRecords('b', 1);
        });

        it('check initial state', () => {
          expect(lair.getOne('a', '1').propB.map((c) => c.id)).to.be.eql([
            '1',
            '2',
          ]);
          expect(lair.getOne('b', '1').propA.id).to.be.equal('1');
          expect(lair.getOne('b', '2').propA.id).to.be.equal('1');
          expect(lair.getOne('b', '3').propA).to.be.null;
        });

        describe('one-to-many relation update (list of object is passed)', () => {
          beforeEach(() => {
            lair.updateOne('a', '1', { propB: [{ id: '2' }, { id: '3' }] });
          });
          it('a#1 updated', () => {
            // a1.b -> [b2, b3]
            expect(lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [
                { id: '2', propA: '1' },
                { id: '3', propA: '1' },
              ],
            });
          });
          it('b#1 updated', () => {
            // b1.a -> null
            expect(lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: null,
            });
          });
          it('b#2 is not updated', () => {
            expect(lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: { id: '1', propB: ['2', '3'] },
            });
          });
          it('b#3 updated', () => {
            // b3.a -> a1
            expect(lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: { id: '1', propB: ['2', '3'] },
            });
          });
        });
      });
    });

    describe('#createOne', () => {
      it('should throw an error if relation-value contains some not id-like values', () => {
        expect(() => lair.createOne('foo', { propBar: ['abc'] })).to.throw(
          `"abc" is invalid identifier for record of "bar" [many-to-one relationship]`
        );
      });

      it("should throw an error if relation-value doesn't exist in the db", () => {
        expect(() => lair.createOne('foo', { propBar: ['100500'] })).to.throw(
          `Record of "bar" with id "100500" doesn't exist. Create it first [many-to-one relationship]`
        );
      });

      describe('should create relationships (id passed)', () => {
        class FactoryCreateRelIdPassedA extends Factory {
          static factoryName = 'a';
          @hasMany('b', 'propA', {
            createRelated: 2,
          })
          propB;
        }
        class FactoryCreateRelIdPassedB extends Factory {
          static factoryName = 'b';
          @hasOne('a', 'propB') propA;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryCreateRelIdPassedA());
          lair.registerFactory(new FactoryCreateRelIdPassedB());
          lair.createRecords('a', 1);
          lair.createRecords('b', 1);
        });

        it('check initial state', () => {
          expect(lair.getOne('a', '1').propB.map((c) => c.id)).to.be.eql([
            '1',
            '2',
          ]);
          expect(lair.getOne('b', '1').propA.id).to.be.equal('1');
          expect(lair.getOne('b', '2').propA.id).to.be.equal('1');
          expect(lair.getOne('b', '3').propA).to.be.null;
        });

        describe('one-to-many relation update (list of ids is passed)', () => {
          beforeEach(() => {
            lair.createOne('a', { propB: ['2', '3'] });
          });
          it('a#1 updated', () => {
            expect(lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [{ id: '1', propA: '1' }],
            });
          });
          it('a#2 created', () => {
            expect(lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: [
                { id: '2', propA: '2' },
                { id: '3', propA: '2' },
              ],
            });
          });
          it('b#1 updated', () => {
            expect(lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: {
                id: '1',
                propB: ['1'],
              },
            });
          });
          it('b#2 updated', () => {
            expect(lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: { id: '2', propB: ['2', '3'] },
            });
          });
          it('b#3 updated', () => {
            expect(lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: { id: '2', propB: ['2', '3'] },
            });
          });
        });
      });

      describe('should create relationships (object passed)', () => {
        class FactoryCreateRelObjectPassedA extends Factory {
          static factoryName = 'a';
          @hasMany('b', 'propA', {
            createRelated: 2,
          })
          propB;
        }
        class FactoryCreateRelObjectPassedB extends Factory {
          static factoryName = 'b';
          @hasOne('a', 'propB') propA;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryCreateRelObjectPassedA());
          lair.registerFactory(new FactoryCreateRelObjectPassedB());
          lair.createRecords('a', 1);
          lair.createRecords('b', 1);
        });

        it('check initial state', () => {
          expect(lair.getOne('a', '1').propB.map((c) => c.id)).to.be.eql([
            '1',
            '2',
          ]);
          expect(lair.getOne('b', '1').propA.id).to.be.equal('1');
          expect(lair.getOne('b', '2').propA.id).to.be.equal('1');
          expect(lair.getOne('b', '3').propA).to.be.null;
        });

        describe('one-to-many relation update (list of ids is passed)', () => {
          beforeEach(() => {
            lair.createOne('a', { propB: [{ id: '2' }, { id: '3' }] });
          });
          it('a#1 updated', () => {
            expect(lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [{ id: '1', propA: '1' }],
            });
          });
          it('a#2 created', () => {
            expect(lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: [
                { id: '2', propA: '2' },
                { id: '3', propA: '2' },
              ],
            });
          });
          it('b#1 updated', () => {
            expect(lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: {
                id: '1',
                propB: ['1'],
              },
            });
          });
          it('b#2 updated', () => {
            expect(lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: { id: '2', propB: ['2', '3'] },
            });
          });
          it('b#3 updated', () => {
            expect(lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: { id: '2', propB: ['2', '3'] },
            });
          });
        });
      });
    });
  });
});
