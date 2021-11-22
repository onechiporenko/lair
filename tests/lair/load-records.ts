import { expect } from 'chai';
import { Factory, field, hasMany, hasOne } from '../../lib/factory';
import { Lair } from '../../lib/lair';

let lair;

class ClusterFactory extends Factory {
  static factoryName = 'cluster';
  @field() name = '';
  @hasMany('host', 'cluster') hosts;
}

class HostFactory extends Factory {
  static factoryName = 'host';
  @field() name = '';
  @hasOne('cluster', 'hosts') cluster;
}

describe('Lair', () => {
  beforeEach(() => {
    lair = Lair.getLair();
  });
  afterEach(() => {
    Lair.cleanLair();
  });

  describe('#loadRecords', () => {
    let clusters;

    beforeEach(() => {
      clusters = [
        {
          id: 'c1',
          name: 'cluster1',
          hosts: [
            { id: 'h1', name: 'host1' },
            { id: 'h2', name: 'host2' },
          ],
        },
        {
          id: 'c2',
          name: 'cluster2',
          hosts: [
            { id: 'h3', name: 'host3' },
            { id: 'h4', name: 'host4' },
          ],
        },
      ];
    });

    describe('Invalid factories', () => {
      beforeEach(() => {
        lair.registerFactory(new ClusterFactory());
        lair.registerFactory(new HostFactory());
      });
      it('should throw an error if `allowCustomIds`-attr is not set', () => {
        expect(() => lair.loadRecords('cluster', [])).to.throw(
          '"cluster" must have "allowCustomIds" set to "true"'
        );
      });
    });

    describe('Valid factories', () => {
      beforeEach(() => {
        const clusterFactory = new ClusterFactory();
        clusterFactory.allowCustomIds = true;
        const hostFactory = new HostFactory();
        hostFactory.allowCustomIds = true;
        lair.registerFactory(clusterFactory);
        lair.registerFactory(hostFactory);
      });

      describe('should load records to the db', () => {
        beforeEach(() => {
          lair.loadRecords('host', clusters[0].hosts);
          lair.loadRecords('host', clusters[1].hosts);
          const clustersData = clusters.map((c) => {
            return {
              id: c.id,
              name: c.name,
              hosts: c.hosts.map((h) => h.id),
            };
          });
          lair.loadRecords('cluster', clustersData);
        });
        it('2 clusters are loaded', () => {
          const expected = clusters.map((c) => {
            c.hosts = c.hosts.map((h) => {
              h.cluster = c.id;
              return h;
            });
            return c;
          });
          expect(lair.getAll('cluster')).to.be.eql(expected);
        });
        it('4 hosts are loaded', () => {
          const mapHost = (cId, hId) => ({
            ...clusters[cId].hosts[hId],
            cluster: {
              ...clusters[cId],
              hosts: clusters[cId].hosts.map((h) => h.id),
            },
          });
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
              lair.loadRecords('host', [
                { ...clusters[0].hosts[0], cluster: 'c1' },
              ]);
            }).to.throw(
              'Record of "cluster" with id "c1" doesn\'t exist. Create it first [one-to-many relationship]'
            );
          });
        });
        describe('related record not exist [many-to-one]', () => {
          it('error thrown', () => {
            expect(() => {
              lair.loadRecords('cluster', [{ ...clusters[0], hosts: ['h1'] }]);
            }).to.throw(
              'Record of "host" with id "h1" doesn\'t exist. Create it first [many-to-one relationship]'
            );
          });
        });
      });
    });
  });
});
