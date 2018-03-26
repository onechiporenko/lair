# Lair-db

[![Build Status](https://travis-ci.org/onechiporenko/lair.svg?branch=master)](https://travis-ci.org/onechiporenko/lair)
[![npm version](https://badge.fury.io/js/lair-db.svg)](https://badge.fury.io/js/lair-db)
[![npm version](https://img.shields.io/npm/dm/lair-db.svg)](https://npmjs.com/package/lair-db)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/a308984984ff4f9a826a5b34be2cc46a)](https://www.codacy.com/app/cv_github/lair)
[![Coverage Status](https://coveralls.io/repos/github/onechiporenko/lair/badge.svg?branch=master)](https://coveralls.io/github/onechiporenko/lair?branch=master)

## Install

```bash
npm i lair-db --save-dev
```

## About Lair-db

Lair-db is a database written on TypeScript. Its main use-case is a test-mode for SPA-applications. Lair-db should be used with fake-server (like Pretender) and data-generator (like Faker.js).

*Lair-db doesn't have any dependencies (only some dev-dependencies).*

Lair-db consists of two parts - Lair and Factories. Lair is a place where all data is stored. It has several methods which implement basic CRUD operations. Lair is a Singleton. Factories are used to generate Records that are pushed to the Lair and create its initial state. Each Record has `id`-field which value is auto incremented in the scope of factory. Every `id` is a stringified number.

To get Lair instance you should use static method `getLair`:

```javascript
const {Lair, Factory} = require('lair-db');
const lair = Lair.getLair();
```

## Lair initial state

Factory-instance may be created by call static method `create`:

```javascript
const {Lair, Factory} = require('lair-db');
const factoryInstance = Factory.create({});
```

Now we have a factory. Currently it can't do any useful things. Every generated Record for this Factory will have only one property (`id`). All properties for Records are described in the field `attrs`:

```javascript
const {Lair, Factory} = require('lair-db');
const faker = require('faker');

const factoryInstance = Factory.create({
  attrs: {
    firstName() {
      return faker.name.firstName();
    },
    lastName() {
      return faker.name.lastName();
    }
  }
});
```

Our factory will create Records with fields `id`, `firstName` and `lastName`. Since `faker` returns truly random values we'll get really different Records. We declared `firstName` and `lastName` as functions that returns some random values. Inside this functions new Record is available as context. So, you can write next:

```javascript
const {Lair, Factory} = require('lair-db');
const faker = require('faker');

const factoryInstance = Factory.create({
  attrs: {
    firstName() {
      return faker.name.firstName();
    },
    lastName() {
      return faker.name.lastName();
    },
    fullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  }
});
```

Records created with such factory will look like:

```json
{
  "id": "1",
  "firstName": "Jim",
  "lastName": "Raynor",
  "fullName": "Jim Raynor"
}
```

Here `fullName` is a result of concatenation fields `firstName` and `lastName`. This means that `fullName` initially has such value. When you will update Record's `firstName` or `lastName`, `fullName` **WON'T** be updated automatically.

To create some Records you firstly need to register factory in the Lair:

```javascript
lair.registerFactory(factoryInstance, 'unit');
```

Here `factoryInstance` is a factory described before and `unit` is a Record's type generated by this factory. There is a method called `createRecords` to create some Records and put them in the Lair-db:

```javascript
lair.createRecords('unit', 10);
```

Here we've created 10 Records of type `unit`. 

*You can't create Records of unregistered types.*

Method `createRecords` **MUST** be used only for initial filling of Lair-db.

Versions 1.6.0 and later have another way to set factory name:

```javascript
const unit = Factory.create({name: 'unit'});
lair.registerFactory(unit);
```

Here factory name is set as a `name` in the hash passed to the `Factory.create`, so `registerFactory` need only one parameter in this case.

Records of different types may be linked one to another. There is a special way to describe such links. It's called 'relationships'. Let's say we have two factories for units and squads. One unit may be in the in the one squad and any squad may contain many units (typical one-to-many or many-to-one relationships):

```javascript
const unit = Factory.create({
  attrs: {
    name() {
      return faker.name.findName();
    },
    squadName: '',
    squad: Factory.hasOne('squad', 'units'),
  }
});
const squad = Factory.create({
  attrs: {
    name() {
      return faker.hacker.abbreviation(); // just some random	
    },
    units: Factory.hasMany('unit', 'squad')
  },
  createRelated: {
    units: 4
  }
});

lair.registerFactory(unit, 'unit');
lair.registerFactory(squad, 'squad');
```

Fields `unit.squad` and `squad.units` are described as relationship-fields. Methods `Factory.hasOne` and `Factory.hasMany` take two arguments. First one is a related Records type and second one is a inverted property name. For `squad`-factory we added new attribute called `createRelated`. Lair uses it to know how many related records should be created "silently". In the example above we set that each `squad` should have 4 `units`. Let's try to create some squads:

```javascript
lair.createRecords('squad', 4);
```

Lair will create 4 `squads` and 16 `units` (4 for each `squad`). We still can create `unit` records with `lair.createRecords('unit', 2)`, however they won't be linked with any `squad` by default.

Sometimes it is useful to update record after it's created. Factory has method `afterCreate` for this case. It receives create Record as argument and must return it. Let's add this method to the `unit` factory:

```javascript
const unit = Factory.create({
  attrs: {
    name() {
      return faker.name.findName();
    },
    squad: Factory.hasOne('squad', 'units'),
  },
  afterCreate(record) {
    record.squadName = record.squad.name;
    return record;
  }
});
```

Here we update unit's property `squadName` with real `squad.name`. Method `afterCreate` takes record with all related records created before it. You may update any own `unit` property in the `afterCreate`, but you can't update related records and `unit` relationships. This means, that you can't do `delete record.squad` or `record.squad.name = '1234'`. 

### Using fixtures

Lair allows to load predefined data. Method `loadRecords` can be used for this. It takes two arguments - factory name and data-array itself:

```javascript
lair.loadRecords('unit', [/* data */]);
```

This method has several requirements:

* Factory `unit` must be registered
* Factory `unit` must have declared `attrs`, otherwise new records will be almost empty
* Factory `unit` must have attribute `allowCustomIds` to be `true`
* Loaded records must have unique identifiers (`id`-field)
* Related factories must be registered too
* Related records must be already loaded

Once all Factories are created and registered and Lair is filled with records you are ready to mock your back-end.

## CRUD operations

Every request to your backend represents one of the four operations with records - Create, Read, Updated or Delete. So, Lair has methods for each request-type.

### `createOne`

Method `createOne` is used to create new record in the Lair. It should not be used for Lair initialize and should be only for PUT/POST request handlers (depends on which request-type is used in your application).

`createOne` takes two arguments. First one is a record type and second one is a data for new record:

```javascript
lair.createOne('unit', {
  name: 'Sarah Kerrigan',
  squad: '1'
});
```

There are few important moments here. Firstly, we don't include `id`. Lair will generate it. Secondly, value for `squad`-field is an identifier for `squad`-record. Only identifiers may be used as values for relationship-fields on create or update records. Thirdly, all related records must be already in the Lair. So, in this example record `squad` with id `1` is already created.

Newly created `unit` will be automatically added to the `squad` with id `1`.

#### Default values for attributes

`Lair` uses attributes `value` as a default value for `createOne` if it's not provided. Method `Factory.field` allows to override `defaultValue`. It takes hash with two properties `value` and `defaultValue`. First one is same as usual "old" field-declaration. Second one is a value (**not** Function) that will be used in the `createOne` if nothing will be provided for field.

```javascript
const Log = Factory.create({
  attrs: {
    type: Factory.field({
      /**
       * Same as:
       * ```javascript
       * attrs: {
       *   type() {
       *      return faker.random.arrayElement(['warn', 'info', 'error']);
       *   }
       * }
       * ```
       */
      value() {
        return faker.random.arrayElement(['warn', 'info', 'error']);
      },
      // 'info' will be used as value for 'type'-field if it's not provided in the `createOne`
      defaultValue: 'info'
    }),
    message: ''
  }
});

lair.registerFactory('log', Log);
const newLog = lair.createOne('log', {message: 'msg'}); // no `type` provided
console.log(newLog); // {message: 'msg', type: 'info'} 'info' - default value for `type` was used
```

### `updateOne`

Method `updateOne` is used to update some record in the Lair. It takes three arguments - record type, record id and new data:

```javascript
lair.updateOne('unit', '1', {
  name: 'Rory Swann',
  squad: '2'
});
```

Here we update some fields for `unit` with id `1` and change its squad to `2` (it must be in the Lair).

### `deleteOne`

Method `deleteOne` is used to delete some record from the Lair. It takes two arguments - record type and record id:

```javascript
lair.deleteOne('unit', '1');
```

Record `unit` with id `1` will be deleted and `squad` where this unit was will be updated.

### `getOne`

There are four methods to get record(s) from the Lair. `getOne` is a first of them. It takes two arguments - record type and record id:

```javascript
lair.getOne('unit', '1');
```

It returns record with all related data:

```json
{
  "id": "1",
  "name": "Jim Raynor",
  "squad": {
    "id": "1",
    "names": "Ravens",
    "units": ["1", "2", "3", "4"]
  }
}
```

### `queryOne`

This method is also used to get one record. The main difference between methods is that `getOne` uses `id` to get record and `queryOne` uses a callback:

```javascript
lair.queryOne('unit', record => record.id === '1');
```

Method `queryOne` will return first record for which the callback returns true.

### `getAll`

Method `getAll` returns all records of given type:

```javascript
lair.getAll('unit');
```

### `queryMany`

Method `queryMany` returns record of given type that the passed function returns true for:

```javascript
lair.queryMany('unit', record => record.squad === '1' || record.squad === '2');
```

## Go Pro

### Drop relationships

You should set value to `null`(for `hasOne`) or `[]` (for `hasMany`) to drop some relationship for record:

```javascript
lair.updateOne('unit', '1', {
  squad: null
});

lair.updateOne('squad', '1', {
  units: []
});
```

Related records will be updated automatically.

### Random number of related records

You may set functions as values for `createRelated`:

```javascript
const squad = Factory.create({
  attrs: {
    units: Factory.hasMany('unit', 'squad')
  },
  createRelated() {
    return faker.random.number({min: 1, max: 10})
  }
});
```

Now every created `squad` will have 1 - 10 related units.

### Check if Factory creates records in the scope of "createRelated" for another Factory

```javascript
lair.registerFactory(Factory.create({
  attrs: {
    children: Factory.hasMany('child', 'parent'),
  },
  createRelated: {
    children: 2,
  },
}), 'parent');

lair.registerFactory(Factory.create({
  attrs: {
    parent: Factory.hasOne('parent', 'children'),
    field() {
      console.log(this.extraData); // <--- check this out
    },
  },
}), 'child');

lair.createRecords('parent', 1);
lair.createRecords('child', 2);
```

Field `extraData` is available in the dynamic fields and contains information about a parent factory that forces Lair to create some records of the child factory.

In the example above `console.log` (in the `field` attribute) will be called 4 times. First two times it will output:

```json
{
  "relatedTo": {
    "factoryName": "parent",
    "recordsCount": 2,
    "currentRecordNumber": 1
  }
}
```

```json
{
  "relatedTo": {
    "factoryName": "parent",
    "recordsCount": 2,
    "currentRecordNumber": 2
  }
}
```

Here `relatedTo` contains name of the parent-factory, records count of child factory that will be created and number of creating child-record. `currentRecordNumber` isn't new record identifier and it's just a sequence number. It will be dropped to `1` for each parent-record.

Last two times `console.log` from the `field`-attribute will out:

```json
{
  "relatedTo": {}
}
```

Field `relatedTo` is empty because child-records are created standalone and not in the scope of the parent factory. 

### One way relationships

Methods `Factory.hasOne` and `Factory.hasMany` take two arguments. However you may set `null` as second parameter. In this case records will be related in one way:
 
```javascript
const squad = Factory.create({
  attrs: {
    units: Factory.hasMany('unit', null)
  }
});

const unit = Factory.create({
  attrs: {
    squad: Factory.hasOne('squad', 'units'),
  }
});
```

Here `squad` records have some related units. When some unit will be added to the squad its `squad`-field won't be updated.

### Reflexive relationships

Good example of reflexive relations is a directories structure. Each directory may have many child-directories and one parent-directory. Lair-db allows you to declare such relationships:

```javascript
const Dir = Factory.create({
  attrs: {
    name() {
      return faker.internet.domainWord(); // any random name
    },
    dirs: Factory.hasMany('dir', 'parent', {reflexive: true, depth: 3}),
    parent: Factory.hasOne('dir', 'dirs')
  },
  createRelated: {
    dirs() {
      return faker.random.number({min: 1, max: 3})
    }
  }
});

lair.registerFactory(Dir, 'dir');
lair.createRecords('dir', 1);
lair.getOne('dir', '1');
```

Factory `Dir` will create records with a lot of related records. Each `dir` will have 1 - 3 child-directories and 3 levels depth:

```json
{
  "id": "1",
  "name": "wendy",
  "dirs": [
    {
      "id": "2",
      "name": "alysa",
      "dirs": [
        {
          "id": "3",
          "name": "tracy",
          "dirs": [],
          "parent": "2"
        },
        {
          "id": "4",
          "name": "mabelle",
          "dirs": [],
          "parent": "2"
        }
      ],
      "parent": "1"
    }
  ],
  "parent": null
}
```

### Sequences

Lair-db allows to create sequences of values. This means that you can create a time line like:

```javascript
const timeLine = Factory.create({
  attrs: {
    timestamp: Factory.sequenceItem(
      new Date().getTime() - 24 * 3600 * 1000, 
      prevValues => prevValues.pop() + 5000
    ),
    value() {
      return faker.random.number({min: 1, max: 100});
    }
  }
});
```

Every created record for this factory will have `timestamp`-property greater to 5 seconds than previous. It's useful for graphs and metrics.

`Factory.sequenceItem` takes two mandatory arguments - initial value (it will be set to record with id `1`) and function that calculates value for next record. This callback will get list with all previously generated values for this field. 

Third argument is a POJO with options for sequence. Currently only one option is available. It's called `lastValuesCount`. Its value determines how many items will be passed to the callback:

```javascript
const timeLine = Factory.create({
  attrs: {
    timestamp: Factory.sequenceItem(
      new Date().getTime() - 24 * 3600 * 1000, 
      prevValues => prevValues.pop() + 5000, // prevValues will have two values (for id '2' it will have one value)
      {lastValuesCount: 2} // <----
    ),
    value() {
      return faker.random.number({min: 1, max: 100});
    }
  }
});
```

Use option `lastValuesCount` if your sequence items depends on limited number of previous values.

### Extending Factories

New Factory may be created based on another Factory. `attrs`, `createRelated`, `afterCreate` and all other fields will be put in the child Factory and overridden if needed:

```javascript
const Parent1 = Factory.create({
  attrs: {
    children: Factory.hasMany('child', 'parent'),    
  },
  createRelated: {
    children: 5
  },
  afterCreate(record) {
    console.log('parent 1');
    return record;
  }
});

const Parent2 = Factory.extend(Parent1, { // <----
  attrs: {
    children: Factory.hasOne('child', 'parent')
  },
  createRelated: {
    children: 1
  },
  afterCreate(record) {
    console.log('parent 2');
    return record;
  }
});

const Child = Factory.create({});
```

Extending Factories has a few restrictions:

* No `super` anywhere. You don't have access to "parent" (basically, "parent" doesn't exist)
* Be aware with inverted fields in the relationships

### Ignore related factories

There are some cases when you don't need to get all related to the record data. Let's go back to the example with `squad` and `units` (one `squad` has many `units` and one `unit` belongs to only one `squad`). We consider the cases:

Squad info is needed with units ids and not whole units data:

```javascript
lair.getOne('squad', '1', {depth: 1});
// {id: '1', name: 'Ravens', units: ['1', '2', '3', '4']}
```

Squad info is needed without units at all:

```javascript
lair.getOne('squad', '1', {ignoreRelated: ['unit']}); 
// {id: '1', name: 'Ravens'}
```

Here we have two options called `depth` and `ignoreRelared`. First one determines how deeply Lair should go to get data for needed record. Second one determines what factories should be ignored while Lair combines data for needed record. **Important** `ignoreRelated` contains a list of factory names and not attribute names! Both `depth` and `ignoreRelated` may be used together.

This options are very useful for cases with a lot of related records that may cause performance issues when Lair will collect them from internal store.