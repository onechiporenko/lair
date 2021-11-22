import { expect } from 'chai';
import {
  CreateRecordExtraData,
  Factory,
  field,
  hasMany,
  hasOne,
} from '../lib/factory';
import { Lair } from '../lib/lair';
import { LairRecord } from '../lib/record';

let lair;

describe('Lair', () => {
  beforeEach(() => {
    lair = Lair.getLair();
  });
  afterEach(() => {
    Lair.cleanLair();
  });

  describe('#createRecords', () => {
    describe('common', () => {
      it('should throw an error if factory is unknown', () => {
        expect(() => {
          lair.createRecords('unknownFactory', 1);
        }).to.throw('Factory with name "unknownFactory" is not registered');
      });

      it('should create number of records', () => {
        class FactoryToTestCreateRecords extends Factory {
          static factoryName = 'test';
        }
        lair.registerFactory(new FactoryToTestCreateRecords());
        lair.createRecords('test', 10);
        expect(lair.getAll('test')).to.have.property('length', 10);
      });
    });

    describe('#createRelated', () => {
      class FooFactoryToTestCreateRelated extends Factory {
        static factoryName = 'foo';
        @hasMany('bar', 'foo', {
          createRelated: 2,
        })
        bar;
        @field() propFoo = 'static foo';
      }
      class BarFactoryToTestCreateRelated extends Factory {
        static factoryName = 'bar';
        @hasMany('foo', 'bar') foo;
        @hasMany('baz', 'bar', {
          createRelated: 2,
        })
        baz;
        @field() propBar = 'static bar';
      }
      class BazFactoryToTestCreateRelated extends Factory {
        static factoryName = 'baz';
        @hasMany('bar', 'baz') bar;
        @field() propBaz = 'static baz';
      }
      beforeEach(() => {
        lair.registerFactory(new FooFactoryToTestCreateRelated());
        lair.registerFactory(new BarFactoryToTestCreateRelated());
        lair.registerFactory(new BazFactoryToTestCreateRelated());
        lair.createRecords('foo', 2);
      });

      describe('should create related records', () => {
        describe('foo are created', () => {
          it('2 records', () => {
            expect(lair.getAll('foo')).to.have.property('length', 2);
          });

          it('each has 2 related `bar`', () => {
            expect(lair.getOne('foo', '1').bar.map((c) => c.id)).to.be.eql([
              '1',
              '2',
            ]);
            expect(lair.getOne('foo', '2').bar.map((c) => c.id)).to.be.eql([
              '3',
              '4',
            ]);
          });
        });

        describe('bar are created', () => {
          it('4 records', () => {
            expect(lair.getAll('bar')).to.have.property('length', 4);
          });
          it('each has 1 related `foo`', () => {
            expect(lair.getOne('bar', '1').foo.map((c) => c.id)).to.be.eql([
              '1',
            ]);
            expect(lair.getOne('bar', '2').foo.map((c) => c.id)).to.be.eql([
              '1',
            ]);
            expect(lair.getOne('bar', '3').foo.map((c) => c.id)).to.be.eql([
              '2',
            ]);
            expect(lair.getOne('bar', '4').foo.map((c) => c.id)).to.be.eql([
              '2',
            ]);
          });

          it('each has 2 related `baz`', () => {
            expect(lair.getOne('bar', '1').baz.map((c) => c.id)).to.be.eql([
              '1',
              '2',
            ]);
            expect(lair.getOne('bar', '2').baz.map((c) => c.id)).to.be.eql([
              '3',
              '4',
            ]);
            expect(lair.getOne('bar', '3').baz.map((c) => c.id)).to.be.eql([
              '5',
              '6',
            ]);
            expect(lair.getOne('bar', '4').baz.map((c) => c.id)).to.be.eql([
              '7',
              '8',
            ]);
          });
        });

        describe('baz are created', () => {
          it('8 records', () => {
            expect(lair.getAll('baz')).to.have.property('length', 8);
          });

          it('each has 1 related `bar`', () => {
            expect(lair.getOne('baz', '1').bar.map((c) => c.id)).to.be.eql([
              '1',
            ]);
            expect(lair.getOne('baz', '2').bar.map((c) => c.id)).to.be.eql([
              '1',
            ]);
            expect(lair.getOne('baz', '3').bar.map((c) => c.id)).to.be.eql([
              '2',
            ]);
            expect(lair.getOne('baz', '4').bar.map((c) => c.id)).to.be.eql([
              '2',
            ]);
            expect(lair.getOne('baz', '5').bar.map((c) => c.id)).to.be.eql([
              '3',
            ]);
            expect(lair.getOne('baz', '6').bar.map((c) => c.id)).to.be.eql([
              '3',
            ]);
            expect(lair.getOne('baz', '7').bar.map((c) => c.id)).to.be.eql([
              '4',
            ]);
            expect(lair.getOne('baz', '8').bar.map((c) => c.id)).to.be.eql([
              '4',
            ]);
          });
        });
      });

      describe('should create related without relation', () => {
        class FactoryAToTestCreateRelatedWithoutRelation extends Factory {
          static factoryName = 'a';
          @hasMany('b', null, {
            createRelated: 2,
          })
          b;
        }
        class FactoryBToTestCreateRelatedWithoutRelation extends Factory {
          static factoryName = 'b';
        }
        class FactoryCToTestCreateRelatedWithoutRelation extends Factory {
          static factoryName = 'c';
          @hasOne('b', null, {
            createRelated: 1,
          })
          b;
        }
        beforeEach(() => {
          lair.registerFactory(
            new FactoryAToTestCreateRelatedWithoutRelation()
          );
          lair.registerFactory(
            new FactoryBToTestCreateRelatedWithoutRelation()
          );
          lair.registerFactory(
            new FactoryCToTestCreateRelatedWithoutRelation()
          );
          lair.createRecords('a', 1);
          lair.createRecords('c', 1);
        });

        describe('A created', () => {
          it('1 record', () => {
            expect(lair.getAll('a')).to.have.property('length', 1);
          });
          it('has 2 related B', () => {
            expect(lair.getOne('a', '1').b.map((c) => c.id)).to.be.eql([
              '1',
              '2',
            ]);
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
        class FactoryNotCreateRelatedA extends Factory {
          static factoryName = 'a';
          @hasMany('b', null) b;
        }
        class FactoryNotCreateRelatedB extends Factory {
          static factoryName = 'b';
        }
        class FactoryNotCreateRelatedC extends Factory {
          static factoryName = 'c';
          @hasOne('b', null) b;
        }
        beforeEach(() => {
          lair.registerFactory(new FactoryNotCreateRelatedA());
          lair.registerFactory(new FactoryNotCreateRelatedB());
          lair.registerFactory(new FactoryNotCreateRelatedC());
          lair.createRecords('a', 1);
          lair.createRecords('c', 1);
        });
        it('one A created', () => {
          expect(lair.getOne('a', '1')).to.be.eql({ id: '1', b: [] });
        });
        it('one C created', () => {
          expect(lair.getOne('c', '1')).to.be.eql({ id: '1', b: null });
        });
        it('B not created', () => {
          expect(lair.getAll('b')).to.have.property('length', 0);
        });
      });

      describe('related factories chains', () => {
        describe('a-b-a', () => {
          class FactoryAbaA extends Factory {
            static factoryName = 'a';
            @hasMany('b', 'a', {
              createRelated: 2,
            })
            b;
          }
          class FactoryAbaB extends Factory {
            static factoryName = 'b';
            @hasMany('a', 'b', {
              createRelated: 2,
            })
            a;
          }
          beforeEach(() => {
            lair.registerFactory(new FactoryAbaA());
            lair.registerFactory(new FactoryAbaB());
          });

          it('should throw an error', () => {
            expect(() => lair.createRecords('a', 2)).to.throw(
              `Loop is detected in the "createRelated". Chain is ["a","b"]. You try to create records for "a" again.`
            );
          });
        });

        describe('a-b-c-a', () => {
          class FactoryAbcaA extends Factory {
            static factoryName = 'a';
            @hasMany('b', 'a', {
              createRelated: 2,
            })
            b;
            @hasMany('c', 'a') c;
          }
          class FactoryAbcaB extends Factory {
            static factoryName = 'b';
            @hasMany('a', 'b') a;
            @hasMany('c', 'b', {
              createRelated: 2,
            })
            c;
          }
          class FactoryAbcaC extends Factory {
            static factoryName = 'c';
            @hasMany('a', 'c', {
              createRelated: 2,
            })
            a;
            @hasMany('b', 'c') b;
          }
          beforeEach(() => {
            lair.registerFactory(new FactoryAbcaA());
            lair.registerFactory(new FactoryAbcaB());
            lair.registerFactory(new FactoryAbcaC());
          });

          it('should throw an error', () => {
            expect(() => lair.createRecords('a', 2)).to.throw(
              `Loop is detected in the "createRelated". Chain is ["a","b","c"]. You try to create records for "a" again.`
            );
          });
        });

        describe('a-b-c-b', () => {
          class FactoryAbcbA extends Factory {
            static factoryName = 'a';
            @hasMany('b', 'a', {
              createRelated: 2,
            })
            b;
            @hasMany('c', 'a') c;
          }
          class FactoryAbcbB extends Factory {
            static factoryName = 'b';
            @hasMany('a', 'b') a;
            @hasMany('c', 'b', {
              createRelated: 2,
            })
            c;
          }
          class FactoryAbcbC extends Factory {
            static factoryName = 'c';
            @hasMany('b', 'c', {
              createRelated: 2,
            })
            b;
          }
          beforeEach(() => {
            lair.registerFactory(new FactoryAbcbA());
            lair.registerFactory(new FactoryAbcbB());
            lair.registerFactory(new FactoryAbcbC());
          });

          it('should throw an error', () => {
            expect(() => lair.createRecords('a', 2)).to.throw(
              `Loop is detected in the "createRelated". Chain is ["a","b","c"]. You try to create records for "b" again.`
            );
          });
        });
      });

      describe('allow function for `createRelated` value', () => {
        it('record id is passed to the function [backward compatibility]', () => {
          class FactoryBackwardCompatibilityParent extends Factory {
            static factoryName = 'a';
            @hasOne('b', null, {
              createRelated(id: string): number {
                expect(id).to.be.equal('1');
                return 1;
              },
            })
            b;
          }
          class FactoryBackwardCompatibilityChild extends Factory {
            static factoryName = 'b';
          }
          lair.registerFactory(new FactoryBackwardCompatibilityParent());
          lair.registerFactory(new FactoryBackwardCompatibilityChild());
          lair.createRecords('a', 1);
          expect(lair.getAll('b').map((c) => c.id)).to.be.eql(['1']);
        });

        it('record is used as context for the function', () => {
          class FactoryFunctionContextA extends Factory {
            static factoryName = 'a';
            @hasOne('b', null, {
              createRelated(): number {
                expect(this.id).to.be.equal('1');
                expect(this.c).to.be.equal('some val');
                return 1;
              },
            })
            b;
            @field() c = 'some val';
          }
          class FactoryFunctionContextB extends Factory {
            static factoryName = 'b';
          }
          lair.registerFactory(new FactoryFunctionContextA());
          lair.registerFactory(new FactoryFunctionContextB());
          lair.createRecords('a', 1);
          expect(lair.getAll('b').map((r) => r.id)).to.be.eql(['1']);
        });

        it('parent-related records are available in the context', () => {
          class ParentRelatedContextFactoryA extends Factory {
            static factoryName = 'a';
            @hasOne('b', 'a', {
              createRelated(): number {
                expect(this.id).to.be.equal('1');
                expect(this.c).to.be.equal('some val');
                return 1;
              },
            })
            b;
            @field() c = 'some val';
          }
          class ParentRelatedContextFactoryB extends Factory {
            static factoryName = 'b';
            @hasOne('a', 'b') a;
            @hasOne('c', null, {
              createRelated(): number {
                expect(this.a.id).to.be.equal('1');
                return 1;
              },
            })
            c;
          }
          class ParentRelatedContextFactoryC extends Factory {
            static factoryName = 'c';
          }
          lair.registerFactory(new ParentRelatedContextFactoryA());
          lair.registerFactory(new ParentRelatedContextFactoryB());
          lair.registerFactory(new ParentRelatedContextFactoryC());
          lair.createRecords('a', 1);
          expect(lair.getAll('b').map((r) => r.id)).to.be.eql(['1']);
        });
      });

      describe('should create records with reflexive relations', () => {
        describe('one level depth', () => {
          describe('one-to-one', () => {
            class Factory1LevelOneToOne extends Factory {
              static factoryName = 'r';
              @hasOne('r', 'propC', {
                reflexive: true,
                depth: 2,
                createRelated: 1,
              })
              propR;
              @hasOne('r', 'propR')
              propC;
            }
            beforeEach(() => {
              lair.registerFactory(new Factory1LevelOneToOne());
              lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(lair.getAll('r')).to.be.eql([
                {
                  id: '1',
                  propC: null,
                  propR: { id: '2', propC: '1', propR: null },
                },
                {
                  id: '2',
                  propC: { id: '1', propC: null, propR: '2' },
                  propR: null,
                },
              ]);
            });
          });

          describe('one-to-many', () => {
            class Factory1LevelOneToMany extends Factory {
              static factoryName = 'r';
              @hasOne('r', 'propC', {
                reflexive: true,
                depth: 2,
                createRelated: 1,
              })
              propR;
              @hasMany('r', 'propR')
              propC;
            }
            beforeEach(() => {
              lair.registerFactory(new Factory1LevelOneToMany());
              lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(lair.getAll('r')).to.be.eql([
                {
                  id: '1',
                  propC: [],
                  propR: { id: '2', propC: ['1'], propR: null },
                },
                {
                  id: '2',
                  propC: [{ id: '1', propC: [], propR: '2' }],
                  propR: null,
                },
              ]);
            });
          });

          describe('many-to-one', () => {
            class Factory1LevelManyToOne extends Factory {
              static factoryName = 'r';
              @hasMany('r', 'propC', {
                reflexive: true,
                depth: 2,
                createRelated: 2,
              })
              propR;
              @hasOne('r', 'propR')
              propC;
            }
            beforeEach(() => {
              lair.registerFactory(new Factory1LevelManyToOne());
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
            class Factory1LevelManyToMany extends Factory {
              static factoryName = 'r';
              @hasMany('r', 'propC', {
                reflexive: true,
                depth: 2,
                createRelated: 1,
              })
              propR;
              @hasMany('r', 'propR')
              propC;
            }
            beforeEach(() => {
              lair.registerFactory(new Factory1LevelManyToMany());
              lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(lair.getAll('r')).to.be.eql([
                {
                  id: '1',
                  propC: [],
                  propR: [{ id: '2', propC: ['1'], propR: [] }],
                },
                {
                  id: '2',
                  propC: [{ id: '1', propC: [], propR: ['2'] }],
                  propR: [],
                },
              ]);
            });
          });
        });

        describe('two levels depth', () => {
          describe('one-to-one', () => {
            class Factory2LevelsOneToOne extends Factory {
              static factoryName = 'r';
              @hasOne('r', 'propC', {
                reflexive: true,
                depth: 3,
                createRelated: 1,
              })
              propR;
              @hasOne('r', 'propR')
              propC;
            }
            beforeEach(() => {
              lair.registerFactory(new Factory2LevelsOneToOne());
              lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(lair.getAll('r')).to.be.eql([
                {
                  id: '1',
                  propC: null,
                  propR: {
                    id: '2',
                    propC: '1',
                    propR: { id: '3', propC: '2', propR: null },
                  },
                },
                {
                  id: '2',
                  propC: { id: '1', propC: null, propR: '2' },
                  propR: { id: '3', propC: '2', propR: null },
                },
                {
                  id: '3',
                  propC: {
                    id: '2',
                    propR: '3',
                    propC: { id: '1', propC: null, propR: '2' },
                  },
                  propR: null,
                },
              ]);
            });
          });

          describe('one-to-many', () => {
            class Factory2LevelsOneToMany extends Factory {
              static factoryName = 'r';
              @hasOne('r', 'propC', {
                reflexive: true,
                depth: 3,
                createRelated: 1,
              })
              propR;
              @hasMany('r', 'propR')
              propC;
            }
            beforeEach(() => {
              lair.registerFactory(new Factory2LevelsOneToMany());
              lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(lair.getAll('r')).to.be.eql([
                {
                  id: '1',
                  propC: [],
                  propR: {
                    id: '2',
                    propC: ['1'],
                    propR: { id: '3', propC: ['2'], propR: null },
                  },
                },
                {
                  id: '2',
                  propC: [{ id: '1', propC: [], propR: '2' }],
                  propR: { id: '3', propC: ['2'], propR: null },
                },
                {
                  id: '3',
                  propC: [
                    {
                      id: '2',
                      propR: '3',
                      propC: [{ id: '1', propC: [], propR: '2' }],
                    },
                  ],
                  propR: null,
                },
              ]);
            });
          });

          describe('many-to-one', () => {
            class Factory2LevelsManyToOne extends Factory {
              static factoryName = 'r';
              @hasMany('r', 'propC', {
                reflexive: true,
                depth: 3,
                createRelated: 1,
              })
              propR;
              @hasOne('r', 'propR')
              propC;
            }
            beforeEach(() => {
              lair.registerFactory(new Factory2LevelsManyToOne());
              lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(lair.getAll('r')).to.be.eql([
                {
                  id: '1',
                  propC: null,
                  propR: [
                    {
                      id: '2',
                      propC: '1',
                      propR: [{ id: '3', propC: '2', propR: [] }],
                    },
                  ],
                },
                {
                  id: '2',
                  propC: { id: '1', propC: null, propR: ['2'] },
                  propR: [{ id: '3', propC: '2', propR: [] }],
                },
                {
                  id: '3',
                  propC: {
                    id: '2',
                    propR: ['3'],
                    propC: { id: '1', propC: null, propR: ['2'] },
                  },
                  propR: [],
                },
              ]);
            });
          });

          describe('many-to-many', () => {
            class Factory2LevelsManyToMany extends Factory {
              static factoryName = 'r';
              @hasMany('r', 'propC', {
                reflexive: true,
                depth: 3,
                createRelated: 1,
              })
              propR;
              @hasMany('r', 'propR')
              propC;
            }
            beforeEach(() => {
              lair.registerFactory(new Factory2LevelsManyToMany());
              lair.createRecords('r', 1);
            });
            it('reflexive records are created', () => {
              expect(lair.getAll('r')).to.be.eql([
                {
                  id: '1',
                  propC: [],
                  propR: [
                    {
                      id: '2',
                      propC: ['1'],
                      propR: [{ id: '3', propC: ['2'], propR: [] }],
                    },
                  ],
                },
                {
                  id: '2',
                  propC: [{ id: '1', propC: [], propR: ['2'] }],
                  propR: [{ id: '3', propC: ['2'], propR: [] }],
                },
                {
                  id: '3',
                  propC: [
                    {
                      id: '2',
                      propR: ['3'],
                      propC: [{ id: '1', propC: [], propR: ['2'] }],
                    },
                  ],
                  propR: [],
                },
              ]);
            });
          });
        });
      });

      describe('should pass info about "createRelated" into child factory (`afterCreate`)', () => {
        let parentInAfterCreate = 1;
        class FactoryForRelatedInfoParent extends Factory {
          static factoryName = 'parent';
          @hasMany('child', 'parent', {
            createRelated: 3,
          })
          children;
          afterCreate(
            r: LairRecord,
            extraData: CreateRecordExtraData
          ): LairRecord {
            expect(extraData).to.be.eql({ relatedTo: {} });
            return r;
          }
        }
        class FactoryForRelatedInfoChild extends Factory {
          static factoryName = 'child';
          @hasOne('parent', 'children') parent;
          afterCreate(
            r: LairRecord,
            extraData: CreateRecordExtraData
          ): LairRecord {
            expect(extraData).to.be.eql({
              relatedTo: {
                factoryName: 'parent',
                recordsCount: 3,
                currentRecordNumber: parentInAfterCreate++,
              },
            });
            return r;
          }
        }
        it('related info is correct', () => {
          lair.registerFactory(new FactoryForRelatedInfoParent());
          lair.registerFactory(new FactoryForRelatedInfoChild());
          lair.createRecords('parent', 1);
        });
      });
    });
  });
});
