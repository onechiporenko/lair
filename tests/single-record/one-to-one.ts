import { expect } from 'chai';
import { Factory, field, hasOne } from '../../lib/factory';
import { Lair } from '../../lib/lair';

import { oneToOneFoo, oneToOneBar, oneToOneBaz } from '../expects';

let lair;
let updatedFoo1;

describe('single record', () => {
  beforeEach(() => (lair = Lair.getLair()));
  afterEach(() => Lair.cleanLair());

  describe('one-to-one', () => {
    class FactoryOneToOneFoo extends Factory {
      static factoryName = 'foo';
      @hasOne('bar', 'propFoo', {
        createRelated: 1,
      })
      propBar;
      @field() sFoo = 'static foo';
    }
    class FactoryOneToOneBar extends Factory {
      static factoryName = 'bar';
      @hasOne('foo', 'propBar') propFoo;
      @hasOne('baz', 'propBar', {
        createRelated: 1,
      })
      propBaz;
      @field() sBar = 'static bar';
    }
    class FactoryOneToOneBaz extends Factory {
      static factoryName = 'baz';
      @hasOne('bar', 'propBaz') propBar;
      @field() sBaz = 'static baz';
    }
    beforeEach(() => {
      lair.registerFactory(new FactoryOneToOneFoo());
      lair.registerFactory(new FactoryOneToOneBar());
      lair.registerFactory(new FactoryOneToOneBaz());
      lair.createRecords('foo', 2);
    });

    describe('#getOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(lair.getOne('foo', '1')).to.be.eql(oneToOneFoo('1'));
      });

      it('should return `bar` record with relationships', () => {
        expect(lair.getOne('bar', '1')).to.be.eql(oneToOneBar('1'));
      });

      it('should return `baz` record with relationships', () => {
        expect(lair.getOne('baz', '1')).to.be.eql(oneToOneBaz('1'));
      });
    });

    describe('#queryOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(lair.queryOne('foo', (r) => r.id === '1')).to.be.eql(
          oneToOneFoo('1')
        );
      });

      it('should return `bar` record with relationships', () => {
        expect(lair.queryOne('bar', (r) => r.id === '1')).to.be.eql(
          oneToOneBar('1')
        );
      });

      it('should return `baz` record with relationships', () => {
        expect(lair.queryOne('baz', (r) => r.id === '1')).to.be.eql(
          oneToOneBaz('1')
        );
      });
    });

    describe('#updateOne', () => {
      it('should drop relation', () => {
        const expectedFoo = oneToOneFoo('1');
        const expectedBar = oneToOneBar('1');
        expectedFoo.propBar = null;
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

      it('should throw an error if relation-value is not an id-like', () => {
        expect(() => lair.updateOne('foo', '1', { propBar: 'abc' })).to.throw(
          `"abc" is invalid identifier for record of "bar" [one-to-one relationship]`
        );
      });

      it("should throw an error if relation-value doesn't exist in the db", () => {
        expect(() =>
          lair.updateOne('foo', '1', { propBar: '100500' })
        ).to.throw(
          `Record of "bar" with id "100500" doesn't exist. Create it first [one-to-one relationship]`
        );
      });

      describe('should update relationships (id passed)', () => {
        beforeEach(() => {
          lair.updateOne('bar', '2', { fooProp: null });
          updatedFoo1 = lair.updateOne('foo', '1', { propBar: '2' });
        });

        it('foo1 is updated', () => {
          const expectedFoo1 = oneToOneFoo('1');
          expectedFoo1.propBar = {
            id: '2',
            propFoo: '1',
            sBar: 'static bar',
            propBaz: {
              id: '2',
              propBar: '2',
              sBaz: 'static baz',
            },
          };
          expect(updatedFoo1).to.be.eql(expectedFoo1);
        });

        it('foo2 is updated', () => {
          const expectedFoo2 = oneToOneFoo('2');
          expectedFoo2.propBar = null;
          expect(lair.getOne('foo', '2')).to.be.eql(expectedFoo2);
        });

        it('bar1 is updated', () => {
          const expectedBar1 = oneToOneBar('1');
          expectedBar1.propFoo = null;
          expect(lair.getOne('bar', '1')).to.be.eql(expectedBar1);
        });

        it('bar2 is updated', () => {
          expect(lair.getOne('bar', '2')).to.be.eql({
            id: '2',
            sBar: 'static bar',
            propFoo: {
              id: '1',
              sFoo: 'static foo',
              propBar: '2',
            },
            propBaz: {
              id: '2',
              propBar: '2',
              sBaz: 'static baz',
            },
          });
        });
      });

      describe('should update relationships (object passed)', () => {
        beforeEach(() => {
          lair.updateOne('bar', '2', { fooProp: null });
          updatedFoo1 = lair.updateOne('foo', '1', { propBar: { id: '2' } });
        });

        it('foo1 is updated', () => {
          const expectedFoo1 = oneToOneFoo('1');
          expectedFoo1.propBar = {
            id: '2',
            propFoo: '1',
            sBar: 'static bar',
            propBaz: {
              id: '2',
              propBar: '2',
              sBaz: 'static baz',
            },
          };
          expect(updatedFoo1).to.be.eql(expectedFoo1);
        });

        it('foo2 is updated', () => {
          const expectedFoo2 = oneToOneFoo('2');
          expectedFoo2.propBar = null;
          expect(lair.getOne('foo', '2')).to.be.eql(expectedFoo2);
        });

        it('bar1 is updated', () => {
          const expectedBar1 = oneToOneBar('1');
          expectedBar1.propFoo = null;
          expect(lair.getOne('bar', '1')).to.be.eql(expectedBar1);
        });

        it('bar2 is updated', () => {
          expect(lair.getOne('bar', '2')).to.be.eql({
            id: '2',
            sBar: 'static bar',
            propFoo: {
              id: '1',
              sFoo: 'static foo',
              propBar: '2',
            },
            propBaz: {
              id: '2',
              propBar: '2',
              sBaz: 'static baz',
            },
          });
        });
      });

      describe('should update cross-relationships (id passed)', () => {
        beforeEach(() => {
          // initial state:
          // foo1 -> bar1, bar1 -> foo1
          // foo2 -> bar2, bar2 -> foo2

          // should become to:
          // foo1 -> bar2, bar1 -> null
          // foo2 -> null, bar2 -> foo1
          updatedFoo1 = lair.updateOne('foo', '1', { propBar: '2' });
        });

        it('foo1 is updated', () => {
          const expectedFoo1 = oneToOneFoo('1');
          expectedFoo1.propBar = {
            id: '2',
            propFoo: '1',
            sBar: 'static bar',
            propBaz: {
              id: '2',
              propBar: '2',
              sBaz: 'static baz',
            },
          };
          expect(updatedFoo1).to.be.eql(expectedFoo1);
        });

        it('foo2 is updated', () => {
          const expectedFoo2 = oneToOneFoo('2');
          expectedFoo2.propBar = null;
          expect(lair.getOne('foo', '2')).to.be.eql(expectedFoo2);
        });

        it('bar1 is updated', () => {
          const expectedBar1 = oneToOneBar('1');
          expectedBar1.propFoo = null;
          expect(lair.getOne('bar', '1')).to.be.eql(expectedBar1);
        });

        it('bar2 is updated', () => {
          expect(lair.getOne('bar', '2')).to.be.eql({
            id: '2',
            sBar: 'static bar',
            propFoo: {
              id: '1',
              sFoo: 'static foo',
              propBar: '2',
            },
            propBaz: {
              id: '2',
              propBar: '2',
              sBaz: 'static baz',
            },
          });
        });
      });

      describe('should update cross-relationships (object passed)', () => {
        beforeEach(() => {
          // initial state:
          // foo1 -> bar1, bar1 -> foo1
          // foo2 -> bar2, bar2 -> foo2

          // should become to:
          // foo1 -> bar2, bar1 -> null
          // foo2 -> null, bar2 -> foo1
          updatedFoo1 = lair.updateOne('foo', '1', { propBar: { id: '2' } });
        });

        it('foo1 is updated', () => {
          const expectedFoo1 = oneToOneFoo('1');
          expectedFoo1.propBar = {
            id: '2',
            propFoo: '1',
            sBar: 'static bar',
            propBaz: {
              id: '2',
              propBar: '2',
              sBaz: 'static baz',
            },
          };
          expect(updatedFoo1).to.be.eql(expectedFoo1);
        });

        it('foo2 is updated', () => {
          const expectedFoo2 = oneToOneFoo('2');
          expectedFoo2.propBar = null;
          expect(lair.getOne('foo', '2')).to.be.eql(expectedFoo2);
        });

        it('bar1 is updated', () => {
          const expectedBar1 = oneToOneBar('1');
          expectedBar1.propFoo = null;
          expect(lair.getOne('bar', '1')).to.be.eql(expectedBar1);
        });

        it('bar2 is updated', () => {
          expect(lair.getOne('bar', '2')).to.be.eql({
            id: '2',
            sBar: 'static bar',
            propFoo: {
              id: '1',
              sFoo: 'static foo',
              propBar: '2',
            },
            propBaz: {
              id: '2',
              propBar: '2',
              sBaz: 'static baz',
            },
          });
        });
      });
    });

    describe('#createOne', () => {
      it('should throw an error if relation-value is not an id-like', () => {
        expect(() => lair.createOne('foo', { propBar: 'abc' })).to.throw(
          `"abc" is invalid identifier for record of "bar" [one-to-one relationship]`
        );
      });

      it("should throw an error if relation-value doesn't exist in the db", () => {
        expect(() => lair.createOne('foo', { propBar: '100500' })).to.throw(
          `Record of "bar" with id "100500" doesn't exist. Create it first [one-to-one relationship]`
        );
      });

      it('should create record without relationship', () => {
        expect(lair.createOne('foo', { propBar: null })).to.be.eql({
          id: '3',
          propBar: null,
        });
      });

      it('should create record without relationship (property not set)', () => {
        expect(lair.createOne('foo', {})).to.be.eql({ id: '3', propBar: null });
      });

      describe('should create relationships (id passed)', () => {
        class FactoryIdPassedA extends Factory {
          static factoryName = 'a';
          @hasOne('b', 'propA', {
            createRelated: 1,
          })
          propB;
        }
        class FactoryIdPassedB extends Factory {
          static factoryName = 'b';
          @hasOne('a', 'propB') propA;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryIdPassedA());
          lair.registerFactory(new FactoryIdPassedB());
          lair.createRecords('a', 1);
          lair.createOne('a', { propB: '1' });
        });

        it('a2 is created', () => {
          expect(lair.getOne('a', '2')).to.be.eql({
            id: '2',
            propB: { id: '1', propA: '2' },
          });
        });

        it('a1 is updated', () => {
          expect(lair.getOne('a', '1')).to.be.eql({ id: '1', propB: null });
        });

        it('b1 is updated', () => {
          expect(lair.getOne('b', '1')).to.be.eql({
            id: '1',
            propA: { id: '2', propB: '1' },
          });
        });
      });

      describe('should create relationships (object passed)', () => {
        class FactoryObjectPassedA extends Factory {
          static factoryName = 'a';
          @hasOne('b', 'propA', {
            createRelated: 1,
          })
          propB;
        }
        class FactoryObjectPassedB extends Factory {
          static factoryName = 'b';
          @hasOne('a', 'propB') propA;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryObjectPassedA());
          lair.registerFactory(new FactoryObjectPassedB());
          lair.createRecords('a', 1);
          lair.createOne('a', { propB: { id: '1' } });
        });

        it('a2 is created', () => {
          expect(lair.getOne('a', '2')).to.be.eql({
            id: '2',
            propB: { id: '1', propA: '2' },
          });
        });

        it('a1 is updated', () => {
          expect(lair.getOne('a', '1')).to.be.eql({ id: '1', propB: null });
        });

        it('b1 is updated', () => {
          expect(lair.getOne('b', '1')).to.be.eql({
            id: '1',
            propA: { id: '2', propB: '1' },
          });
        });
      });
    });
  });
});
