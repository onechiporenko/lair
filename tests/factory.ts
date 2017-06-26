import {expect} from 'chai';
import {Factory, MetaAttrType} from '../lib/factory';

class TestFactory extends Factory {
  attrs = {
    first: 'static',
    second() {
      return `dynamic ${this.id}`;
    },
    third() {
      return `third is ${this.second}`;
    },
    one: Factory.hasOne('anotherFactory', 'attr1'),
    many: Factory.hasMany('anotherFactory', 'attr2'),
  };
}

describe('Factory', () => {

  describe('#createRecord', () => {

    before(() => {
      this.factory = new TestFactory();
      this.factory.init();
      this.firstInstance = this.factory.createRecord(1);
      this.secondInstance = this.factory.createRecord(2);
    });

    it('`id` is auto incremented', () => {
      expect(this.firstInstance.id).to.be.equal('1');
      expect(this.secondInstance.id).to.be.equal('2');
    });

    it('`first`-field is equal for all created records', () => {
      expect(this.firstInstance.first).to.be.equal('static');
      expect(this.firstInstance.first).to.be.equal(this.secondInstance.first);
    });

    it('`second`-field is not equal for created records', () => {
      expect(this.firstInstance.second).to.be.equal('dynamic 1');
      expect(this.secondInstance.second).to.be.equal('dynamic 2');
    });

    it('should throw error if `id` is defined in the `attrs`', () => {
      class F extends Factory {
        attrs = {id: '100500'};
      }
      expect(() => new F().createRecord(1)).to.throw(`Don't add "id" to the "attrs"`);
    });

    describe('dynamic attributes may get values for other attributes', () => {
      it('dynamic -> static', () => {
        expect(this.firstInstance.second).to.be.equal('dynamic 1');
        expect(this.secondInstance.second).to.be.equal('dynamic 2');
      });
      it('dynamic -> dynamic', () => {
        expect(this.firstInstance.third).to.be.equal('third is dynamic 1');
        expect(this.secondInstance.third).to.be.equal('third is dynamic 2');
      });
    });

  });

  describe('#meta', () => {

    beforeEach(() => {
      this.f = new TestFactory();
      this.f.init();
      this.f.createRecord(1);
      this.meta = this.f.meta;
    });

    it('static attr is marked as `FIELD`', () => {
      expect(this.meta.first.type).to.be.equal(MetaAttrType.FIELD);
    });

    it('dynamic attr is marked as `FIELD`', () => {
      expect(this.meta.second.type).to.be.equal(MetaAttrType.FIELD);
    });

    it('single relationship attr is marked as `HAS_ONE`', () => {
      expect(this.meta.one.type).to.be.equal(MetaAttrType.HAS_ONE);
      expect(this.meta.one.factoryName).to.be.equal('anotherFactory');
      expect(this.meta.one.invertedAttrName).to.be.equal('attr1');
    });

    it('multi relationships attr is marked as `HAS_MANY`', () => {
      expect(this.meta.many.type).to.be.equal(MetaAttrType.HAS_MANY);
      expect(this.meta.many.factoryName).to.be.equal('anotherFactory');
      expect(this.meta.many.invertedAttrName).to.be.equal('attr2');
    });

    it('meta should not be changed after init', () => {
      this.f.attrs.newAttr = 'new val';
      this.f.createRecord(2);
      expect(this.f.meta).to.not.have.property('newAttr');
      expect(this.meta).to.not.have.property('newAttr');
    });
  });

});
