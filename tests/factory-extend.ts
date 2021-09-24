import {expect} from 'chai';
import {Factory} from '../lib/factory';
import {Lair} from '../lib/lair';
import {Record} from '../lib/record';

let lair;
let record;

describe('Lair create records', () => {

  beforeEach(() => lair = Lair.getLair());
  afterEach(() => Lair.cleanLair());

  describe('for extended factory', () => {

    describe('without attrs overrides', () => {

      beforeEach(() => {
        const A = Factory.create({
          attrs: {
            first: 'static',
            second(): string {
              return `dynamic ${this.id}`;
            },
            third(): string {
              return `third is ${this.second}`;
            },
            rand(): number {
              return Math.random();
            },
            r1(): number {
              return this.rand;
            },
            r2(): number {
              return this.rand;
            },
            oneB: Factory.hasOne('b', 'oneA'),
            manyB: Factory.hasMany('b', 'manyA'),
            sequenceItem: Factory.sequenceItem(1, prevItems => prevItems.reduce((x, y) => x + y, 0)),
          },
          createRelated: {
            oneB: 1,
            manyB: 2,
          },
        });

        const b = Factory.create({
          attrs: {
            oneA: Factory.hasOne('a', 'oneB'),
            manyA: Factory.hasMany('a', 'manyB'),
          },
        });
        const a = Factory.extend(A, {});
        lair.registerFactory(a, 'a');
        lair.registerFactory(b, 'b');
        lair.createRecords('a', 1);
        record = lair.getOne('a', '1');
      });

      it('should copy static field', () => {
        expect(record.first).to.be.equal('static');
      });

      it('should copy dynamic field', () => {
        expect(record.second).to.be.equal('dynamic 1');
        expect(record.third).to.be.equal('third is dynamic 1');
      });

      it('should copy dynamic field related with other fields', () => {
        expect(record.r1).to.be.equal(record.r2);
      });

      it('should copy hasOne-relationship', () => {
        expect(record.oneB).to.be.eql({
          id: '1',
          oneA: '1',
          manyA: [],
        });
      });

      it('should copy hasMany-relationship', () => {
        expect(record.manyB).to.be.eql([
          {id: '2', manyA: ['1'], oneA: null},
          {id: '3', manyA: ['1'], oneA: null},
        ]);
      });

      it('should copy sequence items', () => {
        expect(record.sequenceItem).to.be.equal(1);
        lair.createRecords('a', 4);
        expect(lair.getAll('a').map(c => c.sequenceItem)).to.be.eql([1, 1, 2, 4, 8]);
      });
    });

    describe('with attrs overrides', () => {

      describe('static field', () => {
        beforeEach(() => {
          const A = Factory.create({
            attrs: {
              field: 'a',
            },
          });
          const B = Factory.extend(A, {
            attrs: {
              field: 'b',
            },
          });
          lair.registerFactory(B, 'b');
          lair.createRecords('b', 1);
        });
        it('should override field', () => {
          expect(lair.getOne('b', '1').field).to.be.equal('b');
        });
      });

      describe('dynamic field', () => {
        beforeEach(() => {
          const A = Factory.create({
            attrs: {
              field(): string {
                return this.id + 'a';
              },
            },
          });
          const B = Factory.extend(A, {
            attrs: {
              field(): string {
                return 'b';
              },
            },
          });
          lair.registerFactory(B, 'b');
          lair.createRecords('b', 1);
        });
        it('should override field', () => {
          expect(lair.getOne('b', '1').field).to.be.equal('b');
        });
      });

      describe('hasOne field', () => {

        beforeEach(() => {
          const A = Factory.create({
            attrs: {
              oneB: Factory.hasOne('b', 'oneA'),
            },
            createRelated: {
              oneB: 1,
            },
          });
          const B = Factory.create({
            attrs: {
              oneA: Factory.hasOne('a', 'oneB'),
            },
          });
          const C = Factory.extend(A, {
            attrs: {
              oneB: 'oneB',
            },
          });
          lair.registerFactory(A, 'a');
          lair.registerFactory(B, 'b');
          lair.registerFactory(C, 'c');
          lair.createRecords('a', 1);
          lair.createRecords('c', 1);
        });

        it('a-record is valid', () => {
          expect(lair.getOne('a', '1')).to.be.eql({
            id: '1',
            oneB: {
              id: '1',
              oneA: '1',
            },
          });
        });

        it('b-record is valid', () => {
          expect(lair.getOne('b', '1')).to.be.eql({
            id: '1',
            oneA: {
              id: '1',
              oneB: '1',
            },
          });
        });

        it('c-record is valid', () => {
          expect(lair.getOne('c', '1')).to.be.eql({
            id: '1',
            oneB: 'oneB',
          });
        });

      });

      describe('hasMany field', () => {
        beforeEach(() => {
          const A = Factory.create({
            attrs: {
              manyB: Factory.hasMany('b', 'manyA'),
            },
            createRelated: {
              manyB: 1,
            },
          });
          const B = Factory.create({
            attrs: {
              manyA: Factory.hasMany('a', 'manyB'),
            },
          });
          const C = Factory.extend(A, {
            attrs: {
              manyB: 'manyB',
            },
          });
          lair.registerFactory(A, 'a');
          lair.registerFactory(B, 'b');
          lair.registerFactory(C, 'c');
          lair.createRecords('a', 1);
          lair.createRecords('c', 1);
        });

        it('a-record is valid', () => {
          expect(lair.getOne('a', '1')).to.be.eql({
            id: '1',
            manyB: [{
              id: '1',
              manyA: ['1'],
            }],
          });
        });

        it('b-record is valid', () => {
          expect(lair.getOne('b', '1')).to.be.eql({
            id: '1',
            manyA: [{
              id: '1',
              manyB: ['1'],
            }],
          });
        });

        it('c-record is valid', () => {
          expect(lair.getOne('c', '1')).to.be.eql({
            id: '1',
            manyB: 'manyB',
          });
        });
      });

      describe('sequenceItem field', () => {
        beforeEach(() => {
          const A = Factory.create({
            attrs: {
              a: Factory.sequenceItem(1, prevValues => prevValues.reduce((a, b) => a + b, 0), {lastValuesCount: 2}),
            },
          });
          const B = Factory.extend(A, {
            attrs: {
              a: Factory.sequenceItem(2, prevValues => prevValues.reduce((a, b) => a * b, 1)),
            },
          });
          lair.registerFactory(A, 'a');
          lair.registerFactory(B, 'b');
          lair.createRecords('a', 8);
          lair.createRecords('b', 5);
        });

        it('a-records are valid', () => {
          expect(lair.getAll('a').map(r => r.a)).to.be.eql([1, 1, 2, 3, 5, 8, 13, 21]);
        });

        it('b-records are valid', () => {
          expect(lair.getAll('b').map(r => r.a)).to.be.eql([2, 2, 4, 16, 256]);
        });
      });

    });

    describe('afterCreate && afterCreateRelationshipsDepth && afterCreateIgnoreRelated', () => {

      let A;

      beforeEach(() => {
        A = Factory.create({
          attrs: {
            a1: Factory.hasOne('a1', null),
          },
          createRelated: {
            a1: 1,
          },
          afterCreateRelationshipsDepth: 5,
          afterCreate(r: Record): Record {
            expect(false).to.be.ok;
            return r;
          },
        });
        const a1 = Factory.create({
          attrs: {
            a2: Factory.hasOne('a2', null),
          },
          createRelated: {
            a2: 1,
          },
        });
        const a2 = Factory.create({
          attrs: {
            a3: Factory.hasOne('a3', null),
          },
          createRelated: {
            a3: 1,
          },
        });
        const a3 = Factory.create({
          attrs: {
            a4: Factory.hasOne('a4', null),
          },
          createRelated: {
            a4: 1,
          },
        });
        const a4 = Factory.create({});
        lair.registerFactory(A, 'a');
        lair.registerFactory(a1, 'a1');
        lair.registerFactory(a2, 'a2');
        lair.registerFactory(a3, 'a3');
        lair.registerFactory(a4, 'a4');
      });

      it('should be correctly overridden', () => {
        const B = Factory.extend(A, {
          afterCreateRelationshipsDepth: 2,
          afterCreateIgnoreRelated: ['a2'],
          afterCreate(r: Record): Record {
            expect(r).to.be.eql({
              id: '1',
              a1: {id: '1'},
            });
            return r;
          },
        });
      });

    });

    describe('createRelated', () => {

      beforeEach(() => {
        const A = Factory.create({
          attrs: {
            a1: Factory.hasMany('a1', null),
            a2: Factory.hasMany('a2', null),
          },
          createRelated: {
            a1: 1,
            a2(): number {
              return 2;
            },
          },
        });
        const a1 = Factory.create({});
        const a2 = Factory.create({});
        const B = Factory.extend(A, {
          createRelated: {
            a1(): number {
              return 2;
            },
            a2: 1,
          },
        });
        lair.registerFactory(A, 'a');
        lair.registerFactory(a1, 'a1');
        lair.registerFactory(a2, 'a2');
        lair.registerFactory(B, 'b');
        lair.createRecords('b', 1);
      });

      it('b-record is valid', () => {
        expect(lair.getOne('b', '1')).to.be.eql({
          id: '1',
          a1: [
            {id: '1'},
            {id: '2'},
          ],
          a2: [
            {id: '1'},
          ],
        });
      });

    });

    describe('allowCustomIds', () => {
      it('field is mapped from parent', () => {
        const Parent = Factory.create({
          attrs: {},
          allowCustomIds: true,
        });
        const Child = Factory.extend(Parent, {
          attrs: {},
        });
        expect(Parent.allowCustomIds).to.be.true;
        expect(Child.allowCustomIds).to.be.true;
      });
      it('field is overridden', () => {
        const Parent = Factory.create({
          attrs: {},
          allowCustomIds: false,
        });
        const Child = Factory.extend(Parent, {
          attrs: {},
          allowCustomIds: true,
        });
        expect(Parent.allowCustomIds).to.be.false;
        expect(Child.allowCustomIds).to.be.true;
      });
    });

  });

});
