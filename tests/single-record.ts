import {expect} from 'chai';
import {Factory} from '../lib/factory';
import {Lair} from '../lib/lair';

import {
  oneToOneFoo,
  oneToOneBar,
  oneToOneBaz,
  oneToManyFoo,
  oneToManyBar,
  oneToManyBaz,
  manyToOneFoo,
  manyToOneBar,
  manyToOneBaz,
  manyToManyFoo,
  manyToManyBar,
  manyToManyBaz,
} from './expects';

describe('single record', () => {

  beforeEach(() => this.lair = Lair.getLair());
  afterEach(() => Lair.cleanLair());

  describe('one-to-one', () => {

    beforeEach(() => {
      this.lair.registerFactory(Factory.create({
        attrs: {
          propBar: Factory.hasOne('bar', 'propFoo'),
          sFoo: 'static foo',
        },
        createRelated: {propBar: 1},
      }), 'foo');
      this.lair.registerFactory(Factory.create({
        attrs: {
          propFoo: Factory.hasOne('foo', 'propBar'),
          propBaz: Factory.hasOne('baz', 'propBar'),
          sBar: 'static bar',
        },
        createRelated: {propBaz: 1},
      }), 'bar');
      this.lair.registerFactory(Factory.create({
        attrs: {
          propBar: Factory.hasOne('bar', 'propBaz'),
          sBaz: 'static baz',
        },
      }), 'baz');
      this.lair.createRecords('foo', 2);
    });

    describe('#getOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(this.lair.getOne('foo', '1')).to.be.eql(oneToOneFoo('1'));
      });

      it('should return `bar` record with relationships', () => {
        expect(this.lair.getOne('bar', '1')).to.be.eql(oneToOneBar('1'));
      });

      it('should return `baz` record with relationships', () => {
        expect(this.lair.getOne('baz', '1')).to.be.eql(oneToOneBaz('1'));
      });
    });

    describe('#queryOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(this.lair.queryOne('foo', r => r.id === '1')).to.be.eql(oneToOneFoo('1'));
      });

      it('should return `bar` record with relationships', () => {
        expect(this.lair.queryOne('bar', r => r.id === '1')).to.be.eql(oneToOneBar('1'));
      });

      it('should return `baz` record with relationships', () => {
        expect(this.lair.queryOne('baz', r => r.id === '1')).to.be.eql(oneToOneBaz('1'));
      });
    });

    describe('#updateOne', () => {

      it('should drop relation', () => {
        const expectedFoo = oneToOneFoo('1');
        const expectedBar = oneToOneBar('1');
        expectedFoo.propBar = null;
        expectedBar.propFoo = null;
        expect(this.lair.updateOne('foo', '1', {propBar: null})).to.be.eql(expectedFoo);
        expect(this.lair.getOne('bar', '1')).to.be.eql(expectedBar);
      });

      it('should throw an error if updated record doesn\'t exist in the db', () => {
        expect(() => this.lair.updateOne('foo', '100500', {})).to.throw('Record of "foo" with id "100500" doesn\'t exist');
      });

      it('should throw an error if relation-value is not an id-like', () => {
        expect(() => this.lair.updateOne('foo', '1', {propBar: 'abc'})).to.throw(`"abc" is invalid identifier for record of "bar" [one-to-one relationship]`);
      });

      it('should throw an error if relation-value doesn\'t exist in the db', () => {
        expect(() => this.lair.updateOne('foo', '1', {propBar: '100500'})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [one-to-one relationship]`);
      });

      describe('should update relationships (id passed)', () => {

        beforeEach(() => {
          this.lair.updateOne('bar', '2', {fooProp: null});
          this.updatedFoo1 = this.lair.updateOne('foo', '1', {propBar: '2'});
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
          expect(this.updatedFoo1).to.be.eql(expectedFoo1);
        });

        it('foo2 is updated', () => {
          const expectedFoo2 = oneToOneFoo('2');
          expectedFoo2.propBar = null;
          expect(this.lair.getOne('foo', '2')).to.be.eql(expectedFoo2);
        });

        it('bar1 is updated', () => {
          const expectedBar1 = oneToOneBar('1');
          expectedBar1.propFoo = null;
          expect(this.lair.getOne('bar', '1')).to.be.eql(expectedBar1);
        });

        it('bar2 is updated', () => {
          expect(this.lair.getOne('bar', '2')).to.be.eql({
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
          this.lair.updateOne('bar', '2', {fooProp: null});
          this.updatedFoo1 = this.lair.updateOne('foo', '1', {propBar: {id: '2'}});
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
          expect(this.updatedFoo1).to.be.eql(expectedFoo1);
        });

        it('foo2 is updated', () => {
          const expectedFoo2 = oneToOneFoo('2');
          expectedFoo2.propBar = null;
          expect(this.lair.getOne('foo', '2')).to.be.eql(expectedFoo2);
        });

        it('bar1 is updated', () => {
          const expectedBar1 = oneToOneBar('1');
          expectedBar1.propFoo = null;
          expect(this.lair.getOne('bar', '1')).to.be.eql(expectedBar1);
        });

        it('bar2 is updated', () => {
          expect(this.lair.getOne('bar', '2')).to.be.eql({
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
          this.updatedFoo1 = this.lair.updateOne('foo', '1', {propBar: '2'});
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
          expect(this.updatedFoo1).to.be.eql(expectedFoo1);
        });

        it('foo2 is updated', () => {
          const expectedFoo2 = oneToOneFoo('2');
          expectedFoo2.propBar = null;
          expect(this.lair.getOne('foo', '2')).to.be.eql(expectedFoo2);
        });

        it('bar1 is updated', () => {
          const expectedBar1 = oneToOneBar('1');
          expectedBar1.propFoo = null;
          expect(this.lair.getOne('bar', '1')).to.be.eql(expectedBar1);
        });

        it('bar2 is updated', () => {
          expect(this.lair.getOne('bar', '2')).to.be.eql({
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
          this.updatedFoo1 = this.lair.updateOne('foo', '1', {propBar: {id: '2'}});
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
          expect(this.updatedFoo1).to.be.eql(expectedFoo1);
        });

        it('foo2 is updated', () => {
          const expectedFoo2 = oneToOneFoo('2');
          expectedFoo2.propBar = null;
          expect(this.lair.getOne('foo', '2')).to.be.eql(expectedFoo2);
        });

        it('bar1 is updated', () => {
          const expectedBar1 = oneToOneBar('1');
          expectedBar1.propFoo = null;
          expect(this.lair.getOne('bar', '1')).to.be.eql(expectedBar1);
        });

        it('bar2 is updated', () => {
          expect(this.lair.getOne('bar', '2')).to.be.eql({
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
        expect(() => this.lair.createOne('foo', {propBar: 'abc'})).to.throw(`"abc" is invalid identifier for record of "bar" [one-to-one relationship]`);
      });

      it('should throw an error if relation-value doesn\'t exist in the db', () => {
        expect(() => this.lair.createOne('foo', {propBar: '100500'})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [one-to-one relationship]`);
      });

      it('should create record without relationship', () => {
        expect(this.lair.createOne('foo', {propBar: null})).to.be.eql({id: '3', propBar: null});
      });

      it('should create record without relationship (property not set)', () => {
        expect(this.lair.createOne('foo', {})).to.be.eql({id: '3', propBar: null});
      });

      describe('should create relationships (id passed)', () => {
        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasOne('b', 'propA'),
            },
            createRelated: {propB: 1},
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasOne('a', 'propB'),
            },
          }), 'b');
          this.lair.createRecords('a', 1);
          this.lair.createOne('a', {propB: '1'});
        });

        it('a2 is created', () => {
          expect(this.lair.getOne('a', '2')).to.be.eql({id: '2', propB: {id: '1', propA: '2'}});
        });

        it('a1 is updated', () => {
          expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: null});
        });

        it('b1 is updated', () => {
          expect(this.lair.getOne('b', '1')).to.be.eql({id: '1', propA: {id: '2', propB: '1'}});
        });
      });

      describe('should create relationships (object passed)', () => {
        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasOne('b', 'propA'),
            },
            createRelated: {propB: 1},
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasOne('a', 'propB'),
            },
          }), 'b');
          this.lair.createRecords('a', 1);
          this.lair.createOne('a', {propB: {id: '1'}});
        });

        it('a2 is created', () => {
          expect(this.lair.getOne('a', '2')).to.be.eql({id: '2', propB: {id: '1', propA: '2'}});
        });

        it('a1 is updated', () => {
          expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: null});
        });

        it('b1 is updated', () => {
          expect(this.lair.getOne('b', '1')).to.be.eql({id: '1', propA: {id: '2', propB: '1'}});
        });
      });
    });

  });

  describe('one-to-many', () => {

    beforeEach(() => {
      this.lair.registerFactory(Factory.create({
        attrs: {
          propBar: Factory.hasOne('bar', 'propFoo'),
          propBaz: Factory.hasOne('baz', 'propFoo'),
          sFoo: 'static foo',
        },
        createRelated: {
          propBar: 1,
          propBaz: 1,
        },
      }), 'foo');
      this.lair.registerFactory(Factory.create({
        attrs: {
          propFoo: Factory.hasMany('foo', 'propBar'),
          sBar: 'static bar',
        },
      }), 'bar');
      this.lair.registerFactory(Factory.create({
        attrs: {
          propFoo: Factory.hasMany('foo', 'propBaz'),
          sBaz: 'static baz',
        },
      }), 'baz');
      this.lair.createRecords('foo', 2);
    });

    describe('#getOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(this.lair.getOne('foo', '1')).to.be.eql(oneToManyFoo('1'));
      });

      it('should return `bar` record with relationships', () => {
        expect(this.lair.getOne('bar', '1')).to.be.eql(oneToManyBar('1'));
      });

      it('should return `baz` record with relationships', () => {
        expect(this.lair.getOne('baz', '1')).to.be.eql(oneToManyBaz('1'));
      });
    });

    describe('#queryOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(this.lair.queryOne('foo', r => r.id === '1')).to.be.eql(oneToManyFoo('1'));
      });

      it('should return `bar` record with relationships', () => {
        expect(this.lair.queryOne('bar', r => r.id === '1')).to.be.eql(oneToManyBar('1'));
      });

      it('should return `baz` record with relationships', () => {
        expect(this.lair.queryOne('baz', r => r.id === '1')).to.be.eql(oneToManyBaz('1'));
      });
    });

    describe('#updateOne', () => {
      it('should drop relation', () => {
        const expectedFoo = oneToManyFoo('1');
        const expectedBar = oneToManyBar('1');
        expectedFoo.propBar = null;
        expectedBar.propFoo = [];
        expect(this.lair.updateOne('foo', '1', {propBar: null})).to.be.eql(expectedFoo);
        expect(this.lair.getOne('bar', '1')).to.be.eql(expectedBar);
      });

      it('should throw an error if updated record doesn\'t exist in the db', () => {
        expect(() => this.lair.updateOne('foo', '100500', {})).to.throw('Record of "foo" with id "100500" doesn\'t exist');
      });

      it('should throw an error if relation-value contains some not id-like values', () => {
        expect(() => this.lair.updateOne('foo', '1', {propBar: 'abc'})).to.throw(`"abc" is invalid identifier for record of "bar" [one-to-many relationship]`);
      });

      it('should throw an error if relation-value doesn\'t exist in the db', () => {
        expect(() => this.lair.updateOne('foo', '1', {propBar: '100500'})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [one-to-many relationship]`);
      });

      describe('should update relationships (id passed)', () => {

        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasOne('b', 'propA'),
            },
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasMany('a', 'propB'),
            },
            createRelated: {propA: 1},
          }), 'b');
          this.lair.createRecords('b', 1);
          this.lair.createRecords('a', 1);
        });

        it('check initial state', () => {
          expect(this.lair.getOne('a', '1').propB.id).to.be.equal('1');
          expect(this.lair.getOne('a', '2').propB).to.be.null;
          expect(this.lair.getOne('b', '1').propA.map(c => c.id)).to.be.eql(['1']);
        });

        describe('', () => {
          beforeEach(() => {
            this.lair.updateOne('a', '2', {propB: '1'});
          });
          it('a1 updated', () => {
            expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: {id: '1', propA: ['1', '2']}});
          });

          it('a2 updated', () => {
            expect(this.lair.getOne('a', '2')).to.be.eql({id: '2', propB: {id: '1', propA: ['1', '2']}});
          });

          it('b1 updated', () => {
            expect(this.lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [{id: '1', propB: '1'}, {id: '2', propB: '1'}],
            });
          });
        });

      });

      describe('should update relationships (object passed)', () => {

        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasOne('b', 'propA'),
            },
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasMany('a', 'propB'),
            },
            createRelated: {propA: 1},
          }), 'b');
          this.lair.createRecords('b', 1);
          this.lair.createRecords('a', 1);
        });

        it('check initial state', () => {
          expect(this.lair.getOne('a', '1').propB.id).to.be.equal('1');
          expect(this.lair.getOne('a', '2').propB).to.be.null;
          expect(this.lair.getOne('b', '1').propA.map(c => c.id)).to.be.eql(['1']);
        });

        describe('', () => {
          beforeEach(() => {
            this.lair.updateOne('a', '2', {propB: {id: '1'}});
          });
          it('a1 updated', () => {
            expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: {id: '1', propA: ['1', '2']}});
          });

          it('a2 updated', () => {
            expect(this.lair.getOne('a', '2')).to.be.eql({id: '2', propB: {id: '1', propA: ['1', '2']}});
          });

          it('b1 updated', () => {
            expect(this.lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [{id: '1', propB: '1'}, {id: '2', propB: '1'}],
            });
          });
        });

      });

      describe('should update cross-relationships', () => {

        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasOne('b', 'propA'),
            },
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasMany('a', 'propB'),
            },
            createRelated: {propA: 2},
          }), 'b');
          this.lair.createRecords('b', 2);
        });

        it('check initial state', () => {
          expect(this.lair.getOne('a', '1').propB.id).to.be.equal('1');
          expect(this.lair.getOne('a', '2').propB.id).to.be.equal('1');
          expect(this.lair.getOne('a', '3').propB.id).to.be.equal('2');
          expect(this.lair.getOne('a', '4').propB.id).to.be.equal('2');
          expect(this.lair.getOne('b', '1').propA.map(c => c.id)).to.be.eql(['1', '2']);
          expect(this.lair.getOne('b', '2').propA.map(c => c.id)).to.be.eql(['3', '4']);
        });

        describe('', () => {
          beforeEach(() => {
            this.lair.updateOne('a', '1', {propB: '2'});
          });
          it('a#1 updated', () => {
            // a1.b -> b2
            expect(this.lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: {
                id: '2',
                propA: ['1', '3', '4'],
              },
            });
          });
          it('a#2 is not updated', () => {
            expect(this.lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: {
                id: '1',
                propA: ['2'],
              },
            });
          });
          it('b#1 updated', () => {
            // b1.a -> [a2]
            expect(this.lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [
                {id: '2', propB: '1'},
              ],
            });
          });
          it('b#2 updated', () => {
            // b2.a -> [a1, a3, a4]
            expect(this.lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: [
                {id: '1', propB: '2'},
                {id: '3', propB: '2'},
                {id: '4', propB: '2'},
              ],
            });
          });
        });

      });
    });

    describe('#createOne', () => {
      it('should throw an error if relation-value contains some not id-like values', () => {
        expect(() => this.lair.createOne('foo', {propBar: 'abc'})).to.throw(`"abc" is invalid identifier for record of "bar" [one-to-many relationship]`);
      });

      it('should throw an error if relation-value doesn\'t exist in the db', () => {
        expect(() => this.lair.createOne('foo', {propBar: '100500'})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [one-to-many relationship]`);
      });

      it('should create record without relationship', () => {
        expect(this.lair.createOne('foo', {propBar: null, propBaz: null})).to.be.eql({
          id: '3',
          propBar: null,
          propBaz: null,
        });
      });

      it('should create record without relationship (property not set)', () => {
        expect(this.lair.createOne('foo', {})).to.be.eql({id: '3', propBar: null, propBaz: null});
      });

      describe('should create relationships (id passed)', () => {

        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasOne('b', 'propA'),
            },
            createRelated: {propB: 1},
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasMany('a', 'propB'),
            },
          }), 'b');
          this.lair.createRecords('a', 1);
        });

        it('check initial state', () => {
          expect(this.lair.getOne('a', '1').propB.id).to.be.equal('1');
          expect(this.lair.getOne('b', '1').propA.map(c => c.id)).to.be.eql(['1']);
        });

        describe('', () => {
          beforeEach(() => {
            this.lair.createOne('a', {propB: '1'});
          });

          it('a2 is created', () => {
            expect(this.lair.getOne('a', '2')).to.be.eql({id: '2', propB: {id: '1', propA: ['1', '2']}});
          });

          it('a1 is updated', () => {
            expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: {id: '1', propA: ['1', '2']}});
          });

          it('b1 is updated', () => {
            expect(this.lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [{id: '1', propB: '1'}, {id: '2', propB: '1'}],
            });
          });
        });

      });

      describe('should create relationships (object passed)', () => {

        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasOne('b', 'propA'),
            },
            createRelated: {propB: 1},
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasMany('a', 'propB'),
            },
          }), 'b');
          this.lair.createRecords('a', 1);
        });

        it('check initial state', () => {
          expect(this.lair.getOne('a', '1').propB.id).to.be.equal('1');
          expect(this.lair.getOne('b', '1').propA.map(c => c.id)).to.be.eql(['1']);
        });

        describe('', () => {
          beforeEach(() => {
            this.lair.createOne('a', {propB: {id: '1'}});
          });

          it('a2 is created', () => {
            expect(this.lair.getOne('a', '2')).to.be.eql({id: '2', propB: {id: '1', propA: ['1', '2']}});
          });

          it('a1 is updated', () => {
            expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: {id: '1', propA: ['1', '2']}});
          });

          it('b1 is updated', () => {
            expect(this.lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [{id: '1', propB: '1'}, {id: '2', propB: '1'}],
            });
          });
        });

      });
    });

  });

  describe('many-to-one', () => {

    beforeEach(() => {
      this.lair.registerFactory(Factory.create({
        attrs: {
          sFoo: 'static foo',
          propBar: Factory.hasMany('bar', 'propFoo'),
          propBaz: Factory.hasMany('baz', 'propFoo'),
        },
        createRelated: {
          propBar: 2,
          propBaz: 2,
        },
      }), 'foo');
      this.lair.registerFactory(Factory.create({
        attrs: {
          propFoo: Factory.hasOne('foo', 'propBar'),
          sBar: 'static bar',
        },
      }), 'bar');
      this.lair.registerFactory(Factory.create({
        attrs: {
          propFoo: Factory.hasOne('foo', 'propBaz'),
          sBaz: 'static baz',
        },
      }), 'baz');
      this.lair.createRecords('foo', 1);
    });

    describe('#getOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(this.lair.getOne('foo', '1')).to.be.eql(manyToOneFoo('1'));
      });

      it('should return `bar` record with relationships', () => {
        expect(this.lair.getOne('bar', '1')).to.be.eql(manyToOneBar('1'));
      });

      it('should return `baz` record with relationships', () => {
        expect(this.lair.getOne('baz', '1')).to.be.eql(manyToOneBaz('1'));
      });
    });

    describe('#queryOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(this.lair.queryOne('foo', r => r.id === '1')).to.be.eql(manyToOneFoo('1'));
      });

      it('should return `bar` record with relationships', () => {
        expect(this.lair.queryOne('bar', r => r.id === '1')).to.be.eql(manyToOneBar('1'));
      });

      it('should return `baz` record with relationships', () => {
        expect(this.lair.queryOne('baz', r => r.id === '1')).to.be.eql(manyToOneBaz('1'));
      });
    });

    describe('#updateOne', () => {

      it('should drop relation', () => {
        const expectedFoo = manyToOneFoo('1');
        const expectedBar = manyToOneBar('1');
        expectedFoo.propBar = [];
        expectedBar.propFoo = null;
        expect(this.lair.updateOne('foo', '1', {propBar: null})).to.be.eql(expectedFoo);
        expect(this.lair.getOne('bar', '1')).to.be.eql(expectedBar);
      });

      it('should throw an error if updated record doesn\'t exist in the db', () => {
        expect(() => this.lair.updateOne('foo', '100500', {})).to.throw('Record of "foo" with id "100500" doesn\'t exist');
      });

      it('should throw an error if relation-value contains some not id-like values', () => {
        expect(() => this.lair.updateOne('foo', '1', {propBar: ['abc']})).to.throw(`"abc" is invalid identifier for record of "bar" [many-to-one relationship]`);
      });

      it('should throw an error if relation-value doesn\'t exist in the db', () => {
        expect(() => this.lair.updateOne('foo', '1', {propBar: ['100500']})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [many-to-one relationship]`);
      });

      describe('should update cross-relationships (id passed)', () => {

        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasMany('b', 'propA'),
            },
            createRelated: {
              propB: 2,
            },
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasOne('a', 'propB'),
            },
          }), 'b');
          this.lair.createRecords('a', 1);
          this.lair.createRecords('b', 1);
        });

        it('check initial state', () => {
          expect(this.lair.getOne('a', '1').propB.map(c => c.id)).to.be.eql(['1', '2']);
          expect(this.lair.getOne('b', '1').propA.id).to.be.equal('1');
          expect(this.lair.getOne('b', '2').propA.id).to.be.equal('1');
          expect(this.lair.getOne('b', '3').propA).to.be.null;
        });

        describe('', () => {
          beforeEach(() => {
            this.lair.updateOne('a', '1', {propB: ['2', '3']});
          });
          it('a#1 updated', () => {
            // a1.b -> [b2, b3]
            expect(this.lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [
                {id: '2', propA: '1'},
                {id: '3', propA: '1'},
              ],
            });
          });
          it('b#1 updated', () => {
            // b1.a -> null
            expect(this.lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: null,
            });
          });
          it('b#2 is not updated', () => {
            expect(this.lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: {id: '1', propB: ['2', '3']},
            });
          });
          it('b#3 updated', () => {
            // b3.a -> a1
            expect(this.lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: {id: '1', propB: ['2', '3']},
            });
          });
        });

      });

      describe('should update cross-relationships (object passed)', () => {

        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasMany('b', 'propA'),
            },
            createRelated: {
              propB: 2,
            },
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasOne('a', 'propB'),
            },
          }), 'b');
          this.lair.createRecords('a', 1);
          this.lair.createRecords('b', 1);
        });

        it('check initial state', () => {
          expect(this.lair.getOne('a', '1').propB.map(c => c.id)).to.be.eql(['1', '2']);
          expect(this.lair.getOne('b', '1').propA.id).to.be.equal('1');
          expect(this.lair.getOne('b', '2').propA.id).to.be.equal('1');
          expect(this.lair.getOne('b', '3').propA).to.be.null;
        });

        describe('', () => {
          beforeEach(() => {
            this.lair.updateOne('a', '1', {propB: [{id: '2'}, {id: '3'}]});
          });
          it('a#1 updated', () => {
            // a1.b -> [b2, b3]
            expect(this.lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [
                {id: '2', propA: '1'},
                {id: '3', propA: '1'},
              ],
            });
          });
          it('b#1 updated', () => {
            // b1.a -> null
            expect(this.lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: null,
            });
          });
          it('b#2 is not updated', () => {
            expect(this.lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: {id: '1', propB: ['2', '3']},
            });
          });
          it('b#3 updated', () => {
            // b3.a -> a1
            expect(this.lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: {id: '1', propB: ['2', '3']},
            });
          });
        });

      });

    });

    describe('#createOne', () => {
      it('should throw an error if relation-value contains some not id-like values', () => {
        expect(() => this.lair.createOne('foo', {propBar: ['abc']})).to.throw(`"abc" is invalid identifier for record of "bar" [many-to-one relationship]`);
      });

      it('should throw an error if relation-value doesn\'t exist in the db', () => {
        expect(() => this.lair.createOne('foo', {propBar: ['100500']})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [many-to-one relationship]`);
      });

      describe('should create relationships (id passed)', () => {

        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasMany('b', 'propA'),
            },
            createRelated: {
              propB: 2,
            },
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasOne('a', 'propB'),
            },
          }), 'b');
          this.lair.createRecords('a', 1);
          this.lair.createRecords('b', 1);
        });

        it('check initial state', () => {
          expect(this.lair.getOne('a', '1').propB.map(c => c.id)).to.be.eql(['1', '2']);
          expect(this.lair.getOne('b', '1').propA.id).to.be.equal('1');
          expect(this.lair.getOne('b', '2').propA.id).to.be.equal('1');
          expect(this.lair.getOne('b', '3').propA).to.be.null;
        });

        describe('', () => {
          beforeEach(() => {
            this.lair.createOne('a', {propB: ['2', '3']});
          });
          it('a#1 updated', () => {
            expect(this.lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [
                {id: '1', propA: '1'},
              ],
            });
          });
          it('a#2 created', () => {
            expect(this.lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: [
                {id: '2', propA: '2'},
                {id: '3', propA: '2'},
              ],
            });
          });
          it('b#1 updated', () => {
            expect(this.lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: {
                id: '1',
                propB: ['1'],
              },
            });
          });
          it('b#2 updated', () => {
            expect(this.lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: {id: '2', propB: ['2', '3']},
            });
          });
          it('b#3 updated', () => {
            expect(this.lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: {id: '2', propB: ['2', '3']},
            });
          });
        });

      });

      describe('should create relationships (object passed)', () => {

        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasMany('b', 'propA'),
            },
            createRelated: {
              propB: 2,
            },
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasOne('a', 'propB'),
            },
          }), 'b');
          this.lair.createRecords('a', 1);
          this.lair.createRecords('b', 1);
        });

        it('check initial state', () => {
          expect(this.lair.getOne('a', '1').propB.map(c => c.id)).to.be.eql(['1', '2']);
          expect(this.lair.getOne('b', '1').propA.id).to.be.equal('1');
          expect(this.lair.getOne('b', '2').propA.id).to.be.equal('1');
          expect(this.lair.getOne('b', '3').propA).to.be.null;
        });

        describe('', () => {
          beforeEach(() => {
            this.lair.createOne('a', {propB: [{id: '2'}, {id: '3'}]});
          });
          it('a#1 updated', () => {
            expect(this.lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [
                {id: '1', propA: '1'},
              ],
            });
          });
          it('a#2 created', () => {
            expect(this.lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: [
                {id: '2', propA: '2'},
                {id: '3', propA: '2'},
              ],
            });
          });
          it('b#1 updated', () => {
            expect(this.lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: {
                id: '1',
                propB: ['1'],
              },
            });
          });
          it('b#2 updated', () => {
            expect(this.lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: {id: '2', propB: ['2', '3']},
            });
          });
          it('b#3 updated', () => {
            expect(this.lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: {id: '2', propB: ['2', '3']},
            });
          });
        });

      });
    });
  });

  describe('many-to-many', () => {
    beforeEach(() => {
      this.lair.registerFactory(Factory.create({
        attrs: {
          sFoo: 'static foo',
          propBar: Factory.hasMany('bar', 'propFoo'),
          propBaz: Factory.hasMany('baz', 'propFoo'),
        },
        createRelated: {
          propBar: 2,
          propBaz: 2,
        },
      }), 'foo');
      this.lair.registerFactory(Factory.create({
        attrs: {
          propFoo: Factory.hasMany('foo', 'propBar'),
          sBar: 'static bar',
        },
      }), 'bar');
      this.lair.registerFactory(Factory.create({
        attrs: {
          propFoo: Factory.hasMany('foo', 'propBaz'),
          sBaz: 'static baz',
        },
      }), 'baz');
      this.lair.createRecords('foo', 2);
    });

    describe('#getOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(this.lair.getOne('foo', '1')).to.be.eql(manyToManyFoo('1'));
      });

      it('should return `bar` record with relationships', () => {
        expect(this.lair.getOne('bar', '1')).to.be.eql(manyToManyBar('1'));
      });

      it('should return `baz` record with relationships', () => {
        expect(this.lair.getOne('baz', '1')).to.be.eql(manyToManyBaz('1'));
      });
    });

    describe('#queryOne', () => {
      it('should return `foo` record with relationships', () => {
        expect(this.lair.queryOne('foo', r => r.id === '1')).to.be.eql(manyToManyFoo('1'));
      });

      it('should return `bar` record with relationships', () => {
        expect(this.lair.queryOne('bar', r => r.id === '1')).to.be.eql(manyToManyBar('1'));
      });

      it('should return `baz` record with relationships', () => {
        expect(this.lair.queryOne('baz', r => r.id === '1')).to.be.eql(manyToManyBaz('1'));
      });
    });

    describe('#updateOne', () => {
      it('should drop relation', () => {
        const expectedFoo = manyToManyFoo('1');
        const expectedBar = manyToManyBar('1');
        expectedFoo.propBar = [];
        expectedBar.propFoo = [];
        expect(this.lair.updateOne('foo', '1', {propBar: null})).to.be.eql(expectedFoo);
        expect(this.lair.getOne('bar', '1')).to.be.eql(expectedBar);
      });

      it('should throw an error if updated record doesn\'t exist in the db', () => {
        expect(() => this.lair.updateOne('foo', '100500', {})).to.throw('Record of "foo" with id "100500" doesn\'t exist');
      });

      it('should throw an error if relation-value contains some not id-like values', () => {
        expect(() => this.lair.updateOne('foo', '1', {propBar: ['abc']})).to.throw(`"abc" is invalid identifier for record of "bar" [many-to-many relationship]`);
      });

      it('should throw an error if relation-value doesn\'t exist in the db', () => {
        expect(() => this.lair.updateOne('foo', '1', {propBar: ['100500']})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [many-to-many relationship]`);
      });

      describe('should update cross-relationships (id passed)', () => {

        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasMany('b', 'propA'),
            },
            createRelated: {
              propB: 2,
            },
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasMany('a', 'propB'),
            },
          }), 'b');
          this.lair.createRecords('a', 2);
        });

        it('check initial state', () => {
          expect(this.lair.getOne('a', '1').propB.map(c => c.id)).to.be.eql(['1', '2']);
          expect(this.lair.getOne('a', '2').propB.map(c => c.id)).to.be.eql(['3', '4']);
          expect(this.lair.getOne('b', '1').propA.map(c => c.id)).to.be.eql(['1']);
          expect(this.lair.getOne('b', '2').propA.map(c => c.id)).to.be.eql(['1']);
          expect(this.lair.getOne('b', '3').propA.map(c => c.id)).to.be.eql(['2']);
          expect(this.lair.getOne('b', '4').propA.map(c => c.id)).to.be.eql(['2']);
        });

        describe('', () => {
          beforeEach(() => {
            this.lair.updateOne('a', '1', {propB: ['2', '3']});
          });
          it('a1 updated', () => {
            // a1.b -> [b2, b3]
            expect(this.lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [
                {id: '2', propA: ['1']},
                {id: '3', propA: ['1', '2']},
              ],
            });
          });
          it('a2 updated', () => {
            // a2.b -> [b3, b4]
            expect(this.lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: [
                {id: '3', propA: ['1', '2']},
                {id: '4', propA: ['2']},
              ],
            });
          });
          it('b1 updated', () => {
            // b1.a -> []
            expect(this.lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [],
            });
          });
          it('b2 updated', () => {
            // b2.a -> [a1, a2]
            expect(this.lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: [
                {id: '1', propB: ['2', '3']},
              ],
            });
          });
          it('b3 updated', () => {
            // b3.a -> [a1, a2]
            expect(this.lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: [
                {id: '1', propB: ['2', '3']},
                {id: '2', propB: ['3', '4']},
              ],
            });
          });
          it('b4 updated', () => {
            // b4.a -> [a2]
            expect(this.lair.getOne('b', '4')).to.be.eql({
              id: '4',
              propA: [
                {id: '2', propB: ['3', '4']},
              ],
            });
          });
        });
      });

      describe('should update cross-relationships (object passed)', () => {

        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasMany('b', 'propA'),
            },
            createRelated: {
              propB: 2,
            },
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasMany('a', 'propB'),
            },
          }), 'b');
          this.lair.createRecords('a', 2);
        });

        it('check initial state', () => {
          expect(this.lair.getOne('a', '1').propB.map(c => c.id)).to.be.eql(['1', '2']);
          expect(this.lair.getOne('a', '2').propB.map(c => c.id)).to.be.eql(['3', '4']);
          expect(this.lair.getOne('b', '1').propA.map(c => c.id)).to.be.eql(['1']);
          expect(this.lair.getOne('b', '2').propA.map(c => c.id)).to.be.eql(['1']);
          expect(this.lair.getOne('b', '3').propA.map(c => c.id)).to.be.eql(['2']);
          expect(this.lair.getOne('b', '4').propA.map(c => c.id)).to.be.eql(['2']);
        });

        describe('', () => {
          beforeEach(() => {
            this.lair.updateOne('a', '1', {propB: [{id: '2'}, {id: '3'}]});
          });
          it('a1 updated', () => {
            // a1.b -> [b2, b3]
            expect(this.lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [
                {id: '2', propA: ['1']},
                {id: '3', propA: ['1', '2']},
              ],
            });
          });
          it('a2 updated', () => {
            // a2.b -> [b3, b4]
            expect(this.lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: [
                {id: '3', propA: ['1', '2']},
                {id: '4', propA: ['2']},
              ],
            });
          });
          it('b1 updated', () => {
            // b1.a -> []
            expect(this.lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [],
            });
          });
          it('b2 updated', () => {
            // b2.a -> [a1, a2]
            expect(this.lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: [
                {id: '1', propB: ['2', '3']},
              ],
            });
          });
          it('b3 updated', () => {
            // b3.a -> [a1, a2]
            expect(this.lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: [
                {id: '1', propB: ['2', '3']},
                {id: '2', propB: ['3', '4']},
              ],
            });
          });
          it('b4 updated', () => {
            // b4.a -> [a2]
            expect(this.lair.getOne('b', '4')).to.be.eql({
              id: '4',
              propA: [
                {id: '2', propB: ['3', '4']},
              ],
            });
          });
        });
      });
    });

    describe('#createOne', () => {
      it('should throw an error if relation-value contains some not id-like values', () => {
        expect(() => this.lair.createOne('foo', {propBar: ['abc']})).to.throw(`"abc" is invalid identifier for record of "bar" [many-to-many relationship]`);
      });

      it('should throw an error if relation-value doesn\'t exist in the db', () => {
        expect(() => this.lair.createOne('foo', {propBar: ['100500']})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [many-to-many relationship]`);
      });

      describe('should create relationships (id passed)', () => {

        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasMany('b', 'propA'),
            },
            createRelated: {
              propB: 2,
            },
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasMany('a', 'propB'),
            },
          }), 'b');
          this.lair.createRecords('a', 2);
          this.lair.createRecords('b', 1);
        });

        it('check initial state', () => {
          expect(this.lair.getOne('a', '1').propB.map(c => c.id)).to.be.eql(['1', '2']);
          expect(this.lair.getOne('a', '2').propB.map(c => c.id)).to.be.eql(['3', '4']);
          expect(this.lair.getOne('b', '1').propA.map(c => c.id)).to.be.eql(['1']);
          expect(this.lair.getOne('b', '2').propA.map(c => c.id)).to.be.eql(['1']);
          expect(this.lair.getOne('b', '3').propA.map(c => c.id)).to.be.eql(['2']);
          expect(this.lair.getOne('b', '4').propA.map(c => c.id)).to.be.eql(['2']);
          expect(this.lair.getOne('b', '5').propA.map(c => c.id)).to.be.eql([]);
        });

        describe('', () => {
          beforeEach(() => {
            this.lair.createOne('a', {propB: ['2', '3', '5']});
          });
          it('a1 updated', () => {
            expect(this.lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [
                {id: '1', propA: ['1']},
                {id: '2', propA: ['1', '3']},
              ],
            });
          });
          it('a2 updated', () => {
            expect(this.lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: [
                {id: '3', propA: ['2', '3']},
                {id: '4', propA: ['2']},
              ],
            });
          });
          it('a3 created', () => {
            expect(this.lair.getOne('a', '3')).to.be.eql({
              id: '3',
              propB: [
                {id: '2', propA: ['1', '3']},
                {id: '3', propA: ['2', '3']},
                {id: '5', propA: ['3']},
              ],
            });
          });
          it('b1 updated', () => {
            expect(this.lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [
                {id: '1', propB: ['1', '2']},
              ],
            });
          });
          it('b2 updated', () => {
            expect(this.lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: [
                {id: '1', propB: ['1', '2']},
                {id: '3', propB: ['2', '3', '5']},
              ],
            });
          });
          it('b3 updated', () => {
            expect(this.lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: [
                {id: '2', propB: ['3', '4']},
                {id: '3', propB: ['2', '3', '5']},
              ],
            });
          });
          it('b4 updated', () => {
            expect(this.lair.getOne('b', '4')).to.be.eql({
              id: '4',
              propA: [
                {id: '2', propB: ['3', '4']},
              ],
            });
          });
          it('b5 updated', () => {
            expect(this.lair.getOne('b', '5')).to.be.eql({
              id: '5',
              propA: [
                {id: '3', propB: ['2', '3', '5']},
              ],
            });
          });
        });
      });

      describe('should create relationships (object passed)', () => {

        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasMany('b', 'propA'),
            },
            createRelated: {
              propB: 2,
            },
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasMany('a', 'propB'),
            },
          }), 'b');
          this.lair.createRecords('a', 2);
          this.lair.createRecords('b', 1);
        });

        it('check initial state', () => {
          expect(this.lair.getOne('a', '1').propB.map(c => c.id)).to.be.eql(['1', '2']);
          expect(this.lair.getOne('a', '2').propB.map(c => c.id)).to.be.eql(['3', '4']);
          expect(this.lair.getOne('b', '1').propA.map(c => c.id)).to.be.eql(['1']);
          expect(this.lair.getOne('b', '2').propA.map(c => c.id)).to.be.eql(['1']);
          expect(this.lair.getOne('b', '3').propA.map(c => c.id)).to.be.eql(['2']);
          expect(this.lair.getOne('b', '4').propA.map(c => c.id)).to.be.eql(['2']);
          expect(this.lair.getOne('b', '5').propA.map(c => c.id)).to.be.eql([]);
        });

        describe('', () => {
          beforeEach(() => {
            this.lair.createOne('a', {propB: [{id: '2'}, {id: '3'}, {id: '5'}]});
          });
          it('a1 updated', () => {
            expect(this.lair.getOne('a', '1')).to.be.eql({
              id: '1',
              propB: [
                {id: '1', propA: ['1']},
                {id: '2', propA: ['1', '3']},
              ],
            });
          });
          it('a2 updated', () => {
            expect(this.lair.getOne('a', '2')).to.be.eql({
              id: '2',
              propB: [
                {id: '3', propA: ['2', '3']},
                {id: '4', propA: ['2']},
              ],
            });
          });
          it('a3 created', () => {
            expect(this.lair.getOne('a', '3')).to.be.eql({
              id: '3',
              propB: [
                {id: '2', propA: ['1', '3']},
                {id: '3', propA: ['2', '3']},
                {id: '5', propA: ['3']},
              ],
            });
          });
          it('b1 updated', () => {
            expect(this.lair.getOne('b', '1')).to.be.eql({
              id: '1',
              propA: [
                {id: '1', propB: ['1', '2']},
              ],
            });
          });
          it('b2 updated', () => {
            expect(this.lair.getOne('b', '2')).to.be.eql({
              id: '2',
              propA: [
                {id: '1', propB: ['1', '2']},
                {id: '3', propB: ['2', '3', '5']},
              ],
            });
          });
          it('b3 updated', () => {
            expect(this.lair.getOne('b', '3')).to.be.eql({
              id: '3',
              propA: [
                {id: '2', propB: ['3', '4']},
                {id: '3', propB: ['2', '3', '5']},
              ],
            });
          });
          it('b4 updated', () => {
            expect(this.lair.getOne('b', '4')).to.be.eql({
              id: '4',
              propA: [
                {id: '2', propB: ['3', '4']},
              ],
            });
          });
          it('b5 updated', () => {
            expect(this.lair.getOne('b', '5')).to.be.eql({
              id: '5',
              propA: [
                {id: '3', propB: ['2', '3', '5']},
              ],
            });
          });
        });
      });
    });
  });

  describe('not-cross relationships', () => {

    beforeEach(() => {
      this.lair.registerFactory(Factory.create({
        attrs: {
          propB: Factory.hasOne('b', null),
        },
      }), 'a');
      this.lair.registerFactory(Factory.create({}), 'b');
      this.lair.registerFactory(Factory.create({
        attrs: {
          propB: Factory.hasMany('b', null),
        },
      }), 'c');
    });

    describe('#getOne', () => {
      beforeEach(() => {
        this.lair.registerFactory(Factory.create({
          attrs: {
            propB: Factory.hasOne('bFactory', null),
          },
          createRelated: {
            propB: 1,
          },
        }), 'aFactory');
        this.lair.registerFactory(Factory.create({}), 'bFactory');
        this.lair.registerFactory(Factory.create({
          attrs: {
            propB: Factory.hasMany('bFactory', null),
          },
          createRelated: {
            propB: 2,
          },
        }), 'cFactory');
        this.lair.createRecords('aFactory', 1);
        this.lair.createRecords('cFactory', 1);
      });
      it('propB for A doesn\'t have related fields for A', () => {
        expect(this.lair.getOne('aFactory', '1')).to.be.eql({
          id: '1',
          propB: {
            id: '1',
          },
        });
      });
      it('propB for C doesn\'t have related fields for C', () => {
        expect(this.lair.getOne('cFactory', '1')).to.be.eql({
          id: '1',
          propB: [
            {id: '2'}, {id: '3'},
          ],
        });
      });
    });

    describe('#queryOne', () => {
      beforeEach(() => {
        this.lair.registerFactory(Factory.create({
          attrs: {
            propB: Factory.hasOne('bFactory', null),
          },
          createRelated: {
            propB: 1,
          },
        }), 'aFactory');
        this.lair.registerFactory(Factory.create({}), 'bFactory');
        this.lair.registerFactory(Factory.create({
          attrs: {
            propB: Factory.hasMany('bFactory', null),
          },
          createRelated: {
            propB: 2,
          },
        }), 'cFactory');
        this.lair.createRecords('aFactory', 1);
        this.lair.createRecords('cFactory', 1);
      });
      it('propB for A doesn\'t have related fields for A', () => {
        expect(this.lair.queryOne('aFactory', r => r.id === '1')).to.be.eql({
          id: '1',
          propB: {
            id: '1',
          },
        });
      });
      it('propB for C doesn\'t have related fields for C', () => {
        expect(this.lair.queryOne('cFactory', r => r.id === '1')).to.be.eql({
          id: '1',
          propB: [
            {id: '2'}, {id: '3'},
          ],
        });
      });
    });

    describe('#createOne', () => {
      describe('has one', () => {
        it('one A created', () => {
          this.lair.createRecords('b', 1);
          this.lair.createOne('a', {propB: '1'});
          expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: {id: '1'}});
        });
        it('one A created without relations', () => {
          this.lair.createOne('a', {});
          expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: null});
        });
      });
      describe('has many', () => {
        it('one C created', () => {
          this.lair.createRecords('b', 2);
          this.lair.createOne('c', {propB: ['1', '2']});
          expect(this.lair.getOne('c', '1')).to.be.eql({id: '1', propB: [{id: '1'}, {id: '2'}]});
        });
        it('one C created without relations', () => {
          this.lair.createOne('c', {});
          expect(this.lair.getOne('c', '1')).to.be.eql({id: '1', propB: []});
        });
      });
    });

    describe('#updateOne', () => {
      describe('has one', () => {
        beforeEach(() => {
          this.lair.createRecords('b', 1);
        });
        it('one A updated', () => {
          this.lair.createOne('a', {});
          this.lair.updateOne('a', '1', {propB: '1'});
          expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: {id: '1'}});
        });
        it('one A updated to drop relation', () => {
          this.lair.createOne('a', {propB: '1'});
          this.lair.updateOne('a', '1', {propB: null});
          expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: null});
        });
      });
      describe('has many', () => {
        beforeEach(() => {
          this.lair.createRecords('b', 2);
        });
        it('one C updated', () => {
          this.lair.createOne('c', {});
          this.lair.updateOne('c', '1', {propB: ['1', '2']});
          expect(this.lair.getOne('c', '1')).to.be.eql({id: '1', propB: [{id: '1'}, {id: '2'}]});
        });
        it('one C updated to drop relation', () => {
          this.lair.createOne('c', {propB: ['1', '2']});
          this.lair.updateOne('c', '1', {propB: []});
          expect(this.lair.getOne('c', '1')).to.be.eql({id: '1', propB: []});
        });
      });
    });

  });

});
