import { expect } from 'chai';
import { Factory, hasMany, hasOne } from '../../../lib/factory';
import { Lair } from '../../../lib/lair';
import sinon = require('sinon');

let sandbox;
let lair;

describe('Lair', () => {
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    lair = Lair.getLair();
  });
  afterEach(() => {
    Lair.cleanLair();
    sandbox.restore();
  });

  describe('#createRecords', () => {
    describe('DB CRUD', () => {
      describe('with related records', () => {
        let r;
        let originA1;
        describe('RU methods should return copies of records from the db', () => {
          class FactoryWithRecordCopiesA extends Factory {
            static factoryName = 'a';
            @hasOne('b', 'propA', {
              createRelated: 1,
            })
            propB;
          }
          class FactoryWithRecordCopiesB extends Factory {
            static factoryName = 'b';
            @hasOne('a', 'propB') propA;
          }

          beforeEach(() => {
            lair.registerFactory(new FactoryWithRecordCopiesA());
            lair.registerFactory(new FactoryWithRecordCopiesB());
            lair.createRecords('a', 1);
            r = lair.getOne('a', '1');
            originA1 = { id: '1', propB: { id: '1', propA: '1' } };
          });
          it('#getOne', () => {
            expect(r).to.be.eql(originA1);
            delete r.propB.id;
            expect(lair.getOne('a', '1')).to.be.eql(originA1);
          });

          it('#queryOne', () => {
            expect(r).to.be.eql(originA1);
            delete r.propB.id;
            expect(lair.queryOne('a', (record) => record.id === '1')).to.be.eql(
              originA1
            );
          });

          it('#getAll', () => {
            expect(r).to.be.eql(originA1);
            delete r.propB.id;
            expect(lair.getAll('a')).to.be.eql([originA1]);
          });

          it('#queryMany', () => {
            expect(r).to.be.eql(originA1);
            delete r.propB.id;
            expect(
              lair.queryMany('a', (record) => record.id === '1')
            ).to.be.eql([originA1]);
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

          class FactoryDepthRelationsA extends Factory {
            static factoryName = 'a';
            @hasMany('b', 'propA', {
              createRelated: 1,
            })
            propB;
          }
          class FactoryDepthRelationsB extends Factory {
            static factoryName = 'b';
            @hasOne('a', 'propB') propA;
            @hasMany('c', 'propB', {
              createRelated: 1,
            })
            propC;
          }
          class FactoryDepthRelationsC extends Factory {
            static factoryName = 'c';
            @hasOne('b', 'propC') propB;
            @hasMany('d', 'propC', {
              createRelated: 1,
            })
            propD;
          }
          class FactoryDepthRelationsD extends Factory {
            static factoryName = 'd';
            @hasOne('c', 'propD') propC;
            @hasMany('e', 'propD', {
              createRelated: 1,
            })
            propE;
          }
          class FactoryDepthRelationsE extends Factory {
            static factoryName = 'e';
            @hasOne('d', 'propE') propD;
          }

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
              propB: [{ id: '1', propA: '1', propC: ['1'] }],
            };
            b3 = {
              id: '1',
              propA: {
                id: '1',
                propB: ['1'],
              },
              propC: [{ id: '1', propB: '1', propD: ['1'] }],
            };
            c3 = {
              id: '1',
              propB: {
                id: '1',
                propA: '1',
                propC: ['1'],
              },
              propD: [{ id: '1', propC: '1', propE: ['1'] }],
            };
            d3 = {
              id: '1',
              propC: {
                id: '1',
                propB: '1',
                propD: ['1'],
              },
              propE: [{ id: '1', propD: '1' }],
            };
            e3 = {
              id: '1',
              propD: {
                id: '1',
                propE: ['1'],
                propC: '1',
              },
            };
            records = [
              a1,
              b1,
              c1,
              d1,
              e1,
              a2,
              b2,
              c2,
              d2,
              e2,
              a3,
              b3,
              c3,
              d3,
              e3,
            ];
            lair.registerFactory(new FactoryDepthRelationsA());
            lair.registerFactory(new FactoryDepthRelationsB());
            lair.registerFactory(new FactoryDepthRelationsC());
            lair.registerFactory(new FactoryDepthRelationsD());
            lair.registerFactory(new FactoryDepthRelationsE());
            lair.createRecords('a', 1);
          });

          describe('#getOne', () => {
            [5, 1, 2].forEach((depth, index) => {
              ['a', 'b', 'c', 'd', 'e'].forEach((f, i) => {
                it(`${f}, depth = ${depth}`, () => {
                  expect(lair.getOne(f, '1', { depth })).to.be.eql(
                    records[index * 5 + i]
                  );
                });
              });
            });
          });

          describe('#queryOne', () => {
            [5, 1, 2].forEach((depth, index) => {
              ['a', 'b', 'c', 'd', 'e'].forEach((f, i) => {
                it(`${f}, depth = ${depth}`, () => {
                  expect(
                    lair.queryOne(f, (record) => record.id === '1', { depth })
                  ).to.be.eql(records[index * 5 + i]);
                });
              });
            });
          });

          describe('#getAll', () => {
            [5, 1, 2].forEach((depth, index) => {
              ['a', 'b', 'c', 'd', 'e'].forEach((f, i) => {
                it(`${f}, depth = ${depth}`, () => {
                  expect(lair.getAll(f, { depth })).to.be.eql([
                    records[index * 5 + i],
                  ]);
                });
              });
            });
          });

          describe('#queryMany', () => {
            [5, 1, 2].forEach((depth, index) => {
              ['a', 'b', 'c', 'd', 'e'].forEach((f, i) => {
                it(`${f}, depth = ${depth}`, () => {
                  expect(
                    lair.queryMany(f, (record) => record.id === '1', { depth })
                  ).to.be.eql([records[index * 5 + i]]);
                });
              });
            });
          });

          describe('#updateOne', () => {
            [5, 1, 2].forEach((depth, index) => {
              ['a', 'b', 'c', 'd', 'e'].forEach((f, i) => {
                it(`${f}, depth = ${depth}`, () => {
                  expect(lair.updateOne(f, '1', {}, { depth })).to.be.eql(
                    records[index * 5 + i]
                  );
                });
              });
            });
          });
        });

        describe('RU methods should allow to ignore some related data', () => {
          class FactoryIgnoreRelatedA extends Factory {
            static factoryName = 'a';
            @hasMany('b', 'propA', {
              createRelated: 1,
            })
            propB;
          }
          class FactoryIgnoreRelatedB extends Factory {
            static factoryName = 'b';
            @hasOne('a', 'propB') propA;
            @hasMany('c', 'propB', {
              createRelated: 1,
            })
            propC;
          }
          class FactoryIgnoreRelatedC extends Factory {
            static factoryName = 'c';
            @hasOne('b', 'propC') propB;
          }
          beforeEach(() => {
            lair.registerFactory(new FactoryIgnoreRelatedA());
            lair.registerFactory(new FactoryIgnoreRelatedB());
            lair.registerFactory(new FactoryIgnoreRelatedC());
            lair.createRecords('a', 1);
          });

          describe('#getOne', () => {
            it('throw an error if ignored factory does not exist', () => {
              expect(() =>
                lair.getOne('a', '1', { ignoreRelated: ['fake'] })
              ).to.throw(
                `"ignoreRelated" contains type "fake" which doesn't exist in the database`
              );
            });

            it('get `a` and ignore related `b`', () => {
              expect(lair.getOne('a', '1', { ignoreRelated: ['b'] })).to.be.eql(
                {
                  id: '1',
                }
              );
            });

            it('get `b` and ignore related `a`', () => {
              expect(lair.getOne('b', '1', { ignoreRelated: ['a'] })).to.be.eql(
                {
                  id: '1',
                  propC: [{ id: '1', propB: '1' }],
                }
              );
            });

            it('get `c` and ignore related `b`', () => {
              expect(lair.getOne('c', '1', { ignoreRelated: ['b'] })).to.be.eql(
                {
                  id: '1',
                }
              );
            });

            it('get `a` and ignore all related', () => {
              expect(lair.getOne('a', '1', { ignoreRelated: true })).to.be.eql({
                id: '1',
              });
            });

            it('get `a` and not ignore anything related', () => {
              expect(lair.getOne('a', '1', { ignoreRelated: false })).to.be.eql(
                {
                  id: '1',
                  propB: [
                    { id: '1', propA: '1', propC: [{ id: '1', propB: '1' }] },
                  ],
                }
              );
            });
          });

          describe('#getAll', () => {
            it('throw an error if ignored factory does not exist', () => {
              expect(() =>
                lair.getAll('a', { ignoreRelated: ['fake'] })
              ).to.throw(
                `"ignoreRelated" contains type "fake" which doesn't exist in the database`
              );
            });

            it('get `a` and ignore related `b`', () => {
              expect(lair.getAll('a', { ignoreRelated: ['b'] })).to.be.eql([
                { id: '1' },
              ]);
            });

            it('get `b` and ignore related `a`', () => {
              expect(lair.getAll('b', { ignoreRelated: ['a'] })).to.be.eql([
                { id: '1', propC: [{ id: '1', propB: '1' }] },
              ]);
            });

            it('get `c` and ignore related `b`', () => {
              expect(lair.getAll('c', { ignoreRelated: ['b'] })).to.be.eql([
                { id: '1' },
              ]);
            });

            it('get `a` and ignore all related', () => {
              expect(lair.getAll('a', { ignoreRelated: true })).to.be.eql([
                { id: '1' },
              ]);
            });

            it('get `a` and not ignore anything related', () => {
              expect(lair.getAll('a', { ignoreRelated: false })).to.be.eql([
                {
                  id: '1',
                  propB: [
                    { id: '1', propA: '1', propC: [{ id: '1', propB: '1' }] },
                  ],
                },
              ]);
            });
          });

          describe('#queryOne', () => {
            it('throw an error if ignored factory does not exist', () => {
              expect(() =>
                lair.queryOne('a', (record) => record.id === '1', {
                  ignoreRelated: ['fake'],
                })
              ).to.throw(
                `"ignoreRelated" contains type "fake" which doesn't exist in the database`
              );
            });

            it('get `a` and ignore related `b`', () => {
              expect(
                lair.queryOne('a', (record) => record.id === '1', {
                  ignoreRelated: ['b'],
                })
              ).to.be.eql({ id: '1' });
            });

            it('get `b` and ignore related `a`', () => {
              expect(
                lair.queryOne('b', (record) => record.id === '1', {
                  ignoreRelated: ['a'],
                })
              ).to.be.eql({ id: '1', propC: [{ id: '1', propB: '1' }] });
            });

            it('get `c` and ignore related `b`', () => {
              expect(
                lair.queryOne('c', (record) => record.id === '1', {
                  ignoreRelated: ['b'],
                })
              ).to.be.eql({ id: '1' });
            });

            it('get `a` and ignore all related', () => {
              expect(
                lair.queryOne('a', (record) => record.id === '1', {
                  ignoreRelated: true,
                })
              ).to.be.eql({ id: '1' });
            });

            it('get `a` and not ignore anything related', () => {
              expect(
                lair.queryOne('a', (record) => record.id === '1', {
                  ignoreRelated: false,
                })
              ).to.be.eql({
                id: '1',
                propB: [
                  { id: '1', propA: '1', propC: [{ id: '1', propB: '1' }] },
                ],
              });
            });
          });

          describe('#queryMany', () => {
            it('throw an error if ignored factory does not exist', () => {
              expect(() =>
                lair.queryMany('a', (record) => record.id === '1', {
                  ignoreRelated: ['fake'],
                })
              ).to.throw(
                `"ignoreRelated" contains type "fake" which doesn't exist in the database`
              );
            });

            it('get `a` and ignore related `b`', () => {
              expect(
                lair.queryMany('a', (record) => record.id === '1', {
                  ignoreRelated: ['b'],
                })
              ).to.be.eql([{ id: '1' }]);
            });

            it('get `b` and ignore related `a`', () => {
              expect(
                lair.queryMany('b', (record) => record.id === '1', {
                  ignoreRelated: ['a'],
                })
              ).to.be.eql([{ id: '1', propC: [{ id: '1', propB: '1' }] }]);
            });

            it('get `c` and ignore related `b`', () => {
              expect(
                lair.queryMany('c', (record) => record.id === '1', {
                  ignoreRelated: ['b'],
                })
              ).to.be.eql([{ id: '1' }]);
            });

            it('get `a` and ignore all related', () => {
              expect(
                lair.queryMany('a', (record) => record.id === '1', {
                  ignoreRelated: true,
                })
              ).to.be.eql([{ id: '1' }]);
            });

            it('get `a` and not ignore anything related', () => {
              expect(
                lair.queryMany('a', (record) => record.id === '1', {
                  ignoreRelated: false,
                })
              ).to.be.eql([
                {
                  id: '1',
                  propB: [
                    { id: '1', propA: '1', propC: [{ id: '1', propB: '1' }] },
                  ],
                },
              ]);
            });
          });

          describe('#updateOne', () => {
            it('throw an error if ignored factory does not exist', () => {
              expect(() =>
                lair.updateOne('a', '1', {}, { ignoreRelated: ['fake'] })
              ).to.throw(
                `"ignoreRelated" contains type "fake" which doesn't exist in the database`
              );
            });

            it('get `a` and ignore related `b`', () => {
              expect(
                lair.updateOne('a', '1', {}, { ignoreRelated: ['b'] })
              ).to.be.eql({ id: '1' });
            });

            it('get `b` and ignore related `a`', () => {
              expect(
                lair.updateOne('b', '1', {}, { ignoreRelated: ['a'] })
              ).to.be.eql({ id: '1', propC: [{ id: '1', propB: '1' }] });
            });

            it('get `c` and ignore related `b`', () => {
              expect(
                lair.updateOne('c', '1', {}, { ignoreRelated: ['b'] })
              ).to.be.eql({ id: '1' });
            });

            it('get `a` and ignore all related', () => {
              expect(
                lair.updateOne('a', '1', {}, { ignoreRelated: true })
              ).to.be.eql({ id: '1' });
            });

            it('get `a` and not ignore anything related', () => {
              expect(
                lair.updateOne('a', '1', {}, { ignoreRelated: false })
              ).to.be.eql({
                id: '1',
                propB: [
                  { id: '1', propA: '1', propC: [{ id: '1', propB: '1' }] },
                ],
              });
            });
          });

          describe('#createOne', () => {
            it('throw an error if ignored factory does not exist', () => {
              expect(() =>
                lair.createOne('a', {}, { ignoreRelated: ['fake'] })
              ).to.throw(
                `"ignoreRelated" contains type "fake" which doesn't exist in the database`
              );
            });

            it('get `a` and ignore related `b`', () => {
              expect(
                lair.createOne('a', {}, { ignoreRelated: ['b'] })
              ).to.be.eql({ id: '2' });
            });

            it('get `b` and ignore related `a`', () => {
              expect(
                lair.createOne('b', {}, { ignoreRelated: ['a'] })
              ).to.be.eql({ id: '2', propC: [] });
            });

            it('get `c` and ignore related `b`', () => {
              expect(
                lair.createOne('c', {}, { ignoreRelated: ['b'] })
              ).to.be.eql({ id: '2' });
            });

            it('get `a` and ignore all related', () => {
              expect(
                lair.createOne('a', {}, { ignoreRelated: true })
              ).to.be.eql({
                id: '2',
              });
            });

            it('get `a` and not ignore anything related', () => {
              expect(
                lair.createOne('a', {}, { ignoreRelated: false })
              ).to.be.eql({ id: '2', propB: [] });
            });
          });
        });
      });
    });
  });
});
