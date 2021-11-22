import { Factory, field } from '../../lib/factory';
import { Lair } from '../../lib/lair';
import { expect } from 'chai';
import { CommonFactory } from './_shared';

let factory;

describe('Factory', () => {
  afterEach(() => {
    Lair.cleanLair();
  });

  describe('#field', () => {
    it('should thrown an error if `value` does not exist in the `allowedValues`', () => {
      class F extends Factory {
        static factoryName = 'f';
        @field({
          allowedValues: [1, 2, 3],
        })
        a = 4;
      }
      new F();
    });
  });

  describe('#createRecord', () => {
    let firstInstance;
    let secondInstance;
    let thirdInstance;
    let fourthInstance;

    beforeEach(() => {
      factory = new CommonFactory();
      CommonFactory.resetMeta();
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
      expect(secondInstance.first).to.be.equal('static');
      expect(thirdInstance.first).to.be.equal('static');
      expect(fourthInstance.first).to.be.equal('static');
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
          expect(firstInstance.r1).to.be.equal(firstInstance.rand);
          expect(firstInstance.r2).to.be.equal(firstInstance.rand);
        });
        it('second instance', () => {
          expect(secondInstance.r1).to.be.equal(secondInstance.r2);
          expect(secondInstance.r1).to.be.equal(secondInstance.rand);
          expect(secondInstance.r2).to.be.equal(secondInstance.rand);
        });
        it('both instances', () => {
          expect(firstInstance.r1).to.be.not.equal(secondInstance.r1);
        });
      });
    });
  });
});
