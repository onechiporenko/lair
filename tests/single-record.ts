import { expect } from 'chai';
import { Factory, hasMany, hasOne } from '../lib/factory';
import { Lair } from '../lib/lair';

let lair;

describe('single record', () => {
  beforeEach(() => (lair = Lair.getLair()));
  afterEach(() => Lair.cleanLair());

  describe('not-cross relationships', () => {
    class FactoryNotCrossRelsA extends Factory {
      static factoryName = 'a';
      @hasOne('b', null) propB;
    }
    class FactoryNotCrossRelsB extends Factory {
      static factoryName = 'b';
    }
    class FactoryNotCrossRelsC extends Factory {
      static factoryName = 'c';
      @hasMany('b', null) propB;
    }
    beforeEach(() => {
      lair.registerFactory(new FactoryNotCrossRelsA());
      lair.registerFactory(new FactoryNotCrossRelsB());
      lair.registerFactory(new FactoryNotCrossRelsC());
    });

    describe('#getOne', () => {
      class FactoryGetOneA extends Factory {
        static factoryName = 'aFactory';
        @hasOne('bFactory', null, {
          createRelated: 1,
        })
        propB;
      }
      class FactoryGetOneB extends Factory {
        static factoryName = 'bFactory';
      }
      class FactoryGetOneC extends Factory {
        static factoryName = 'cFactory';
        @hasMany('bFactory', null, {
          createRelated: 2,
        })
        propB;
      }
      beforeEach(() => {
        lair.registerFactory(new FactoryGetOneA());
        lair.registerFactory(new FactoryGetOneB());
        lair.registerFactory(new FactoryGetOneC());
        lair.createRecords('aFactory', 1);
        lair.createRecords('cFactory', 1);
      });
      it("propB for A doesn't have related fields for A", () => {
        expect(lair.getOne('aFactory', '1')).to.be.eql({
          id: '1',
          propB: {
            id: '1',
          },
        });
      });
      it("propB for C doesn't have related fields for C", () => {
        expect(lair.getOne('cFactory', '1')).to.be.eql({
          id: '1',
          propB: [{ id: '2' }, { id: '3' }],
        });
      });
    });

    describe('#queryOne', () => {
      class FactoryQueryOneA extends Factory {
        static factoryName = 'aFactory';
        @hasOne('bFactory', null, {
          createRelated: 1,
        })
        propB;
      }
      class FactoryQueryOneB extends Factory {
        static factoryName = 'bFactory';
      }
      class FactoryQueryOneC extends Factory {
        static factoryName = 'cFactory';
        @hasMany('bFactory', null, {
          createRelated: 2,
        })
        propB;
      }
      beforeEach(() => {
        lair.registerFactory(new FactoryQueryOneA());
        lair.registerFactory(new FactoryQueryOneB());
        lair.registerFactory(new FactoryQueryOneC());
        lair.createRecords('aFactory', 1);
        lair.createRecords('cFactory', 1);
      });
      it("propB for A doesn't have related fields for A", () => {
        expect(lair.queryOne('aFactory', (r) => r.id === '1')).to.be.eql({
          id: '1',
          propB: {
            id: '1',
          },
        });
      });
      it("propB for C doesn't have related fields for C", () => {
        expect(lair.queryOne('cFactory', (r) => r.id === '1')).to.be.eql({
          id: '1',
          propB: [{ id: '2' }, { id: '3' }],
        });
      });
    });

    describe('#createOne', () => {
      describe('has one', () => {
        it('one A created', () => {
          lair.createRecords('b', 1);
          lair.createOne('a', { propB: '1' });
          expect(lair.getOne('a', '1')).to.be.eql({
            id: '1',
            propB: { id: '1' },
          });
        });
        it('one A created without relations', () => {
          lair.createOne('a', {});
          expect(lair.getOne('a', '1')).to.be.eql({ id: '1', propB: null });
        });
      });
      describe('has many', () => {
        it('one C created', () => {
          lair.createRecords('b', 2);
          lair.createOne('c', { propB: ['1', '2'] });
          expect(lair.getOne('c', '1')).to.be.eql({
            id: '1',
            propB: [{ id: '1' }, { id: '2' }],
          });
        });
        it('one C created without relations', () => {
          lair.createOne('c', {});
          expect(lair.getOne('c', '1')).to.be.eql({ id: '1', propB: [] });
        });
      });
    });

    describe('#updateOne', () => {
      describe('has one', () => {
        beforeEach(() => {
          lair.createRecords('b', 1);
        });
        it('one A updated', () => {
          lair.createOne('a', {});
          lair.updateOne('a', '1', { propB: '1' });
          expect(lair.getOne('a', '1')).to.be.eql({
            id: '1',
            propB: { id: '1' },
          });
        });
        it('one A updated to drop relation', () => {
          lair.createOne('a', { propB: '1' });
          lair.updateOne('a', '1', { propB: null });
          expect(lair.getOne('a', '1')).to.be.eql({ id: '1', propB: null });
        });
      });
      describe('has many', () => {
        beforeEach(() => {
          lair.createRecords('b', 2);
        });
        it('one C updated', () => {
          lair.createOne('c', {});
          lair.updateOne('c', '1', { propB: ['1', '2'] });
          expect(lair.getOne('c', '1')).to.be.eql({
            id: '1',
            propB: [{ id: '1' }, { id: '2' }],
          });
        });
        it('one C updated to drop relation', () => {
          lair.createOne('c', { propB: ['1', '2'] });
          lair.updateOne('c', '1', { propB: [] });
          expect(lair.getOne('c', '1')).to.be.eql({ id: '1', propB: [] });
        });
      });
    });
  });
});
