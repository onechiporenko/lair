import { expect } from 'chai';
import { Factory, field, hasMany } from '../../lib/factory';
import { Lair } from '../../lib/lair';

import { manyToManyFoo, manyToManyBar, manyToManyBaz } from '../expects';

let lair;

describe('single record', () => {
  beforeEach(() => (lair = Lair.getLair()));
  afterEach(() => Lair.cleanLair());

  describe('many-to-many', () => {
    class FactoryManyToManyFoo extends Factory {
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
    class FactoryManyToManyBar extends Factory {
      static factoryName = 'bar';
      @hasMany('foo', 'propBar') propFoo;
      @field() sBar = 'static bar';
    }
    class FactoryManyToManyBaz extends Factory {
      static factoryName = 'baz';
      @hasMany('foo', 'propBaz') propFoo;
      @field() sBaz = 'static baz';
    }
    beforeEach(() => {
      lair.registerFactory(new FactoryManyToManyFoo());
      lair.registerFactory(new FactoryManyToManyBar());
      lair.registerFactory(new FactoryManyToManyBaz());
      lair.createRecords('foo', 2);
    });

    describe('#getOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(lair.getOne('foo', '1')).to.be.eql(manyToManyFoo('1'));
      });

      it('should return `bar` record with relationships', () => {
        expect(lair.getOne('bar', '1')).to.be.eql(manyToManyBar('1'));
      });

      it('should return `baz` record with relationships', () => {
        expect(lair.getOne('baz', '1')).to.be.eql(manyToManyBaz('1'));
      });
    });

    describe('#queryOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(lair.queryOne('foo', (r) => r.id === '1')).to.be.eql(
          manyToManyFoo('1')
        );
      });

      it('should return `bar` record with relationships', () => {
        expect(lair.queryOne('bar', (r) => r.id === '1')).to.be.eql(
          manyToManyBar('1')
        );
      });

      it('should return `baz` record with relationships', () => {
        expect(lair.queryOne('baz', (r) => r.id === '1')).to.be.eql(
          manyToManyBaz('1')
        );
      });
    });

    describe('#updateOne', () => {
      it('should drop relation', () => {
        const expectedFoo = manyToManyFoo('1');
        const expectedBar = manyToManyBar('1');
        expectedFoo.propBar = [];
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
        expect(() => lair.updateOne('foo', '1', { propBar: ['abc'] })).to.throw(
          `"abc" is invalid identifier for record of "bar" [many-to-many relationship]`
        );
      });

      it("should throw an error if relation-value doesn't exist in the db", () => {
        expect(() =>
          lair.updateOne('foo', '1', { propBar: ['100500'] })
        ).to.throw(
          `Record of "bar" with id "100500" doesn't exist. Create it first [many-to-many relationship]`
        );
      });

      describe('should update cross-relationships (id passed)', () => {
        class FactoryUdpCrossIdPassedA extends Factory {
          static factoryName = 'a';
          @hasMany('b', 'propA', {
            createRelated: 2,
          })
          propB;
        }
        class FactoryUdpCrossIdPassedB extends Factory {
          static factoryName = 'b';
          @hasMany('a', 'propB') propA;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryUdpCrossIdPassedA());
          lair.registerFactory(new FactoryUdpCrossIdPassedB());
          lair.createRecords('a', 2);
        });

        it('check initial state', () => {
          expect(lair.getOne('a', '1').propB.map((c) => c.id)).to.be.eql([
            '1',
            '2',
          ]);
          expect(lair.getOne('a', '2').propB.map((c) => c.id)).to.be.eql([
            '3',
            '4',
          ]);
          expect(lair.getOne('b', '1').propA.map((c) => c.id)).to.be.eql(['1']);
          expect(lair.getOne('b', '2').propA.map((c) => c.id)).to.be.eql(['1']);
          expect(lair.getOne('b', '3').propA.map((c) => c.id)).to.be.eql(['2']);
          expect(lair.getOne('b', '4').propA.map((c) => c.id)).to.be.eql(['2']);
        });

        describe('one-to-many relation update (list of ids is passed)', () => {
          beforeEach(() => {
            lair.updateOne('a', '1', { propB: ['2', '3'] });
          });
          it('a1 updated', () => {
            // a1.b -> [b2, b3]
            expect(lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [
                { id: '2', propA: ['1'] },
                { id: '3', propA: ['1', '2'] },
              ],
            });
          });
          it('a2 updated', () => {
            // a2.b -> [b3, b4]
            expect(lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: [
                { id: '3', propA: ['1', '2'] },
                { id: '4', propA: ['2'] },
              ],
            });
          });
          it('b1 updated', () => {
            // b1.a -> []
            expect(lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [],
            });
          });
          it('b2 updated', () => {
            // b2.a -> [a1, a2]
            expect(lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: [{ id: '1', propB: ['2', '3'] }],
            });
          });
          it('b3 updated', () => {
            // b3.a -> [a1, a2]
            expect(lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: [
                { id: '1', propB: ['2', '3'] },
                { id: '2', propB: ['3', '4'] },
              ],
            });
          });
          it('b4 updated', () => {
            // b4.a -> [a2]
            expect(lair.getOne('b', '4')).to.be.eql({
              id: '4',
              propA: [{ id: '2', propB: ['3', '4'] }],
            });
          });
        });
      });

      describe('should update cross-relationships (object passed)', () => {
        class FactoryUdpCrossObjectPassedA extends Factory {
          static factoryName = 'a';
          @hasMany('b', 'propA', {
            createRelated: 2,
          })
          propB;
        }
        class FactoryUdpCrossObjectPassedB extends Factory {
          static factoryName = 'b';
          @hasMany('a', 'propB') propA;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryUdpCrossObjectPassedA());
          lair.registerFactory(new FactoryUdpCrossObjectPassedB());
          lair.createRecords('a', 2);
        });

        it('check initial state', () => {
          expect(lair.getOne('a', '1').propB.map((c) => c.id)).to.be.eql([
            '1',
            '2',
          ]);
          expect(lair.getOne('a', '2').propB.map((c) => c.id)).to.be.eql([
            '3',
            '4',
          ]);
          expect(lair.getOne('b', '1').propA.map((c) => c.id)).to.be.eql(['1']);
          expect(lair.getOne('b', '2').propA.map((c) => c.id)).to.be.eql(['1']);
          expect(lair.getOne('b', '3').propA.map((c) => c.id)).to.be.eql(['2']);
          expect(lair.getOne('b', '4').propA.map((c) => c.id)).to.be.eql(['2']);
        });

        describe('one-to-many relation update (list of objects is passed)', () => {
          beforeEach(() => {
            lair.updateOne('a', '1', { propB: [{ id: '2' }, { id: '3' }] });
          });
          it('a1 updated', () => {
            // a1.b -> [b2, b3]
            expect(lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [
                { id: '2', propA: ['1'] },
                { id: '3', propA: ['1', '2'] },
              ],
            });
          });
          it('a2 updated', () => {
            // a2.b -> [b3, b4]
            expect(lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: [
                { id: '3', propA: ['1', '2'] },
                { id: '4', propA: ['2'] },
              ],
            });
          });
          it('b1 updated', () => {
            // b1.a -> []
            expect(lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [],
            });
          });
          it('b2 updated', () => {
            // b2.a -> [a1, a2]
            expect(lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: [{ id: '1', propB: ['2', '3'] }],
            });
          });
          it('b3 updated', () => {
            // b3.a -> [a1, a2]
            expect(lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: [
                { id: '1', propB: ['2', '3'] },
                { id: '2', propB: ['3', '4'] },
              ],
            });
          });
          it('b4 updated', () => {
            // b4.a -> [a2]
            expect(lair.getOne('b', '4')).to.be.eql({
              id: '4',
              propA: [{ id: '2', propB: ['3', '4'] }],
            });
          });
        });
      });
    });

    describe('#createOne', () => {
      it('should throw an error if relation-value contains some not id-like values', () => {
        expect(() => lair.createOne('foo', { propBar: ['abc'] })).to.throw(
          `"abc" is invalid identifier for record of "bar" [many-to-many relationship]`
        );
      });

      it("should throw an error if relation-value doesn't exist in the db", () => {
        expect(() => lair.createOne('foo', { propBar: ['100500'] })).to.throw(
          `Record of "bar" with id "100500" doesn't exist. Create it first [many-to-many relationship]`
        );
      });

      describe('should create relationships (id passed)', () => {
        class FactoryCreateRelsIdPassedA extends Factory {
          static factoryName = 'a';
          @hasMany('b', 'propA', {
            createRelated: 2,
          })
          propB;
        }
        class FactoryCreateRelsIdPassedB extends Factory {
          static factoryName = 'b';
          @hasMany('a', 'propB') propA;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryCreateRelsIdPassedA());
          lair.registerFactory(new FactoryCreateRelsIdPassedB());
          lair.createRecords('a', 2);
          lair.createRecords('b', 1);
        });

        it('check initial state', () => {
          expect(lair.getOne('a', '1').propB.map((c) => c.id)).to.be.eql([
            '1',
            '2',
          ]);
          expect(lair.getOne('a', '2').propB.map((c) => c.id)).to.be.eql([
            '3',
            '4',
          ]);
          expect(lair.getOne('b', '1').propA.map((c) => c.id)).to.be.eql(['1']);
          expect(lair.getOne('b', '2').propA.map((c) => c.id)).to.be.eql(['1']);
          expect(lair.getOne('b', '3').propA.map((c) => c.id)).to.be.eql(['2']);
          expect(lair.getOne('b', '4').propA.map((c) => c.id)).to.be.eql(['2']);
          expect(lair.getOne('b', '5').propA.map((c) => c.id)).to.be.eql([]);
        });

        describe('one-to-many relation update (list of ids is passed)', () => {
          beforeEach(() => {
            lair.createOne('a', { propB: ['2', '3', '5'] });
          });
          it('a1 updated', () => {
            expect(lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [
                { id: '1', propA: ['1'] },
                { id: '2', propA: ['1', '3'] },
              ],
            });
          });
          it('a2 updated', () => {
            expect(lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: [
                { id: '3', propA: ['2', '3'] },
                { id: '4', propA: ['2'] },
              ],
            });
          });
          it('a3 created', () => {
            expect(lair.getOne('a', '3')).to.be.eql({
              id: '3',
              propB: [
                { id: '2', propA: ['1', '3'] },
                { id: '3', propA: ['2', '3'] },
                { id: '5', propA: ['3'] },
              ],
            });
          });
          it('b1 updated', () => {
            expect(lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [{ id: '1', propB: ['1', '2'] }],
            });
          });
          it('b2 updated', () => {
            expect(lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: [
                { id: '1', propB: ['1', '2'] },
                { id: '3', propB: ['2', '3', '5'] },
              ],
            });
          });
          it('b3 updated', () => {
            expect(lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: [
                { id: '2', propB: ['3', '4'] },
                { id: '3', propB: ['2', '3', '5'] },
              ],
            });
          });
          it('b4 updated', () => {
            expect(lair.getOne('b', '4')).to.be.eql({
              id: '4',
              propA: [{ id: '2', propB: ['3', '4'] }],
            });
          });
          it('b5 updated', () => {
            expect(lair.getOne('b', '5')).to.be.eql({
              id: '5',
              propA: [{ id: '3', propB: ['2', '3', '5'] }],
            });
          });
        });
      });

      describe('should create relationships (object passed)', () => {
        class FactoryCreateRelsObjectPassedA extends Factory {
          static factoryName = 'a';
          @hasMany('b', 'propA', {
            createRelated: 2,
          })
          propB;
        }
        class FactoryCreateRelsObjectPassedB extends Factory {
          static factoryName = 'b';
          @hasMany('a', 'propB') propA;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryCreateRelsObjectPassedA());
          lair.registerFactory(new FactoryCreateRelsObjectPassedB());
          lair.createRecords('a', 2);
          lair.createRecords('b', 1);
        });

        it('check initial state', () => {
          expect(lair.getOne('a', '1').propB.map((c) => c.id)).to.be.eql([
            '1',
            '2',
          ]);
          expect(lair.getOne('a', '2').propB.map((c) => c.id)).to.be.eql([
            '3',
            '4',
          ]);
          expect(lair.getOne('b', '1').propA.map((c) => c.id)).to.be.eql(['1']);
          expect(lair.getOne('b', '2').propA.map((c) => c.id)).to.be.eql(['1']);
          expect(lair.getOne('b', '3').propA.map((c) => c.id)).to.be.eql(['2']);
          expect(lair.getOne('b', '4').propA.map((c) => c.id)).to.be.eql(['2']);
          expect(lair.getOne('b', '5').propA.map((c) => c.id)).to.be.eql([]);
        });

        describe('one-to-many relation update (list of objects is passed)', () => {
          beforeEach(() => {
            lair.createOne('a', {
              propB: [{ id: '2' }, { id: '3' }, { id: '5' }],
            });
          });
          it('a1 updated', () => {
            expect(lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [
                { id: '1', propA: ['1'] },
                { id: '2', propA: ['1', '3'] },
              ],
            });
          });
          it('a2 updated', () => {
            expect(lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: [
                { id: '3', propA: ['2', '3'] },
                { id: '4', propA: ['2'] },
              ],
            });
          });
          it('a3 created', () => {
            expect(lair.getOne('a', '3')).to.be.eql({
              id: '3',
              propB: [
                { id: '2', propA: ['1', '3'] },
                { id: '3', propA: ['2', '3'] },
                { id: '5', propA: ['3'] },
              ],
            });
          });
          it('b1 updated', () => {
            expect(lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [{ id: '1', propB: ['1', '2'] }],
            });
          });
          it('b2 updated', () => {
            expect(lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: [
                { id: '1', propB: ['1', '2'] },
                { id: '3', propB: ['2', '3', '5'] },
              ],
            });
          });
          it('b3 updated', () => {
            expect(lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: [
                { id: '2', propB: ['3', '4'] },
                { id: '3', propB: ['2', '3', '5'] },
              ],
            });
          });
          it('b4 updated', () => {
            expect(lair.getOne('b', '4')).to.be.eql({
              id: '4',
              propA: [{ id: '2', propB: ['3', '4'] }],
            });
          });
          it('b5 updated', () => {
            expect(lair.getOne('b', '5')).to.be.eql({
              id: '5',
              propA: [{ id: '3', propB: ['2', '3', '5'] }],
            });
          });
        });
      });
    });
  });
});
