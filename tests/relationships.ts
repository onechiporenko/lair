import {expect} from 'chai';
import {Factory, MetaAttrType} from '../lib/factory';
import {Relationships} from '../lib/relationships';

describe('Relationships', () => {

  beforeEach(() => {
    this.relationships = new Relationships();
  });

  describe('#addFactory', () => {
    beforeEach(() => {
      this.relationships.updateMeta({baz: {}});
    });
    it('should add factory', () => {
      expect(this.relationships.relationships).to.not.have.property('baz');
      this.relationships.addFactory('baz');
      expect(this.relationships.relationships).to.be.eql({baz: {}});
    });

    it('should not override factory if it already exists', () => {
      this.relationships.addFactory('baz');
      this.relationships.addRecord('baz', '1');
      this.relationships.addFactory('baz');
      expect(this.relationships.relationships).to.be.eql({baz: {'1': {}}});
    });
  });

  describe('#addRecord', () => {
    beforeEach(() => {
      this.relationships.updateMeta({baz: {}});
    });
    it('should create record if not added', () => {
      expect(this.relationships.relationships).to.not.have.property('baz');
      this.relationships.addRecord('baz', '1');
      expect(this.relationships.relationships).to.be.eql({baz: {'1': {}}});
    });
    it('should fill relations for new record with default values', () => {
      expect(this.relationships.relationships).to.not.have.property('baz');
      this.relationships.updateMeta({baz: {a: Factory.hasOne('b', 'a'), b: Factory.hasMany('c', 'a')}});
      this.relationships.addRecord('baz', '1');
      expect(this.relationships.relationships).to.be.eql({baz: {'1': {a: null, b: []}}});
    });
  });

  describe('#setOne', () => {
    beforeEach(() => {
      this.relationships.meta = {
        f: {
          a: {type: MetaAttrType.HAS_MANY},
          b: {type: MetaAttrType.HAS_ONE},
        },
      };
      this.relationships.relationships = {
        f: {
          '1': {
            a: [],
            b: '1',
          },
        },
      };
    });
    it('should set value', () => {
      this.relationships.setOne('f', '1', 'b', '2');
      expect(this.relationships.getOne('f', '1', 'b')).to.be.equal('2');
    });
    it('should throw an error', () => {
      expect(() => this.relationships.setOne('f', '1', 'a', '1')).to.throw(`"setOne" should be used only for HAS_ONE relationships. You try to use for "f.a"`);
    });
  });

  describe('#getOne', () => {
    beforeEach(() => {
      this.relationships.relationships = {
        f: {
          '1': {
            a: null,
            b: '1',
          },
        },
      };
    });
    it('should return value', () => {
      expect(this.relationships.getOne('f', '1', 'b')).to.be.equal('1');
    });
  });

  describe('#setMany', () => {
    beforeEach(() => {
      this.relationships.meta = {
        f: {
          a: {type: MetaAttrType.HAS_MANY},
          b: {type: MetaAttrType.HAS_ONE},
        },
      };
      this.relationships.relationships = {
        f: {
          '1': {
            a: [],
            b: '1',
          },
        },
      };
    });
    it('should set value', () => {
      this.relationships.setMany('f', '1', 'a', ['2']);
      expect(this.relationships.getMany('f', '1', 'a')).to.be.eql(['2']);
    });
    it('should sort new value', () => {
      this.relationships.setMany('f', '1', 'a', ['2', '1', '3']);
      expect(this.relationships.getMany('f', '1', 'a')).to.be.eql(['1', '2', '3']);
    });
    it('should not allow duplicates in the value', () => {
      this.relationships.setMany('f', '1', 'a', ['2']);
      this.relationships.setMany('f', '1', 'a', ['2', '1']);
      expect(this.relationships.getMany('f', '1', 'a')).to.be.eql(['1', '2']);
    });
    it('should throw an error', () => {
      expect(() => this.relationships.setMany('f', '1', 'b', '1')).to.throw(`"setMany" should be used only for HAS_MANY relationships. You try to use for "f.b"`);
    });
  });

  describe('#getMany', () => {
    beforeEach(() => {
      this.relationships.relationships = {
        f: {
          '1': {
            a: null,
            b: ['1', '2'],
          },
        },
      };
    });
    it('should return value', () => {
      expect(this.relationships.getMany('f', '1', 'b')).to.be.eql(['1', '2']);
    });
  });

  describe('#addToMany', () => {
    beforeEach(() => {
      this.relationships.meta = {
        f: {
          a: {type: MetaAttrType.HAS_MANY},
          b: {type: MetaAttrType.HAS_ONE},
        },
      };
      this.relationships.relationships = {
        f: {
          '1': {
            a: [],
            b: '1',
          },
        },
      };
    });
    it('should add to value', () => {
      this.relationships.addToMany('f', '1', 'a', '2');
      expect(this.relationships.getMany('f', '1', 'a')).to.be.eql(['2']);
    });
    it('should sort new value', () => {
      this.relationships.addToMany('f', '1', 'a', '2');
      this.relationships.addToMany('f', '1', 'a', '1');
      expect(this.relationships.getMany('f', '1', 'a')).to.be.eql(['1', '2']);
    });
    it('should not allow duplicates in the value', () => {
      this.relationships.addToMany('f', '1', 'a', '2');
      this.relationships.addToMany('f', '1', 'a', '2');
      this.relationships.addToMany('f', '1', 'a', '1');
      expect(this.relationships.getMany('f', '1', 'a')).to.be.eql(['1', '2']);
    });
    it('should throw an error', () => {
      expect(() => this.relationships.addToMany('f', '1', 'b', '1')).to.throw(`"addToMany" should be used only for HAS_MANY relationships. You try to use for "f.b"`);
    });
  });

  describe('#removeFromMany', () => {
    beforeEach(() => {
      this.relationships.meta = {
        f: {
          a: {type: MetaAttrType.HAS_MANY},
          b: {type: MetaAttrType.HAS_ONE},
        },
      };
      this.relationships.relationships = {
        f: {
          '1': {
            a: ['1', '2', '3'],
            b: '1',
          },
        },
      };
    });
    it('should remove from value', () => {
      this.relationships.removeFromMany('f', '1', 'a', '2');
      expect(this.relationships.getMany('f', '1', 'a')).to.be.eql(['1', '3']);
    });
    it('should throw an error', () => {
      expect(() => this.relationships.removeFromMany('f', '1', 'b', '1')).to.throw(`"removeFromMany" should be used only for HAS_MANY relationships. You try to use for "f.b"`);
    });
  });

  describe('#recalculateRelationshipsForRecord', () => {

    describe('#updateOneToOne', () => {

      class FooFactory extends Factory {
        attrs = {
          b: Factory.hasOne('bar', 'f'),
          prop: 'static',
        };
      }
      class BarFactory extends Factory {
        attrs = {
          f: Factory.hasOne('foo', 'b'),
          prop: 'static',
        };
      }

      beforeEach(() => {
        this.foo = new FooFactory();
        this.bar = new BarFactory();
        this.foo.createRecord(1);
        this.bar.createRecord(1);
        this.relationships.addFactory('bar');
        this.relationships.addFactory('foo');
        this.relationships.updateMeta({
          foo: this.foo.meta,
          bar: this.bar.meta,
        });
      });

      it('should add relationships for the records', () => {
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: '2'});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: '2'}},
          bar: {'2': {f: '1'}},
        });
      });

      it('should add relationships for the records (object)', () => {
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: {id: '2'}});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: '2'}},
          bar: {'2': {f: '1'}},
        });
      });

      it('should update relationships for the records', () => {
        this.relationships.relationships = {
          foo: {'1': {b: '3'}},
          bar: {'2': {f: '4'}},
        };
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: '2'});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: '2'}},
          bar: {'2': {f: '1'}},
        });
      });

      it('should update relationships for the records (with `null`)', () => {
        this.relationships.relationships = {
          foo: {'1': {b: '2'}},
          bar: {'2': {f: '1'}},
        };
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: null});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: null}},
          bar: {'2': {f: null}},
        });
      });
    });

    describe('#updateManyToOne', () => {

      class FooFactory extends Factory {
        attrs = {
          b: Factory.hasMany('bar', 'f'),
          prop: 'static',
        };
      }
      class BarFactory extends Factory {
        attrs = {
          f: Factory.hasOne('foo', 'b'),
          prop: 'static',
        };
      }

      beforeEach(() => {
        this.foo = new FooFactory();
        this.bar = new BarFactory();
        this.foo.createRecord(1);
        this.bar.createRecord(1);
        this.relationships.addFactory('bar');
        this.relationships.addFactory('foo');
        this.relationships.updateMeta({
          foo: this.foo.meta,
          bar: this.bar.meta,
        });
      });

      it('should add relationships for the records', () => {
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: ['2', '3']});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: ['2', '3']}},
          bar: {'2': {f: '1'}, '3': {f: '1'}},
        });
      });

      it('should add relationships for the records (objects)', () => {
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: [{id: '2'}, {id: '3'}]});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: ['2', '3']}},
          bar: {'2': {f: '1'}, '3': {f: '1'}},
        });
      });

      it('should update relationships for the records (remove one record)', () => {
        this.relationships.relationships = {
          foo: {'1': {b: ['2', '3']}},
          bar: {'2': {f: '1'}, '3': {f: '1'}},
        };
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: [{id: '2'}]});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: ['2']}},
          bar: {'2': {f: '1'}, '3': {f: null}},
        });
      });

      it('should update relationships for the records (remove one record and add another)', () => {
        this.relationships.relationships = {
          foo: {'1': {b: ['2', '3']}},
          bar: {'2': {f: '1'}, '3': {f: '1'}},
        };
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: ['2', '4']});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: ['2', '4']}},
          bar: {'2': {f: '1'}, '3': {f: null}, '4': {f: '1'}},
        });
      });

      it('should update relationships for the records (null)', () => {
        this.relationships.relationships = {
          foo: {'1': {b: ['2', '3']}},
          bar: {'2': {f: '1'}, '3': {f: '1'}},
        };
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: null});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: []}},
          bar: {'2': {f: null}, '3': {f: null}},
        });
      });

      it('should update relationships for the records (should ignore null and undefined in the array)', () => {
        this.relationships.relationships = {
          foo: {'1': {b: ['2', '3']}},
          bar: {'2': {f: '1'}, '3': {f: '1'}},
        };
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: [null, '2', undefined, '3']});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: ['2', '3']}},
          bar: {'2': {f: '1'}, '3': {f: '1'}},
        });
      });
    });

    describe('#updateOneToMany', () => {
      class FooFactory extends Factory {
        attrs = {
          b: Factory.hasOne('bar', 'f'),
          prop: 'static',
        };
      }
      class BarFactory extends Factory {
        attrs = {
          f: Factory.hasMany('foo', 'b'),
          prop: 'static',
        };
      }

      beforeEach(() => {
        this.foo = new FooFactory();
        this.bar = new BarFactory();
        this.foo.createRecord(1);
        this.bar.createRecord(1);
        this.relationships.addFactory('bar');
        this.relationships.addFactory('foo');
        this.relationships.updateMeta({
          foo: this.foo.meta,
          bar: this.bar.meta,
        });
      });

      it('should add relationships for the records', () => {
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: '2'});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: '2'}},
          bar: {'2': {f: ['1']}},
        });
      });

      it('should add relationships for the records (objects)', () => {
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: {id: '2'}});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: '2'}},
          bar: {'2': {f: ['1']}},
        });
      });

      it('should update relationships for the records (move to another record)', () => {
        this.relationships.relationships = {
          foo: {'1': {b: '2'}},
          bar: {'2': {f: ['1']}},
        };
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: {id: '3'}});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: '3'}},
          bar: {'2': {f: []}, '3': {f: ['1']}},
        });
      });

      it('should update relationships for the records (move to another record 2)', () => {
        this.relationships.relationships = {
          foo: {'1': {b: '2'}, '2': {b: '2'}},
          bar: {'2': {f: ['1', '2']}},
        };
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: {id: '3'}});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: '3'}, '2': {b: '2'}},
          bar: {'2': {f: ['2']}, '3': {f: ['1']}},
        });
      });

      it('should update relationships for the records (null)', () => {
        this.relationships.relationships = {
          foo: {'1': {b: '2'}},
          bar: {'2': {f: ['1']}},
        };
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: null});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: null}},
          bar: {'2': {f: []}},
        });
      });

      it('should update relationships for the records (null 2)', () => {
        this.relationships.relationships = {
          foo: {'1': {b: '2'}, '2': {b: '2'}},
          bar: {'2': {f: ['1', '2']}},
        };
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: null});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: null}, '2': {b: '2'}},
          bar: {'2': {f: ['2']}},
        });
      });
    });

    describe('#updateManyToMany', () => {
      class FooFactory extends Factory {
        attrs = {
          b: Factory.hasMany('bar', 'f'),
          prop: 'static',
        };
      }
      class BarFactory extends Factory {
        attrs = {
          f: Factory.hasMany('foo', 'b'),
          prop: 'static',
        };
      }

      beforeEach(() => {
        this.foo = new FooFactory();
        this.bar = new BarFactory();
        this.foo.createRecord(1);
        this.bar.createRecord(1);
        this.relationships.addFactory('bar');
        this.relationships.addFactory('foo');
        this.relationships.updateMeta({
          foo: this.foo.meta,
          bar: this.bar.meta,
        });
      });

      it('should add relationships for the records', () => {
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: ['1', '2']});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: ['1', '2']}},
          bar: {'1': {f: ['1']}, '2': {f: ['1']}},
        });
      });

      it('should add relationships for the records (objects)', () => {
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: [{id: '1'}, {id: '2'}]});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: ['1', '2']}},
          bar: {'1': {f: ['1']}, '2': {f: ['1']}},
        });
      });

      it('should update relationships for the records (remove one record)', () => {
        this.relationships.relationships = {
          foo: {'1': {b: ['1', '2']}},
          bar: {'1': {f: ['1']}, '2': {f: ['1']}},
        };
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: ['1']});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: ['1']}},
          bar: {'1': {f: ['1']}, '2': {f: []}},
        });
      });

      it('should update relationships for the records (remove one record and add another)', () => {
        this.relationships.relationships = {
          foo: {'1': {b: ['2', '3']}},
          bar: {'2': {f: ['1']}, '3': {f: ['1']}},
        };
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: ['2', '4']});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: ['2', '4']}},
          bar: {'2': {f: ['1']}, '3': {f: []}, '4': {f: ['1']}},
        });
      });

      it('should update relationships for the records (null)', () => {
        this.relationships.relationships = {
          foo: {'1': {b: ['2', '3']}},
          bar: {'2': {f: ['1']}, '3': {f: ['1']}},
        };
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: null});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: []}},
          bar: {'2': {f: []}, '3': {f: []}},
        });
      });

      it('should update relationships for the records (should ignore null and undefined in the array)', () => {
        this.relationships.relationships = {
          foo: {'1': {b: ['2', '3']}},
          bar: {'2': {f: ['1']}, '3': {f: ['1']}},
        };
        this.relationships.recalculateRelationshipsForRecord('foo', {id: '1', b: [null, '2', undefined, '3']});
        expect(this.relationships.relationships).to.be.eql({
          foo: {'1': {b: ['2', '3']}},
          bar: {'2': {f: ['1']}, '3': {f: ['1']}},
        });
      });
    });

  });

  describe('#deleteRelationshipsForRecord', () => {

    describe('#updateOneToOne', () => {
      class FooFactory extends Factory {
        attrs = {
          b: Factory.hasOne('bar', 'f'),
          prop: 'static',
        };
      }
      class BarFactory extends Factory {
        attrs = {
          f: Factory.hasOne('foo', 'b'),
          prop: 'static',
        };
      }

      beforeEach(() => {
        this.foo = new FooFactory();
        this.bar = new BarFactory();
        this.foo.createRecord(1);
        this.bar.createRecord(1);
        this.relationships.addFactory('bar');
        this.relationships.addFactory('foo');
        this.relationships.updateMeta({
          foo: this.foo.meta,
          bar: this.bar.meta,
        });
      });

      it('should delete existing relationships for the records', () => {
        this.relationships.relationships = {
          foo: {'1': {b: '2'}, '2': {b: '1'}},
          bar: {'1': {f: '2'}, '2': {f: '1'}},
        };
        this.relationships.deleteRelationshipsForRecord('foo', '1');
        expect(this.relationships.relationships).to.be.eql({
          foo: {'2': {b: '1'}},
          bar: {'1': {f: '2'}, '2': {f: null}},
        });
      });
    });

    describe('#updateOneToMany', () => {
      class FooFactory extends Factory {
        attrs = {
          b: Factory.hasOne('bar', 'f'),
          prop: 'static',
        };
      }
      class BarFactory extends Factory {
        attrs = {
          f: Factory.hasMany('foo', 'b'),
          prop: 'static',
        };
      }

      beforeEach(() => {
        this.foo = new FooFactory();
        this.bar = new BarFactory();
        this.foo.createRecord(1);
        this.bar.createRecord(1);
        this.relationships.addFactory('bar');
        this.relationships.addFactory('foo');
        this.relationships.updateMeta({
          foo: this.foo.meta,
          bar: this.bar.meta,
        });
      });

      it('should delete existing relationships for the records', () => {
        this.relationships.relationships = {
          foo: {'1': {b: '2'}, '2': {b: '1'}},
          bar: {'1': {f: ['3']}, '2': {f: ['1', '2']}},
        };
        this.relationships.deleteRelationshipsForRecord('foo', '1');
        expect(this.relationships.relationships).to.be.eql({
          foo: {'2': {b: '1'}},
          bar: {'1': {f: ['3']}, '2': {f: ['2']}},
        });
      });
    });

    describe('#updateManyToOne', () => {
      class FooFactory extends Factory {
        attrs = {
          b: Factory.hasMany('bar', 'f'),
          prop: 'static',
        };
      }
      class BarFactory extends Factory {
        attrs = {
          f: Factory.hasOne('foo', 'b'),
          prop: 'static',
        };
      }

      beforeEach(() => {
        this.foo = new FooFactory();
        this.bar = new BarFactory();
        this.foo.createRecord(1);
        this.bar.createRecord(1);
        this.relationships.addFactory('bar');
        this.relationships.addFactory('foo');
        this.relationships.updateMeta({
          foo: this.foo.meta,
          bar: this.bar.meta,
        });
      });

      it('should delete existing relationships for the records', () => {
        this.relationships.relationships = {
          foo: {'1': {b: ['2']}, '2': {b: ['1']}},
          bar: {'1': {f: '2'}, '2': {f: '1'}},
        };
        this.relationships.deleteRelationshipsForRecord('foo', '1');
        expect(this.relationships.relationships).to.be.eql({
          foo: {'2': {b: ['1']}},
          bar: {'1': {f: '2'}, '2': {f: null}},
        });
      });
    });

    describe('#updateManyToMany', () => {
      class FooFactory extends Factory {
        attrs = {
          b: Factory.hasMany('bar', 'f'),
          prop: 'static',
        };
      }
      class BarFactory extends Factory {
        attrs = {
          f: Factory.hasMany('foo', 'b'),
          prop: 'static',
        };
      }

      beforeEach(() => {
        this.foo = new FooFactory();
        this.bar = new BarFactory();
        this.foo.createRecord(1);
        this.bar.createRecord(1);
        this.relationships.addFactory('bar');
        this.relationships.addFactory('foo');
        this.relationships.updateMeta({
          foo: this.foo.meta,
          bar: this.bar.meta,
        });
      });

      it('should delete existing relationships for the records', () => {
        this.relationships.relationships = {
          foo: {'1': {b: ['1', '2']}, '2': {b: ['1', '2']}},
          bar: {'1': {f: ['1', '2']}, '2': {f: ['1', '2']}},
        };
        this.relationships.deleteRelationshipsForRecord('foo', '1');
        expect(this.relationships.relationships).to.be.eql({
          foo: {'2': {b: ['1', '2']}},
          bar: {'1': {f: ['2']}, '2': {f: ['2']}},
        });
      });
    });

  });

});
