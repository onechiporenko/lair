import {expect} from 'chai';
import {Factory, MetaAttrType} from '../lib/factory';

const attrs = {
  first: 'static',
  second() {
    return `dynamic ${this.id}`;
  },
  third() {
    return `third is ${this.second}`;
  },
  rand() {
    return Math.random();
  },
  r1() {
    return this.rand;
  },
  r2() {
    return this.rand;
  },
  one: Factory.hasOne('anotherFactory', 'attr1'),
  many: Factory.hasMany('anotherFactory', 'attr2'),
  oneTest: Factory.hasOne('test', null, {reflexive: true, depth: 2}),
  manyTests: Factory.hasMany('test', null, {reflexive: true, depth: 2}),
  sequenceItem: Factory.sequenceItem(1, prevItems => prevItems.reduce((a, b) => a + b, 0)),
};

describe('Factory', () => {

  describe('#createRecord', () => {

    before(() => {
      this.factory = Factory.create({attrs});
      this.factory.init();
      this.firstInstance = this.factory.createRecord(1);
      this.secondInstance = this.factory.createRecord(2);
      this.thirdInstance = this.factory.createRecord(3);
      this.fourthInstance = this.factory.createRecord(4);
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

    it('sequence items are calculated basing on previous values', () => {
      expect(this.firstInstance.sequenceItem).to.be.equal(1);
      expect(this.secondInstance.sequenceItem).to.be.equal(1);
      expect(this.thirdInstance.sequenceItem).to.be.equal(2);
      expect(this.fourthInstance.sequenceItem).to.be.equal(4);
    });

    it('should throw error if `id` is defined in the `attrs`', () => {
      const f = Factory.create({attrs: {id: '100500'}});
      expect(() => f.createRecord(1)).to.throw(`Don't add "id" to the "attrs"`);
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
      describe('dynamic attribute should not be recalculated', () => {
        it('first instance', () => {
          expect(this.firstInstance.r1).to.be.equal(this.firstInstance.r2);
        });
        it('second instance', () => {
          expect(this.secondInstance.r1).to.be.equal(this.secondInstance.r2);
        });
        it('both instances', () => {
          expect(this.firstInstance.r1).to.be.not.equal(this.secondInstance.r1);
        });
      });
    });

  });

  describe('#meta', () => {

    beforeEach(() => {
      this.f = Factory.create({attrs});
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

    it('sequence item is marked as `SEQUENCE_ITEM`', () => {
      const sequenceItem = this.meta.sequenceItem;
      expect(sequenceItem.type).to.be.equal(MetaAttrType.SEQUENCE_ITEM);
      expect(sequenceItem.initialValue).to.be.equal(1);
      expect(sequenceItem.getNextValue).to.be.a('function');
    });

    it('single relationship attr is marked as `HAS_ONE`', () => {
      const one = this.meta.one;
      expect(one.type).to.be.equal(MetaAttrType.HAS_ONE);
      expect(one.factoryName).to.be.equal('anotherFactory');
      expect(one.invertedAttrName).to.be.equal('attr1');
    });

    it('single reflexive relationship attr is marked as `HAS_ONE` with needed attributes', () => {
      const oneTest = this.meta.oneTest;
      expect(oneTest.type).to.be.equal(MetaAttrType.HAS_ONE);
      expect(oneTest.factoryName).to.be.equal('test');
      expect(oneTest.invertedAttrName).to.be.equal(null);
      expect(oneTest.reflexiveDepth).to.be.equal(2);
      expect(oneTest.reflexive).to.be.equal(true);
    });

    it('multi relationships attr is marked as `HAS_MANY`', () => {
      const many = this.meta.many;
      expect(many.type).to.be.equal(MetaAttrType.HAS_MANY);
      expect(many.factoryName).to.be.equal('anotherFactory');
      expect(many.invertedAttrName).to.be.equal('attr2');
    });

    it('multi relationships attr is marked as `HAS_MANY` with needed attributes', () => {
      const manyTests = this.meta.manyTests;
      expect(manyTests.type).to.be.equal(MetaAttrType.HAS_MANY);
      expect(manyTests.factoryName).to.be.equal('test');
      expect(manyTests.invertedAttrName).to.be.equal(null);
      expect(manyTests.reflexiveDepth).to.be.equal(2);
      expect(manyTests.reflexive).to.be.equal(true);
    });

    it('meta should not be changed after init', () => {
      this.f.attrs.newAttr = 'new val';
      this.f.createRecord(2);
      expect(this.f.meta).to.not.have.property('newAttr');
      expect(this.meta).to.not.have.property('newAttr');
    });
  });

});
