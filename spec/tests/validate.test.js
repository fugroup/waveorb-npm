var extras = require('extras')
var i18n = require('../../lib/i18n.js')
var loader = require('../../lib/loader.js')
var dispatch = require('../../lib/dispatch.js')
var locales = require('../../lib/locales.js')
var db = require('configdb')

beforeEach(() => {
  db('user').clear()
})

// Test validate data
it('should validate data', async ({ t }) => {
  var app = await loader({ path: 'spec/apps/app7', locales })
  var $ = {
    app,
    req: {
      route: 'createProject'
    },
    params: {
      query: {
        name: 'hey',
        key: 5
      }
    },
    t: i18n.t()
  }

  var result = await dispatch($)
  t.equal(result.error.message, 'validation error')
  t.deepEqual(result.query.name, ['minimum length is 5'])
  t.deepEqual(result.query.key, ['must be one of 7, 8'])

  $.params.query.name = 'hello'
  $.params.query.key = 7

  result = await dispatch($)
  t.equal(result.hello, 'bye')
})

// Test unique on create
it('should validate unique user on create', async ({ t }) => {
  var app = await loader({ path: 'spec/apps/app27', locales })
  var $ = {
    app,
    req: {
      route: 'createUser'
    },
    db,
    params: {
      values: {
        email: 'test@example.com'
      }
    },
    t: i18n.t()
  }

  var result = await dispatch($)
  t.equal(result.hello, 'bye')

  // Create
  db('user').create({ email: 'test@example.com' })

  result = await dispatch($)
  t.equal(result.error.message, 'validation error')
  t.deepEqual(result.values.email, ['has been taken'])
})

// Test unique on update
it('should validate unique user on update', async ({ t }) => {
  var app = await loader({ path: 'spec/apps/app28', locales })
  var user1 = db('user').create({ email: 'test1@example.com' })
  var user2 = db('user').create({ email: 'test2@example.com' })

  var $ = {
    app,
    req: {
      route: 'updateUser'
    },
    db,
    params: {
      query: {
        id: user1.id
      },
      values: {
        email: 'test1@example.com'
      }
    },
    t: i18n.t()
  }

  var result = await dispatch($)
  t.equal(result.hello, 'bye')

  // Update
  result = null
  $.params.values.email = 'new@example.com'

  result = await dispatch($)
  t.equal(result.hello, 'bye')

  $.params.values.email = 'test2@example.com'

  result = await dispatch($)

  t.equal(result.error.message, 'validation error')
  t.deepEqual(result.values.email, ['has been taken'])
})

// Test unique on create, narrowed with ids
it('should validate unique user on create, narrowed', async ({ t }) => {
  var app = await loader({ path: 'spec/apps/app31', locales })
  var $ = {
    app,
    req: {
      route: 'createUser'
    },
    db,
    params: {
      values: {
        email: 'test@example.com'
      }
    },
    t: i18n.t()
  }

  var result = await dispatch($)
  t.equal(result.hello, 'bye')

  // Create
  db('user').create({ email: 'test@example.com', site_id: '1234' })

  result = await dispatch($)
  t.equal(result.error.message, 'validation error')
  t.deepEqual(result.values.email, ['has been taken'])

  $.params.values.site_id = '1234'

  result = await dispatch($)
  t.equal(result.error.message, 'validation error')
  t.deepEqual(result.values.email, ['has been taken'])

  $.params.values.site_id = '4321'
  result = await dispatch($)

  t.equal(result.hello, 'bye')
})

// Test unique on update, narrowed with ids
it('should validate unique user on update, narrowed', async ({ t }) => {
  var app = await loader({ path: 'spec/apps/app32', locales })
  var user1 = db('user').create({
    email: 'test1@example.com',
    site_id: '1234'
  })

  var $ = {
    app,
    req: {
      route: 'updateUser'
    },
    db,
    params: {
      query: {
        id: user1.id
      },
      values: {
        email: 'test1@example.com'
      }
    },
    t: i18n.t()
  }

  var result = await dispatch($)
  t.equal(result.hello, 'bye')

  // Update
  result = null
  $.params.values.email = 'new@example.com'

  result = await dispatch($)
  t.equal(result.hello, 'bye')

  result = null
  $.params.values.email = 'test2@example.com'

  result = await dispatch($)
  t.equal(result.hello, 'bye')
})

// Test exist
it('should fail if not exist', async ({ t }) => {
  var app = await loader({ path: 'spec/apps/app29', locales })
  var $ = {
    app,
    req: {
      route: 'getProject'
    },
    db,
    params: {
      query: {
        id: '12341234'
      }
    },
    t: i18n.t()
  }

  var result = await dispatch($)
  t.equal(result.error.message, 'validation error')
  t.deepEqual(result.query.id, ['does not exist'])

  var project = db('project').create({})
  $.params.query.id = project.id

  result = await dispatch($)
  t.equal(result.hello, 'bye')
})

// Test multiple required
it('should work with multiple required fields', async ({ t }) => {
  var app = await loader({ path: 'spec/apps/app30', locales })
  var $ = {
    app,
    req: {
      route: 'createProject'
    },
    db,
    params: {},
    t: i18n.t()
  }

  var result = await dispatch($)
  t.equal(result.error.message, 'validation error')
  t.deepEqual(result.values.name, ['is required'])
  t.deepEqual(result.values.email, ['is required'])
})

// Test custom validations
it('should use custom validations', async ({ t }) => {
  var customLocales = extras.cloneDeep(locales)
  customLocales.en.validation.required = 'custom required'

  var app = await loader({
    path: 'spec/apps/app30',
    locales: customLocales
  })
  var $ = {
    app,
    req: {
      route: 'createProject'
    },
    db,
    params: {},
    t: i18n.t()
  }

  var result = await dispatch($)
  t.equal(result.error.message, 'validation error')
  t.deepEqual(result.values.name, ['custom required'])
  t.deepEqual(result.values.email, ['custom required'])
})

// Test custom validations, other language
it('should use custom validations', async ({ t }) => {
  var customLocales = Object.assign({}, locales)
  customLocales.no = {
    validation: {
      required: 'er påkrevet'
    }
  }

  var app = await loader({
    path: 'spec/apps/app30',
    locales: customLocales
  })
  var $ = {
    app,
    lang: 'no',
    req: {
      route: 'createProject'
    },
    db,
    params: {},
    t: i18n.t()
  }

  var result = await dispatch($)
  t.equal(result.error.message, 'validation error')
  t.deepEqual(result.values.name, ['er påkrevet'])
  t.deepEqual(result.values.email, ['er påkrevet'])
})

// Test string validations
it('should support string validations', async ({ t }) => {
  var app = await loader({ path: 'spec/apps/app34', locales })
  var $ = {
    app,
    req: {
      route: 'createProject'
    },
    db,
    params: {},
    t: i18n.t()
  }

  var result = await dispatch($)
  t.equal(result.error.message, 'validation error')
  t.deepEqual(result.values.name, ['is required'])
  t.deepEqual(result.values.email, ['is required'])
})

// Test array validations
it('should support array validations', async ({ t }) => {
  var app = await loader({ path: 'spec/apps/app35', locales })
  var $ = {
    app,
    req: {
      route: 'createProject'
    },
    db,
    params: {},
    t: i18n.t()
  }

  var result = await dispatch($)

  t.equal(result.error.message, 'validation error')
  t.deepEqual(result.values.name, ['is required'])
  t.deepEqual(result.values.email, ['is required'])
})
