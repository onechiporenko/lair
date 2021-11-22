import { expect } from 'chai';
import {
  field,
  Factory,
  hasOne,
  hasMany,
  sequenceItem,
} from '../../lib/factory';

class FactoryToTestDefaults extends Factory {
  static factoryName = 'factory-to-test-defaults';
  @field({
    defaultValue: '1',
  })
  a = '1';

  @field({
    defaultValue: 2,
  })
  b = 2;

  @field({
    defaultValue: false,
  })
  c = false;

  @field({}) d;
  @hasOne('b', null) e;
  @hasMany('b', null) f;
  @sequenceItem('b', () => '2') g;
}

describe('Factory', () => {
  describe('#getDefaults', () => {
    it('should return object with default values for attributes', () => {
      expect(new FactoryToTestDefaults().getDefaults()).to.be.eql({
        a: '1',
        b: 2,
        c: false,
      });
    });
  });
});
