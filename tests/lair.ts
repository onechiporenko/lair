import {expect} from 'chai';
import {Factory} from '../lib/factory';
import {Lair} from '../lib/lair';

function incStr(val: string): string {
  return '' + (Number(val) + 1);
}

describe('Lair', () => {

  beforeEach(() => this.lair = Lair.getLair());
  afterEach(() => Lair.cleanLair());

  describe('#registerFactory', () => {
    it('should register factory', () => {
      this.lair.registerFactory(Factory.create({}), 'test');
      expect(() => this.lair.createRecords('test', 1)).to.not.throw();

    });

    it('should throw an error if factory is already registered', () => {
      this.lair.registerFactory(Factory.create({}), 'test');
      expect(() => {
        this.lair.registerFactory(Factory.create({}), 'test');
      }).to.throw('Factory with name "test" is already registered');
    });
  });

  describe('#createRecords', () => {

    describe('common', () => {
      it('should throw an error if factory is unknown', () => {
        expect(() => {
          this.lair.createRecords('unknownFactory', 1);
        }).to.throw('Factory with name "unknownFactory" is not registered');
      });

      it('should create number of records', () => {
        this.lair.registerFactory(Factory.create({}), 'test');
        this.lair.createRecords('test', 10);
        expect(this.lair.getAll('test')).to.have.property('length', 10);
      });
    });

    describe('#createRelated', () => {

      beforeEach(() => {
        this.lair.registerFactory(Factory.create({
          attrs: {
            bar: Factory.hasMany('bar', 'foo'),
            propFoo: 'static foo',
          },
          createRelated: {bar: 2},
        }), 'foo');
        this.lair.registerFactory(Factory.create({
          attrs: {
            foo: Factory.hasMany('foo', 'bar'),
            baz: Factory.hasMany('baz', 'bar'),
            propBar: 'static bar',
          },
          createRelated: {baz: 2},
        }), 'bar');
        this.lair.registerFactory(Factory.create({
          attrs: {
            bar: Factory.hasMany('bar', 'baz'),
            propBaz: 'static baz',
          },
        }), 'baz');
        this.lair.createRecords('foo', 2);
      });

      describe('should create related records', () => {

        describe('foo are created', () => {
          it('2 records', () => {
            expect(this.lair.getAll('foo')).to.have.property('length', 2);
          });

          it('each has 2 related `bar`', () => {
            expect(this.lair.getOne('foo', '1').bar.map(c => c.id)).to.be.eql(['1', '2']);
            expect(this.lair.getOne('foo', '2').bar.map(c => c.id)).to.be.eql(['3', '4']);
          });
        });

        describe('bar are created', () => {
          it('4 records', () => {
            expect(this.lair.getAll('bar')).to.have.property('length', 4);
          });
          it('each has 1 related `foo`', () => {
            expect(this.lair.getOne('bar', '1').foo.map(c => c.id)).to.be.eql(['1']);
            expect(this.lair.getOne('bar', '2').foo.map(c => c.id)).to.be.eql(['1']);
            expect(this.lair.getOne('bar', '3').foo.map(c => c.id)).to.be.eql(['2']);
            expect(this.lair.getOne('bar', '4').foo.map(c => c.id)).to.be.eql(['2']);
          });

          it('each has 2 related `baz`', () => {
            expect(this.lair.getOne('bar', '1').baz.map(c => c.id)).to.be.eql(['1', '2']);
            expect(this.lair.getOne('bar', '2').baz.map(c => c.id)).to.be.eql(['3', '4']);
            expect(this.lair.getOne('bar', '3').baz.map(c => c.id)).to.be.eql(['5', '6']);
            expect(this.lair.getOne('bar', '4').baz.map(c => c.id)).to.be.eql(['7', '8']);
          });
        });

        describe('baz are created', () => {
          it('8 records', () => {
            expect(this.lair.getAll('baz')).to.have.property('length', 8);
          });

          it('each has 1 related `bar`', () => {
            expect(this.lair.getOne('baz', '1').bar.map(c => c.id)).to.be.eql(['1']);
            expect(this.lair.getOne('baz', '2').bar.map(c => c.id)).to.be.eql(['1']);
            expect(this.lair.getOne('baz', '3').bar.map(c => c.id)).to.be.eql(['2']);
            expect(this.lair.getOne('baz', '4').bar.map(c => c.id)).to.be.eql(['2']);
            expect(this.lair.getOne('baz', '5').bar.map(c => c.id)).to.be.eql(['3']);
            expect(this.lair.getOne('baz', '6').bar.map(c => c.id)).to.be.eql(['3']);
            expect(this.lair.getOne('baz', '7').bar.map(c => c.id)).to.be.eql(['4']);
            expect(this.lair.getOne('baz', '8').bar.map(c => c.id)).to.be.eql(['4']);
          });
        });
      });

      describe('should create related without relation', () => {
        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              b: Factory.hasMany('b', null),
            },
            createRelated: {b: 2},
          }), 'a');
          this.lair.registerFactory(Factory.create({}), 'b');
          this.lair.registerFactory(Factory.create({
            attrs: {
              b: Factory.hasOne('b', null),
            },
            createRelated: {b: 1},
          }), 'c');
          this.lair.createRecords('a', 1);
          this.lair.createRecords('c', 1);
        });

        describe('A created', () => {
          it('1 record', () => {
            expect(this.lair.getAll('a')).to.have.property('length', 1);
          });
          it('has 2 related B', () => {
            expect(this.lair.getOne('a', '1').b.map(c => c.id)).to.be.eql(['1', '2']);
          });
        });

        describe('B created', () => {
          it('4 records', () => {
            expect(this.lair.getAll('b')).to.have.property('length', 3);
          });
        });

        describe('C created', () => {
          it('1 record', () => {
            expect(this.lair.getAll('c')).to.have.property('length', 1);
          });
          it('has 1 related B', () => {
            expect(this.lair.getOne('c', '1').b.id).to.be.equal('3');
          });
        });
      });

      describe('should not create related', () => {

        beforeEach(() => {
          this.lair.registerFactory(Factory.create({attrs: {
            b: Factory.hasMany('b', null),
          }}), 'a');
          this.lair.registerFactory(Factory.create({}), 'b');
          this.lair.registerFactory(Factory.create({attrs: {
            b: Factory.hasOne('b', null),
          }}), 'c');
          this.lair.createRecords('a', 1);
          this.lair.createRecords('c', 1);
        });
        it('one A created', () => {
          expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', b: []});
        });
        it('one C created', () => {
          expect(this.lair.getOne('c', '1')).to.be.eql({id: '1', b: null});
        });
        it('B not created', () => {
          expect(this.lair.getAll('b')).to.have.property('length', 0);
        });
      });

      describe('related factories chains', () => {

        describe('a-b-a', () => {
          beforeEach(() => {
            this.lair.registerFactory(Factory.create({
              attrs: {
                b: Factory.hasMany('b', 'a'),
              },
              createRelated: {b: 2},
            }), 'a');
            this.lair.registerFactory(Factory.create({
              attrs: {
                a: Factory.hasMany('a', 'b'),
              },
              createRelated: {a: 2},
            }), 'b');
          });

          it('should throw an error', () => {
            expect(() => this.lair.createRecords('a', 2)).to.throw(`Loop is detected in the "createRelated". Chain is ["a","b"]. You try to create records for "a" again.`);
          });
        });

        describe('a-b-c-a', () => {

          beforeEach(() => {
            this.lair.registerFactory(Factory.create({
              attrs: {
                b: Factory.hasMany('b', 'a'),
                c: Factory.hasMany('c', 'a'),
              },
              createRelated: {b: 2},
            }), 'a');
            this.lair.registerFactory(Factory.create({
              attrs: {
                a: Factory.hasMany('a', 'b'),
                c: Factory.hasMany('c', 'b'),
              },
              createRelated: {c: 2},
            }), 'b');
            this.lair.registerFactory(Factory.create({
              attrs: {
                a: Factory.hasMany('a', 'c'),
                b: Factory.hasMany('b', 'c'),
              },
              createRelated: {a: 2},
            }), 'c');
          });

          it('should throw an error', () => {
            expect(() => this.lair.createRecords('a', 2)).to.throw(`Loop is detected in the "createRelated". Chain is ["a","b","c"]. You try to create records for "a" again.`);
          });
        });

        describe('a-b-c-b', () => {

          beforeEach(() => {
            this.lair.registerFactory(Factory.create({
              attrs: {
                b: Factory.hasMany('b', 'a'),
                c: Factory.hasMany('c', 'a'),
              },
              createRelated: {b: 2},
            }), 'a');
            this.lair.registerFactory(Factory.create({
              attrs: {
                a: Factory.hasMany('a', 'b'),
                c: Factory.hasMany('c', 'b'),
              },
              createRelated: {c: 2},
            }), 'b');
            this.lair.registerFactory(Factory.create({
              attrs: {
                b: Factory.hasMany('b', 'c'),
              },
              createRelated: {b: 2},
            }), 'c');
          });

          it('should throw an error', () => {
            expect(() => this.lair.createRecords('a', 2)).to.throw(`Loop is detected in the "createRelated". Chain is ["a","b","c"]. You try to create records for "b" again.`);
          });
        });

      });

      describe('allow function for `createRelated` value', () => {
        it('record id is passed to the function', () => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              b: Factory.hasOne('b', null),
            },
            createRelated: {
              b(id) {
                expect(id).to.be.equal('1');
                return 1;
              },
            },
          }), 'a');
          this.lair.registerFactory(Factory.create({}), 'b');
          this.lair.createRecords('a', 1);
          expect(this.lair.getAll('b').map(c => c.id)).to.be.eql(['1']);
        });
      });

      describe('should create records with reflexive relations', () => {

        describe('one level depth', () => {
          describe('one-to-one', () => {
            beforeEach(() => {
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasOne('r', 'propC', {reflexive: true, depth: 2}),
                  propC: Factory.hasOne('r', 'propR'),
                },
                createRelated: {
                  propR: 1,
                },
              }), 'r');
              this.lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(this.lair.getAll('r')).to.be.eql([
                {id: '1', propC: null, propR: {id: '2', propC: '1', propR: null}},
                {id: '2', propC: {id: '1', propC: null, propR: '2'}, propR: null},
              ]);
            });
          });

          describe('one-to-many', () => {
            beforeEach(() => {
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasOne('r', 'propC', {reflexive: true, depth: 2}),
                  propC: Factory.hasMany('r', 'propR'),
                },
                createRelated: {propR: 1},
              }), 'r');
              this.lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(this.lair.getAll('r')).to.be.eql([
                {id: '1', propC: [], propR: {id: '2', propC: ['1'], propR: null}},
                {id: '2', propC: [{id: '1', propC: [], propR: '2'}], propR: null},
              ]);
            });
          });

          describe('many-to-one', () => {
            beforeEach(() => {
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasMany('r', 'propC', {reflexive: true, depth: 2}),
                  propC: Factory.hasOne('r', 'propR'),
                },
                createRelated: {propR: 1},
              }), 'r');
              this.lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(this.lair.getAll('r')).to.be.eql([
                {id: '1', propC: null, propR: [{id: '2', propC: '1', propR: []}]},
                {id: '2', propC: {id: '1', propC: null, propR: ['2']}, propR: []},
              ]);
            });
          });

          describe('many-to-many', () => {
            beforeEach(() => {
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasMany('r', 'propC', {reflexive: true, depth: 2}),
                  propC: Factory.hasMany('r', 'propR'),
                },
                createRelated: {propR: 1},
              }), 'r');
              this.lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(this.lair.getAll('r')).to.be.eql([
                {id: '1', propC: [], propR: [{id: '2', propC: ['1'], propR: []}]},
                {id: '2', propC: [{id: '1', propC: [], propR: ['2']}], propR: []},
              ]);
            });
          });
        });

        describe('two levels depth', () => {
          describe('one-to-one', () => {
            beforeEach(() => {
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasOne('r', 'propC', {reflexive: true, depth: 3}),
                  propC: Factory.hasOne('r', 'propR'),
                },
                createRelated: {propR: 1},
              }), 'r');
              this.lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(this.lair.getAll('r')).to.be.eql([
                {id: '1', propC: null, propR: {id: '2', propC: '1', propR: {id: '3', propC: '2', propR: null}}},
                {id: '2', propC: {id: '1', propC: null, propR: '2'}, propR: {id: '3', propC: '2', propR: null}},
                {id: '3', propC: {id: '2', propR: '3', propC: {id: '1', propC: null, propR: '2'}}, propR: null},
              ]);
            });
          });

          describe('one-to-many', () => {
            beforeEach(() => {
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasOne('r', 'propC', {reflexive: true, depth: 3}),
                  propC: Factory.hasMany('r', 'propR'),
                },
                createRelated: {propR: 1},
              }), 'r');
              this.lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(this.lair.getAll('r')).to.be.eql([
                {id: '1', propC: [], propR: {id: '2', propC: ['1'], propR: {id: '3', propC: ['2'], propR: null}}},
                {id: '2', propC: [{id: '1', propC: [], propR: '2'}], propR: {id: '3', propC: ['2'], propR: null}},
                {id: '3', propC: [{id: '2', propR: '3', propC: [{id: '1', propC: [], propR: '2'}]}], propR: null},
              ]);
            });
          });

          describe('many-to-one', () => {
            beforeEach(() => {
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasMany('r', 'propC', {reflexive: true, depth: 3}),
                  propC: Factory.hasOne('r', 'propR'),
                },
                createRelated: {propR: 1},
              }), 'r');
              this.lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(this.lair.getAll('r')).to.be.eql([
                {id: '1', propC: null, propR: [{id: '2', propC: '1', propR: [{id: '3', propC: '2', propR: []}]}]},
                {id: '2', propC: {id: '1', propC: null, propR: ['2']}, propR: [{id: '3', propC: '2', propR: []}]},
                {id: '3', propC: {id: '2', propR: ['3'], propC: {id: '1', propC: null, propR: ['2']}}, propR: []},
              ]);
            });
          });

          describe('many-to-many', () => {
            beforeEach(() => {
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasMany('r', 'propC', {reflexive: true, depth: 3}),
                  propC: Factory.hasMany('r', 'propR'),
                },
                createRelated: {propR: 1},
              }), 'r');
              this.lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(this.lair.getAll('r')).to.be.eql([
                {id: '1', propC: [], propR: [{id: '2', propC: ['1'], propR: [{id: '3', propC: ['2'], propR: []}]}]},
                {id: '2', propC: [{id: '1', propC: [], propR: ['2']}], propR: [{id: '3', propC: ['2'], propR: []}]},
                {id: '3', propC: [{id: '2', propR: ['3'], propC: [{id: '1', propC: [], propR: ['2']}]}], propR: []},
              ]);
            });
          });
        });
      });

    });

    describe('#afterCreate', () => {

      describe('should allow update record fields', () => {
        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              a: '1',
              b: '2',
              c: '3',
            },
            afterCreate(record) {
              record.a = 'a';
              record.b = 'b';
              record.c = 'c';
              return record;
            },
          }), 'a');
          this.lair.createRecords('a', 1);
          this.r = this.lair.getOne('a', '1');
        });
        it('fields are updated', () => {
          expect(this.r.a).to.be.equal('a');
          expect(this.r.b).to.be.equal('b');
          expect(this.r.c).to.be.equal('c');
        });
      });

      describe('should receive record with related data', () => {
        it('record has all related data', () => {
          const A = Factory.create({
            attrs: {
              a: 'a',
              propB: Factory.hasOne('b', 'propA'),
            },
            createRelated: {
              propB: 1,
            },
            afterCreate(record) {
              expect(record).to.be.eql({
                id: '1',
                a: 'a',
                propB: {
                  id: '1',
                  b: 'b',
                  propA: '1',
                  propC: [
                    {id: '1', propB: '1', c: 'c'},
                  ],
                },
              });
              return record;
            },
          });
          const B = Factory.create({
            attrs: {
              b: 'b',
              propA: Factory.hasOne('a', 'propB'),
              propC: Factory.hasMany('c', 'propB'),
            },
            createRelated: {
              propC: 1,
            },
            afterCreate(record) {
              expect(record).to.be.eql({
                id: '1',
                b: 'b',
                propA: {
                  id: '1',
                  a: 'a',
                  propB: '1',
                },
                propC: [
                  {id: '1', propB: '1', c: 'c'},
                ],
              });
              return record;
            },
          });
          const C = Factory.create({
            attrs: {
              c: 'c',
              propB: Factory.hasOne('b', 'propC'),
            },
            afterCreate(record) {
              expect(record).to.be.eql({
                id: '1',
                c: 'c',
                propB: {
                  id: '1',
                  b: 'b',
                  propA: {
                    id: '1',
                    a: 'a',
                    propB: '1',
                  },
                  propC: ['1'],
                },
              });
              return record;
            },
          });
          this.lair.registerFactory(A, 'a');
          this.lair.registerFactory(B, 'b');
          this.lair.registerFactory(C, 'c');
          this.lair.createRecords('a', 1);
        });
      });

      describe('should ignore updating related data', () => {
        const A = Factory.create({
          attrs: {
            a: 'a',
            propB: Factory.hasMany('b', 'propA'),
            propC: Factory.hasOne('c', 'propA'),
          },
          createRelated: {
            propB: 2,
            propC: 1,
          },
          afterCreate(record) {
            record.propC.id = '100500';
            delete record.propB;
            return record;
          },
        });
        beforeEach(() => {
          this.lair.registerFactory(A, 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              b: 'b',
              propA: Factory.hasOne('a', 'propB'),
            },
          }), 'b');
          this.lair.registerFactory(Factory.create({
            attrs: {
              c: 'c',
              propA: Factory.hasMany('a', 'propC'),
            },
          }), 'c');
          this.lair.createRecords('a', 1);
        });
        it('a1 relationships are not changed', () => {
          expect(this.lair.getOne('a', '1')).to.be.eql({
            id: '1',
            a: 'a',
            propB: [
              {id: '1', propA: '1', b: 'b'},
              {id: '2', propA: '1', b: 'b'},
            ],
            propC: {id: '1', propA: ['1'], c: 'c'},
          });
        });
        it('b1 relationships are not changed', () => {
          expect(this.lair.getOne('b', '1')).to.be.eql({
            id: '1',
            b: 'b',
            propA: {id: '1', a: 'a', propB: ['1', '2'], propC: {id: '1', propA: ['1'], c: 'c'}},
          });
        });
        it('b2 relationships are not changed', () => {
          expect(this.lair.getOne('b', '2')).to.be.eql({
            id: '2',
            b: 'b',
            propA: {id: '1', a: 'a', propB: ['1', '2'], propC: {id: '1', propA: ['1'], c: 'c'}},
          });
        });
        it('c1 relationships are not changed', () => {
          expect(this.lair.getOne('c', '1')).to.be.eql({id: '1', c: 'c', propA: [
            {id: '1', a: 'a', propB: [
              {id: '1', propA: '1', b: 'b'},
              {id: '2', propA: '1', b: 'b'},
            ], propC: '1'},
          ]});
        });
      });

    });

  });

  describe('DB CRUD', () => {

    describe('common', () => {

      beforeEach(() => {
        this.lair.registerFactory(Factory.create({attrs: {
          foo() {
            return `foo ${this.id}`;
          },
        }}), 'foo');
        this.lair.registerFactory(Factory.create({attrs: {
          bar() {
            return `foo ${this.id}`;
          },
        }}), 'bar');
        this.lair.createRecords('foo', 5);
        this.lair.createRecords('bar', 5);
      });

      describe('#getAll', () => {
        it('should return array with all records of needed type', () => {
          expect(this.lair.getAll('foo')).to.have.property('length', 5);
        });

        it('should throw an error for unknown type', () => {
          expect(() => this.lair.getAll('fake')).to.throw('"fake"-type doesn\'t exist in the database');
        });
      });

      describe('#getOne', () => {
        it('should return record if it exists', () => {
          expect(this.lair.getOne('foo', '1')).to.have.property('foo', 'foo 1');
        });

        it('should return undefined if record with needed id doesn\'t exist', () => {
          expect(this.lair.getOne('foo', '100500')).to.be.null;
        });

        it('should throw an error for unknown type', () => {
          expect(() => this.lair.getOne('fake', '1')).to.throw('"fake"-type doesn\'t exist in the database');
        });
      });

      describe('#queryMany', () => {
        it('should return filtered records', () => {
          expect(this.lair.queryMany('foo', r => Number(r.id) > 3)).to.have.property('length', 2);
        });

        it('should throw an error for unknown type', () => {
          expect(() => this.lair.queryMany('fake', r => !!r)).to.throw('"fake"-type doesn\'t exist in the database');
        });
      });

      describe('#queryOne', () => {
        it('should return one record', () => {
          expect(this.lair.queryOne('foo', r => Number(r.id) > 3)).to.have.property('id', '4');
        });

        it('should throw an error for unknown type', () => {
          expect(() => this.lair.queryOne('fake', r => !!r)).to.throw('"fake"-type doesn\'t exist in the database');
        });
      });

      describe('#deleteOne', () => {
        it('should delete record with provided id', () => {
          expect(this.lair.getOne('foo', '1')).to.have.property('id', '1');
          this.lair.deleteOne('foo', '1');
          expect(this.lair.getOne('foo', '1')).to.be.null;
        });

        it('should throw an error for unknown type', () => {
          expect(() => this.lair.deleteOne('fake', '1')).to.throw('"fake"-type doesn\'t exist in the database');
        });
      });

      describe('#createOne', () => {
        it('should create record in the database', () => {
          this.lair.createOne('foo', {foo: 'unique foo'});
          expect(this.lair.getOne('foo', '6')).to.have.property('id', '6');
        });

        it('should return created record', () => {
          const record = this.lair.createOne('foo', {foo: 'super unique foo'});
          expect(record).to.have.property('id', '6');
          expect(record).to.have.property('foo', 'super unique foo');
        });

        it('should ignore properties not declared in factory.attrs', () => {
          const record = this.lair.createOne('foo', {fake: 'fake'});
          expect(record).to.not.have.property('fake');
        });

        it('should throw an error for unknown type', () => {
          expect(() => this.lair.createOne('fake', {})).to.throw('"fake"-type doesn\'t exist in the database');
        });
      });

      describe('#updateOne', () => {
        it('should update record in the database', () => {
          this.lair.updateOne('foo', '1', {foo: 'updated foo'});
          expect(this.lair.getOne('foo', '1')).to.have.property('foo', 'updated foo');
        });

        it('should return updated record', () => {
          const record = this.lair.updateOne('foo', '1', {foo: 'updated foo'});
          expect(record).to.have.property('id', '1');
          expect(record).to.have.property('foo', 'updated foo');
        });

        it('should ignore properties not declared in factory.attrs', () => {
          const record = this.lair.updateOne('foo', '1', {fake: 'fake'});
          expect(record).to.not.have.property('fake');
        });

        it('should throw an error for unknown type', () => {
          expect(() => this.lair.updateOne('fake', '1', {})).to.throw('"fake"-type doesn\'t exist in the database');
        });

        it('should ignore `id` updating', () => {
          const record = this.lair.updateOne('foo', '1', {foo: 'updated foo', id: '6'});
          expect(record.id).to.be.equal('1');
          expect(this.lair.getAll('foo')).to.have.property('length', 5);
        });
      });

      describe('RU methods should return copies of records from the db', () => {
        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: 'some',
            },
          }), 'a');
          this.lair.createRecords('a', 1);
          this.r = this.lair.getOne('a', '1');
        });
        it('#getOne', () => {
          expect(this.r).to.be.eql({id: '1', propB: 'some'});
          delete this.r.id;
          expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: 'some'});
        });

        it('#queryOne', () => {
          expect(this.r).to.be.eql({id: '1', propB: 'some'});
          delete this.r.id;
          expect(this.lair.queryOne('a', r => r.id === '1')).to.be.eql({id: '1', propB: 'some'});
        });

        it('#getAll', () => {
          expect(this.r).to.be.eql({id: '1', propB: 'some'});
          delete this.r.id;
          expect(this.lair.getAll('a')).to.be.eql([{id: '1', propB: 'some'}]);
        });

        it('#queryMany', () => {
          expect(this.r).to.be.eql({id: '1', propB: 'some'});
          delete this.r.id;
          expect(this.lair.queryMany('a', r => r.id === '1')).to.be.eql([{id: '1', propB: 'some'}]);
        });

        it('#updateOne', () => {
          expect(this.r).to.be.eql({id: '1', propB: 'some'});
          delete this.r.id;
          expect(this.lair.updateOne('a', '1', {propB: 'another'})).to.be.eql({id: '1', propB: 'another'});
        });
      });

    });

    describe('with related records', () => {

      const oneToOneFoo = (id = '1') => {
        return {
          id,
          sFoo: 'static foo',
          propBar: {
            id,
            propFoo: id,
            sBar: 'static bar',
            propBaz: {
              id,
              propBar: id,
              sBaz: 'static baz',
            },
          },
        };
      };
      const oneToOneBar = (id = '1') => {
        return {
          id,
          sBar: 'static bar',
          propFoo: {
            id,
            sFoo: 'static foo',
            propBar: id,
          },
          propBaz: {
            id,
            propBar: id,
            sBaz: 'static baz',
          },
        };
      };
      const oneToOneBaz = (id = '1') => {
        return {
          id,
          sBaz: 'static baz',
          propBar: {
            id,
            sBar: 'static bar',
            propBaz: id,
            propFoo: {
              id,
              sFoo: 'static foo',
              propBar: id,
            },
          },
        };
      };

      const oneToManyFoo = (id = '1') => {
        return {
          id,
          sFoo: 'static foo',
          propBar: {
            id,
            propFoo: [id],
            sBar: 'static bar',
          },
          propBaz: {
            id,
            propFoo: [id],
            sBaz: 'static baz',
          },
        };
      };
      const oneToManyBar = (id = '1') => {
        return {
          id,
          sBar: 'static bar',
          propFoo: [{
            id,
            sFoo: 'static foo',
            propBar: id,
            propBaz: {
              id,
              sBaz: 'static baz',
              propFoo: [id],
            },
          }],
        };
      };
      const oneToManyBaz = (id = '1') => {
        return {
          id,
          sBaz: 'static baz',
          propFoo: [
            {
              id,
              sFoo: 'static foo',
              propBaz: id,
              propBar: {
                id,
                sBar: 'static bar',
                propFoo: [id],
              },
            },
          ],
        };
      };

      const manyToOneFoo = (id = '1') => {
        return {
          id,
          sFoo: 'static foo',
          propBar: [
            {id: '1', sBar: 'static bar', propFoo: id},
            {id: '2', sBar: 'static bar', propFoo: id},
          ],
          propBaz: [
            {id: '1', sBaz: 'static baz', propFoo: id},
            {id: '2', sBaz: 'static baz', propFoo: id},
          ],
        };
      };
      const manyToOneBar = (id = '1', barId = '1') => {
        return {
          id: barId,
          sBar: 'static bar',
          propFoo: {
            id,
            sFoo: 'static foo',
            propBar: ['1', '2'],
            propBaz: [
              {id: '1', sBaz: 'static baz', propFoo: id},
              {id: '2', sBaz: 'static baz', propFoo: id},
            ],
          },
        };
      };
      const manyToOneBaz = (id = '1', bazId = '1') => {
        return {
          id: bazId,
          sBaz: 'static baz',
          propFoo: {
            id,
            sFoo: 'static foo',
            propBaz: ['1', '2'],
            propBar: [
              {id: '1', sBar: 'static bar', propFoo: id},
              {id: '2', sBar: 'static bar', propFoo: id},
            ],
          },
        };
      };

      const manyToManyFoo = (id = '1', barId = '1', bazId = '1') => {
        return {
          id,
          sFoo: 'static foo',
          propBar: [
            {id: barId, sBar: 'static bar', propFoo: [id]},
            {id: incStr(barId), sBar: 'static bar', propFoo: [id]},
          ],
          propBaz: [
            {id: bazId, sBaz: 'static baz', propFoo: [id]},
            {id: incStr(bazId), sBaz: 'static baz', propFoo: [id]},
          ],
        };
      };
      const manyToManyBar = (id = '1', fooId = '1', barId = '1', bazId = '1') => {
        return {
          id,
          sBar: 'static bar',
          propFoo: [
            {
              id: fooId,
              sFoo: 'static foo',
              propBar: [barId, incStr(barId)],
              propBaz: [
                {id: bazId, sBaz: 'static baz', propFoo: [fooId]},
                {id: incStr(bazId), sBaz: 'static baz', propFoo: [fooId]},
              ],
            },
          ],
        };
      };
      const manyToManyBaz = (id = '1', fooId = '1', barId = '1', bazId = '1') => {
        return {
          id,
          sBaz: 'static baz',
          propFoo: [
            {
              id: fooId,
              sFoo: 'static foo',
              propBar: [
                {id: barId, sBar: 'static bar', propFoo: [fooId]},
                {id: incStr(barId), sBar: 'static bar', propFoo: [fooId]},
              ],
              propBaz: [bazId, incStr(bazId)],
            },
          ],
        };
      };

      describe('single record', () => {

        describe('one-to-one', () => {

          beforeEach(() => {
            this.lair.registerFactory(Factory.create({
              attrs: {
                propBar: Factory.hasOne('bar', 'propFoo'),
                sFoo: 'static foo',
              },
              createRelated: {propBar: 1},
            }), 'foo');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propFoo: Factory.hasOne('foo', 'propBar'),
                propBaz: Factory.hasOne('baz', 'propBar'),
                sBar: 'static bar',
              },
              createRelated: {propBaz: 1},
            }), 'bar');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propBar: Factory.hasOne('bar', 'propBaz'),
                sBaz: 'static baz',
              },
            }), 'baz');
            this.lair.createRecords('foo', 2);
          });

          describe('#getOne', () => {
            it('should return `foo` record with relationships', () => {
              expect(this.lair.getOne('foo', '1')).to.be.eql(oneToOneFoo('1'));
            });

            it('should return `bar` record with relationships', () => {
              expect(this.lair.getOne('bar', '1')).to.be.eql(oneToOneBar('1'));
            });

            it('should return `baz` record with relationships', () => {
              expect(this.lair.getOne('baz', '1')).to.be.eql(oneToOneBaz('1'));
            });
          });

          describe('#queryOne', () => {
            it('should return `foo` record with relationships', () => {
              expect(this.lair.queryOne('foo', r => r.id === '1')).to.be.eql(oneToOneFoo('1'));
            });

            it('should return `bar` record with relationships', () => {
              expect(this.lair.queryOne('bar', r => r.id === '1')).to.be.eql(oneToOneBar('1'));
            });

            it('should return `baz` record with relationships', () => {
              expect(this.lair.queryOne('baz', r => r.id === '1')).to.be.eql(oneToOneBaz('1'));
            });
          });

          describe('#updateOne', () => {

            it('should drop relation', () => {
              const expectedFoo = oneToOneFoo('1');
              const expectedBar = oneToOneBar('1');
              expectedFoo.propBar = null;
              expectedBar.propFoo = null;
              expect(this.lair.updateOne('foo', '1', {propBar: null})).to.be.eql(expectedFoo);
              expect(this.lair.getOne('bar', '1')).to.be.eql(expectedBar);
            });

            it('should throw an error if updated record doesn\'t exist in the db', () => {
              expect(() => this.lair.updateOne('foo', '100500', {})).to.throw('Record of "foo" with id "100500" doesn\'t exist');
            });

            it('should throw an error if relation-value is not an id-like', () => {
              expect(() => this.lair.updateOne('foo', '1', {propBar: 'abc'})).to.throw(`"abc" is invalid identifier for record of "bar" [one-to-one relationship]`);
            });

            it('should throw an error if relation-value doesn\'t exist in the db', () => {
              expect(() => this.lair.updateOne('foo', '1', {propBar: '100500'})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [one-to-one relationship]`);
            });

            describe('should update relationships', () => {

              beforeEach(() => {
                this.lair.updateOne('bar', '2', {fooProp: null});
                this.updatedFoo1 = this.lair.updateOne('foo', '1', {propBar: '2'});
              });

              it('foo1 is updated', () => {
                const expectedFoo1 = oneToOneFoo('1');
                expectedFoo1.propBar = {
                  id: '2',
                  propFoo: '1',
                  sBar: 'static bar',
                  propBaz: {
                    id: '2',
                    propBar: '2',
                    sBaz: 'static baz',
                  },
                };
                expect(this.updatedFoo1).to.be.eql(expectedFoo1);
              });

              it('foo2 is updated', () => {
                const expectedFoo2 = oneToOneFoo('2');
                expectedFoo2.propBar = null;
                expect(this.lair.getOne('foo', '2')).to.be.eql(expectedFoo2);
              });

              it('bar1 is updated', () => {
                const expectedBar1 = oneToOneBar('1');
                expectedBar1.propFoo = null;
                expect(this.lair.getOne('bar', '1')).to.be.eql(expectedBar1);
              });

              it('bar2 is updated', () => {
                expect(this.lair.getOne('bar', '2')).to.be.eql({
                  id: '2',
                  sBar: 'static bar',
                  propFoo: {
                    id: '1',
                    sFoo: 'static foo',
                    propBar: '2',
                  },
                  propBaz: {
                    id: '2',
                    propBar: '2',
                    sBaz: 'static baz',
                  },
                });
              });
            });

            describe('should update cross-relationships', () => {

              beforeEach(() => {
                // initial state:
                // foo1 -> bar1, bar1 -> foo1
                // foo2 -> bar2, bar2 -> foo2

                // should become to:
                // foo1 -> bar2, bar1 -> null
                // foo2 -> null, bar2 -> foo1
                this.updatedFoo1 = this.lair.updateOne('foo', '1', {propBar: '2'});
              });

              it('foo1 is updated', () => {
                const expectedFoo1 = oneToOneFoo('1');
                expectedFoo1.propBar = {
                  id: '2',
                  propFoo: '1',
                  sBar: 'static bar',
                  propBaz: {
                    id: '2',
                    propBar: '2',
                    sBaz: 'static baz',
                  },
                };
                expect(this.updatedFoo1).to.be.eql(expectedFoo1);
              });

              it('foo2 is updated', () => {
                const expectedFoo2 = oneToOneFoo('2');
                expectedFoo2.propBar = null;
                expect(this.lair.getOne('foo', '2')).to.be.eql(expectedFoo2);
              });

              it('bar1 is updated', () => {
                const expectedBar1 = oneToOneBar('1');
                expectedBar1.propFoo = null;
                expect(this.lair.getOne('bar', '1')).to.be.eql(expectedBar1);
              });

              it('bar2 is updated', () => {
                expect(this.lair.getOne('bar', '2')).to.be.eql({
                  id: '2',
                  sBar: 'static bar',
                  propFoo: {
                    id: '1',
                    sFoo: 'static foo',
                    propBar: '2',
                  },
                  propBaz: {
                    id: '2',
                    propBar: '2',
                    sBaz: 'static baz',
                  },
                });
              });

            });
          });

          describe('#createOne', () => {
            it('should throw an error if relation-value is not an id-like', () => {
              expect(() => this.lair.createOne('foo', {propBar: 'abc'})).to.throw(`"abc" is invalid identifier for record of "bar" [one-to-one relationship]`);
            });

            it('should throw an error if relation-value doesn\'t exist in the db', () => {
              expect(() => this.lair.createOne('foo', {propBar: '100500'})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [one-to-one relationship]`);
            });

            it('should create record without relationship', () => {
              expect(this.lair.createOne('foo', {propBar: null})).to.be.eql({id: '3', propBar: null});
            });

            it('should create record without relationship (property not set)', () => {
              expect(this.lair.createOne('foo', {})).to.be.eql({id: '3', propBar: null});
            });

            describe('should create relationships', () => {
              beforeEach(() => {
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propB: Factory.hasOne('b', 'propA'),
                  },
                  createRelated: {propB: 1},
                }), 'a');
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propA: Factory.hasOne('a', 'propB'),
                  },
                }), 'b');
                this.lair.createRecords('a', 1);
                this.lair.createOne('a', {propB: '1'});
              });

              it('a2 is created', () => {
                expect(this.lair.getOne('a', '2')).to.be.eql({id: '2', propB: {id: '1', propA: '2'}});
              });

              it('a1 is updated', () => {
                expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: null});
              });

              it('b1 is updated', () => {
                expect(this.lair.getOne('b', '1')).to.be.eql({id: '1', propA: {id: '2', propB: '1'}});
              });
            });
          });

        });

        describe('one-to-many', () => {

          beforeEach(() => {
            this.lair.registerFactory(Factory.create({
              attrs: {
                propBar: Factory.hasOne('bar', 'propFoo'),
                propBaz: Factory.hasOne('baz', 'propFoo'),
                sFoo: 'static foo',
              },
              createRelated: {
                propBar: 1,
                propBaz: 1,
              },
            }), 'foo');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propFoo: Factory.hasMany('foo', 'propBar'),
                sBar: 'static bar',
              },
            }), 'bar');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propFoo: Factory.hasMany('foo', 'propBaz'),
                sBaz: 'static baz',
              },
            }), 'baz');
            this.lair.createRecords('foo', 2);
          });

          describe('#getOne', () => {
            it('should return `foo` record with relationships', () => {
              expect(this.lair.getOne('foo', '1')).to.be.eql(oneToManyFoo('1'));
            });

            it('should return `bar` record with relationships', () => {
              expect(this.lair.getOne('bar', '1')).to.be.eql(oneToManyBar('1'));
            });

            it('should return `baz` record with relationships', () => {
              expect(this.lair.getOne('baz', '1')).to.be.eql(oneToManyBaz('1'));
            });
          });

          describe('#queryOne', () => {
            it('should return `foo` record with relationships', () => {
              expect(this.lair.queryOne('foo', r => r.id === '1')).to.be.eql(oneToManyFoo('1'));
            });

            it('should return `bar` record with relationships', () => {
              expect(this.lair.queryOne('bar', r => r.id === '1')).to.be.eql(oneToManyBar('1'));
            });

            it('should return `baz` record with relationships', () => {
              expect(this.lair.queryOne('baz', r => r.id === '1')).to.be.eql(oneToManyBaz('1'));
            });
          });

          describe('#updateOne', () => {
            it('should drop relation', () => {
              const expectedFoo = oneToManyFoo('1');
              const expectedBar = oneToManyBar('1');
              expectedFoo.propBar = null;
              expectedBar.propFoo = [];
              expect(this.lair.updateOne('foo', '1', {propBar: null})).to.be.eql(expectedFoo);
              expect(this.lair.getOne('bar', '1')).to.be.eql(expectedBar);
            });

            it('should throw an error if updated record doesn\'t exist in the db', () => {
              expect(() => this.lair.updateOne('foo', '100500', {})).to.throw('Record of "foo" with id "100500" doesn\'t exist');
            });

            it('should throw an error if relation-value contains some not id-like values', () => {
              expect(() => this.lair.updateOne('foo', '1', {propBar: ['abc']})).to.throw(`"abc" is invalid identifier for record of "bar" [one-to-many relationship]`);
            });

            it('should throw an error if relation-value doesn\'t exist in the db', () => {
              expect(() => this.lair.updateOne('foo', '1', {propBar: ['100500']})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [one-to-many relationship]`);
            });

            describe('should update relationships', () => {

              beforeEach(() => {
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propB: Factory.hasOne('b', 'propA'),
                  },
                }), 'a');
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propA: Factory.hasMany('a', 'propB'),
                  },
                  createRelated: {propA: 1},
                }), 'b');
                this.lair.createRecords('b', 1);
                this.lair.createRecords('a', 1);
              });

              it('check initial state', () => {
                expect(this.lair.getOne('a', '1').propB.id).to.be.equal('1');
                expect(this.lair.getOne('a', '2').propB).to.be.null;
                expect(this.lair.getOne('b', '1').propA.map(c => c.id)).to.be.eql(['1']);
              });

              describe('', () => {
                beforeEach(() => {
                  this.lair.updateOne('a', '2', {propB: '1'});
                });
                it('a1 updated', () => {
                  expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: {id: '1', propA: ['1', '2']}});
                });

                it('a2 updated', () => {
                  expect(this.lair.getOne('a', '2')).to.be.eql({id: '2', propB: {id: '1', propA: ['1', '2']}});
                });

                it('b1 updated', () => {
                  expect(this.lair.getOne('b', '1')).to.be.eql({id: '1', propA: [{id: '1', propB: '1'}, {id: '2', propB: '1'}]});
                });
              });

            });

            describe('should update cross-relationships', () => {

              beforeEach(() => {
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propB: Factory.hasOne('b', 'propA'),
                  },
                }), 'a');
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propA: Factory.hasMany('a', 'propB'),
                  },
                  createRelated: {propA: 2},
                }), 'b');
                this.lair.createRecords('b', 2);
              });

              it('check initial state', () => {
                expect(this.lair.getOne('a', '1').propB.id).to.be.equal('1');
                expect(this.lair.getOne('a', '2').propB.id).to.be.equal('1');
                expect(this.lair.getOne('a', '3').propB.id).to.be.equal('2');
                expect(this.lair.getOne('a', '4').propB.id).to.be.equal('2');
                expect(this.lair.getOne('b', '1').propA.map(c => c.id)).to.be.eql(['1', '2']);
                expect(this.lair.getOne('b', '2').propA.map(c => c.id)).to.be.eql(['3', '4']);
              });

              describe('', () => {
                beforeEach(() => {
                  this.lair.updateOne('a', '1', {propB: '2'});
                });
                it('a#1 updated', () => {
                  // a1.b -> b2
                  expect(this.lair.getOne('a', '1')).to.be.eql({
                    id: '1',
                    propB: {
                      id: '2',
                      propA: ['1', '3', '4'],
                    },
                  });
                });
                it('a#2 is not updated', () => {
                  expect(this.lair.getOne('a', '2')).to.be.eql({
                    id: '2',
                    propB: {
                      id: '1',
                      propA: ['2'],
                    },
                  });
                });
                it('b#1 updated', () => {
                  // b1.a -> [a2]
                  expect(this.lair.getOne('b', '1')).to.be.eql({
                    id: '1',
                    propA: [
                      {id: '2', propB: '1'},
                    ],
                  });
                });
                it('b#2 updated', () => {
                  // b2.a -> [a1, a3, a4]
                  expect(this.lair.getOne('b', '2')).to.be.eql({
                    id: '2',
                    propA: [
                      {id: '1', propB: '2'},
                      {id: '3', propB: '2'},
                      {id: '4', propB: '2'},
                    ],
                  });
                });
              });

            });
          });

          describe('#createOne', () => {
            it('should throw an error if relation-value contains some not id-like values', () => {
              expect(() => this.lair.createOne('foo', {propBar: 'abc'})).to.throw(`"abc" is invalid identifier for record of "bar" [one-to-many relationship]`);
            });

            it('should throw an error if relation-value doesn\'t exist in the db', () => {
              expect(() => this.lair.createOne('foo', {propBar: '100500'})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [one-to-many relationship]`);
            });

            it('should create record without relationship', () => {
              expect(this.lair.createOne('foo', {propBar: null, propBaz: null})).to.be.eql({id: '3', propBar: null, propBaz: null});
            });

            it('should create record without relationship (property not set)', () => {
              expect(this.lair.createOne('foo', {})).to.be.eql({id: '3', propBar: null, propBaz: null});
            });

            describe('should create relationships', () => {

              beforeEach(() => {
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propB: Factory.hasOne('b', 'propA'),
                  },
                  createRelated: {propB: 1},
                }), 'a');
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propA: Factory.hasMany('a', 'propB'),
                  },
                }), 'b');
                this.lair.createRecords('a', 1);
              });

              it('check initial state', () => {
                expect(this.lair.getOne('a', '1').propB.id).to.be.equal('1');
                expect(this.lair.getOne('b', '1').propA.map(c => c.id)).to.be.eql(['1']);
              });

              describe('', () => {
                beforeEach(() => {
                  this.lair.createOne('a', {propB: '1'});
                });

                it('a2 is created', () => {
                  expect(this.lair.getOne('a', '2')).to.be.eql({id: '2', propB: {id: '1', propA: ['1', '2']}});
                });

                it('a1 is updated', () => {
                  expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: {id: '1', propA: ['1', '2']}});
                });

                it('b1 is updated', () => {
                  expect(this.lair.getOne('b', '1')).to.be.eql({id: '1', propA: [{id: '1', propB: '1'}, {id: '2', propB: '1'}]});
                });
              });

            });
          });

        });

        describe('many-to-one', () => {

          beforeEach(() => {
            this.lair.registerFactory(Factory.create({
              attrs: {
                sFoo: 'static foo',
                propBar: Factory.hasMany('bar', 'propFoo'),
                propBaz: Factory.hasMany('baz', 'propFoo'),
              },
              createRelated: {
                propBar: 2,
                propBaz: 2,
              },
            }), 'foo');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propFoo: Factory.hasOne('foo', 'propBar'),
                sBar: 'static bar',
              },
            }), 'bar');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propFoo: Factory.hasOne('foo', 'propBaz'),
                sBaz: 'static baz',
              },
            }), 'baz');
            this.lair.createRecords('foo', 1);
          });

          describe('#getOne', () => {
            it('should return `foo` record with relationships', () => {
              expect(this.lair.getOne('foo', '1')).to.be.eql(manyToOneFoo('1'));
            });

            it('should return `bar` record with relationships', () => {
              expect(this.lair.getOne('bar', '1')).to.be.eql(manyToOneBar('1'));
            });

            it('should return `baz` record with relationships', () => {
              expect(this.lair.getOne('baz', '1')).to.be.eql(manyToOneBaz('1'));
            });
          });

          describe('#queryOne', () => {
            it('should return `foo` record with relationships', () => {
              expect(this.lair.queryOne('foo', r => r.id === '1')).to.be.eql(manyToOneFoo('1'));
            });

            it('should return `bar` record with relationships', () => {
              expect(this.lair.queryOne('bar', r => r.id === '1')).to.be.eql(manyToOneBar('1'));
            });

            it('should return `baz` record with relationships', () => {
              expect(this.lair.queryOne('baz', r => r.id === '1')).to.be.eql(manyToOneBaz('1'));
            });
          });

          describe('#updateOne', () => {

            it('should drop relation', () => {
              const expectedFoo = manyToOneFoo('1');
              const expectedBar = manyToOneBar('1');
              expectedFoo.propBar = [];
              expectedBar.propFoo = null;
              expect(this.lair.updateOne('foo', '1', {propBar: null})).to.be.eql(expectedFoo);
              expect(this.lair.getOne('bar', '1')).to.be.eql(expectedBar);
            });

            it('should throw an error if updated record doesn\'t exist in the db', () => {
              expect(() => this.lair.updateOne('foo', '100500', {})).to.throw('Record of "foo" with id "100500" doesn\'t exist');
            });

            it('should throw an error if relation-value contains some not id-like values', () => {
              expect(() => this.lair.updateOne('foo', '1', {propBar: ['abc']})).to.throw(`"abc" is invalid identifier for record of "bar" [many-to-one relationship]`);
            });

            it('should throw an error if relation-value doesn\'t exist in the db', () => {
              expect(() => this.lair.updateOne('foo', '1', {propBar: ['100500']})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [many-to-one relationship]`);
            });

            describe('should update cross-relationships', () => {

              beforeEach(() => {
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propB: Factory.hasMany('b', 'propA'),
                  },
                  createRelated: {
                    propB: 2,
                  },
                }), 'a');
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propA: Factory.hasOne('a', 'propB'),
                  },
                }), 'b');
                this.lair.createRecords('a', 1);
                this.lair.createRecords('b', 1);
              });

              it('check initial state', () => {
                expect(this.lair.getOne('a', '1').propB.map(c => c.id)).to.be.eql(['1', '2']);
                expect(this.lair.getOne('b', '1').propA.id).to.be.equal('1');
                expect(this.lair.getOne('b', '2').propA.id).to.be.equal('1');
                expect(this.lair.getOne('b', '3').propA).to.be.null;
              });

              describe('', () => {
                beforeEach(() => {
                  this.lair.updateOne('a', '1', {propB: ['2', '3']});
                });
                it('a#1 updated', () => {
                  // a1.b -> [b2, b3]
                  expect(this.lair.getOne('a', '1')).to.be.eql({
                    id: '1',
                    propB: [
                      {id: '2', propA: '1'},
                      {id: '3', propA: '1'},
                    ],
                  });
                });
                it('b#1 updated', () => {
                  // b1.a -> null
                  expect(this.lair.getOne('b', '1')).to.be.eql({
                    id: '1',
                    propA: null,
                  });
                });
                it('b#2 is not updated', () => {
                  expect(this.lair.getOne('b', '2')).to.be.eql({
                    id: '2',
                    propA: {id: '1', propB: ['2', '3']},
                  });
                });
                it('b#3 updated', () => {
                  // b3.a -> a1
                  expect(this.lair.getOne('b', '3')).to.be.eql({
                    id: '3',
                    propA: {id: '1', propB: ['2', '3']},
                  });
                });
              });

            });

          });

          describe('#createOne', () => {
            it('should throw an error if relation-value contains some not id-like values', () => {
              expect(() => this.lair.createOne('foo', {propBar: ['abc']})).to.throw(`"abc" is invalid identifier for record of "bar" [many-to-one relationship]`);
            });

            it('should throw an error if relation-value doesn\'t exist in the db', () => {
              expect(() => this.lair.createOne('foo', {propBar: ['100500']})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [many-to-one relationship]`);
            });

            describe('should create relationships', () => {

              beforeEach(() => {
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propB: Factory.hasMany('b', 'propA'),
                  },
                  createRelated: {
                    propB: 2,
                  },
                }), 'a');
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propA: Factory.hasOne('a', 'propB'),
                  },
                }), 'b');
                this.lair.createRecords('a', 1);
                this.lair.createRecords('b', 1);
              });

              it('check initial state', () => {
                expect(this.lair.getOne('a', '1').propB.map(c => c.id)).to.be.eql(['1', '2']);
                expect(this.lair.getOne('b', '1').propA.id).to.be.equal('1');
                expect(this.lair.getOne('b', '2').propA.id).to.be.equal('1');
                expect(this.lair.getOne('b', '3').propA).to.be.null;
              });

              describe('', () => {
                beforeEach(() => {
                  this.lair.createOne('a', {propB: ['2', '3']});
                });
                it('a#1 updated', () => {
                  expect(this.lair.getOne('a', '1')).to.be.eql({
                    id: '1',
                    propB: [
                      {id: '1', propA: '1'},
                    ],
                  });
                });
                it('a#2 created', () => {
                  expect(this.lair.getOne('a', '2')).to.be.eql({
                    id: '2',
                    propB: [
                      {id: '2', propA: '2'},
                      {id: '3', propA: '2'},
                    ],
                  });
                });
                it('b#1 updated', () => {
                  expect(this.lair.getOne('b', '1')).to.be.eql({
                    id: '1',
                    propA: {
                      id: '1',
                      propB: ['1'],
                    },
                  });
                });
                it('b#2 updated', () => {
                  expect(this.lair.getOne('b', '2')).to.be.eql({
                    id: '2',
                    propA: {id: '2', propB: ['2', '3']},
                  });
                });
                it('b#3 updated', () => {
                  expect(this.lair.getOne('b', '3')).to.be.eql({
                    id: '3',
                    propA: {id: '2', propB: ['2', '3']},
                  });
                });
              });

            });
          });
        });

        describe('many-to-many', () => {
          beforeEach(() => {
            this.lair.registerFactory(Factory.create({
              attrs: {
                sFoo: 'static foo',
                propBar: Factory.hasMany('bar', 'propFoo'),
                propBaz: Factory.hasMany('baz', 'propFoo'),
              },
              createRelated: {
                propBar: 2,
                propBaz: 2,
              },
            }), 'foo');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propFoo: Factory.hasMany('foo', 'propBar'),
                sBar: 'static bar',
              },
            }), 'bar');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propFoo: Factory.hasMany('foo', 'propBaz'),
                sBaz: 'static baz',
              },
            }), 'baz');
            this.lair.createRecords('foo', 2);
          });

          describe('#getOne', () => {
            it('should return `foo` record with relationships', () => {
              expect(this.lair.getOne('foo', '1')).to.be.eql(manyToManyFoo('1'));
            });

            it('should return `bar` record with relationships', () => {
              expect(this.lair.getOne('bar', '1')).to.be.eql(manyToManyBar('1'));
            });

            it('should return `baz` record with relationships', () => {
              expect(this.lair.getOne('baz', '1')).to.be.eql(manyToManyBaz('1'));
            });
          });

          describe('#queryOne', () => {
            it('should return `foo` record with relationships', () => {
              expect(this.lair.queryOne('foo', r => r.id === '1')).to.be.eql(manyToManyFoo('1'));
            });

            it('should return `bar` record with relationships', () => {
              expect(this.lair.queryOne('bar', r => r.id === '1')).to.be.eql(manyToManyBar('1'));
            });

            it('should return `baz` record with relationships', () => {
              expect(this.lair.queryOne('baz', r => r.id === '1')).to.be.eql(manyToManyBaz('1'));
            });
          });

          describe('#updateOne', () => {
            it('should drop relation', () => {
              const expectedFoo = manyToManyFoo('1');
              const expectedBar = manyToManyBar('1');
              expectedFoo.propBar = [];
              expectedBar.propFoo = [];
              expect(this.lair.updateOne('foo', '1', {propBar: null})).to.be.eql(expectedFoo);
              expect(this.lair.getOne('bar', '1')).to.be.eql(expectedBar);
            });

            it('should throw an error if updated record doesn\'t exist in the db', () => {
              expect(() => this.lair.updateOne('foo', '100500', {})).to.throw('Record of "foo" with id "100500" doesn\'t exist');
            });

            it('should throw an error if relation-value contains some not id-like values', () => {
              expect(() => this.lair.updateOne('foo', '1', {propBar: ['abc']})).to.throw(`"abc" is invalid identifier for record of "bar" [many-to-many relationship]`);
            });

            it('should throw an error if relation-value doesn\'t exist in the db', () => {
              expect(() => this.lair.updateOne('foo', '1', {propBar: ['100500']})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [many-to-many relationship]`);
            });

            describe('should update cross-relationships', () => {

              beforeEach(() => {
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propB: Factory.hasMany('b', 'propA'),
                  },
                  createRelated: {
                    propB: 2,
                  },
                }), 'a');
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propA: Factory.hasMany('a', 'propB'),
                  },
                }), 'b');
                this.lair.createRecords('a', 2);
              });

              it('check initial state', () => {
                expect(this.lair.getOne('a', '1').propB.map(c => c.id)).to.be.eql(['1', '2']);
                expect(this.lair.getOne('a', '2').propB.map(c => c.id)).to.be.eql(['3', '4']);
                expect(this.lair.getOne('b', '1').propA.map(c => c.id)).to.be.eql(['1']);
                expect(this.lair.getOne('b', '2').propA.map(c => c.id)).to.be.eql(['1']);
                expect(this.lair.getOne('b', '3').propA.map(c => c.id)).to.be.eql(['2']);
                expect(this.lair.getOne('b', '4').propA.map(c => c.id)).to.be.eql(['2']);
              });

              describe('', () => {
                beforeEach(() => {
                  this.lair.updateOne('a', '1', {propB: ['2', '3']});
                });
                it('a1 updated', () => {
                  // a1.b -> [b2, b3]
                  expect(this.lair.getOne('a', '1')).to.be.eql({
                    id: '1',
                    propB: [
                      {id: '2', propA: ['1']},
                      {id: '3', propA: ['1', '2']},
                    ],
                  });
                });
                it('a2 updated', () => {
                  // a2.b -> [b3, b4]
                  expect(this.lair.getOne('a', '2')).to.be.eql({
                    id: '2',
                    propB: [
                      {id: '3', propA: ['1', '2']},
                      {id: '4', propA: ['2']},
                    ],
                  });
                });
                it('b1 updated', () => {
                  // b1.a -> []
                  expect(this.lair.getOne('b', '1')).to.be.eql({
                    id: '1',
                    propA: [],
                  });
                });
                it('b2 updated', () => {
                  // b2.a -> [a1, a2]
                  expect(this.lair.getOne('b', '2')).to.be.eql({
                    id: '2',
                    propA: [
                      {id: '1', propB: ['2', '3']},
                    ],
                  });
                });
                it('b3 updated', () => {
                  // b3.a -> [a1, a2]
                  expect(this.lair.getOne('b', '3')).to.be.eql({
                    id: '3',
                    propA: [
                      {id: '1', propB: ['2', '3']},
                      {id: '2', propB: ['3', '4']},
                    ],
                  });
                });
                it('b4 updated', () => {
                  // b4.a -> [a2]
                  expect(this.lair.getOne('b', '4')).to.be.eql({
                    id: '4',
                    propA: [
                      {id: '2', propB: ['3', '4']},
                    ],
                  });
                });
              });
            });
          });

          describe('#createOne', () => {
            it('should throw an error if relation-value contains some not id-like values', () => {
              expect(() => this.lair.createOne('foo', {propBar: ['abc']})).to.throw(`"abc" is invalid identifier for record of "bar" [many-to-many relationship]`);
            });

            it('should throw an error if relation-value doesn\'t exist in the db', () => {
              expect(() => this.lair.createOne('foo', {propBar: ['100500']})).to.throw(`Record of "bar" with id "100500" doesn't exist. Create it first [many-to-many relationship]`);
            });

            describe('should create relationships', () => {

              beforeEach(() => {
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propB: Factory.hasMany('b', 'propA'),
                  },
                  createRelated: {
                    propB: 2,
                  },
                }), 'a');
                this.lair.registerFactory(Factory.create({
                  attrs: {
                    propA: Factory.hasMany('a', 'propB'),
                  },
                }), 'b');
                this.lair.createRecords('a', 2);
                this.lair.createRecords('b', 1);
              });

              it('check initial state', () => {
                expect(this.lair.getOne('a', '1').propB.map(c => c.id)).to.be.eql(['1', '2']);
                expect(this.lair.getOne('a', '2').propB.map(c => c.id)).to.be.eql(['3', '4']);
                expect(this.lair.getOne('b', '1').propA.map(c => c.id)).to.be.eql(['1']);
                expect(this.lair.getOne('b', '2').propA.map(c => c.id)).to.be.eql(['1']);
                expect(this.lair.getOne('b', '3').propA.map(c => c.id)).to.be.eql(['2']);
                expect(this.lair.getOne('b', '4').propA.map(c => c.id)).to.be.eql(['2']);
                expect(this.lair.getOne('b', '5').propA.map(c => c.id)).to.be.eql([]);
              });

              describe('', () => {
                beforeEach(() => {
                  this.lair.createOne('a', {propB: ['2', '3', '5']});
                });
                it('a1 updated', () => {
                  expect(this.lair.getOne('a', '1')).to.be.eql({
                    id: '1',
                    propB: [
                      {id: '1', propA: ['1']},
                      {id: '2', propA: ['1', '3']},
                    ],
                  });
                });
                it('a2 updated', () => {
                  expect(this.lair.getOne('a', '2')).to.be.eql({
                    id: '2',
                    propB: [
                      {id: '3', propA: ['2', '3']},
                      {id: '4', propA: ['2']},
                    ],
                  });
                });
                it('a3 created', () => {
                  expect(this.lair.getOne('a', '3')).to.be.eql({
                    id: '3',
                    propB: [
                      {id: '2', propA: ['1', '3']},
                      {id: '3', propA: ['2', '3']},
                      {id: '5', propA: ['3']},
                    ],
                  });
                });
                it('b1 updated', () => {
                  expect(this.lair.getOne('b', '1')).to.be.eql({
                    id: '1',
                    propA: [
                      {id: '1', propB: ['1', '2']},
                    ],
                  });
                });
                it('b2 updated', () => {
                  expect(this.lair.getOne('b', '2')).to.be.eql({
                    id: '2',
                    propA: [
                      {id: '1', propB: ['1', '2']},
                      {id: '3', propB: ['2', '3', '5']},
                    ],
                  });
                });
                it('b3 updated', () => {
                  expect(this.lair.getOne('b', '3')).to.be.eql({
                    id: '3',
                    propA: [
                      {id: '2', propB: ['3', '4']},
                      {id: '3', propB: ['2', '3', '5']},
                    ],
                  });
                });
                it('b4 updated', () => {
                  expect(this.lair.getOne('b', '4')).to.be.eql({
                    id: '4',
                    propA: [
                      {id: '2', propB: ['3', '4']},
                    ],
                  });
                });
                it('b5 updated', () => {
                  expect(this.lair.getOne('b', '5')).to.be.eql({
                    id: '5',
                    propA: [
                      {id: '3', propB: ['2', '3', '5']},
                    ],
                  });
                });
              });
            });
          });
        });

        describe('not-cross relationships', () => {

          beforeEach(() => {
            this.lair.registerFactory(Factory.create({
              attrs: {
                propB: Factory.hasOne('b', null),
              },
            }), 'a');
            this.lair.registerFactory(Factory.create({}), 'b');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propB: Factory.hasMany('b', null),
              },
            }), 'c');
          });

          describe('#getOne', () => {
            beforeEach(() => {
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propB: Factory.hasOne('bFactory', null),
                },
                createRelated: {
                  propB: 1,
                },
              }), 'aFactory');
              this.lair.registerFactory(Factory.create({}), 'bFactory');
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propB: Factory.hasMany('bFactory', null),
                },
                createRelated: {
                  propB: 2,
                },
              }), 'cFactory');
              this.lair.createRecords('aFactory', 1);
              this.lair.createRecords('cFactory', 1);
            });
            it('propB for A doesn\'t have related fields for A', () => {
              expect(this.lair.getOne('aFactory', '1')).to.be.eql({
                id: '1',
                propB: {
                  id: '1',
                },
              });
            });
            it('propB for C doesn\'t have related fields for C', () => {
              expect(this.lair.getOne('cFactory', '1')).to.be.eql({
                id: '1',
                propB: [
                  {id: '2'}, {id: '3'},
                ],
              });
            });
          });

          describe('#queryOne', () => {
            beforeEach(() => {
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propB: Factory.hasOne('bFactory', null),
                },
                createRelated: {
                  propB: 1,
                },
              }), 'aFactory');
              this.lair.registerFactory(Factory.create({}), 'bFactory');
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propB: Factory.hasMany('bFactory', null),
                },
                createRelated: {
                  propB: 2,
                },
              }), 'cFactory');
              this.lair.createRecords('aFactory', 1);
              this.lair.createRecords('cFactory', 1);
            });
            it('propB for A doesn\'t have related fields for A', () => {
              expect(this.lair.queryOne('aFactory', r => r.id === '1')).to.be.eql({
                id: '1',
                propB: {
                  id: '1',
                },
              });
            });
            it('propB for C doesn\'t have related fields for C', () => {
              expect(this.lair.queryOne('cFactory', r => r.id === '1')).to.be.eql({
                id: '1',
                propB: [
                  {id: '2'}, {id: '3'},
                ],
              });
            });
          });

          describe('#createOne', () => {
            describe('has one', () => {
              it('one A created', () => {
                this.lair.createRecords('b', 1);
                this.lair.createOne('a', {propB: '1'});
                expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: {id: '1'}});
              });
              it('one A created without relations', () => {
                this.lair.createOne('a', {});
                expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: null});
              });
            });
            describe('has many', () => {
              it('one C created', () => {
                this.lair.createRecords('b', 2);
                this.lair.createOne('c', {propB: ['1', '2']});
                expect(this.lair.getOne('c', '1')).to.be.eql({id: '1', propB: [{id: '1'}, {id: '2'}]});
              });
              it('one C created without relations', () => {
                this.lair.createOne('c', {});
                expect(this.lair.getOne('c', '1')).to.be.eql({id: '1', propB: []});
              });
            });
          });

          describe('#updateOne', () => {
            describe('has one', () => {
              beforeEach(() => {
                this.lair.createRecords('b', 1);
              });
              it('one A updated', () => {
                this.lair.createOne('a', {});
                this.lair.updateOne('a', '1', {propB: '1'});
                expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: {id: '1'}});
              });
              it('one A updated to drop relation', () => {
                this.lair.createOne('a', {propB: '1'});
                this.lair.updateOne('a', '1', {propB: null});
                expect(this.lair.getOne('a', '1')).to.be.eql({id: '1', propB: null});
              });
            });
            describe('has many', () => {
              beforeEach(() => {
                this.lair.createRecords('b', 2);
              });
              it('one C updated', () => {
                this.lair.createOne('c', {});
                this.lair.updateOne('c', '1', {propB: ['1', '2']});
                expect(this.lair.getOne('c', '1')).to.be.eql({id: '1', propB: [{id: '1'}, {id: '2'}]});
              });
              it('one C updated to drop relation', () => {
                this.lair.createOne('c', {propB: ['1', '2']});
                this.lair.updateOne('c', '1', {propB: []});
                expect(this.lair.getOne('c', '1')).to.be.eql({id: '1', propB: []});
              });
            });
          });

        });

      });

      describe('multiple records', () => {

        describe('one-to-one', () => {

          beforeEach(() => {
            this.lair.registerFactory(Factory.create({
              attrs: {
                propBar: Factory.hasOne('bar', 'propFoo'),
                sFoo: 'static foo',
              },
              createRelated: {
                propBar: 1,
              },
            }), 'foo');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propFoo: Factory.hasOne('foo', 'propBar'),
                propBaz: Factory.hasOne('baz', 'propBar'),
                sBar: 'static bar',
              },
              createRelated: {
                propBaz: 1,
              },
            }), 'bar');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propBar: Factory.hasOne('bar', 'propBaz'),
                sBaz: 'static baz',
              },
            }), 'baz');
            this.lair.createRecords('foo', 2);
          });

          describe('#getAll', () => {
            it('should return all `foo` records with relationships', () => {
              expect(this.lair.getAll('foo')).to.be.eql([oneToOneFoo('1'), oneToOneFoo('2')]);
            });

            it('should return all `bar` records with relationships', () => {
              expect(this.lair.getAll('bar')).to.be.eql([oneToOneBar('1'), oneToOneBar('2')]);
            });

            it('should return all `baz` records with relationships', () => {
              expect(this.lair.getAll('baz')).to.be.eql([oneToOneBaz('1'), oneToOneBaz('2')]);
            });
          });

          describe('#queryMany', () => {
            it('should return queried `foo` records with relationships', () => {
              expect(this.lair.queryMany('foo', r => r.id === '1' || r.id === '2')).to.be.eql([oneToOneFoo('1'), oneToOneFoo('2')]);
            });

            it('should return queried `bar` records with relationships', () => {
              expect(this.lair.queryMany('bar', r => r.id === '1' || r.id === '2')).to.be.eql([oneToOneBar('1'), oneToOneBar('2')]);
            });

            it('should return queried `baz` records with relationships', () => {
              expect(this.lair.queryMany('baz', r => r.id === '1' || r.id === '2')).to.be.eql([oneToOneBaz('1'), oneToOneBaz('2')]);
            });
          });
        });

        describe('one-to-many', () => {

          beforeEach(() => {
            this.lair.registerFactory(Factory.create({
              attrs: {
                propBar: Factory.hasOne('bar', 'propFoo'),
                propBaz: Factory.hasOne('baz', 'propFoo'),
                sFoo: 'static foo',
              },
              createRelated: {
                propBar: 1,
                propBaz: 1,
              },
            }), 'foo');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propFoo: Factory.hasMany('foo', 'propBar'),
                sBar: 'static bar',
              },
            }), 'bar');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propFoo: Factory.hasMany('foo', 'propBaz'),
                sBaz: 'static baz',
              },
            }), 'baz');
            this.lair.createRecords('foo', 2);
          });

          describe('#getAll', () => {
            it('should return all `foo` records with relationships', () => {
              expect(this.lair.getAll('foo')).to.be.eql([oneToManyFoo('1'), oneToManyFoo('2')]);
            });

            it('should return all `bar` records with relationships', () => {
              expect(this.lair.getAll('bar')).to.be.eql([oneToManyBar('1'), oneToManyBar('2')]);
            });

            it('should return all `baz` records with relationships', () => {
              expect(this.lair.getAll('baz')).to.be.eql([oneToManyBaz('1'), oneToManyBaz('2')]);
            });
          });

          describe('#queryMany', () => {
            it('should return queried `foo` records with relationships', () => {
              expect(this.lair.queryMany('foo', r => r.id === '1' || r.id === '2')).to.be.eql([oneToManyFoo('1'), oneToManyFoo('2')]);
            });

            it('should return queried `bar` records with relationships', () => {
              expect(this.lair.queryMany('bar', r => r.id === '1' || r.id === '2')).to.be.eql([oneToManyBar('1'), oneToManyBar('2')]);
            });

            it('should return queried `baz` records with relationships', () => {
              expect(this.lair.queryMany('baz', r => r.id === '1' || r.id === '2')).to.be.eql([oneToManyBaz('1'), oneToManyBaz('2')]);
            });
          });

        });

        describe('many-to-one', () => {

          beforeEach(() => {
            this.lair.registerFactory(Factory.create({
              attrs: {
                sFoo: 'static foo',
                propBar: Factory.hasMany('bar', 'propFoo'),
                propBaz: Factory.hasMany('baz', 'propFoo'),
              },
              createRelated: {
                propBar: 2,
                propBaz: 2,
              },
            }), 'foo');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propFoo: Factory.hasOne('foo', 'propBar'),
                sBar: 'static bar',
              },
            }), 'bar');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propFoo: Factory.hasOne('foo', 'propBaz'),
                sBaz: 'static baz',
              },
            }), 'baz');
            this.lair.createRecords('foo', 1);
          });

          describe('#getAll', () => {
            it('should return all `foo` records with relationships', () => {
              expect(this.lair.getAll('foo')).to.be.eql([manyToOneFoo('1')]);
            });

            it('should return all `bar` records with relationships', () => {
              expect(this.lair.getAll('bar')).to.be.eql([manyToOneBar('1'), manyToOneBar('1', '2')]);
            });

            it('should return all `baz` records with relationships', () => {
              expect(this.lair.getAll('baz')).to.be.eql([manyToOneBaz('1'), manyToOneBaz('1', '2')]);
            });
          });

          describe('#queryMany', () => {
            it('should return queried `foo` records with relationships', () => {
              expect(this.lair.queryMany('foo', r => r.id === '1' || r.id === '2')).to.be.eql([manyToOneFoo('1')]);
            });

            it('should return queried `bar` records with relationships', () => {
              expect(this.lair.queryMany('bar', r => r.id === '1' || r.id === '2')).to.be.eql([manyToOneBar('1'), manyToOneBar('1', '2')]);
            });

            it('should return queried `baz` records with relationships', () => {
              expect(this.lair.queryMany('baz', r => r.id === '1' || r.id === '2')).to.be.eql([manyToOneBaz('1'), manyToOneBaz('1', '2')]);
            });
          });
        });

        describe('many-to-many', () => {

          beforeEach(() => {
            this.lair.registerFactory(Factory.create({
              attrs: {
                sFoo: 'static foo',
                propBar: Factory.hasMany('bar', 'propFoo'),
                propBaz: Factory.hasMany('baz', 'propFoo'),
              },
              createRelated: {
                propBar: 2,
                propBaz: 2,
              },
            }), 'foo');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propFoo: Factory.hasMany('foo', 'propBar'),
                sBar: 'static bar',
              },
            }), 'bar');
            this.lair.registerFactory(Factory.create({
              attrs: {
                propFoo: Factory.hasMany('foo', 'propBaz'),
                sBaz: 'static baz',
              },
            }), 'baz');
            this.lair.createRecords('foo', 2);
          });

          describe('#getAll', () => {
            it('should return all `foo` records with relationships', () => {
              expect(this.lair.getAll('foo')).to.be.eql([manyToManyFoo('1'), manyToManyFoo('2', '3', '3')]);
            });

            it('should return all `bar` records with relationships', () => {
              expect(this.lair.getAll('bar')).to.be.eql([
                manyToManyBar('1'),
                manyToManyBar('2'),
                manyToManyBar('3', '2', '3', '3'),
                manyToManyBar('4', '2', '3', '3'),
              ]);
            });

            it('should return all `baz` records with relationships', () => {
              expect(this.lair.getAll('baz')).to.be.eql([
                manyToManyBaz('1'),
                manyToManyBaz('2'),
                manyToManyBaz('3', '2', '3', '3'),
                manyToManyBaz('4', '2', '3', '3'),
              ]);
            });
          });

          describe('#queryMany', () => {
            it('should return queried `foo` records with relationships', () => {
              expect(this.lair.queryMany('foo', r => r.id === '1' || r.id === '2')).to.be.eql([manyToManyFoo('1'), manyToManyFoo('2', '3', '3')]);
            });

            it('should return queried `bar` records with relationships', () => {
              expect(this.lair.queryMany('bar', r => r.id === '1' || r.id === '2')).to.be.eql([
                manyToManyBar('1'),
                manyToManyBar('2'),
              ]);
            });

            it('should return queried `baz` records with relationships', () => {
              expect(this.lair.queryMany('baz', r => r.id === '1' || r.id === '2')).to.be.eql([
                manyToManyBaz('1'),
                manyToManyBaz('2'),
              ]);
            });
          });

        });

        describe('non-cross relationships', () => {

          describe('#getAll', () => {

            beforeEach(() => {
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propB: Factory.hasOne('bFactory', null),
                },
                createRelated: {
                  propB: 1,
                },
              }), 'aFactory');
              this.lair.registerFactory(Factory.create({}), 'bFactory');
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propB: Factory.hasMany('bFactory', null),
                },
                createRelated: {
                  propB: 2,
                },
              }), 'cFactory');
              this.lair.createRecords('aFactory', 1);
              this.lair.createRecords('cFactory', 1);
            });
            it('propB for A doesn\'t have related fields for A', () => {
              expect(this.lair.getAll('aFactory')).to.be.eql([{
                id: '1',
                propB: {
                  id: '1',
                },
              }]);
            });
            it('propB for C doesn\'t have related fields for C', () => {
              expect(this.lair.getAll('cFactory')).to.be.eql([{
                id: '1',
                propB: [
                  {id: '2'}, {id: '3'},
                ],
              }]);
            });
          });

          describe('#queryMany', () => {

            beforeEach(() => {
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propB: Factory.hasOne('bFactory', null),
                },
                createRelated: {
                  propB: 1,
                },
              }), 'aFactory');
              this.lair.registerFactory(Factory.create({}), 'bFactory');
              this.lair.registerFactory(Factory.create({
                attrs: {
                  propB: Factory.hasMany('bFactory', null),
                },
                createRelated: {
                  propB: 2,
                },
              }), 'cFactory');
              this.lair.createRecords('aFactory', 1);
              this.lair.createRecords('cFactory', 1);
            });
            it('propB for A doesn\'t have related fields for A', () => {
              expect(this.lair.queryMany('aFactory', r => r.id === '1')).to.be.eql([{
                id: '1',
                propB: {
                  id: '1',
                },
              }]);
            });
            it('propB for C doesn\'t have related fields for C', () => {
              expect(this.lair.queryMany('cFactory', r => r.id === '1')).to.be.eql([{
                id: '1',
                propB: [
                  {id: '2'}, {id: '3'},
                ],
              }]);
            });
          });

        });

      });

      describe('RU methods should return copies of records from the db', () => {

        beforeEach(() => {
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasOne('b', 'propA'),
            },
            createRelated: {
              propB: 1,
            },
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasOne('a', 'propB'),
            },
          }), 'b');
          this.lair.createRecords('a', 1);
          this.r = this.lair.getOne('a', '1');
          this.originA1 = {id: '1', propB: {id: '1', propA: '1'}};
        });
        it('#getOne', () => {
          expect(this.r).to.be.eql(this.originA1);
          delete this.r.propB.id;
          expect(this.lair.getOne('a', '1')).to.be.eql(this.originA1);
        });

        it('#queryOne', () => {
          expect(this.r).to.be.eql(this.originA1);
          delete this.r.propB.id;
          expect(this.lair.queryOne('a', r => r.id === '1')).to.be.eql(this.originA1);
        });

        it('#getAll', () => {
          expect(this.r).to.be.eql(this.originA1);
          delete this.r.propB.id;
          expect(this.lair.getAll('a')).to.be.eql([this.originA1]);
        });

        it('#queryMany', () => {
          expect(this.r).to.be.eql(this.originA1);
          delete this.r.propB.id;
          expect(this.lair.queryMany('a', r => r.id === '1')).to.be.eql([this.originA1]);
        });

        it('#updateOne', () => {
          expect(this.r).to.be.eql(this.originA1);
          delete this.r.propB.id;
          expect(this.lair.updateOne('a', '1', {})).to.be.eql(this.originA1);
        });
      });

      describe('RU method should allow to set depth of relationships to be included in their response', () => {

        beforeEach(() => {
          this.a1 = {
            id: '1',
            propB: [
              {
                id: '1',
                propA: '1',
                propC: [
                  {
                    id: '1',
                    propB: '1',
                    propD: [
                      {
                        id: '1',
                        propC: '1',
                        propE: [
                          {
                            id: '1',
                            propD: '1',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          };
          this.b1 = {
            id: '1',
            propA: {
              id: '1',
              propB: ['1'],
            },
            propC: [
              {
                id: '1',
                propB: '1',
                propD: [
                  {
                    id: '1',
                    propC: '1',
                    propE: [
                      {
                        id: '1',
                        propD: '1',
                      },
                    ],
                  },
                ],
              },
            ],
          };
          this.c1 = {
            id: '1',
            propB: {
              id: '1',
              propA: {
                id: '1',
                propB: ['1'],
              },
              propC: ['1'],
            },
            propD: [
              {
                id: '1',
                propC: '1',
                propE: [
                  {
                    id: '1',
                    propD: '1',
                  },
                ],
              },
            ],
          };
          this.d1 = {
            id: '1',
            propC: {
              id: '1',
              propB: {
                id: '1',
                propA: {
                  id: '1',
                  propB: ['1'],
                },
                propC: ['1'],
              },
              propD: ['1'],
            },
            propE: [
              {
                id: '1',
                propD: '1',
              },
            ],
          };
          this.e1 = {
            id: '1',
            propD: {
              id: '1',
              propE: ['1'],
              propC: {
                id: '1',
                propD: ['1'],
                propB: {
                  id: '1',
                  propA: {
                    id: '1',
                    propB: ['1'],
                  },
                  propC: ['1'],
                },
              },
            },
          };
          this.a2 = {
            id: '1',
            propB: ['1'],
          };
          this.b2 = {
            id: '1',
            propA: '1',
            propC: ['1'],
          };
          this.c2 = {
            id: '1',
            propB: '1',
            propD: ['1'],
          };
          this.d2 = {
            id: '1',
            propC: '1',
            propE: ['1'],
          };
          this.e2 = {
            id: '1',
            propD: '1',
          };
          this.a3 = {
            id: '1',
            propB: [
              {id: '1', propA: '1', propC: ['1']},
            ],
          };
          this.b3 = {
            id: '1',
            propA: {
              id: '1',
              propB: ['1'],
            },
            propC: [
              {id: '1', propB: '1', propD: ['1']},
            ],
          };
          this.c3 = {
            id: '1',
            propB: {
              id: '1',
              propA: '1',
              propC: ['1'],
            },
            propD: [
              {id: '1', propC: '1', propE: ['1']},
            ],
          };
          this.d3 = {
            id: '1',
            propC: {
              id: '1',
              propB: '1',
              propD: ['1'],
            },
            propE: [
              {id: '1', propD: '1'},
            ],
          };
          this.e3 = {
            id: '1',
            propD: {
              id: '1',
              propE: ['1'],
              propC: '1',
            },
          };
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasMany('b', 'propA'),
            },
            createRelated: {
              propB: 1,
            },
          }), 'a');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasOne('a', 'propB'),
              propC: Factory.hasMany('c', 'propB'),
            },
            createRelated: {
              propC: 1,
            },
          }), 'b');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasOne('b', 'propC'),
              propD: Factory.hasMany('d', 'propC'),
            },
            createRelated: {
              propD: 1,
            },
          }), 'c');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propC: Factory.hasOne('c', 'propD'),
              propE: Factory.hasMany('e', 'propD'),
            },
            createRelated: {
              propE: 1,
            },
          }), 'd');
          this.lair.registerFactory(Factory.create({
            attrs: {
              propD: Factory.hasOne('d', 'propE'),
            },
          }), 'e');
          this.lair.createRecords('a', 1);
        });

        describe('#getOne', () => {
          [5, 1, 2].forEach((depth, index) => {
            ['a', 'b', 'c', 'd', 'e'].forEach(f => {
              it(`${f}, depth = ${depth}`, () => {
                expect(this.lair.getOne(f, '1', {depth})).to.be.eql(this[`${f}${index + 1}`]);
              });
            });
          });
        });

        describe('#queryOne', () => {
          [5, 1, 2].forEach((depth, index) => {
            ['a', 'b', 'c', 'd', 'e'].forEach(f => {
              it(`${f}, depth = ${depth}`, () => {
                expect(this.lair.queryOne(f, r => r.id === '1', {depth})).to.be.eql(this[`${f}${index + 1}`]);
              });
            });
          });

        });

        describe('#getAll', () => {
          [5, 1, 2].forEach((depth, index) => {
            ['a', 'b', 'c', 'd', 'e'].forEach(f => {
              it(`${f}, depth = ${depth}`, () => {
                expect(this.lair.getAll(f, {depth})).to.be.eql([this[`${f}${index + 1}`]]);
              });
            });
          });
        });

        describe('#queryMany', () => {
          [5, 1, 2].forEach((depth, index) => {
            ['a', 'b', 'c', 'd', 'e'].forEach(f => {
              it(`${f}, depth = ${depth}`, () => {
                expect(this.lair.queryMany(f, r => r.id === '1', {depth})).to.be.eql([this[`${f}${index + 1}`]]);
              });
            });
          });
        });

        describe('#updateOne', () => {
          [5, 1, 2].forEach((depth, index) => {
            ['a', 'b', 'c', 'd', 'e'].forEach(f => {
              it(`${f}, depth = ${depth}`, () => {
                expect(this.lair.updateOne(f, '1', {}, {depth})).to.be.eql(this[`${f}${index + 1}`]);
              });
            });
          });
        });

      });

    });

  });

});
