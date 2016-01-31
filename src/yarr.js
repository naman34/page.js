/* @flow */
/**
 * Perform initial dispatch.
 */

let dispatch = true

/**
 * Base path.
 */

let base = ''

/**
 * Running flag.
 */

let running

/**
 * Register `path` with callback `fn()`,
 * or route `path`, or `yarr.start()`.
 *
 *   yarr(fn);
 *   yarr('*', fn);
 *   yarr('/user/:id', load, user);
 *   yarr('/user/' + user.id, { some: 'thing' });
 *   yarr('/user/' + user.id);
 *   yarr();
 *
 * @param {String|Function} path
 * @param {Function} fn...
 * @api public
 */

function yarr(path: string | Function, fn?: Function) {
  // <callback>
  if (typeof path === 'function') {
    return yarr('*', path)
  }

  // route <path> to <callback ...>
  if (typeof fn === 'function') {
    const route = new Route(path)
    for (let i = 1; i < arguments.length; ++i) {
      yarr.callbacks.push(route.middleware(arguments[i]))
    }
  // show <path> with [state]
  } else if (typeof path === 'string') {
    yarr.show(path, fn)
  // start [options]
  } else {
    yarr.start(path)
  }
}

/**
 * Callback functions.
 */

yarr.callbacks = []

/**
 * Get or set basepath to `path`.
 *
 * @param {String} path
 * @api public
 */

yarr.base = function(path) {
  if (arguments.length === 0) return base
  base = path
}

/**
 * Bind with the given `options`.
 *
 * Options:
 *
 *    - `click` bind to click events [true]
 *    - `popstate` bind to popstate [true]
 *    - `dispatch` perform initial dispatch [true]
 *
 * @param {Object} options
 * @api public
 */

yarr.start = function(options) {
  options = options || {}
  if (running) return
  running = true
  if (options.dispatch === false) dispatch = false
  if (options.popstate !== false) window.addEventListener('popstate', onpopstate, false)
  if (!dispatch) return
  const url = location.pathname + location.search + location.hash
  yarr.replace(url, null, true, dispatch)
}

/**
 * Unbind click and popstate event handlers.
 *
 * @api public
 */

yarr.stop = function() {
  running = false
  global.removeEventListener('popstate', onpopstate, false)
}

/**
 * Show `path` with optional `state` object.
 *
 * @param {String} path
 * @param {Object} state
 * @param {Boolean} dispatch
 * @return {Context}
 * @api public
 */

yarr.show = function(path: string, state: any, dispatch?: boolean): Context {
  const ctx = new Context(path, state)
  if (dispatch !== false) yarr.dispatch(ctx)
  if (!ctx.unhandled) ctx.pushState()
  return ctx
}

/**
 * Replace `path` with optional `state` object.
 *
 * @param {String} path
 * @param {Object} state
 * @return {Context}
 * @api public
 */

yarr.replace = function(path: string, state: ?Object, init: ?boolean, dispatch: ?boolean) {
  const ctx = new Context(path, state)
  ctx.init = Boolean(init)
  if (dispatch == null) dispatch = true
  if (dispatch) yarr.dispatch(ctx)
  ctx.save()
  return ctx
}

/**
 * Dispatch the given `ctx`.
 *
 * @param {Object} ctx
 * @api private
 */

yarr.dispatch = function(ctx: Context) {
  var i = 0

  function next() {
    var fn = yarr.callbacks[i++]
    if (!fn) return unhandled(ctx)
    fn(ctx, next)
  }

  next()
}

/**
 * Unhandled `ctx`. When it's not the initial
 * popstate then redirect. If you wish to handle
 * 404s on your own use `yarr('*', callback)`.
 *
 * @param {Context} ctx
 * @api private
 */

function unhandled(ctx: Context) {
  const current = window.location.pathname + window.location.search
  if (current === ctx.canonicalPath) return
  yarr.stop()
  ctx.unhandled = true
  window.location = ctx.canonicalPath
}

/**
 * Initialize a new "request" `Context`
 * with the given `path` and optional initial `state`.
 *
 * @param {String} path
 * @param {Object} state
 * @api public
 */
