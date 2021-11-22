import { Factory, field } from '../../lib/factory';

describe('Factory', () => {
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
});
