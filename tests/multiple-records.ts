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

let lair;

describe('multiple records', () => {

  beforeEach(() => lair = Lair.getLair());
  afterEach(() => Lair.cleanLair());

  describe('one-to-one', () => {

    beforeEach(() => {
      lair.registerFactory(Factory.create({
        attrs: {
          propBar: Factory.hasOne('bar', 'propFoo'),
          sFoo: 'static foo',
        },
        createRelated: {
          propBar: 1,
        },
      }), 'foo');
      lair.registerFactory(Factory.create({
        attrs: {
          propFoo: Factory.hasOne('foo', 'propBar'),
          propBaz: Factory.hasOne('baz', 'propBar'),
          sBar: 'static bar',
        },
        createRelated: {
          propBaz: 1,
        },
      }), 'bar');
      lair.registerFactory(Factory.create({
        attrs: {
          propBar: Factory.hasOne('bar', 'propBaz'),
          sBaz: 'static baz',
        },
      }), 'baz');
      lair.createRecords('foo', 2);
    });

    describe('#getAll', () => {
      it('should return all `foo` records with relationships', () => {
        expect(lair.getAll('foo')).to.be.eql([oneToOneFoo('1'), oneToOneFoo('2')]);
      });

      it('should return all `bar` records with relationships', () => {
        expect(lair.getAll('bar')).to.be.eql([oneToOneBar('1'), oneToOneBar('2')]);
      });

      it('should return all `baz` records with relationships', () => {
        expect(lair.getAll('baz')).to.be.eql([oneToOneBaz('1'), oneToOneBaz('2')]);
      });
    });

    describe('#queryMany', () => {
      it('should return queried `foo` records with relationships', () => {
        expect(lair.queryMany('foo', r => r.id === '1' || r.id === '2')).to.be.eql([oneToOneFoo('1'), oneToOneFoo('2')]);
      });

      it('should return queried `bar` records with relationships', () => {
        expect(lair.queryMany('bar', r => r.id === '1' || r.id === '2')).to.be.eql([oneToOneBar('1'), oneToOneBar('2')]);
      });

      it('should return queried `baz` records with relationships', () => {
        expect(lair.queryMany('baz', r => r.id === '1' || r.id === '2')).to.be.eql([oneToOneBaz('1'), oneToOneBaz('2')]);
      });
    });
  });

  describe('one-to-many', () => {

    beforeEach(() => {
      lair.registerFactory(Factory.create({
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
      lair.registerFactory(Factory.create({
        attrs: {
          propFoo: Factory.hasMany('foo', 'propBar'),
          sBar: 'static bar',
        },
      }), 'bar');
      lair.registerFactory(Factory.create({
        attrs: {
          propFoo: Factory.hasMany('foo', 'propBaz'),
          sBaz: 'static baz',
        },
      }), 'baz');
      lair.createRecords('foo', 2);
    });

    describe('#getAll', () => {
      it('should return all `foo` records with relationships', () => {
        expect(lair.getAll('foo')).to.be.eql([oneToManyFoo('1'), oneToManyFoo('2')]);
      });

      it('should return all `bar` records with relationships', () => {
        expect(lair.getAll('bar')).to.be.eql([oneToManyBar('1'), oneToManyBar('2')]);
      });

      it('should return all `baz` records with relationships', () => {
        expect(lair.getAll('baz')).to.be.eql([oneToManyBaz('1'), oneToManyBaz('2')]);
      });
    });

    describe('#queryMany', () => {
      it('should return queried `foo` records with relationships', () => {
        expect(lair.queryMany('foo', r => r.id === '1' || r.id === '2')).to.be.eql([oneToManyFoo('1'), oneToManyFoo('2')]);
      });

      it('should return queried `bar` records with relationships', () => {
        expect(lair.queryMany('bar', r => r.id === '1' || r.id === '2')).to.be.eql([oneToManyBar('1'), oneToManyBar('2')]);
      });

      it('should return queried `baz` records with relationships', () => {
        expect(lair.queryMany('baz', r => r.id === '1' || r.id === '2')).to.be.eql([oneToManyBaz('1'), oneToManyBaz('2')]);
      });
    });

  });

  describe('many-to-one', () => {

    beforeEach(() => {
      lair.registerFactory(Factory.create({
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
      lair.registerFactory(Factory.create({
        attrs: {
          propFoo: Factory.hasOne('foo', 'propBar'),
          sBar: 'static bar',
        },
      }), 'bar');
      lair.registerFactory(Factory.create({
        attrs: {
          propFoo: Factory.hasOne('foo', 'propBaz'),
          sBaz: 'static baz',
        },
      }), 'baz');
      lair.createRecords('foo', 1);
    });

    describe('#getAll', () => {
      it('should return all `foo` records with relationships', () => {
        expect(lair.getAll('foo')).to.be.eql([manyToOneFoo('1')]);
      });

      it('should return all `bar` records with relationships', () => {
        expect(lair.getAll('bar')).to.be.eql([manyToOneBar('1'), manyToOneBar('1', '2')]);
      });

      it('should return all `baz` records with relationships', () => {
        expect(lair.getAll('baz')).to.be.eql([manyToOneBaz('1'), manyToOneBaz('1', '2')]);
      });
    });

    describe('#queryMany', () => {
      it('should return queried `foo` records with relationships', () => {
        expect(lair.queryMany('foo', r => r.id === '1' || r.id === '2')).to.be.eql([manyToOneFoo('1')]);
      });

      it('should return queried `bar` records with relationships', () => {
        expect(lair.queryMany('bar', r => r.id === '1' || r.id === '2')).to.be.eql([manyToOneBar('1'), manyToOneBar('1', '2')]);
      });

      it('should return queried `baz` records with relationships', () => {
        expect(lair.queryMany('baz', r => r.id === '1' || r.id === '2')).to.be.eql([manyToOneBaz('1'), manyToOneBaz('1', '2')]);
      });
    });
  });

  describe('many-to-many', () => {

    beforeEach(() => {
      lair.registerFactory(Factory.create({
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
      lair.registerFactory(Factory.create({
        attrs: {
          propFoo: Factory.hasMany('foo', 'propBar'),
          sBar: 'static bar',
        },
      }), 'bar');
      lair.registerFactory(Factory.create({
        attrs: {
          propFoo: Factory.hasMany('foo', 'propBaz'),
          sBaz: 'static baz',
        },
      }), 'baz');
      lair.createRecords('foo', 2);
    });

    describe('#getAll', () => {
      it('should return all `foo` records with relationships', () => {
        expect(lair.getAll('foo')).to.be.eql([manyToManyFoo('1'), manyToManyFoo('2', '3', '3')]);
      });

      it('should return all `bar` records with relationships', () => {
        expect(lair.getAll('bar')).to.be.eql([
          manyToManyBar('1'),
          manyToManyBar('2'),
          manyToManyBar('3', '2', '3', '3'),
          manyToManyBar('4', '2', '3', '3'),
        ]);
      });

      it('should return all `baz` records with relationships', () => {
        expect(lair.getAll('baz')).to.be.eql([
          manyToManyBaz('1'),
          manyToManyBaz('2'),
          manyToManyBaz('3', '2', '3', '3'),
          manyToManyBaz('4', '2', '3', '3'),
        ]);
      });
    });

    describe('#queryMany', () => {
      it('should return queried `foo` records with relationships', () => {
        expect(lair.queryMany('foo', r => r.id === '1' || r.id === '2')).to.be.eql([manyToManyFoo('1'), manyToManyFoo('2', '3', '3')]);
      });

      it('should return queried `bar` records with relationships', () => {
        expect(lair.queryMany('bar', r => r.id === '1' || r.id === '2')).to.be.eql([
          manyToManyBar('1'),
          manyToManyBar('2'),
        ]);
      });

      it('should return queried `baz` records with relationships', () => {
        expect(lair.queryMany('baz', r => r.id === '1' || r.id === '2')).to.be.eql([
          manyToManyBaz('1'),
          manyToManyBaz('2'),
        ]);
      });
    });

  });

  describe('non-cross relationships', () => {

    describe('#getAll', () => {

      beforeEach(() => {
        lair.registerFactory(Factory.create({
          attrs: {
            propB: Factory.hasOne('bFactory', null),
          },
          createRelated: {
            propB: 1,
          },
        }), 'aFactory');
        lair.registerFactory(Factory.create({}), 'bFactory');
        lair.registerFactory(Factory.create({
          attrs: {
            propB: Factory.hasMany('bFactory', null),
          },
          createRelated: {
            propB: 2,
          },
        }), 'cFactory');
        lair.createRecords('aFactory', 1);
        lair.createRecords('cFactory', 1);
      });
      it('propB for A doesn\'t have related fields for A', () => {
        expect(lair.getAll('aFactory')).to.be.eql([{
          id: '1',
          propB: {
            id: '1',
          },
        }]);
      });
      it('propB for C doesn\'t have related fields for C', () => {
        expect(lair.getAll('cFactory')).to.be.eql([{
          id: '1',
          propB: [
            {id: '2'}, {id: '3'},
          ],
        }]);
      });
    });

    describe('#queryMany', () => {

      beforeEach(() => {
        lair.registerFactory(Factory.create({
          attrs: {
            propB: Factory.hasOne('bFactory', null),
          },
          createRelated: {
            propB: 1,
          },
        }), 'aFactory');
        lair.registerFactory(Factory.create({}), 'bFactory');
        lair.registerFactory(Factory.create({
          attrs: {
            propB: Factory.hasMany('bFactory', null),
          },
          createRelated: {
            propB: 2,
          },
        }), 'cFactory');
        lair.createRecords('aFactory', 1);
        lair.createRecords('cFactory', 1);
      });
      it('propB for A doesn\'t have related fields for A', () => {
        expect(lair.queryMany('aFactory', r => r.id === '1')).to.be.eql([{
          id: '1',
          propB: {
            id: '1',
          },
        }]);
      });
      it('propB for C doesn\'t have related fields for C', () => {
        expect(lair.queryMany('cFactory', r => r.id === '1')).to.be.eql([{
          id: '1',
          propB: [
            {id: '2'}, {id: '3'},
          ],
        }]);
      });
    });

  });

});