class Context {
  init: boolean;
  canonicalPath: string;
  path: string;
  title: string;
  state: any;
  querystring: string;
  pathname: string;
  params: Array<string>;
  hash: string;
  constructor(path: string, state: any) {
    if (path[0] === '/' && path.indexOf(base) !== 0) {
      path = base + path
    }

    const i = path.indexOf('?')

    this.canonicalPath = path
    this.path = path.replace(base, '') || '/'

    this.title = global.document.title
    this.state = state || {}
    this.state.path = path
    this.querystring = ~i ? path.slice(i + 1) : ''
    this.pathname = ~i ? path.slice(0, i) : path
    this.params = []

    // fragment
    this.hash = ''
    if (~this.path.indexOf('#')) {
      const parts = this.path.split('#')
      this.path = parts[0]
      this.hash = parts[1] || ''
      this.querystring = this.querystring.split('#')[0]
    }
  }
  pushState() {
    history.pushState(this.state, this.title, this.canonicalPath)
  }
  save() {
    history.replaceState(this.state, this.title, this.canonicalPath)
  }
}
yarr.Context = Context

/**
 * Initialize `Route` with the given HTTP `path`,
 * and an array of `callbacks` and `options`.
 *
 * Options:
 *
 *   - `sensitive`    enable case-sensitive routes
 *   - `strict`       enable strict matching for trailing slashes
 *
 * @param {String} path
 * @param {Object} options.
 * @api private
 */
class Route {
  path: string;
  method: 'GET';
  keys: Array<{ name: number, optional: boolean }>;
  regexp: RegExp;
  constructor(path: string, options?: Object = {}) {
    const {sensitive, strict} = options
    this.path = path
    this.method = 'GET'
    this.keys = []
    this.regexp = pathtoRegexp(path, this.keys, sensitive, strict)
  }

  /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {Function} fn
   * @return {Function}
   * @api public
   */
  middleware(fn: (ctx: Context, next: Function) => void) {
    return (ctx, next) => {
      if (this.match(ctx.path, ctx.params)) {
        return fn(ctx, next)
      }
      next()
    }
  }

  /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {String} path
   * @param {Array} params
   * @return {Boolean}
   * @api private
   */
  match(path: string, params: Array<string>) {
    const keys = this.keys
    const qsIndex = path.indexOf('?')
    const pathname = ~qsIndex ? path.slice(0, qsIndex) : path
    const m = this.regexp.exec(decodeURIComponent(pathname))

    if (!m) return false

    for (let i = 1, len = m.length; i < len; ++i) {
      const key = keys[i - 1]

      const val = typeof m[i] === 'string'
        ? decodeURIComponent(m[i])
        : m[i]

      if (key) {
        params[key.name] = undefined !== params[key.name]
          ? params[key.name]
          : val
      } else {
        params.push(val)
      }
    }

    return true
  }
}

yarr.Route = Route

/**
 * Normalize the given path string,
 * returning a regular expression.
 *
 * An empty array should be passed,
 * which will contain the placeholder
 * key names. For example "/user/:id" will
 * then contain ["id"].
 *
 * @param  {String|RegExp|Array} path
 * @param  {Array} keys
 * @param  {Boolean} sensitive
 * @param  {Boolean} strict
 * @return {RegExp}
 * @api private
 */

function pathtoRegexp(path: string | RegExp | Array<string>, keys: Array<any>, sensitive: boolean, strict: boolean) {
  if (path instanceof RegExp) return path
  if (path instanceof Array) path = '(' + path.join('|') + ')'
  path = path
    .concat(strict ? '' : '/?')
    .replace(/\/\(/g, '(?:/')
    .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional) {
      keys.push({ name: key, optional: !!optional })
      slash = slash || ''
      return '' +
        (optional ? '' : slash) +
        '(?:' +
        (optional ? slash : '') +
        (format || '') +
        (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' +
        (optional || '')
    })
    .replace(/([\/.])/g, '\\$1')
    .replace(/\*/g, '(.*)')

  return sensitive ? new RegExp('^' + path + '$') : new RegExp('^' + path + '$', 'i')
}

/**
 * Handle "populate" events.
 */

function onpopstate(e: Object) {
  if (e.state) {
    var path = e.state.path
    yarr.replace(path, e.state)
  }
}

/**
 * Expose `yarr`.
 */

module.exports = yarr
