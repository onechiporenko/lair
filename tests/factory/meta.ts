import { MetaAttrType } from '../../lib/factory';
import { expect } from 'chai';
import { CommonFactory } from './_shared';

let factory;

describe('Factory', () => {
  beforeEach(() => {
    factory = new CommonFactory();
  });
  describe('#meta', () => {
    beforeEach(() => {
      factory.createRecord(1);
    });

    it('static attr is marked as `FIELD`', () => {
      expect(factory.meta.first.type).to.be.equal(MetaAttrType.FIELD);
    });

    it('dynamic attr is marked as `FIELD`', () => {
      expect(factory.meta.second.type).to.be.equal(MetaAttrType.FIELD);
    });

    it('static field attr is marked as `FIELD`', () => {
      expect(factory.meta.fourth.type).to.be.equal(MetaAttrType.FIELD);
      expect(factory.meta.fourth.defaultValue).to.be.equal(
        'default value for fourth'
      );
    });

    it('dynamic field attr is marked as `FIELD`', () => {
      expect(factory.meta.fifth.type).to.be.equal(MetaAttrType.FIELD);
    });

    it('#24 Add `preferredType` and `allowedValues` for `field`', () => {
      expect(factory.meta.sixth.preferredType).to.be.equal('number');
      expect(factory.meta.sixth.allowedValues).to.be.eql([1, 2, 3]);
    });

    it('#25 `defaultValue` for FIELD must not be `undefined`', () => {
      expect(factory.meta.seventh).to.not.have.property('defaultValue');
    });

    it('sequence item is marked as `SEQUENCE_ITEM`', () => {
      CommonFactory.resetMeta();
      factory.createRecord(1);
      const sequenceItem = factory.meta.sequenceItem;
      expect(sequenceItem.type).to.be.equal(MetaAttrType.SEQUENCE_ITEM);
      expect(sequenceItem.prevValues).to.be.eql([1]);
      expect(sequenceItem.initialValue).to.be.equal(1);
      expect(sequenceItem.getNextValue).to.be.a('function');
    });

    it('single relationship attr is marked as `HAS_ONE`', () => {
      const one = factory.meta.one;
      expect(one.type).to.be.equal(MetaAttrType.HAS_ONE);
      expect(one.factoryName).to.be.equal('anotherFactory');
      expect(one.invertedAttrName).to.be.equal('attr1');
    });

    it('single reflexive relationship attr is marked as `HAS_ONE` with needed attributes', () => {
      const oneTest = factory.meta.oneTest;
      expect(oneTest.type).to.be.equal(MetaAttrType.HAS_ONE);
      expect(oneTest.factoryName).to.be.equal('test');
      expect(oneTest.invertedAttrName).to.be.equal(null);
      expect(oneTest.reflexiveDepth).to.be.equal(2);
      expect(oneTest.reflexive).to.be.equal(true);
    });

    it('multi relationships attr is marked as `HAS_MANY`', () => {
      const many = factory.meta.many;
      expect(many.type).to.be.equal(MetaAttrType.HAS_MANY);
      expect(many.factoryName).to.be.equal('anotherFactory');
      expect(many.invertedAttrName).to.be.equal('attr2');
    });

    it('multi relationships attr is marked as `HAS_MANY` with needed attributes', () => {
      const manyTests = factory.meta.manyTests;
      expect(manyTests.type).to.be.equal(MetaAttrType.HAS_MANY);
      expect(manyTests.factoryName).to.be.equal('test');
      expect(manyTests.invertedAttrName).to.be.equal(null);
      expect(manyTests.reflexiveDepth).to.be.equal(2);
      expect(manyTests.reflexive).to.be.equal(true);
    });
  });

  describe('#resetMeta', () => {
    it('should reset `prevValues` for `SEQUENCE_ITEM` fields', () => {
      factory.createRecord(1);
      factory.createRecord(2);
      factory.createRecord(3);
      const sq = factory.meta.sequenceItem;
      expect(sq.type).to.be.equal(MetaAttrType.SEQUENCE_ITEM);
      expect(sq.prevValues).to.be.not.empty;
      CommonFactory.resetMeta();
      expect(factory.meta.sequenceItem.prevValues).to.be.eql([]);
    });
  });
});
