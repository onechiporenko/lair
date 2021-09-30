import { expect } from 'chai';
import { Factory, MetaAttrType } from '../lib/factory';

const attrs = {
  first: 'static',
  second(): string {
    return `dynamic ${this.id}`;
  },
  third(): string {
    return `third is ${this.second}`;
  },
  fourth: Factory.field({
    value: 'fourth',
    defaultValue: 'default value for fourth',
  }),
  fifth: Factory.field({
    value(): string {
      return `fifth ${this.id}`;
    },
  }),
  sixth: Factory.field({
    value: 1,
    allowedValues: [1, 2, 3],
    preferredType: 'number',
  }),
  seventh: Factory.field({
    value(): number {
      return 1;
    },
  }),
  rand(): number {
    return Math.random();
  },
  r1(): number {
    return this.rand as number;
  },
  r2(): number {
    return this.rand as number;
  },
  one: Factory.hasOne('anotherFactory', 'attr1'),
  many: Factory.hasMany('anotherFactory', 'attr2'),
  oneTest: Factory.hasOne('test', null, { reflexive: true, depth: 2 }),
  manyTests: Factory.hasMany('test', null, { reflexive: true, depth: 2 }),
  sequenceItem: Factory.sequenceItem(1, (prevItems) =>
    prevItems.reduce((a, b) => a + b, 0)
  ),
};

let factory;

