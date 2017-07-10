function incStr(val: string): string {
  return '' + (Number(val) + 1);
}

export const oneToOneFoo = (id = '1') => {
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
export const oneToOneBar = (id = '1') => {
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
export const oneToOneBaz = (id = '1') => {
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

export const oneToManyFoo = (id = '1') => {
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
export const oneToManyBar = (id = '1') => {
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
export const oneToManyBaz = (id = '1') => {
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

export const manyToOneFoo = (id = '1') => {
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
export const manyToOneBar = (id = '1', barId = '1') => {
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
export const manyToOneBaz = (id = '1', bazId = '1') => {
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

export const manyToManyFoo = (id = '1', barId = '1', bazId = '1') => {
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
export const manyToManyBar = (id = '1', fooId = '1', barId = '1', bazId = '1') => {
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
export const manyToManyBaz = (id = '1', fooId = '1', barId = '1', bazId = '1') => {
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
