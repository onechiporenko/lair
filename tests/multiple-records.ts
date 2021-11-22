import { expect } from 'chai';
import { Factory, field, hasMany, hasOne } from '../lib/factory';
import { Lair } from '../lib/lair';

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

    describe('#getAll', () => {
      it('should return all `foo` records with relationships', () => {
        expect(lair.getAll('foo')).to.be.eql([
          oneToOneFoo('1'),
          oneToOneFoo('2'),
        ]);
      });

      it('should return all `bar` records with relationships', () => {
        expect(lair.getAll('bar')).to.be.eql([
          oneToOneBar('1'),
          oneToOneBar('2'),
        ]);
      });

      it('should return all `baz` records with relationships', () => {
        expect(lair.getAll('baz')).to.be.eql([
          oneToOneBaz('1'),
          oneToOneBaz('2'),
        ]);
      });
    });

    describe('#queryMany', () => {
      it('should return queried `foo` records with relationships', () => {
        expect(
          lair.queryMany('foo', (r) => r.id === '1' || r.id === '2')
        ).to.be.eql([oneToOneFoo('1'), oneToOneFoo('2')]);
      });

      it('should return queried `bar` records with relationships', () => {
        expect(
          lair.queryMany('bar', (r) => r.id === '1' || r.id === '2')
        ).to.be.eql([oneToOneBar('1'), oneToOneBar('2')]);
      });

      it('should return queried `baz` records with relationships', () => {
        expect(
          lair.queryMany('baz', (r) => r.id === '1' || r.id === '2')
        ).to.be.eql([oneToOneBaz('1'), oneToOneBaz('2')]);
      });
    });
  });

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

    describe('#getAll', () => {
      it('should return all `foo` records with relationships', () => {
        expect(lair.getAll('foo')).to.be.eql([
          oneToManyFoo('1'),
          oneToManyFoo('2'),
        ]);
      });

      it('should return all `bar` records with relationships', () => {
        expect(lair.getAll('bar')).to.be.eql([
          oneToManyBar('1'),
          oneToManyBar('2'),
        ]);
      });

      it('should return all `baz` records with relationships', () => {
        expect(lair.getAll('baz')).to.be.eql([
          oneToManyBaz('1'),
          oneToManyBaz('2'),
        ]);
      });
    });

    describe('#queryMany', () => {
      it('should return queried `foo` records with relationships', () => {
        expect(
          lair.queryMany('foo', (r) => r.id === '1' || r.id === '2')
        ).to.be.eql([oneToManyFoo('1'), oneToManyFoo('2')]);
      });

      it('should return queried `bar` records with relationships', () => {
        expect(
          lair.queryMany('bar', (r) => r.id === '1' || r.id === '2')
        ).to.be.eql([oneToManyBar('1'), oneToManyBar('2')]);
      });

      it('should return queried `baz` records with relationships', () => {
        expect(
          lair.queryMany('baz', (r) => r.id === '1' || r.id === '2')
        ).to.be.eql([oneToManyBaz('1'), oneToManyBaz('2')]);
      });
    });
  });

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

    describe('#getAll', () => {
      it('should return all `foo` records with relationships', () => {
        expect(lair.getAll('foo')).to.be.eql([manyToOneFoo('1')]);
      });

      it('should return all `bar` records with relationships', () => {
        expect(lair.getAll('bar')).to.be.eql([
          manyToOneBar('1'),
          manyToOneBar('1', '2'),
        ]);
      });

      it('should return all `baz` records with relationships', () => {
        expect(lair.getAll('baz')).to.be.eql([
          manyToOneBaz('1'),
          manyToOneBaz('1', '2'),
        ]);
      });
    });

    describe('#queryMany', () => {
      it('should return queried `foo` records with relationships', () => {
        expect(
          lair.queryMany('foo', (r) => r.id === '1' || r.id === '2')
        ).to.be.eql([manyToOneFoo('1')]);
      });

      it('should return queried `bar` records with relationships', () => {
        expect(
          lair.queryMany('bar', (r) => r.id === '1' || r.id === '2')
        ).to.be.eql([manyToOneBar('1'), manyToOneBar('1', '2')]);
      });

      it('should return queried `baz` records with relationships', () => {
        expect(
          lair.queryMany('baz', (r) => r.id === '1' || r.id === '2')
        ).to.be.eql([manyToOneBaz('1'), manyToOneBaz('1', '2')]);
      });
    });
  });

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

    describe('#getAll', () => {
      it('should return all `foo` records with relationships', () => {
        expect(lair.getAll('foo')).to.be.eql([
          manyToManyFoo('1'),
          manyToManyFoo('2', '3', '3'),
        ]);
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
        expect(
          lair.queryMany('foo', (r) => r.id === '1' || r.id === '2')
        ).to.be.eql([manyToManyFoo('1'), manyToManyFoo('2', '3', '3')]);
      });

      it('should return queried `bar` records with relationships', () => {
        expect(
          lair.queryMany('bar', (r) => r.id === '1' || r.id === '2')
        ).to.be.eql([manyToManyBar('1'), manyToManyBar('2')]);
      });

      it('should return queried `baz` records with relationships', () => {
        expect(
          lair.queryMany('baz', (r) => r.id === '1' || r.id === '2')
        ).to.be.eql([manyToManyBaz('1'), manyToManyBaz('2')]);
      });
    });
  });

  describe('non-cross relationships', () => {
    describe('#getAll', () => {
      class FactoryGetAllNonCrossA extends Factory {
        static factoryName = 'aFactory';
        @hasOne('bFactory', null, {
          createRelated: 1,
        })
        propB;
      }
      class FactoryGetAllNonCrossB extends Factory {
        static factoryName = 'bFactory';
      }
      class FactoryGetAllNonCrossC extends Factory {
        static factoryName = 'cFactory';
        @hasMany('bFactory', null, {
          createRelated: 2,
        })
        propB;
      }
      beforeEach(() => {
        lair.registerFactory(new FactoryGetAllNonCrossA());
        lair.registerFactory(new FactoryGetAllNonCrossB());
        lair.registerFactory(new FactoryGetAllNonCrossC());
        lair.createRecords('aFactory', 1);
        lair.createRecords('cFactory', 1);
      });
      it("propB for A doesn't have related fields for A", () => {
        expect(lair.getAll('aFactory')).to.be.eql([
          {
            id: '1',
            propB: {
              id: '1',
            },
          },
        ]);
      });
      it("propB for C doesn't have related fields for C", () => {
        expect(lair.getAll('cFactory')).to.be.eql([
          {
            id: '1',
            propB: [{ id: '2' }, { id: '3' }],
          },
        ]);
      });
    });

    describe('#queryMany', () => {
      class FactoryQueryManyNonCrossA extends Factory {
        static factoryName = 'aFactory';
        @hasOne('bFactory', null, {
          createRelated: 1,
        })
        propB;
      }
      class FactoryQueryManyNonCrossB extends Factory {
        static factoryName = 'bFactory';
      }
      class FactoryQueryManyNonCrossC extends Factory {
        static factoryName = 'cFactory';
        @hasMany('bFactory', null, {
          createRelated: 2,
        })
        propB;
      }
      beforeEach(() => {
        lair.registerFactory(new FactoryQueryManyNonCrossA());
        lair.registerFactory(new FactoryQueryManyNonCrossB());
        lair.registerFactory(new FactoryQueryManyNonCrossC());
        lair.createRecords('aFactory', 1);
        lair.createRecords('cFactory', 1);
      });
      it("propB for A doesn't have related fields for A", () => {
        expect(lair.queryMany('aFactory', (r) => r.id === '1')).to.be.eql([
          {
            id: '1',
            propB: {
              id: '1',
            },
          },
        ]);
      });
      it("propB for C doesn't have related fields for C", () => {
        expect(lair.queryMany('cFactory', (r) => r.id === '1')).to.be.eql([
          {
            id: '1',
            propB: [{ id: '2' }, { id: '3' }],
          },
        ]);
      });
    });
  });
});
