import {expect} from 'chai';
import {Factory} from '../lib/factory';
import {Lair} from '../lib/lair';

describe('Lair create records', () => {

  beforeEach(() => this.lair = Lair.getLair());
  afterEach(() => Lair.cleanLair());

  describe('for extended factory', () => {

    describe('without attrs overrides', () => {

      beforeEach(() => {
        const A = Factory.create({
          attrs: {
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
        this.lair.registerFactory(a, 'a');
        this.lair.registerFactory(b, 'b');
        this.lair.createRecords('a', 1);
        this.record = this.lair.getOne('a', '1');
      });

      it('should copy static field', () => {
        expect(this.record.first).to.be.equal('static');
      });

      it('should copy dynamic field', () => {
        expect(this.record.second).to.be.equal('dynamic 1');
        expect(this.record.third).to.be.equal('third is dynamic 1');
      });

      it('should copy dynamic field related with other fields', () => {
        expect(this.record.r1).to.be.equal(this.record.r2);
      });

      it('should copy hasOne-relationship', () => {
        expect(this.record.oneB).to.be.eql({
          id: '1',
          oneA: '1',
          manyA: [],
        });
      });

      it('should copy hasMany-relationship', () => {
        expect(this.record.manyB).to.be.eql([
          {id: '2', manyA: ['1'], oneA: null},
          {id: '3', manyA: ['1'], oneA: null},
        ]);
      });

      it('should copy sequence items', () => {
        expect(this.record.sequenceItem).to.be.equal(1);
        this.lair.createRecords('a', 4);
        expect(this.lair.getAll('a').map(c => c.sequenceItem)).to.be.eql([1, 1, 2, 4, 8]);
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
          this.lair.registerFactory(B, 'b');
          this.lair.createRecords('b', 1);
        });
        it('should override field', () => {
          expect(this.lair.getOne('b', '1').field).to.be.equal('b');
        });
      });

      describe('dynamic field', () => {
        beforeEach(() => {
          const A = Factory.create({
            attrs: {
              field() {
                return this.id + 'a';
              },
            },
          });
          const B = Factory.extend(A, {
            attrs: {
              field() {
                return 'b';
              },
            },
          });
          this.lair.registerFactory(B, 'b');
          this.lair.createRecords('b', 1);
        });
        it('should override field', () => {
          expect(this.lair.getOne('b', '1').field).to.be.equal('b');
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
          this.lair.registerFactory(A, 'a');
          this.lair.registerFactory(B, 'b');
          this.lair.registerFactory(C, 'c');
          this.lair.createRecords('a', 1);
          this.lair.createRecords('c', 1);
        });

        it('a-record is valid', () => {
          expect(this.lair.getOne('a', '1')).to.be.eql({
            id: '1',
            oneB: {
              id: '1',
              oneA: '1',
            },
          });
        });

        it('b-record is valid', () => {
          expect(this.lair.getOne('b', '1')).to.be.eql({
            id: '1',
            oneA: {
              id: '1',
              oneB: '1',
            },
          });
        });

        it('c-record is valid', () => {
          expect(this.lair.getOne('c', '1')).to.be.eql({
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
          this.lair.registerFactory(A, 'a');
          this.lair.registerFactory(B, 'b');
          this.lair.registerFactory(C, 'c');
          this.lair.createRecords('a', 1);
          this.lair.createRecords('c', 1);
        });

        it('a-record is valid', () => {
          expect(this.lair.getOne('a', '1')).to.be.eql({
            id: '1',
            manyB: [{
              id: '1',
              manyA: ['1'],
            }],
          });
        });

        it('b-record is valid', () => {
          expect(this.lair.getOne('b', '1')).to.be.eql({
            id: '1',
            manyA: [{
              id: '1',
              manyB: ['1'],
            }],
          });
        });

        it('c-record is valid', () => {
          expect(this.lair.getOne('c', '1')).to.be.eql({
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
          this.lair.registerFactory(A, 'a');
          this.lair.registerFactory(B, 'b');
          this.lair.createRecords('a', 8);
          this.lair.createRecords('b', 5);
        });

        it('a-records are valid', () => {
          expect(this.lair.getAll('a').map(r => r.a)).to.be.eql([1, 1, 2, 3, 5, 8, 13, 21]);
        });

        it('b-records are valid', () => {
          expect(this.lair.getAll('b').map(r => r.a)).to.be.eql([2, 2, 4, 16, 256]);
        });
      });

    });

    describe('afterCreate && afterCreateRelationshipsDepth && afterCreateIgnoreRelated', () => {

      beforeEach(() => {
        this.A = Factory.create({
          attrs: {
            a1: Factory.hasOne('a1', null),
          },
          createRelated: {
            a1: 1,
          },
          afterCreateRelationshipsDepth: 5,
          afterCreate(record) {
            expect(false).to.be.ok;
            return record;
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
        this.lair.registerFactory(this.A, 'a');
        this.lair.registerFactory(a1, 'a1');
        this.lair.registerFactory(a2, 'a2');
        this.lair.registerFactory(a3, 'a3');
        this.lair.registerFactory(a4, 'a4');
      });

      it('should be correctly overridden', () => {
        const B = Factory.extend(this.A, {
          afterCreateRelationshipsDepth: 2,
          afterCreateIgnoreRelated: ['a2'],
          afterCreate(record) {
            expect(record).to.be.eql({
              id: '1',
              a1: {id: '1'},
            });
            return record;
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
            a2() {
              return 2;
            },
          },
        });
        const a1 = Factory.create({});
        const a2 = Factory.create({});
        const B = Factory.extend(A, {
          createRelated: {
            a1() {
              return 2;
            },
            a2: 1,
          },
        });
        this.lair.registerFactory(A, 'a');
        this.lair.registerFactory(a1, 'a1');
        this.lair.registerFactory(a2, 'a2');
        this.lair.registerFactory(B, 'b');
        this.lair.createRecords('b', 1);
      });

      it('b-record is valid', () => {
        expect(this.lair.getOne('b', '1')).to.be.eql({
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
