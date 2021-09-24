import {expect} from 'chai';
import { CreateRecordExtraData, Factory, MetaAttrType } from '../lib/factory';
import {Lair} from '../lib/lair';
import {Record} from '../lib/record';
import sinon = require('sinon');

let sandbox;
let lair;
let consoleStub;

describe('Lair', () => {

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    lair = Lair.getLair();
  });
  afterEach(() => {
    Lair.cleanLair();
    sandbox.restore();
  });

  describe('#registerFactory', () => {
    it('should register factory', () => {
      lair.registerFactory(Factory.create({}), 'test');
      expect(() => lair.createRecords('test', 1)).to.not.throw();
    });

    it('should use name from factory', () => {
      lair.registerFactory(Factory.create({name: 'test'}));
      expect(() => lair.createRecords('test', 1)).to.not.throw();
    });

    it('should use name from factory (2)', () => {
      lair.registerFactory(Factory.create({name: 'test'}), 'another-name');
      expect(() => lair.createRecords('test', 1)).to.not.throw();
    });

    it('should throw an error if factory is already registered', () => {
      lair.registerFactory(Factory.create({}), 'test');
      expect(() => {
        lair.registerFactory(Factory.create({}), 'test');
      }).to.throw('Factory with name "test" is already registered');
    });

    it('should throw an error if factory name is not provided', () => {
      expect(() => {
        lair.registerFactory(Factory.create({}));
      }).to.throw('Factory name must be defined in the `Factory.create` or it must be provided here as a second argument');
    });
  });

  describe('#getDevInfo', () => {

    beforeEach(() => {
      const A = Factory.create({
        attrs: {
          a: 'a',
        },
      });
      const B = Factory.create({
        attrs: {
          b: 'b',
        },
      });
      lair.registerFactory(A, 'a');
      lair.registerFactory(B, 'b');
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
              value: 'a',
            },
          },
        },
        b: {
          count: 0,
          id: 1,
          meta: {
            b: {
              type: MetaAttrType.FIELD,
              value: 'b',
            },
          },
        },
      });
    });

  });

  describe('#createRecords', () => {

    describe('common', () => {
      it('should throw an error if factory is unknown', () => {
        expect(() => {
          lair.createRecords('unknownFactory', 1);
        }).to.throw('Factory with name "unknownFactory" is not registered');
      });

      it('should create number of records', () => {
        lair.registerFactory(Factory.create({}), 'test');
        lair.createRecords('test', 10);
        expect(lair.getAll('test')).to.have.property('length', 10);
      });
    });

    describe('#createRelated', () => {

      beforeEach(() => {
        lair.registerFactory(Factory.create({
          attrs: {
            bar: Factory.hasMany('bar', 'foo'),
            propFoo: 'static foo',
          },
          createRelated: {bar: 2},
        }), 'foo');
        lair.registerFactory(Factory.create({
          attrs: {
            foo: Factory.hasMany('foo', 'bar'),
            baz: Factory.hasMany('baz', 'bar'),
            propBar: 'static bar',
          },
          createRelated: {baz: 2},
        }), 'bar');
        lair.registerFactory(Factory.create({
          attrs: {
            bar: Factory.hasMany('bar', 'baz'),
            propBaz: 'static baz',
          },
        }), 'baz');
        lair.createRecords('foo', 2);
      });

      describe('should create related records', () => {

        describe('foo are created', () => {
          it('2 records', () => {
            expect(lair.getAll('foo')).to.have.property('length', 2);
          });

          it('each has 2 related `bar`', () => {
            expect(lair.getOne('foo', '1').bar.map(c => c.id)).to.be.eql(['1', '2']);
            expect(lair.getOne('foo', '2').bar.map(c => c.id)).to.be.eql(['3', '4']);
          });
        });

        describe('bar are created', () => {
          it('4 records', () => {
            expect(lair.getAll('bar')).to.have.property('length', 4);
          });
          it('each has 1 related `foo`', () => {
            expect(lair.getOne('bar', '1').foo.map(c => c.id)).to.be.eql(['1']);
            expect(lair.getOne('bar', '2').foo.map(c => c.id)).to.be.eql(['1']);
            expect(lair.getOne('bar', '3').foo.map(c => c.id)).to.be.eql(['2']);
            expect(lair.getOne('bar', '4').foo.map(c => c.id)).to.be.eql(['2']);
          });

          it('each has 2 related `baz`', () => {
            expect(lair.getOne('bar', '1').baz.map(c => c.id)).to.be.eql(['1', '2']);
            expect(lair.getOne('bar', '2').baz.map(c => c.id)).to.be.eql(['3', '4']);
            expect(lair.getOne('bar', '3').baz.map(c => c.id)).to.be.eql(['5', '6']);
            expect(lair.getOne('bar', '4').baz.map(c => c.id)).to.be.eql(['7', '8']);
          });
        });

        describe('baz are created', () => {
          it('8 records', () => {
            expect(lair.getAll('baz')).to.have.property('length', 8);
          });

          it('each has 1 related `bar`', () => {
            expect(lair.getOne('baz', '1').bar.map(c => c.id)).to.be.eql(['1']);
            expect(lair.getOne('baz', '2').bar.map(c => c.id)).to.be.eql(['1']);
            expect(lair.getOne('baz', '3').bar.map(c => c.id)).to.be.eql(['2']);
            expect(lair.getOne('baz', '4').bar.map(c => c.id)).to.be.eql(['2']);
            expect(lair.getOne('baz', '5').bar.map(c => c.id)).to.be.eql(['3']);
            expect(lair.getOne('baz', '6').bar.map(c => c.id)).to.be.eql(['3']);
            expect(lair.getOne('baz', '7').bar.map(c => c.id)).to.be.eql(['4']);
            expect(lair.getOne('baz', '8').bar.map(c => c.id)).to.be.eql(['4']);
          });
        });
      });

      describe('should create related without relation', () => {
        beforeEach(() => {
          lair.registerFactory(Factory.create({
            attrs: {
              b: Factory.hasMany('b', null),
            },
            createRelated: {b: 2},
          }), 'a');
          lair.registerFactory(Factory.create({}), 'b');
          lair.registerFactory(Factory.create({
            attrs: {
              b: Factory.hasOne('b', null),
            },
            createRelated: {b: 1},
          }), 'c');
          lair.createRecords('a', 1);
          lair.createRecords('c', 1);
        });

        describe('A created', () => {
          it('1 record', () => {
            expect(lair.getAll('a')).to.have.property('length', 1);
          });
          it('has 2 related B', () => {
            expect(lair.getOne('a', '1').b.map(c => c.id)).to.be.eql(['1', '2']);
          });
        });

        describe('B created', () => {
          it('4 records', () => {
            expect(lair.getAll('b')).to.have.property('length', 3);
          });
        });

        describe('C created', () => {
          it('1 record', () => {
            expect(lair.getAll('c')).to.have.property('length', 1);
          });
          it('has 1 related B', () => {
            expect(lair.getOne('c', '1').b.id).to.be.equal('3');
          });
        });
      });

      describe('should not create related', () => {

        beforeEach(() => {
          lair.registerFactory(Factory.create({
            attrs: {
              b: Factory.hasMany('b', null),
            },
          }), 'a');
          lair.registerFactory(Factory.create({}), 'b');
          lair.registerFactory(Factory.create({
            attrs: {
              b: Factory.hasOne('b', null),
            },
          }), 'c');
          lair.createRecords('a', 1);
          lair.createRecords('c', 1);
        });
        it('one A created', () => {
          expect(lair.getOne('a', '1')).to.be.eql({id: '1', b: []});
        });
        it('one C created', () => {
          expect(lair.getOne('c', '1')).to.be.eql({id: '1', b: null});
        });
        it('B not created', () => {
          expect(lair.getAll('b')).to.have.property('length', 0);
        });
      });

      describe('related factories chains', () => {

        describe('a-b-a', () => {
          beforeEach(() => {
            lair.registerFactory(Factory.create({
              attrs: {
                b: Factory.hasMany('b', 'a'),
              },
              createRelated: {b: 2},
            }), 'a');
            lair.registerFactory(Factory.create({
              attrs: {
                a: Factory.hasMany('a', 'b'),
              },
              createRelated: {a: 2},
            }), 'b');
          });

          it('should throw an error', () => {
            expect(() => lair.createRecords('a', 2)).to.throw(`Loop is detected in the "createRelated". Chain is ["a","b"]. You try to create records for "a" again.`);
          });
        });

        describe('a-b-c-a', () => {

          beforeEach(() => {
            lair.registerFactory(Factory.create({
              attrs: {
                b: Factory.hasMany('b', 'a'),
                c: Factory.hasMany('c', 'a'),
              },
              createRelated: {b: 2},
            }), 'a');
            lair.registerFactory(Factory.create({
              attrs: {
                a: Factory.hasMany('a', 'b'),
                c: Factory.hasMany('c', 'b'),
              },
              createRelated: {c: 2},
            }), 'b');
            lair.registerFactory(Factory.create({
              attrs: {
                a: Factory.hasMany('a', 'c'),
                b: Factory.hasMany('b', 'c'),
              },
              createRelated: {a: 2},
            }), 'c');
          });

          it('should throw an error', () => {
            expect(() => lair.createRecords('a', 2)).to.throw(`Loop is detected in the "createRelated". Chain is ["a","b","c"]. You try to create records for "a" again.`);
          });
        });

        describe('a-b-c-b', () => {

          beforeEach(() => {
            lair.registerFactory(Factory.create({
              attrs: {
                b: Factory.hasMany('b', 'a'),
                c: Factory.hasMany('c', 'a'),
              },
              createRelated: {b: 2},
            }), 'a');
            lair.registerFactory(Factory.create({
              attrs: {
                a: Factory.hasMany('a', 'b'),
                c: Factory.hasMany('c', 'b'),
              },
              createRelated: {c: 2},
            }), 'b');
            lair.registerFactory(Factory.create({
              attrs: {
                b: Factory.hasMany('b', 'c'),
              },
              createRelated: {b: 2},
            }), 'c');
          });

          it('should throw an error', () => {
            expect(() => lair.createRecords('a', 2)).to.throw(`Loop is detected in the "createRelated". Chain is ["a","b","c"]. You try to create records for "b" again.`);
          });
        });

      });

      describe('allow function for `createRelated` value', () => {
        it('record id is passed to the function [backward compatibility]', () => {
          lair.registerFactory(Factory.create({
            attrs: {
              b: Factory.hasOne('b', null),
            },
            createRelated: {
              b(id: string): number {
                expect(id).to.be.equal('1');
                return 1;
              },
            },
          }), 'a');
          lair.registerFactory(Factory.create({}), 'b');
          lair.createRecords('a', 1);
          expect(lair.getAll('b').map(c => c.id)).to.be.eql(['1']);
        });
        it('record is used as context for the function', () => {
          lair.registerFactory(Factory.create({
            attrs: {
              b: Factory.hasOne('b', null),
              c: 'some val',
            },
            createRelated: {
              b(): number {
                expect(this.id).to.be.equal('1');
                expect(this.c).to.be.equal('some val');
                return 1;
              },
            },
          }), 'a');
          lair.registerFactory(Factory.create({}), 'b');
          lair.createRecords('a', 1);
          expect(lair.getAll('b').map(r => r.id)).to.be.eql(['1']);
        });

        it('parent-related records are available in the context', () => {
          lair.registerFactory(Factory.create({
            attrs: {
              b: Factory.hasOne('b', 'a'),
              c: 'some val',
            },
            createRelated: {
              b(): number {
                expect(this.id).to.be.equal('1');
                expect(this.c).to.be.equal('some val');
                return 1;
              },
            },
          }), 'a');
          lair.registerFactory(Factory.create({
            attrs: {
              a: Factory.hasOne('a', 'b'),
              c: Factory.hasOne('c', null),
            },
            createRelated: {
              c(): number {
                expect(this.a.id).to.be.equal('1');
                return 1;
              },
            },
          }), 'b');
          lair.registerFactory(Factory.create({}), 'c');
          lair.createRecords('a', 1);
          expect(lair.getAll('b').map(r => r.id)).to.be.eql(['1']);
        });
      });

      describe('should create records with reflexive relations', () => {

        describe('one level depth', () => {
          describe('one-to-one', () => {
            beforeEach(() => {
              lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasOne('r', 'propC', {reflexive: true, depth: 2}),
                  propC: Factory.hasOne('r', 'propR'),
                },
                createRelated: {
                  propR: 1,
                },
              }), 'r');
              lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(lair.getAll('r')).to.be.eql([
                {id: '1', propC: null, propR: {id: '2', propC: '1', propR: null}},
                {id: '2', propC: {id: '1', propC: null, propR: '2'}, propR: null},
              ]);
            });
          });

          describe('one-to-many', () => {
            beforeEach(() => {
              lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasOne('r', 'propC', {reflexive: true, depth: 2}),
                  propC: Factory.hasMany('r', 'propR'),
                },
                createRelated: {propR: 1},
              }), 'r');
              lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(lair.getAll('r')).to.be.eql([
                {id: '1', propC: [], propR: {id: '2', propC: ['1'], propR: null}},
                {id: '2', propC: [{id: '1', propC: [], propR: '2'}], propR: null},
              ]);
            });
          });

          describe('many-to-one', () => {
            beforeEach(() => {
              lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasMany('r', 'propC', {reflexive: true, depth: 2}),
                  propC: Factory.hasOne('r', 'propR'),
                },
                createRelated: {propR: 2},
              }), 'r');
              lair.createRecords('r', 2);
            });
            describe('reflexive records are created', () => {
              it('6 records are created', () => {
                expect(lair.getAll('r')).to.have.property('length', 6);
              });
              it('r1', () => {
                expect(lair.getOne('r', '1')).to.be.eql({
                  id: '1',
                  propC: null,
                  propR: [
                    {
                      id: '2',
                      propC: '1',
                      propR: [],
                    },
                    {
                      id: '3',
                      propC: '1',
                      propR: [],
                    },
                  ],
                });
              });
              it('r2', () => {
                expect(lair.getOne('r', '2')).to.be.eql({
                  id: '2',
                  propC: {
                    id: '1',
                    propC: null,
                    propR: ['2', '3'],
                  },
                  propR: [],
                });
              });
              it('r3', () => {
                expect(lair.getOne('r', '3')).to.be.eql({
                  id: '3',
                  propC: {
                    id: '1',
                    propC: null,
                    propR: ['2', '3'],
                  },
                  propR: [],
                });
              });
              it('r4', () => {
                expect(lair.getOne('r', '4')).to.be.eql({
                  id: '4',
                  propC: null,
                  propR: [
                    {
                      id: '5',
                      propC: '4',
                      propR: [],
                    },
                    {
                      id: '6',
                      propC: '4',
                      propR: [],
                    },
                  ],
                });
              });
              it('r5', () => {
                expect(lair.getOne('r', '5')).to.be.eql({
                  id: '5',
                  propC: {
                    id: '4',
                    propC: null,
                    propR: ['5', '6'],
                  },
                  propR: [],
                });
              });
              it('r6', () => {
                expect(lair.getOne('r', '6')).to.be.eql({
                  id: '6',
                  propC: {
                    id: '4',
                    propC: null,
                    propR: ['5', '6'],
                  },
                  propR: [],
                });
              });
            });
          });

          describe('many-to-many', () => {
            beforeEach(() => {
              lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasMany('r', 'propC', {reflexive: true, depth: 2}),
                  propC: Factory.hasMany('r', 'propR'),
                },
                createRelated: {propR: 1},
              }), 'r');
              lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(lair.getAll('r')).to.be.eql([
                {id: '1', propC: [], propR: [{id: '2', propC: ['1'], propR: []}]},
                {id: '2', propC: [{id: '1', propC: [], propR: ['2']}], propR: []},
              ]);
            });
          });
        });

        describe('two levels depth', () => {
          describe('one-to-one', () => {
            beforeEach(() => {
              lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasOne('r', 'propC', {reflexive: true, depth: 3}),
                  propC: Factory.hasOne('r', 'propR'),
                },
                createRelated: {propR: 1},
              }), 'r');
              lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(lair.getAll('r')).to.be.eql([
                {id: '1', propC: null, propR: {id: '2', propC: '1', propR: {id: '3', propC: '2', propR: null}}},
                {id: '2', propC: {id: '1', propC: null, propR: '2'}, propR: {id: '3', propC: '2', propR: null}},
                {id: '3', propC: {id: '2', propR: '3', propC: {id: '1', propC: null, propR: '2'}}, propR: null},
              ]);
            });
          });

          describe('one-to-many', () => {
            beforeEach(() => {
              lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasOne('r', 'propC', {reflexive: true, depth: 3}),
                  propC: Factory.hasMany('r', 'propR'),
                },
                createRelated: {propR: 1},
              }), 'r');
              lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(lair.getAll('r')).to.be.eql([
                {id: '1', propC: [], propR: {id: '2', propC: ['1'], propR: {id: '3', propC: ['2'], propR: null}}},
                {id: '2', propC: [{id: '1', propC: [], propR: '2'}], propR: {id: '3', propC: ['2'], propR: null}},
                {id: '3', propC: [{id: '2', propR: '3', propC: [{id: '1', propC: [], propR: '2'}]}], propR: null},
              ]);
            });
          });

          describe('many-to-one', () => {
            beforeEach(() => {
              lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasMany('r', 'propC', {reflexive: true, depth: 3}),
                  propC: Factory.hasOne('r', 'propR'),
                },
                createRelated: {propR: 1},
              }), 'r');
              lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(lair.getAll('r')).to.be.eql([
                {id: '1', propC: null, propR: [{id: '2', propC: '1', propR: [{id: '3', propC: '2', propR: []}]}]},
                {id: '2', propC: {id: '1', propC: null, propR: ['2']}, propR: [{id: '3', propC: '2', propR: []}]},
                {id: '3', propC: {id: '2', propR: ['3'], propC: {id: '1', propC: null, propR: ['2']}}, propR: []},
              ]);
            });
          });

          describe('many-to-many', () => {
            beforeEach(() => {
              lair.registerFactory(Factory.create({
                attrs: {
                  propR: Factory.hasMany('r', 'propC', {reflexive: true, depth: 3}),
                  propC: Factory.hasMany('r', 'propR'),
                },
                createRelated: {propR: 1},
              }), 'r');
              lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(lair.getAll('r')).to.be.eql([
                {id: '1', propC: [], propR: [{id: '2', propC: ['1'], propR: [{id: '3', propC: ['2'], propR: []}]}]},
                {id: '2', propC: [{id: '1', propC: [], propR: ['2']}], propR: [{id: '3', propC: ['2'], propR: []}]},
                {id: '3', propC: [{id: '2', propR: ['3'], propC: [{id: '1', propC: [], propR: ['2']}]}], propR: []},
              ]);
            });
          });
        });
      });

      describe('should pass info about "createRelated" into child factory (`field` and `afterCreate`)', () => {

        it('related info is correct', () => {
          let parentInField = 1;
          let parentInAfterCreate = 1;
          lair.registerFactory(Factory.create({
            attrs: {
              children: Factory.hasMany('child', 'parent'),
              field(): void {
                expect(this.extraData).to.be.eql({relatedTo: {}});
              },
            },
            createRelated: {
              children: 3,
            },
            afterCreate(r: Record, extraData: CreateRecordExtraData): Record {
              expect(extraData).to.be.eql({relatedTo: {}});
              return r;
            },
          }), 'parent');
          lair.registerFactory(Factory.create({
            attrs: {
              parent: Factory.hasOne('parent', 'children'),
              field(): void {
                expect(this.extraData).to.be.eql({
                  relatedTo: {
                    factoryName: 'parent',
                    recordsCount: 3,
                    currentRecordNumber: parentInField++,
                  },
                });
              },
            },
            afterCreate(r: Record, extraData: CreateRecordExtraData): Record {
              expect(extraData).to.be.eql({relatedTo: {
                factoryName: 'parent',
                recordsCount: 3,
                currentRecordNumber: parentInAfterCreate++,
              }});
              return r;
            },
          }), 'child');
          lair.createRecords('parent', 1);
        });

      });

    });

    describe('#afterCreate', () => {

      describe('should allow update record fields', () => {
        let r;
        beforeEach(() => {
          lair.registerFactory(Factory.create({
            attrs: {
              a: '1',
              b: '2',
              c: '3',
            },
            afterCreate(record: Record): Record {
              record.a = 'a';
              record.b = 'b';
              record.c = 'c';
              return record;
            },
          }), 'a');
          lair.createRecords('a', 1);
          r = lair.getOne('a', '1');
        });
        it('fields are updated', () => {
          expect(r.a).to.be.equal('a');
          expect(r.b).to.be.equal('b');
          expect(r.c).to.be.equal('c');
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
            afterCreate(record: Record): Record {
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
            afterCreate(record: Record): Record {
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
            afterCreate(record: Record): Record {
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
          lair.registerFactory(A, 'a');
          lair.registerFactory(B, 'b');
          lair.registerFactory(C, 'c');
          lair.createRecords('a', 1);
        });
      });

      describe('should not receive ignored related data', () => {
        it('record does not have ignored related data', () => {
          const A = Factory.create({
            attrs: {
              a: 'a',
              propB: Factory.hasOne('b', 'propA'),
            },
            createRelated: {
              propB: 1,
            },
            afterCreateIgnoreRelated: ['b'],
            afterCreate(record: Record): Record {
              expect(record).to.be.eql({
                id: '1',
                a: 'a',
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
            afterCreateIgnoreRelated: ['c'],
            createRelated: {
              propC: 1,
            },
            afterCreate(record: Record): Record {
              expect(record).to.be.eql({
                id: '1',
                b: 'b',
                propA: {
                  id: '1',
                  a: 'a',
                  propB: '1',
                },
              });
              return record;
            },
          });
          const C = Factory.create({
            attrs: {
              c: 'c',
              propB: Factory.hasOne('b', 'propC'),
            },
            afterCreateIgnoreRelated: ['b'],
            afterCreate(record: Record): Record {
              expect(record).to.be.eql({
                id: '1',
                c: 'c',
              });
              return record;
            },
          });
          lair.registerFactory(A, 'a');
          lair.registerFactory(B, 'b');
          lair.registerFactory(C, 'c');
          lair.createRecords('a', 1);
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
          afterCreate(record: Record): Record {
            record.propC.id = '100500';
            delete record.propB;
            return record;
          },
        });
        beforeEach(() => {
          lair.registerFactory(A, 'a');
          lair.registerFactory(Factory.create({
            attrs: {
              b: 'b',
              propA: Factory.hasOne('a', 'propB'),
            },
          }), 'b');
          lair.registerFactory(Factory.create({
            attrs: {
              c: 'c',
              propA: Factory.hasMany('a', 'propC'),
            },
          }), 'c');
          lair.createRecords('a', 1);
        });
        it('a1 relationships are not changed', () => {
          expect(lair.getOne('a', '1')).to.be.eql({
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
          expect(lair.getOne('b', '1')).to.be.eql({
            id: '1',
            b: 'b',
            propA: {id: '1', a: 'a', propB: ['1', '2'], propC: {id: '1', propA: ['1'], c: 'c'}},
          });
        });
        it('b2 relationships are not changed', () => {
          expect(lair.getOne('b', '2')).to.be.eql({
            id: '2',
            b: 'b',
            propA: {id: '1', a: 'a', propB: ['1', '2'], propC: {id: '1', propA: ['1'], c: 'c'}},
          });
        });
        it('c1 relationships are not changed', () => {
          expect(lair.getOne('c', '1')).to.be.eql({
            id: '1', c: 'c', propA: [
              {
                id: '1', a: 'a', propB: [
                {id: '1', propA: '1', b: 'b'},
                {id: '2', propA: '1', b: 'b'},
              ], propC: '1',
              },
            ],
          });
        });
      });

    });

    describe('create sequences', () => {
      it('getNextValue should receive a list with previous values', () => {
        const expected = [
          ['initial'],
          ['initial', 2],
          ['initial', 2, 3],
        ];
        let i = 0;
        const A = Factory.create({
          attrs: {
            propA: Factory.sequenceItem<number|string>('initial', prevValues => {
              expect(prevValues).to.be.eql(expected[i++]);
              return prevValues.length + 1;
            }),
          },
        });
        lair.registerFactory(A, 'a');
        lair.createRecords('a', 4);
        expect(lair.getOne('a', '4').propA).to.be.equal(4);
      });

      it('getNextValue should receive only part of the previous values', () => {
        const expected = [
          [1],
          [1, 1],
          [1, 2],
        ];
        let i = 0;
        const A = Factory.create({
          attrs: {
            propA: Factory.sequenceItem<number>(1, v => {
              expect(v).to.be.eql(expected[i++]);
              return v.reduce((a, b) => a + b, 0);
            }, {lastValuesCount: 2}),
          },
        });
        lair.registerFactory(A, 'a');
        lair.createRecords('a', 4);
        expect(lair.getOne('a', '4').propA).to.be.equal(3);
      });

      it('sequence items should not be recalculated', () => {
        const A = Factory.create({
          attrs: {
            propA: Factory.sequenceItem(new Date().getTime(), prevItems => prevItems[prevItems.length - 1] - Math.round(Math.random() * 100)),
            propB(): number {
              return this.propA;
            },
            propC(): number {
              return this.propA;
            },
          },
        });
        lair.registerFactory(A, 'a');
        lair.createRecords('a', 1);
        const r = lair.getOne('a', '1');
        expect(r.propB).to.be.equal(r.propC);
      });

      it('getNextValue should not be able to change list of previous values', () => {
        const expected = [
          [1],
          [1, 1],
          [1, 1, 1],
          [1, 1, 1, 1],
        ];
        let i = 0;
        const A = Factory.create({
          attrs: {
            propA: Factory.sequenceItem(1, prevValues => {
              expect(prevValues).to.be.eql(expected[i++]);
              const ret = prevValues.pop();
              prevValues = null;
              return ret;
            }),
          },
        });
        lair.registerFactory(A, 'a');
        lair.createRecords('a', 4);
        expect(lair.getOne('a', 4).propA).to.be.equal(1);
      });

      it('getNextValue (not arrow) should be called in the new record context', () => {
        const expected = ['2', '3', '4'];
        let i = 0;
        const A = Factory.create({
          attrs: {
            propA: Factory.sequenceItem<string|number>(1, function(prevValues: string[]): string {
              expect(this.id).to.be.equal(expected[i++]);
              return prevValues.pop();
            }),
          },
        });
        lair.registerFactory(A, 'a');
        lair.createRecords('a', 4);
        expect(lair.getOne('a', 4).propA).to.be.equal(1);
      });
    });

  });

  describe('#loadRecords', () => {

    let clusters;
    let cl;
    let hs;

    beforeEach(() => {
      clusters = [
        {
          id: 'c1',
          name: 'cluster1',
          hosts: [
            {id: 'h1', name: 'host1'},
            {id: 'h2', name: 'host2'},
          ],
        },
        {
          id: 'c2',
          name: 'cluster2',
          hosts: [
            {id: 'h3', name: 'host3'},
            {id: 'h4', name: 'host4'},
          ],
        },
      ];
      cl = {
        attrs: {
          name: Factory.field({value: ''}),
          hosts: Factory.hasMany('host', 'cluster'),
        },
      };
      hs = {
        attrs: {
          name: Factory.field({value: ''}),
          cluster: Factory.hasOne('cluster', 'hosts'),
        },
      };
    });

    describe('Invalid factories', () => {
      beforeEach(() => {
        lair.registerFactory(Factory.create(cl), 'cluster');
        lair.registerFactory(Factory.create(hs), 'host');
      });
      it('should throw an error if `allowCustomIds`-attr is not set', () => {
        expect(() => lair.loadRecords('cluster', [])).to.throw('"cluster" must have "allowCustomIds" set to "true"');
      });
    });

    describe('Valid factories', () => {

      beforeEach(() => {
        cl.allowCustomIds = true;
        hs.allowCustomIds = true;
        lair.registerFactory(Factory.create(cl), 'cluster');
        lair.registerFactory(Factory.create(hs), 'host');
      });

      describe('should load records to the db', () => {
        beforeEach(() => {
          lair.loadRecords('host', clusters[0].hosts);
          lair.loadRecords('host', clusters[1].hosts);
          const clustersData = clusters.map(c => {
            return {
              id: c.id,
              name: c.name,
              hosts: c.hosts.map(h => h.id),
            };
          });
          lair.loadRecords('cluster', clustersData);
        });
        it('2 clusters are loaded', () => {
          const expected = clusters.map(c => {
            c.hosts = c.hosts.map(h => {
              h.cluster = c.id;
              return h;
            });
            return c;
          });
          expect(lair.getAll('cluster')).to.be.eql(expected);
        });
        it('4 hosts are loaded', () => {
          const mapHost = (cId, hId) => ({...clusters[cId].hosts[hId], cluster: {...clusters[cId], hosts: clusters[cId].hosts.map(h => h.id)}});
          const expected = [
            mapHost(0, 0),
            mapHost(0, 1),
            mapHost(1, 0),
            mapHost(1, 1),
          ];
          expect(lair.getAll('host')).to.be.eql(expected);
        });
      });

      describe('should ignore not attrs', () => {
        beforeEach(() => {
          const host = clusters[0].hosts[0];
          host.extraField = 'azaza';
          lair.loadRecords('host', [host]);
        });
        it('`extraField` is not mapped', () => {
          expect(lair.getOne('host', 'h1')).to.not.have.property('extraField');
        });
      });

      describe('relations errors', () => {
        describe('related record not exist [one-to-many]', () => {
          it('error thrown', () => {
            expect(() => {
              lair.loadRecords('host', [{...clusters[0].hosts[0], cluster: 'c1'}]);
            }).to.throw('Record of "cluster" with id "c1" doesn\'t exist. Create it first [one-to-many relationship]');
          });
        });
        describe('related record not exist [many-to-one]', () => {
          it('error thrown', () => {
            expect(() => {
              lair.loadRecords('cluster', [{...clusters[0], hosts: ['h1']}]);
            }).to.throw('Record of "host" with id "h1" doesn\'t exist. Create it first [many-to-one relationship]');
          });
        });
      });

    });

  });

  describe('DB CRUD', () => {

    describe('common', () => {

      beforeEach(() => {
        lair.registerFactory(Factory.create({
          attrs: {
            foo(): string {
              return `foo ${this.id}`;
            },
          },
        }), 'foo');
        lair.registerFactory(Factory.create({
          attrs: {
            bar(): string {
              return `foo ${this.id}`;
            },
          },
        }), 'bar');
        lair.createRecords('foo', 5);
        lair.createRecords('bar', 5);
      });

      describe('#getAll', () => {
        it('should return array with all records of needed type', () => {
          expect(lair.getAll('foo')).to.have.property('length', 5);
        });

        it('should throw an error for unknown type', () => {
          expect(() => lair.getAll('fake')).to.throw('"fake"-type doesn\'t exist in the database');
        });
      });

      describe('#getOne', () => {
        it('should return record if it exists', () => {
          expect(lair.getOne('foo', '1')).to.have.property('foo', 'foo 1');
        });

        it('should return undefined if record with needed id doesn\'t exist', () => {
          expect(lair.getOne('foo', '100500')).to.be.null;
        });

        it('should throw an error for unknown type', () => {
          expect(() => lair.getOne('fake', '1')).to.throw('"fake"-type doesn\'t exist in the database');
        });
      });

      describe('#queryMany', () => {
        it('should return filtered records', () => {
          expect(lair.queryMany('foo', r => Number(r.id) > 3)).to.have.property('length', 2);
        });

        it('should throw an error for unknown type', () => {
          expect(() => lair.queryMany('fake', r => !!r)).to.throw('"fake"-type doesn\'t exist in the database');
        });
      });

      describe('#queryOne', () => {
        it('should return one record', () => {
          expect(lair.queryOne('foo', r => Number(r.id) > 3)).to.have.property('id', '4');
        });

        it('should throw an error for unknown type', () => {
          expect(() => lair.queryOne('fake', r => !!r)).to.throw('"fake"-type doesn\'t exist in the database');
        });
      });

      describe('#deleteOne', () => {
        it('should delete record with provided id (no relations)', () => {
          expect(lair.getOne('foo', '1')).to.have.property('id', '1');
          lair.deleteOne('foo', '1');
          expect(lair.getOne('foo', '1')).to.be.null;
        });

        it('should delete record with provided id (with two-ways relations)', () => {
          lair.registerFactory(Factory.create({
            attrs: {
              bar1: Factory.hasOne('bar1', 'foo1'),
            },
            createRelated: {
              bar1: 1,
            },
          }), 'foo1');
          lair.registerFactory(Factory.create({
            attrs: {
              foo1: Factory.hasOne('foo1', 'bar1'),
            },
          }), 'bar1');
          lair.createRecords('foo1', 1);
          expect(lair.getOne('foo1', '1')).to.have.property('id', '1');
          lair.deleteOne('foo1', '1');
          expect(lair.getOne('foo1', '1')).to.be.null;
        });

        it('should delete record with provided id (with one-way relations) [hasOne]', () => {
          lair.registerFactory(Factory.create({
            attrs: {
              bar1: Factory.hasOne('bar1', null),
            },
            createRelated: {
              bar1: 1,
            },
          }), 'foo1');
          lair.registerFactory(Factory.create({
            attrs: {
              foo1: Factory.hasOne('foo1', 'bar1'),
            },
          }), 'bar1');
          lair.createRecords('foo1', 1);
          expect(lair.getOne('foo1', '1')).to.have.property('id', '1');
          lair.deleteOne('foo1', '1');
          expect(lair.getOne('foo1', '1')).to.be.null;
        });

        it('should delete record with provided id (with one-way relations) [hasOne] [2]', () => {
          lair.registerFactory(Factory.create({
            attrs: {
              bar1: Factory.hasOne('bar1', 'foo1'),
            },
            createRelated: {
              bar1: 1,
            },
          }), 'foo1');
          lair.registerFactory(Factory.create({
            attrs: {
              foo1: Factory.hasOne('foo1', null),
            },
          }), 'bar1');
          lair.createRecords('foo1', 1);
          expect(lair.getOne('foo1', '1')).to.have.property('id', '1');
          lair.deleteOne('foo1', '1');
          expect(lair.getOne('foo1', '1')).to.be.null;
        });

        it('should delete record with provided id (with one-way relations) [hasMany]', () => {
          lair.registerFactory(Factory.create({
            attrs: {
              bar1: Factory.hasMany('bar1', null),
            },
            createRelated: {
              bar1: 1,
            },
          }), 'foo1');
          lair.registerFactory(Factory.create({
            attrs: {
              foo1: Factory.hasOne('foo1', 'bar1'),
            },
          }), 'bar1');
          lair.createRecords('foo1', 1);
          expect(lair.getOne('foo1', '1')).to.have.property('id', '1');
          lair.deleteOne('foo1', '1');
          expect(lair.getOne('foo1', '1')).to.be.null;
        });

        it('should delete record with provided id (with one-way relations) [hasMany] [2]', () => {
          lair.registerFactory(Factory.create({
            attrs: {
              bar1: Factory.hasMany('bar1', 'foo1'),
            },
            createRelated: {
              bar1: 1,
            },
          }), 'foo1');
          lair.registerFactory(Factory.create({
            attrs: {
              foo1: Factory.hasOne('foo1', null),
            },
          }), 'bar1');
          lair.createRecords('foo1', 1);
          expect(lair.getOne('foo1', '1')).to.have.property('id', '1');
          lair.deleteOne('foo1', '1');
          expect(lair.getOne('foo1', '1')).to.be.null;
        });

        it('should throw an error for unknown type', () => {
          expect(() => lair.deleteOne('fake', '1')).to.throw('"fake"-type doesn\'t exist in the database');
        });
      });

      describe('#createOne', () => {

        beforeEach(() => {
          consoleStub = sandbox.stub(console, 'warn');
        });

        it('should create record in the database', () => {
          lair.createOne('foo', {foo: 'unique foo'});
          expect(lair.getOne('foo', '6')).to.have.property('id', '6');
        });

        it('should return created record', () => {
          const record = lair.createOne('foo', {foo: 'super unique foo'});
          expect(record).to.have.property('id', '6');
          expect(record).to.have.property('foo', 'super unique foo');
        });

        it('should ignore properties not declared in factory.attrs', () => {
          const record = lair.createOne('foo', {fake: 'fake'});
          expect(record).to.not.have.property('fake');
        });

        it('should throw an error for unknown type', () => {
          expect(() => lair.createOne('fake', {})).to.throw('"fake"-type doesn\'t exist in the database');
        });

        it('should process not defined attributes if `handleNotAttrs`-option is set', () => {
          const record = lair.createOne('foo', {foo: 'foo', fake: 'fake'}, {handleNotAttrs: true});
          expect(record).to.be.eql({
            id: '6',
            foo: 'foo',
            fake: 'fake',
          });
        });

        it('should create record with default values', () => {
          lair.registerFactory(Factory.create({
            attrs: {
              a: Factory.field({
                value: 'a',
                defaultValue: 'b',
              }),
            },
          }), 'baz');
          expect(lair.createOne('baz', {})).to.have.property('a', 'b');
        });

        it('should create record with custom id if `allowCustomIds` is `true`', () => {
          lair.registerFactory(Factory.create({attrs: {}, allowCustomIds: true}), 'baz');
          expect(lair.createOne('baz', {id: 'custom_id'})).to.have.property('id', 'custom_id');
        });

        it('should throw an error if value for field is not exist in the `allowedValues`', () => {
          lair.registerFactory(Factory.create({
            attrs: {
              a: Factory.field({
                value: 1,
                allowedValues: [1, 2, 3],
              }),
            },
          }), 'baz');
          expect(() => lair.createOne('baz', {a: 4})).to.throw(`"a" must be one of the "1,2,3". You passed "4"`);
        });

        it('should warn user if preferredType for field mismatch provided value', () => {
          lair.registerFactory(Factory.create({
            attrs: {
              a: Factory.field({
                value: 1,
                preferredType: 'number',
              }),
            },
          }), 'baz');
          lair.createOne('baz', {a: '2'});
          sinon.assert.calledWith(consoleStub, '"a" expected to be "number". You passed "string"');
        });
      });

      describe('#updateOne', () => {

        beforeEach(() => {
          consoleStub = sandbox.stub(console, 'warn');
        });

        it('should update record in the database', () => {
          lair.updateOne('foo', '1', {foo: 'updated foo'});
          expect(lair.getOne('foo', '1')).to.have.property('foo', 'updated foo');
        });

        it('should return updated record', () => {
          const record = lair.updateOne('foo', '1', {foo: 'updated foo'});
          expect(record).to.have.property('id', '1');
          expect(record).to.have.property('foo', 'updated foo');
        });

        it('should ignore properties not declared in factory.attrs', () => {
          const record = lair.updateOne('foo', '1', {fake: 'fake'});
          expect(record).to.not.have.property('fake');
        });

        it('should throw an error for unknown type', () => {
          expect(() => lair.updateOne('fake', '1', {})).to.throw('"fake"-type doesn\'t exist in the database');
        });

        it('should ignore `id` updating', () => {
          const record = lair.updateOne('foo', '1', {foo: 'updated foo', id: '6'});
          expect(record.id).to.be.equal('1');
          expect(lair.getAll('foo')).to.have.property('length', 5);
        });

        it('should process not defined attributes if `handleNotAttrs`-option is set', () => {
          lair.updateOne('foo', '1', {foo: 'foo', fake: 'fake'}, {handleNotAttrs: true});
          expect(lair.getOne('foo', '1')).to.be.eql({
            id: '1',
            foo: 'foo',
            fake: 'fake',
          });
        });
        it('should not process `id`  if `handleNotAttrs`-option is set', () => {
          expect(lair.updateOne('foo', '1', {id: 'new_id'}, {handleNotAttrs: true})).to.have.property('id', '1');
        });

        it('should throw an error if value for field is not exist in the `allowedValues`', () => {
          lair.registerFactory(Factory.create({
            attrs: {
              a: Factory.field({
                value: 1,
                allowedValues: [1, 2, 3],
              }),
            },
          }), 'baz');
          lair.createRecords('baz', 1);
          expect(() => lair.updateOne('baz', '1', {a: 4})).to.throw(`"a" must be one of the "1,2,3". You passed "4"`);
        });

        it('should warn user if preferredType for field mismatch provided value', () => {
          lair.registerFactory(Factory.create({
            attrs: {
              a: Factory.field({
                value: 1,
                preferredType: 'number',
              }),
            },
          }), 'baz');
          lair.createRecords('baz', 1);
          lair.updateOne('baz', '1', {a: '2'});
          sinon.assert.calledWith(consoleStub, '"a" expected to be "number". You passed "string"');
        });
      });

      describe('RU methods should return copies of records from the db', () => {
        let r;
        beforeEach(() => {
          lair.registerFactory(Factory.create({
            attrs: {
              propB: 'some',
            },
          }), 'a');
          lair.createRecords('a', 1);
          r = lair.getOne('a', '1');
        });
        it('#getOne', () => {
          expect(r).to.be.eql({id: '1', propB: 'some'});
          delete r.id;
          expect(lair.getOne('a', '1')).to.be.eql({id: '1', propB: 'some'});
        });

        it('#queryOne', () => {
          expect(r).to.be.eql({id: '1', propB: 'some'});
          delete r.id;
          expect(lair.queryOne('a', record => record.id === '1')).to.be.eql({id: '1', propB: 'some'});
        });

        it('#getAll', () => {
          expect(r).to.be.eql({id: '1', propB: 'some'});
          delete r.id;
          expect(lair.getAll('a')).to.be.eql([{id: '1', propB: 'some'}]);
        });

        it('#queryMany', () => {
          expect(r).to.be.eql({id: '1', propB: 'some'});
          delete r.id;
          expect(lair.queryMany('a', record => record.id === '1')).to.be.eql([{id: '1', propB: 'some'}]);
        });

        it('#updateOne', () => {
          expect(r).to.be.eql({id: '1', propB: 'some'});
          delete r.id;
          expect(lair.updateOne('a', '1', {propB: 'another'})).to.be.eql({id: '1', propB: 'another'});
        });
      });

    });

    describe('with related records', () => {
      let r;
      let originA1;
      describe('RU methods should return copies of records from the db', () => {

        beforeEach(() => {
          lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasOne('b', 'propA'),
            },
            createRelated: {
              propB: 1,
            },
          }), 'a');
          lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasOne('a', 'propB'),
            },
          }), 'b');
          lair.createRecords('a', 1);
          r = lair.getOne('a', '1');
          originA1 = {id: '1', propB: {id: '1', propA: '1'}};
        });
        it('#getOne', () => {
          expect(r).to.be.eql(originA1);
          delete r.propB.id;
          expect(lair.getOne('a', '1')).to.be.eql(originA1);
        });

        it('#queryOne', () => {
          expect(r).to.be.eql(originA1);
          delete r.propB.id;
          expect(lair.queryOne('a', record => record.id === '1')).to.be.eql(originA1);
        });

        it('#getAll', () => {
          expect(r).to.be.eql(originA1);
          delete r.propB.id;
          expect(lair.getAll('a')).to.be.eql([originA1]);
        });

        it('#queryMany', () => {
          expect(r).to.be.eql(originA1);
          delete r.propB.id;
          expect(lair.queryMany('a', record => record.id === '1')).to.be.eql([originA1]);
        });

        it('#updateOne', () => {
          expect(r).to.be.eql(originA1);
          delete r.propB.id;
          expect(lair.updateOne('a', '1', {})).to.be.eql(originA1);
        });
      });

      describe('RU methods should allow to set depth of relationships to be included in their response', () => {

        let a1;
        let b1;
        let c1;
        let d1;
        let e1;
        let a2;
        let b2;
        let c2;
        let d2;
        let e2;
        let a3;
        let b3;
        let c3;
        let d3;
        let e3;
        let records;

        beforeEach(() => {
          a1 = {
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
          b1 = {
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
          c1 = {
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
          d1 = {
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
          e1 = {
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
          a2 = {
            id: '1',
            propB: ['1'],
          };
          b2 = {
            id: '1',
            propA: '1',
            propC: ['1'],
          };
          c2 = {
            id: '1',
            propB: '1',
            propD: ['1'],
          };
          d2 = {
            id: '1',
            propC: '1',
            propE: ['1'],
          };
          e2 = {
            id: '1',
            propD: '1',
          };
          a3 = {
            id: '1',
            propB: [
              {id: '1', propA: '1', propC: ['1']},
            ],
          };
          b3 = {
            id: '1',
            propA: {
              id: '1',
              propB: ['1'],
            },
            propC: [
              {id: '1', propB: '1', propD: ['1']},
            ],
          };
          c3 = {
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
          d3 = {
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
          e3 = {
            id: '1',
            propD: {
              id: '1',
              propE: ['1'],
              propC: '1',
            },
          };
          records = [a1, b1, c1, d1, e1, a2, b2, c2, d2, e2, a3, b3, c3, d3, e3];
          lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasMany('b', 'propA'),
            },
            createRelated: {
              propB: 1,
            },
          }), 'a');
          lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasOne('a', 'propB'),
              propC: Factory.hasMany('c', 'propB'),
            },
            createRelated: {
              propC: 1,
            },
          }), 'b');
          lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasOne('b', 'propC'),
              propD: Factory.hasMany('d', 'propC'),
            },
            createRelated: {
              propD: 1,
            },
          }), 'c');
          lair.registerFactory(Factory.create({
            attrs: {
              propC: Factory.hasOne('c', 'propD'),
              propE: Factory.hasMany('e', 'propD'),
            },
            createRelated: {
              propE: 1,
            },
          }), 'd');
          lair.registerFactory(Factory.create({
            attrs: {
              propD: Factory.hasOne('d', 'propE'),
            },
          }), 'e');
          lair.createRecords('a', 1);
        });

        describe('#getOne', () => {
          [5, 1, 2].forEach((depth, index) => {
            ['a', 'b', 'c', 'd', 'e'].forEach((f, i) => {
              it(`${f}, depth = ${depth}`, () => {
                expect(lair.getOne(f, '1', {depth})).to.be.eql(records[index * 5 + i]);
              });
            });
          });
        });

        describe('#queryOne', () => {
          [5, 1, 2].forEach((depth, index) => {
            ['a', 'b', 'c', 'd', 'e'].forEach((f, i) => {
              it(`${f}, depth = ${depth}`, () => {
                expect(lair.queryOne(f, record => record.id === '1', {depth})).to.be.eql(records[index * 5 + i]);
              });
            });
          });

        });

        describe('#getAll', () => {
          [5, 1, 2].forEach((depth, index) => {
            ['a', 'b', 'c', 'd', 'e'].forEach((f, i) => {
              it(`${f}, depth = ${depth}`, () => {
                expect(lair.getAll(f, {depth})).to.be.eql([records[index * 5 + i]]);
              });
            });
          });
        });

        describe('#queryMany', () => {
          [5, 1, 2].forEach((depth, index) => {
            ['a', 'b', 'c', 'd', 'e'].forEach((f, i) => {
              it(`${f}, depth = ${depth}`, () => {
                expect(lair.queryMany(f, record => record.id === '1', {depth})).to.be.eql([records[index * 5 + i]]);
              });
            });
          });
        });

        describe('#updateOne', () => {
          [5, 1, 2].forEach((depth, index) => {
            ['a', 'b', 'c', 'd', 'e'].forEach((f, i) => {
              it(`${f}, depth = ${depth}`, () => {
                expect(lair.updateOne(f, '1', {}, {depth})).to.be.eql(records[index * 5 + i]);
              });
            });
          });
        });

      });

      describe('RU methods should allow to ignore some related data', () => {
        beforeEach(() => {
          lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasMany('b', 'propA'),
            },
            createRelated: {
              propB: 1,
            },
          }), 'a');
          lair.registerFactory(Factory.create({
            attrs: {
              propA: Factory.hasOne('a', 'propB'),
              propC: Factory.hasMany('c', 'propB'),
            },
            createRelated: {
              propC: 1,
            },
          }), 'b');
          lair.registerFactory(Factory.create({
            attrs: {
              propB: Factory.hasOne('b', 'propC'),
            },
          }), 'c');
          lair.createRecords('a', 1);
        });

        describe('#getOne', () => {
          it('throw an error if ignored factory does not exist', () => {
            expect(() => lair.getOne('a', '1', {ignoreRelated: ['fake']})).to.throw(`"ignoreRelated" contains type "fake" which doesn't exist in the database`);
          });

          it('get `a` and ignore related `b`', () => {
            expect(lair.getOne('a', '1', {ignoreRelated: ['b']})).to.be.eql({id: '1'});
          });

          it('get `b` and ignore related `a`', () => {
            expect(lair.getOne('b', '1', {ignoreRelated: ['a']})).to.be.eql({id: '1', propC: [{id: '1', propB: '1'}]});
          });

          it('get `c` and ignore related `b`', () => {
            expect(lair.getOne('c', '1', {ignoreRelated: ['b']})).to.be.eql({id: '1'});
          });
        });

        describe('#getAll', () => {
          it('throw an error if ignored factory does not exist', () => {
            expect(() => lair.getAll('a', {ignoreRelated: ['fake']})).to.throw(`"ignoreRelated" contains type "fake" which doesn't exist in the database`);
          });

          it('get `a` and ignore related `b`', () => {
            expect(lair.getAll('a', {ignoreRelated: ['b']})).to.be.eql([{id: '1'}]);
          });

          it('get `b` and ignore related `a`', () => {
            expect(lair.getAll('b', {ignoreRelated: ['a']})).to.be.eql([{id: '1', propC: [{id: '1', propB: '1'}]}]);
          });

          it('get `c` and ignore related `b`', () => {
            expect(lair.getAll('c', {ignoreRelated: ['b']})).to.be.eql([{id: '1'}]);
          });
        });

        describe('#queryOne', () => {
          it('throw an error if ignored factory does not exist', () => {
            expect(() => lair.queryOne('a', record => record.id === '1', {ignoreRelated: ['fake']})).to.throw(`"ignoreRelated" contains type "fake" which doesn't exist in the database`);
          });

          it('get `a` and ignore related `b`', () => {
            expect(lair.queryOne('a', record => record.id === '1', {ignoreRelated: ['b']})).to.be.eql({id: '1'});
          });

          it('get `b` and ignore related `a`', () => {
            expect(lair.queryOne('b', record => record.id === '1', {ignoreRelated: ['a']})).to.be.eql({id: '1', propC: [{id: '1', propB: '1'}]});
          });

          it('get `c` and ignore related `b`', () => {
            expect(lair.queryOne('c', record => record.id === '1', {ignoreRelated: ['b']})).to.be.eql({id: '1'});
          });
        });

        describe('#queryMany', () => {
          it('throw an error if ignored factory does not exist', () => {
            expect(() => lair.queryMany('a', record => record.id === '1', {ignoreRelated: ['fake']})).to.throw(`"ignoreRelated" contains type "fake" which doesn't exist in the database`);
          });

          it('get `a` and ignore related `b`', () => {
            expect(lair.queryMany('a', record => record.id === '1', {ignoreRelated: ['b']})).to.be.eql([{id: '1'}]);
          });

          it('get `b` and ignore related `a`', () => {
            expect(lair.queryMany('b', record => record.id === '1', {ignoreRelated: ['a']})).to.be.eql([{id: '1', propC: [{id: '1', propB: '1'}]}]);
          });

          it('get `c` and ignore related `b`', () => {
            expect(lair.queryMany('c', record => record.id === '1', {ignoreRelated: ['b']})).to.be.eql([{id: '1'}]);
          });
        });

        describe('#updateOne', () => {
          it('throw an error if ignored factory does not exist', () => {
            expect(() => lair.updateOne('a', '1', {}, {ignoreRelated: ['fake']})).to.throw(`"ignoreRelated" contains type "fake" which doesn't exist in the database`);
          });

          it('get `a` and ignore related `b`', () => {
            expect(lair.updateOne('a', '1', {}, {ignoreRelated: ['b']})).to.be.eql({id: '1'});
          });

          it('get `b` and ignore related `a`', () => {
            expect(lair.updateOne('b', '1', {}, {ignoreRelated: ['a']})).to.be.eql({id: '1', propC: [{id: '1', propB: '1'}]});
          });

          it('get `c` and ignore related `b`', () => {
            expect(lair.updateOne('c', '1', {}, {ignoreRelated: ['b']})).to.be.eql({id: '1'});
          });
        });

        describe('#createOne', () => {
          it('throw an error if ignored factory does not exist', () => {
            expect(() => lair.createOne('a', {}, {ignoreRelated: ['fake']})).to.throw(`"ignoreRelated" contains type "fake" which doesn't exist in the database`);
          });

          it('get `a` and ignore related `b`', () => {
            expect(lair.createOne('a', {}, {ignoreRelated: ['b']})).to.be.eql({id: '2'});
          });

          it('get `b` and ignore related `a`', () => {
            expect(lair.createOne('b', {}, {ignoreRelated: ['a']})).to.be.eql({id: '2', propC: []});
          });

          it('get `c` and ignore related `b`', () => {
            expect(lair.createOne('c', {}, {ignoreRelated: ['b']})).to.be.eql({id: '2'});
          });
        });
      });

    });

  });

});
