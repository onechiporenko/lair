import { expect } from 'chai';
import { Factory, field, sequenceItem } from '../../../lib/factory';
import { Lair } from '../../../lib/lair';

let lair;

describe('Lair', () => {
  beforeEach(() => {
    lair = Lair.getLair();
  });
  afterEach(() => {
    Lair.cleanLair();
  });

  describe('#createRecords', () => {
    describe('create sequences', () => {
      it('getNextValue should receive a list with previous values', () => {
        let i = 0;
        const expected = [['initial'], ['initial', 2], ['initial', 2, 3]];
        class Factory1ToTestSequences extends Factory {
          static factoryName = 'a';
          @sequenceItem<number | string>('initial', (prevValues) => {
            expect(prevValues).to.be.eql(expected[i++]);
            return prevValues.length + 1;
          })
          propA;
        }
        lair.registerFactory(new Factory1ToTestSequences());
        lair.createRecords('a', 4);
        expect(lair.getOne('a', '4').propA).to.be.equal(4);
      });

      it('getNextValue should receive only part of the previous values', () => {
        const expected = [[1], [1, 1], [1, 2]];
        let i = 0;
        class Factory2ToTestSequences extends Factory {
          static factoryName = 'a';
          @sequenceItem<number>(
            1,
            (v) => {
              expect(v).to.be.eql(expected[i++]);
              return v.reduce((a, b) => a + b, 0);
            },
            { lastValuesCount: 2 }
          )
          propA;
        }
        lair.registerFactory(new Factory2ToTestSequences());
        lair.createRecords('a', 4);
        expect(lair.getOne('a', '4').propA).to.be.equal(3);
      });

      it('sequence items should not be recalculated', () => {
        class Factory3ToTestSequences extends Factory {
          static factoryName = 'a';
          @sequenceItem(
            new Date().getTime(),
            (prevItems) =>
              prevItems[prevItems.length - 1] - Math.round(Math.random() * 100)
          )
          propA;
          @field()
          get propB(): number {
            return this.propA;
          }
          @field()
          get propC(): number {
            return this.propA;
          }
        }
        lair.registerFactory(new Factory3ToTestSequences());
        lair.createRecords('a', 1);
        const r = lair.getOne('a', '1');
        expect(r.propB).to.be.equal(r.propC);
      });

      it('getNextValue should not be able to change list of previous values', () => {
        const expected = [[1], [1, 1], [1, 1, 1], [1, 1, 1, 1]];
        let i = 0;
        class Factory4ToTestSequences extends Factory {
          static factoryName = 'a';
          @sequenceItem(1, (prevValues) => {
            expect(prevValues).to.be.eql(expected[i++]);
            const ret = prevValues.pop();
            prevValues = null;
            return ret;
          })
          propA;
        }
        lair.registerFactory(new Factory4ToTestSequences());
        lair.createRecords('a', 4);
        expect(lair.getOne('a', 4).propA).to.be.equal(1);
      });

      it('getNextValue (not arrow) should be called in the new record context', () => {
        const expected = ['2', '3', '4'];
        let i = 0;
        class Factory5ToTestSequences extends Factory {
          static factoryName = 'a';
          @sequenceItem<string | number>(
            1,
            function (prevValues: string[]): string {
              expect(this.id).to.be.equal(expected[i++]);
              return prevValues.pop();
            }
          )
          propA;
        }
        lair.registerFactory(new Factory5ToTestSequences());
        lair.createRecords('a', 4);
        expect(lair.getOne('a', 4).propA).to.be.equal(1);
      });
    });
  });
});
