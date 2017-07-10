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

describe('multiple records', () => {

  beforeEach(() => this.lair = Lair.getLair());
  afterEach(() => Lair.cleanLair());

  describe('one-to-one', () => {

    beforeEach(() => {
      this.lair.registerFactory(Factory.create({
        attrs: {
          propBar: Factory.hasOne('bar', 'propFoo'),
          sFoo: 'static foo',
        },
        createRelated: {
          propBar: 1,
        },
      }), 'foo');
      this.lair.registerFactory(Factory.create({
        attrs: {
          propFoo: Factory.hasOne('foo', 'propBar'),
          propBaz: Factory.hasOne('baz', 'propBar'),
          sBar: 'static bar',
        },
        createRelated: {
          propBaz: 1,
        },
      }), 'bar');
      this.lair.registerFactory(Factory.create({
        attrs: {
          propBar: Factory.hasOne('bar', 'propBaz'),
          sBaz: 'static baz',
        },
      }), 'baz');
      this.lair.createRecords('foo', 2);
    });

    describe('#getAll', () => {
      it('should return all `foo` records with relationships', () => {
        expect(this.lair.getAll('foo')).to.be.eql([oneToOneFoo('1'), oneToOneFoo('2')]);
      });

      it('should return all `bar` records with relationships', () => {
        expect(this.lair.getAll('bar')).to.be.eql([oneToOneBar('1'), oneToOneBar('2')]);
      });

      it('should return all `baz` records with relationships', () => {
        expect(this.lair.getAll('baz')).to.be.eql([oneToOneBaz('1'), oneToOneBaz('2')]);
      });
    });

    describe('#queryMany', () => {
      it('should return queried `foo` records with relationships', () => {
        expect(this.lair.queryMany('foo', r => r.id === '1' || r.id === '2')).to.be.eql([oneToOneFoo('1'), oneToOneFoo('2')]);
      });

      it('should return queried `bar` records with relationships', () => {
        expect(this.lair.queryMany('bar', r => r.id === '1' || r.id === '2')).to.be.eql([oneToOneBar('1'), oneToOneBar('2')]);
      });

      it('should return queried `baz` records with relationships', () => {
        expect(this.lair.queryMany('baz', r => r.id === '1' || r.id === '2')).to.be.eql([oneToOneBaz('1'), oneToOneBaz('2')]);
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

    describe('#getAll', () => {
      it('should return all `foo` records with relationships', () => {
        expect(this.lair.getAll('foo')).to.be.eql([oneToManyFoo('1'), oneToManyFoo('2')]);
      });

      it('should return all `bar` records with relationships', () => {
        expect(this.lair.getAll('bar')).to.be.eql([oneToManyBar('1'), oneToManyBar('2')]);
      });

      it('should return all `baz` records with relationships', () => {
        expect(this.lair.getAll('baz')).to.be.eql([oneToManyBaz('1'), oneToManyBaz('2')]);
      });
    });

    describe('#queryMany', () => {
      it('should return queried `foo` records with relationships', () => {
        expect(this.lair.queryMany('foo', r => r.id === '1' || r.id === '2')).to.be.eql([oneToManyFoo('1'), oneToManyFoo('2')]);
      });

      it('should return queried `bar` records with relationships', () => {
        expect(this.lair.queryMany('bar', r => r.id === '1' || r.id === '2')).to.be.eql([oneToManyBar('1'), oneToManyBar('2')]);
      });

      it('should return queried `baz` records with relationships', () => {
        expect(this.lair.queryMany('baz', r => r.id === '1' || r.id === '2')).to.be.eql([oneToManyBaz('1'), oneToManyBaz('2')]);
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

    describe('#getAll', () => {
      it('should return all `foo` records with relationships', () => {
        expect(this.lair.getAll('foo')).to.be.eql([manyToOneFoo('1')]);
      });

      it('should return all `bar` records with relationships', () => {
        expect(this.lair.getAll('bar')).to.be.eql([manyToOneBar('1'), manyToOneBar('1', '2')]);
      });

      it('should return all `baz` records with relationships', () => {
        expect(this.lair.getAll('baz')).to.be.eql([manyToOneBaz('1'), manyToOneBaz('1', '2')]);
      });
    });

    describe('#queryMany', () => {
      it('should return queried `foo` records with relationships', () => {
        expect(this.lair.queryMany('foo', r => r.id === '1' || r.id === '2')).to.be.eql([manyToOneFoo('1')]);
      });

      it('should return queried `bar` records with relationships', () => {
        expect(this.lair.queryMany('bar', r => r.id === '1' || r.id === '2')).to.be.eql([manyToOneBar('1'), manyToOneBar('1', '2')]);
      });

      it('should return queried `baz` records with relationships', () => {
        expect(this.lair.queryMany('baz', r => r.id === '1' || r.id === '2')).to.be.eql([manyToOneBaz('1'), manyToOneBaz('1', '2')]);
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

    describe('#getAll', () => {
      it('should return all `foo` records with relationships', () => {
        expect(this.lair.getAll('foo')).to.be.eql([manyToManyFoo('1'), manyToManyFoo('2', '3', '3')]);
      });

      it('should return all `bar` records with relationships', () => {
        expect(this.lair.getAll('bar')).to.be.eql([
          manyToManyBar('1'),
          manyToManyBar('2'),
          manyToManyBar('3', '2', '3', '3'),
          manyToManyBar('4', '2', '3', '3'),
        ]);
      });

      it('should return all `baz` records with relationships', () => {
        expect(this.lair.getAll('baz')).to.be.eql([
          manyToManyBaz('1'),
          manyToManyBaz('2'),
          manyToManyBaz('3', '2', '3', '3'),
          manyToManyBaz('4', '2', '3', '3'),
        ]);
      });
    });

    describe('#queryMany', () => {
      it('should return queried `foo` records with relationships', () => {
        expect(this.lair.queryMany('foo', r => r.id === '1' || r.id === '2')).to.be.eql([manyToManyFoo('1'), manyToManyFoo('2', '3', '3')]);
      });

      it('should return queried `bar` records with relationships', () => {
        expect(this.lair.queryMany('bar', r => r.id === '1' || r.id === '2')).to.be.eql([
          manyToManyBar('1'),
          manyToManyBar('2'),
        ]);
      });

      it('should return queried `baz` records with relationships', () => {
        expect(this.lair.queryMany('baz', r => r.id === '1' || r.id === '2')).to.be.eql([
          manyToManyBaz('1'),
          manyToManyBaz('2'),
        ]);
      });
    });

  });

  describe('non-cross relationships', () => {

    describe('#getAll', () => {

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
        expect(this.lair.getAll('aFactory')).to.be.eql([{
          id: '1',
          propB: {
            id: '1',
          },
        }]);
      });
      it('propB for C doesn\'t have related fields for C', () => {
        expect(this.lair.getAll('cFactory')).to.be.eql([{
          id: '1',
          propB: [
            {id: '2'}, {id: '3'},
          ],
        }]);
      });
    });

    describe('#queryMany', () => {

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
        expect(this.lair.queryMany('aFactory', r => r.id === '1')).to.be.eql([{
          id: '1',
          propB: {
            id: '1',
          },
        }]);
      });
      it('propB for C doesn\'t have related fields for C', () => {
        expect(this.lair.queryMany('cFactory', r => r.id === '1')).to.be.eql([{
          id: '1',
          propB: [
            {id: '2'}, {id: '3'},
          ],
        }]);
      });
    });

  });

});
