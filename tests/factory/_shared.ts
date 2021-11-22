import {
  field,
  Factory,
  hasOne,
  hasMany,
  sequenceItem,
} from '../../lib/factory';

export class CommonFactory extends Factory {
  static factoryName = 'f';
  @field()
  first = 'static';

  @field()
  get second(): string {
    return `dynamic ${this.id}`;
  }

  @field()
  get third(): string {
    return `third is ${this.second}`;
  }

  @field({
    defaultValue: 'default value for fourth',
  })
  fourth = 'fourth';

  @field()
  get fifth(): string {
    return `fifth ${this.id}`;
  }

  @field({
    allowedValues: [1, 2, 3],
    preferredType: 'number',
  })
  sixth = 1;

  @field()
  seventh = 1;

  @field()
  get rand(): number {
    return Math.random();
  }

  @field()
  get r1(): number {
    return this.rand as number;
  }

  @field()
  get r2(): number {
    return this.rand as number;
  }

  @hasOne('anotherFactory', 'attr1') one;
  @hasMany('anotherFactory', 'attr2') many;
  @hasOne('test', null, { reflexive: true, depth: 2 }) oneTest;
  @hasMany('test', null, { reflexive: true, depth: 2 }) manyTests;
  @sequenceItem(1, (prevItems) => prevItems.reduce((a, b) => a + b, 0))
  sequenceItem;
}
