import Factory, {MetaAttrType} from '../lib/factory';
import {expect} from 'chai';

class TestFactory extends Factory {
  attrs = {
    first: 'static',
    second(id) {
      return `dynamic ${id}`;
    },
    one: Factory.hasOne('anotherFactory', 'attr1'),
    many: Factory.hasMany('anotherFactory', 'attr2')
  }
}

describe('Factory', () => {

  describe('#createRecord', () => {

    before(() => {
      this.factory = new TestFactory();
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
      class f extends Factory {
        attrs = {id: '100500'};
      }
      expect(() => new f().createRecord(1)).to.throw(`Don't add "id" to the "attrs"`);
    });

  });

  describe('#meta', () => {

    beforeEach(() => {
      this.f = new TestFactory();
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