describe('Factory', () => {
  describe('#field', () => {
    describe('should thrown an error if `value` does not exist in the `allowedValues`', () => {
      expect(() =>
        Factory.create({
          attrs: {
            a: Factory.field({
              value: 4,
              allowedValues: [1, 2, 3],
            }),
          },
        })
      ).to.throw(`"value" must be one of the "allowedValues". You passed "4"`);
    });
  });

  describe('#18 Use `value` as `defaultValue` when `value` is not a function', () => {
    beforeEach(() => {
      factory = Factory.create({
        attrs: {
          a: Factory.field({
            value: '1',
          }),
          b: Factory.field({
            value(): string {
              return '1';
            },
          }),
          c: Factory.field({
            value: '2',
            defaultValue: '1',
          }),
        },
      });
    });

    it('`defaultValue` is generated', () => {
      expect(factory.meta.a.defaultValue).to.be.equal('1');
    });

    it('`defaultValue` is not generated', () => {
      expect(factory.meta.b.defaultValue).to.not.exist;
    });

    it('`defaultValue` is not overridden', () => {
      expect(factory.meta.c.defaultValue).to.be.equal('1');
    });
  });

  describe('#createRecord', () => {
    let firstInstance;
    let secondInstance;
    let thirdInstance;
    let fourthInstance;

    before(() => {
      factory = Factory.create({ attrs });
      factory.init();
      firstInstance = factory.createRecord(1);
      secondInstance = factory.createRecord(2);
      thirdInstance = factory.createRecord(3);
      fourthInstance = factory.createRecord(4);
    });

    it('`id` is auto incremented', () => {
      expect(firstInstance.id).to.be.equal('1');
      expect(secondInstance.id).to.be.equal('2');
    });

    it('`first`-field is equal for all created records', () => {
      expect(firstInstance.first).to.be.equal('static');
      expect(firstInstance.first).to.be.equal(secondInstance.first);
    });

    it('`second`-field is not equal for created records', () => {
      expect(firstInstance.second).to.be.equal('dynamic 1');
      expect(secondInstance.second).to.be.equal('dynamic 2');
    });

    it('sequence items are calculated basing on previous values', () => {
      expect(firstInstance.sequenceItem).to.be.equal(1);
      expect(secondInstance.sequenceItem).to.be.equal(1);
      expect(thirdInstance.sequenceItem).to.be.equal(2);
      expect(fourthInstance.sequenceItem).to.be.equal(4);
    });

    it('`fourth`-field is equal for all created records', () => {
      expect(firstInstance.fourth).to.be.equal('fourth');
      expect(firstInstance.fourth).to.be.equal(secondInstance.fourth);
    });

    it('`fifth`-field is equal for all created records', () => {
      expect(firstInstance.fifth).to.be.equal('fifth 1');
      expect(secondInstance.fifth).to.be.equal('fifth 2');
    });

    it('should throw error if `id` is defined in the `attrs`', () => {
      const f = Factory.create({ attrs: { id: '100500' } });
      expect(() => f.createRecord(1)).to.throw(`Don't add "id" to the "attrs"`);
    });

    describe('dynamic attributes may get values for other attributes', () => {
      it('dynamic -> static', () => {
        expect(firstInstance.second).to.be.equal('dynamic 1');
        expect(secondInstance.second).to.be.equal('dynamic 2');
      });
      it('dynamic -> dynamic', () => {
        expect(firstInstance.third).to.be.equal('third is dynamic 1');
        expect(secondInstance.third).to.be.equal('third is dynamic 2');
      });
      describe('dynamic attribute should not be recalculated', () => {
        it('first instance', () => {
          expect(firstInstance.r1).to.be.equal(firstInstance.r2);
        });
        it('second instance', () => {
          expect(secondInstance.r1).to.be.equal(secondInstance.r2);
        });
        it('both instances', () => {
          expect(firstInstance.r1).to.be.not.equal(secondInstance.r1);
        });
      });
    });
  });

  describe('#meta', () => {
    let meta;

    beforeEach(() => {
      factory = Factory.create({ attrs });
      factory.init();
      factory.createRecord(1);
      meta = factory.meta;
    });

    it('static attr is marked as `FIELD`', () => {
      expect(meta.first.type).to.be.equal(MetaAttrType.FIELD);
    });

    it('dynamic attr is marked as `FIELD`', () => {
      expect(meta.second.type).to.be.equal(MetaAttrType.FIELD);
    });

    it('static field attr is marked as `FIELD`', () => {
      expect(meta.fourth.type).to.be.equal(MetaAttrType.FIELD);
      expect(meta.fourth.defaultValue).to.be.equal('default value for fourth');
    });

    it('dynamic field attr is marked as `FIELD`', () => {
      expect(meta.fifth.type).to.be.equal(MetaAttrType.FIELD);
    });

    it('#24 Add `preferredType` and `allowedValues` for `Factory.field`', () => {
      expect(meta.sixth.preferredType).to.be.equal('number');
      expect(meta.sixth.allowedValues).to.be.eql([1, 2, 3]);
    });

    it('#25 `defaultValue` for FIELD must not be `undefined`', () => {
      expect(meta.seventh).to.not.have.property('defaultValue');
    });

    it('sequence item is marked as `SEQUENCE_ITEM`', () => {
      const sequenceItem = meta.sequenceItem;
      expect(sequenceItem.type).to.be.equal(MetaAttrType.SEQUENCE_ITEM);
      expect(sequenceItem.initialValue).to.be.equal(1);
      expect(sequenceItem.getNextValue).to.be.a('function');
    });

    it('single relationship attr is marked as `HAS_ONE`', () => {
      const one = meta.one;
      expect(one.type).to.be.equal(MetaAttrType.HAS_ONE);
      expect(one.factoryName).to.be.equal('anotherFactory');
      expect(one.invertedAttrName).to.be.equal('attr1');
    });

    it('single reflexive relationship attr is marked as `HAS_ONE` with needed attributes', () => {
      const oneTest = meta.oneTest;
      expect(oneTest.type).to.be.equal(MetaAttrType.HAS_ONE);
      expect(oneTest.factoryName).to.be.equal('test');
      expect(oneTest.invertedAttrName).to.be.equal(null);
      expect(oneTest.reflexiveDepth).to.be.equal(2);
      expect(oneTest.reflexive).to.be.equal(true);
    });

    it('multi relationships attr is marked as `HAS_MANY`', () => {
      const many = meta.many;
      expect(many.type).to.be.equal(MetaAttrType.HAS_MANY);
      expect(many.factoryName).to.be.equal('anotherFactory');
      expect(many.invertedAttrName).to.be.equal('attr2');
    });

    it('multi relationships attr is marked as `HAS_MANY` with needed attributes', () => {
      const manyTests = meta.manyTests;
      expect(manyTests.type).to.be.equal(MetaAttrType.HAS_MANY);
      expect(manyTests.factoryName).to.be.equal('test');
      expect(manyTests.invertedAttrName).to.be.equal(null);
      expect(manyTests.reflexiveDepth).to.be.equal(2);
      expect(manyTests.reflexive).to.be.equal(true);
    });

    it('meta should not be changed after init', () => {
      factory.attrs.newAttr = 'new val';
      factory.createRecord(2);
      expect(factory.meta).to.not.have.property('newAttr');
      expect(meta).to.not.have.property('newAttr');
    });
  });

  describe('#getDefaults', () => {
    const A = Factory.create({
      attrs: {
        a: Factory.field({
          value: '1',
          defaultValue: '1',
        }),
        b: Factory.field({
          value: 2,
          defaultValue: 2,
        }),
        c: Factory.field({
          value: false,
          defaultValue: false,
        }),
        d: 'd',
        e: Factory.hasOne('b', null),
        f: Factory.hasMany('b', null),
        g: Factory.sequenceItem('1', () => '2'),
      },
    });
    it('should return object with default values for attributes', () => {
      expect(A.getDefaults()).to.be.eql({ a: '1', b: 2, c: false });
    });
  });
});
