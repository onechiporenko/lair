import { expect } from 'chai';
import { Factory, field, MetaAttrType } from '../../lib/factory';
import { Lair } from '../../lib/lair';

let lair;

class AFactory extends Factory {
  static factoryName = 'a';
  @field()
  a = 'a';
}

class BFactory extends Factory {
  static factoryName = 'b';
  @field()
  b = 'b';
}

describe('Lair', () => {
  beforeEach(() => {
    lair = Lair.getLair();
  });
  afterEach(() => {
    Lair.cleanLair();
  });

  describe('#getDevInfo', () => {
    beforeEach(() => {
      lair.registerFactory(new AFactory());
      lair.registerFactory(new BFactory());
      lair.createRecords('a', 5);
    });

    it('should return valid info', () => {
      expect(lair.getDevInfo()).to.be.eql({
        a: {
          count: 5,
          id: 6,
          meta: {
            a: {
              type: MetaAttrType.FIELD,
            },
            id: {
              type: MetaAttrType.FIELD,
            },
          },
        },
        b: {
          count: 0,
          id: 1,
          meta: {
            b: {
              type: MetaAttrType.FIELD,
            },
            id: {
              type: MetaAttrType.FIELD,
            },
          },
        },
      });
    });
  });
});
