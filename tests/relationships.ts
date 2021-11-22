import { expect } from 'chai';
import { Factory, field, hasMany, hasOne, MetaAttrType } from '../lib/factory';
import { Relationships } from '../lib/relationships';

let relationships;
let foo;
let bar;

describe('Relationships', () => {
  beforeEach(() => {
    relationships = new Relationships();
  });

  describe('#addFactory', () => {
    beforeEach(() => {
      relationships.updateMeta({ baz: {} });
    });
    it('should add factory', () => {
      expect(relationships.relationships).to.not.have.property('baz');
      relationships.addFactory('baz');
      expect(relationships.relationships).to.be.eql({ baz: {} });
    });

    it('should not override factory if it already exists', () => {
      relationships.addFactory('baz');
      relationships.addRecord('baz', '1');
      relationships.addFactory('baz');
      expect(relationships.relationships).to.be.eql({ baz: { '1': {} } });
    });
  });

  describe('#addRecord', () => {
    beforeEach(() => {
      relationships.updateMeta({ baz: {} });
    });
    it('should create record if not added', () => {
      expect(relationships.relationships).to.not.have.property('baz');
      relationships.addRecord('baz', '1');
      expect(relationships.relationships).to.be.eql({ baz: { '1': {} } });
    });
    it('should fill relations for new record with default values', () => {
      expect(relationships.relationships).to.not.have.property('baz');
      relationships.updateMeta({
        baz: {
          a: {
            factoryName: 'a',
            invertedAttrName: 'a',
            type: MetaAttrType.HAS_ONE,
            reflexive: false,
            reflexiveDepth: 2,
          },
          b: {
            factoryName: 'c',
            invertedAttrName: 'a',
            type: MetaAttrType.HAS_MANY,
            reflexive: false,
            reflexiveDepth: 2,
          },
        },
      });
      relationships.addRecord('baz', '1');
      expect(relationships.relationships).to.be.eql({
        baz: { '1': { a: null, b: [] } },
      });
    });
  });

  describe('#setOne', () => {
    beforeEach(() => {
      relationships.meta = {
        f: {
          a: { type: MetaAttrType.HAS_MANY },
          b: { type: MetaAttrType.HAS_ONE },
        },
      };
      relationships.relationships = {
        f: {
          '1': {
            a: [],
            b: '1',
          },
        },
      };
    });
    it('should set value', () => {
      relationships.setOne('f', '1', 'b', '2');
      expect(relationships.getOne('f', '1', 'b')).to.be.equal('2');
    });
    it('should throw an error', () => {
      expect(() => relationships.setOne('f', '1', 'a', '1')).to.throw(
        `"setOne" should be used only for HAS_ONE relationships. You try to use for "f.a"`
      );
    });
  });

  describe('#getOne', () => {
    beforeEach(() => {
      relationships.relationships = {
        f: {
          '1': {
            a: null,
            b: '1',
          },
        },
      };
    });
    it('should return value', () => {
      expect(relationships.getOne('f', '1', 'b')).to.be.equal('1');
    });
  });

  describe('#setMany', () => {
    beforeEach(() => {
      relationships.meta = {
        f: {
          a: { type: MetaAttrType.HAS_MANY },
          b: { type: MetaAttrType.HAS_ONE },
        },
      };
      relationships.relationships = {
        f: {
          '1': {
            a: [],
            b: '1',
          },
        },
      };
    });
    it('should set value', () => {
      relationships.setMany('f', '1', 'a', ['2']);
      expect(relationships.getMany('f', '1', 'a')).to.be.eql(['2']);
    });
    it('should sort new value', () => {
      relationships.setMany('f', '1', 'a', ['2', '1', '3']);
      expect(relationships.getMany('f', '1', 'a')).to.be.eql(['1', '2', '3']);
    });
    it('should not allow duplicates in the value', () => {
      relationships.setMany('f', '1', 'a', ['2']);
      relationships.setMany('f', '1', 'a', ['2', '1']);
      expect(relationships.getMany('f', '1', 'a')).to.be.eql(['1', '2']);
    });
    it('should throw an error', () => {
      expect(() => relationships.setMany('f', '1', 'b', '1')).to.throw(
        `"setMany" should be used only for HAS_MANY relationships. You try to use for "f.b"`
      );
    });
  });

  describe('#getMany', () => {
    beforeEach(() => {
      relationships.relationships = {
        f: {
          '1': {
            a: null,
            b: ['1', '2'],
          },
        },
      };
    });
    it('should return value', () => {
      expect(relationships.getMany('f', '1', 'b')).to.be.eql(['1', '2']);
    });
  });

  describe('#addToMany', () => {
    beforeEach(() => {
      relationships.meta = {
        f: {
          a: { type: MetaAttrType.HAS_MANY },
          b: { type: MetaAttrType.HAS_ONE },
        },
      };
      relationships.relationships = {
        f: {
          '1': {
            a: [],
            b: '1',
          },
        },
      };
    });
    it('should add to value', () => {
      relationships.addToMany('f', '1', 'a', '2');
      expect(relationships.getMany('f', '1', 'a')).to.be.eql(['2']);
    });
    it('should sort new value', () => {
      relationships.addToMany('f', '1', 'a', '2');
      relationships.addToMany('f', '1', 'a', '1');
      expect(relationships.getMany('f', '1', 'a')).to.be.eql(['1', '2']);
    });
    it('should not allow duplicates in the value', () => {
      relationships.addToMany('f', '1', 'a', '2');
      relationships.addToMany('f', '1', 'a', '2');
      relationships.addToMany('f', '1', 'a', '1');
      expect(relationships.getMany('f', '1', 'a')).to.be.eql(['1', '2']);
    });
    it('should throw an error', () => {
      expect(() => relationships.addToMany('f', '1', 'b', '1')).to.throw(
        `"addToMany" should be used only for HAS_MANY relationships. You try to use for "f.b"`
      );
    });
  });

  describe('#removeFromMany', () => {
    beforeEach(() => {
      relationships.meta = {
        f: {
          a: { type: MetaAttrType.HAS_MANY },
          b: { type: MetaAttrType.HAS_ONE },
        },
      };
      relationships.relationships = {
        f: {
          '1': {
            a: ['1', '2', '3'],
            b: '1',
          },
        },
      };
    });
    it('should remove from value', () => {
      relationships.removeFromMany('f', '1', 'a', '2');
      expect(relationships.getMany('f', '1', 'a')).to.be.eql(['1', '3']);
    });
    it('should throw an error', () => {
      expect(() => relationships.removeFromMany('f', '1', 'b', '1')).to.throw(
        `"removeFromMany" should be used only for HAS_MANY relationships. You try to use for "f.b"`
      );
    });
  });

  describe('#recalculateRelationshipsForRecord', () => {
    describe('#updateOneToOne', () => {
      class FactoryRecalcRelOneToOneFoo extends Factory {
        static factoryName = 'foo';
        @hasOne('bar', 'f') b;
        @field() prop = 'static';
      }
      class FactoryRecalcRelOneToOneBar extends Factory {
        static factoryName = 'bar';
        @hasOne('foo', 'b') f;
        @field() prop = 'static';
      }
      beforeEach(() => {
        foo = new FactoryRecalcRelOneToOneFoo();
        bar = new FactoryRecalcRelOneToOneBar();
        foo.createRecord(1);
        bar.createRecord(1);
        relationships.addFactory('bar');
        relationships.addFactory('foo');
        relationships.updateMeta({
          foo: foo.meta,
          bar: bar.meta,
        });
      });

      it('should add relationships for the records', () => {
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: '2',
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: '2' } },
          bar: { '2': { f: '1' } },
        });
      });

      it('should add relationships for the records (object)', () => {
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: { id: '2' },
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: '2' } },
          bar: { '2': { f: '1' } },
        });
      });

      it('should update relationships for the records', () => {
        relationships.relationships = {
          foo: { '1': { b: '3' } },
          bar: { '2': { f: '4' } },
        };
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: '2',
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: '2' } },
          bar: { '2': { f: '1' } },
        });
      });

      it('should update relationships for the records (with `null`)', () => {
        relationships.relationships = {
          foo: { '1': { b: '2' } },
          bar: { '2': { f: '1' } },
        };
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: null,
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: null } },
          bar: { '2': { f: null } },
        });
      });
    });

    describe('#updateManyToOne', () => {
      class FactoryRecalcRelManyToOneFoo extends Factory {
        static factoryName = 'foo';
        @hasMany('bar', 'f') b;
        @field() prop = 'static';
      }
      class FactoryRecalcRelManyToOneBar extends Factory {
        static factoryName = 'bar';
        @hasOne('foo', 'b') f;
        @field() prop = 'static';
      }
      beforeEach(() => {
        foo = new FactoryRecalcRelManyToOneFoo();
        bar = new FactoryRecalcRelManyToOneBar();
        foo.createRecord(1);
        bar.createRecord(1);
        relationships.addFactory('bar');
        relationships.addFactory('foo');
        relationships.updateMeta({
          foo: foo.meta,
          bar: bar.meta,
        });
      });

      it('should add relationships for the records', () => {
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: ['2', '3'],
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: ['2', '3'] } },
          bar: { '2': { f: '1' }, '3': { f: '1' } },
        });
      });

      it('should add relationships for the records (objects)', () => {
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: [{ id: '2' }, { id: '3' }],
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: ['2', '3'] } },
          bar: { '2': { f: '1' }, '3': { f: '1' } },
        });
      });

      it('should update relationships for the records (remove one record)', () => {
        relationships.relationships = {
          foo: { '1': { b: ['2', '3'] } },
          bar: { '2': { f: '1' }, '3': { f: '1' } },
        };
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: [{ id: '2' }],
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: ['2'] } },
          bar: { '2': { f: '1' }, '3': { f: null } },
        });
      });

      it('should update relationships for the records (remove one record and add another)', () => {
        relationships.relationships = {
          foo: { '1': { b: ['2', '3'] } },
          bar: { '2': { f: '1' }, '3': { f: '1' } },
        };
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: ['2', '4'],
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: ['2', '4'] } },
          bar: { '2': { f: '1' }, '3': { f: null }, '4': { f: '1' } },
        });
      });

      it('should update relationships for the records (null)', () => {
        relationships.relationships = {
          foo: { '1': { b: ['2', '3'] } },
          bar: { '2': { f: '1' }, '3': { f: '1' } },
        };
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: null,
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: [] } },
          bar: { '2': { f: null }, '3': { f: null } },
        });
      });

      it('should update relationships for the records (should ignore null and undefined in the array)', () => {
        relationships.relationships = {
          foo: { '1': { b: ['2', '3'] } },
          bar: { '2': { f: '1' }, '3': { f: '1' } },
        };
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: [null, '2', undefined, '3'],
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: ['2', '3'] } },
          bar: { '2': { f: '1' }, '3': { f: '1' } },
        });
      });
    });

    describe('#updateOneToMany', () => {
      class FactoryRecalcRelOneToManyFoo extends Factory {
        static factoryName = 'foo';
        @hasOne('bar', 'f') b;
        @field() prop = 'static';
      }
      class FactoryRecalcRelOneToManyBar extends Factory {
        static factoryName = 'bar';
        @hasMany('foo', 'b') f;
        @field() prop = 'static';
      }
      beforeEach(() => {
        foo = new FactoryRecalcRelOneToManyFoo();
        bar = new FactoryRecalcRelOneToManyBar();
        foo.createRecord(1);
        bar.createRecord(1);
        relationships.addFactory('bar');
        relationships.addFactory('foo');
        relationships.updateMeta({
          foo: foo.meta,
          bar: bar.meta,
        });
      });

      it('should add relationships for the records', () => {
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: '2',
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: '2' } },
          bar: { '2': { f: ['1'] } },
        });
      });

      it('should add relationships for the records (objects)', () => {
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: { id: '2' },
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: '2' } },
          bar: { '2': { f: ['1'] } },
        });
      });

      it('should update relationships for the records (move to another record)', () => {
        relationships.relationships = {
          foo: { '1': { b: '2' } },
          bar: { '2': { f: ['1'] } },
        };
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: { id: '3' },
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: '3' } },
          bar: { '2': { f: [] }, '3': { f: ['1'] } },
        });
      });

      it('should update relationships for the records (move to another record 2)', () => {
        relationships.relationships = {
          foo: { '1': { b: '2' }, '2': { b: '2' } },
          bar: { '2': { f: ['1', '2'] } },
        };
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: { id: '3' },
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: '3' }, '2': { b: '2' } },
          bar: { '2': { f: ['2'] }, '3': { f: ['1'] } },
        });
      });

      it('should update relationships for the records (null)', () => {
        relationships.relationships = {
          foo: { '1': { b: '2' } },
          bar: { '2': { f: ['1'] } },
        };
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: null,
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: null } },
          bar: { '2': { f: [] } },
        });
      });

      it('should update relationships for the records (null 2)', () => {
        relationships.relationships = {
          foo: { '1': { b: '2' }, '2': { b: '2' } },
          bar: { '2': { f: ['1', '2'] } },
        };
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: null,
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: null }, '2': { b: '2' } },
          bar: { '2': { f: ['2'] } },
        });
      });
    });

    describe('#updateManyToMany', () => {
      class FactoryRecalcRelManyToManyFoo extends Factory {
        static factoryName = 'foo';
        @hasMany('bar', 'f') b;
        @field() prop = 'static';
      }
      class FactoryRecalcRelManyToManyBar extends Factory {
        static factoryName = 'bar';
        @hasMany('foo', 'b') f;
        @field() prop = 'static';
      }
      beforeEach(() => {
        foo = new FactoryRecalcRelManyToManyFoo();
        bar = new FactoryRecalcRelManyToManyBar();
        foo.createRecord(1);
        bar.createRecord(1);
        relationships.addFactory('bar');
        relationships.addFactory('foo');
        relationships.updateMeta({
          foo: foo.meta,
          bar: bar.meta,
        });
      });

      it('should add relationships for the records', () => {
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: ['1', '2'],
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: ['1', '2'] } },
          bar: { '1': { f: ['1'] }, '2': { f: ['1'] } },
        });
      });

      it('should add relationships for the records (objects)', () => {
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: [{ id: '1' }, { id: '2' }],
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: ['1', '2'] } },
          bar: { '1': { f: ['1'] }, '2': { f: ['1'] } },
        });
      });

      it('should update relationships for the records (remove one record)', () => {
        relationships.relationships = {
          foo: { '1': { b: ['1', '2'] } },
          bar: { '1': { f: ['1'] }, '2': { f: ['1'] } },
        };
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: ['1'],
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: ['1'] } },
          bar: { '1': { f: ['1'] }, '2': { f: [] } },
        });
      });

      it('should update relationships for the records (remove one record and add another)', () => {
        relationships.relationships = {
          foo: { '1': { b: ['2', '3'] } },
          bar: { '2': { f: ['1'] }, '3': { f: ['1'] } },
        };
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: ['2', '4'],
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: ['2', '4'] } },
          bar: { '2': { f: ['1'] }, '3': { f: [] }, '4': { f: ['1'] } },
        });
      });

      it('should update relationships for the records (null)', () => {
        relationships.relationships = {
          foo: { '1': { b: ['2', '3'] } },
          bar: { '2': { f: ['1'] }, '3': { f: ['1'] } },
        };
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: null,
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: [] } },
          bar: { '2': { f: [] }, '3': { f: [] } },
        });
      });

      it('should update relationships for the records (should ignore null and undefined in the array)', () => {
        relationships.relationships = {
          foo: { '1': { b: ['2', '3'] } },
          bar: { '2': { f: ['1'] }, '3': { f: ['1'] } },
        };
        relationships.recalculateRelationshipsForRecord('foo', {
          id: '1',
          b: [null, '2', undefined, '3'],
        });
        expect(relationships.relationships).to.be.eql({
          foo: { '1': { b: ['2', '3'] } },
          bar: { '2': { f: ['1'] }, '3': { f: ['1'] } },
        });
      });
    });
  });

  describe('#deleteRelationshipsForRecord', () => {
    describe('#updateOneToOne', () => {
      class FactoryDelRelOneToOneFoo extends Factory {
        static factoryName = 'foo';
        @hasOne('bar', 'f') b;
        @field() prop = 'static';
      }
      class FactoryDelRelOneToOneBar extends Factory {
        static factoryName = 'bar';
        @hasOne('foo', 'b') f;
        @field() prop = 'static';
      }
      beforeEach(() => {
        foo = new FactoryDelRelOneToOneFoo();
        bar = new FactoryDelRelOneToOneBar();
        foo.createRecord(1);
        bar.createRecord(1);
        relationships.addFactory('bar');
        relationships.addFactory('foo');
        relationships.updateMeta({
          foo: foo.meta,
          bar: bar.meta,
        });
      });

      it('should delete existing relationships for the records', () => {
        relationships.relationships = {
          foo: { '1': { b: '2' }, '2': { b: '1' } },
          bar: { '1': { f: '2' }, '2': { f: '1' } },
        };
        relationships.deleteRelationshipsForRecord('foo', '1');
        expect(relationships.relationships).to.be.eql({
          foo: { '2': { b: '1' } },
          bar: { '1': { f: '2' }, '2': { f: null } },
        });
      });
    });

    describe('#updateOneToMany', () => {
      class FactoryDelRelOneToManyFoo extends Factory {
        static factoryName = 'foo';
        @hasOne('bar', 'f') b;
        @field() prop = 'static';
      }
      class FactoryDelRelOneToManyBar extends Factory {
        static factoryName = 'bar';
        @hasMany('foo', 'b') f;
        @field() prop = 'static';
      }
      beforeEach(() => {
        foo = new FactoryDelRelOneToManyFoo();
        bar = new FactoryDelRelOneToManyBar();
        foo.createRecord(1);
        bar.createRecord(1);
        relationships.addFactory('bar');
        relationships.addFactory('foo');
        relationships.updateMeta({
          foo: foo.meta,
          bar: bar.meta,
        });
      });

      it('should delete existing relationships for the records', () => {
        relationships.relationships = {
          foo: { '1': { b: '2' }, '2': { b: '1' } },
          bar: { '1': { f: ['3'] }, '2': { f: ['1', '2'] } },
        };
        relationships.deleteRelationshipsForRecord('foo', '1');
        expect(relationships.relationships).to.be.eql({
          foo: { '2': { b: '1' } },
          bar: { '1': { f: ['3'] }, '2': { f: ['2'] } },
        });
      });
    });

    describe('#updateManyToOne', () => {
      class FactoryDelRelManyToOneFoo extends Factory {
        static factoryName = 'foo';
        @hasMany('bar', 'f') b;
        @field() prop = 'static';
      }
      class FactoryDelRelManyToOneBar extends Factory {
        static factoryName = 'bar';
        @hasOne('foo', 'b') f;
        @field() prop = 'static';
      }
      beforeEach(() => {
        foo = new FactoryDelRelManyToOneFoo();
        bar = new FactoryDelRelManyToOneBar();
        foo.createRecord(1);
        bar.createRecord(1);
        relationships.addFactory('bar');
        relationships.addFactory('foo');
        relationships.updateMeta({
          foo: foo.meta,
          bar: bar.meta,
        });
      });

      it('should delete existing relationships for the records', () => {
        relationships.relationships = {
          foo: { '1': { b: ['2'] }, '2': { b: ['1'] } },
          bar: { '1': { f: '2' }, '2': { f: '1' } },
        };
        relationships.deleteRelationshipsForRecord('foo', '1');
        expect(relationships.relationships).to.be.eql({
          foo: { '2': { b: ['1'] } },
          bar: { '1': { f: '2' }, '2': { f: null } },
        });
      });
    });

    describe('#updateManyToMany', () => {
      class FactoryDelRelManyToManyFoo extends Factory {
        static factoryName = 'foo';
        @hasMany('bar', 'f') b;
        @field() prop = 'static';
      }
      class FactoryDelRelManyToManyBar extends Factory {
        static factoryName = 'bar';
        @hasMany('foo', 'b') f;
        @field() prop = 'static';
      }
      beforeEach(() => {
        foo = new FactoryDelRelManyToManyFoo();
        bar = new FactoryDelRelManyToManyBar();
        foo.createRecord(1);
        bar.createRecord(1);
        relationships.addFactory('bar');
        relationships.addFactory('foo');
        relationships.updateMeta({
          foo: foo.meta,
          bar: bar.meta,
        });
      });

      it('should delete existing relationships for the records', () => {
        relationships.relationships = {
          foo: { '1': { b: ['1', '2'] }, '2': { b: ['1', '2'] } },
          bar: { '1': { f: ['1', '2'] }, '2': { f: ['1', '2'] } },
        };
        relationships.deleteRelationshipsForRecord('foo', '1');
        expect(relationships.relationships).to.be.eql({
          foo: { '2': { b: ['1', '2'] } },
          bar: { '1': { f: ['2'] }, '2': { f: ['2'] } },
        });
      });
    });
  });
});
