import { expect } from 'chai';
import { Factory } from '../../lib/factory';
import { Lair } from '../../lib/lair';

let lair;

class FactoryToTestRegisterFactory extends Factory {
  static factoryName = 'test';
}

describe('Lair', () => {
  beforeEach(() => {
    lair = Lair.getLair();
  });
  afterEach(() => {
    Lair.cleanLair();
  });

  [
    {
      clb: () => lair.registerFactory(new FactoryToTestRegisterFactory()),
      title: 'instance',
    },
    {
      clb: () => lair.registerFactory(FactoryToTestRegisterFactory),
      title: 'class',
    },
  ].forEach((test) => {
    describe('#registerFactory', () => {
      beforeEach(() => {
        Lair.cleanLair();
        test.clb();
      });

      it('should register factory', () => {
        expect(() => lair.createRecords('test', 1)).to.not.throw();
      });

      it('should use name from factory', () => {
        expect(() => lair.createRecords('test', 1)).to.not.throw();
      });

      it('should use name from factory (2)', () => {
        expect(() => lair.createRecords('test', 1)).to.not.throw();
      });

      it('should throw an error if factory is already registered', () => {
        expect(() => {
          lair.registerFactory(new FactoryToTestRegisterFactory());
        }).to.throw('Factory with name "test" is already registered');
      });

      it('should throw an error if factory name is not provided', () => {
        expect(() => {
          class FactoryWithoutName extends Factory {}

          lair.registerFactory(new FactoryWithoutName());
        }).to.throw(
          'Factory name must be defined in the `Factory` child-class as a static property "factoryName"'
        );
      });
    });
  });
});
