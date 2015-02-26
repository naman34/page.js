![yarr logo](http://naman.s3.amazonaws.com/yarr.png)

Yet Another React Router.
(forked from Page.js a tiny ~1200 byte Express-inspired client-side router)

```js
var yarr = require('yarr.js');

yarr('/', index)
yarr('/user/:user', show)
yarr('/user/:user/edit', edit)
yarr('/user/:user/album', album)
yarr('/user/:user/album/sort', sort)
yarr('*', notfound)
yarr()
```

## examples

  In order to provide suitable example, the original examples for page.js have been removed. New examples will be added to reflect the slightly modified behaviour.
  **Please Note**: Unlike in Page.js, you have to use yarr.Link for all links in React app for routing to work correctly. The Link Component has the same API as a normal <a> tag.

## Changelog

#### v1.2.0
- *Link* now uses React-Tappable behind the scenes. This means that you will get fast click responses on touch screens. The API on the outside remains unchanged.
- *Link* now accepts any props that are accepted by React-Tappable. You can set the `component` attribute to use an element other than an `<a>` element. This includes custom React Classes. I have also submitted a pull request to React-Tappable that adds support for arbitrary props. I will update to the latest React-Tappable when that code is merged.
- The previous version of `Yarr.js` only made the `Link` component available with a lowercase `l`. This is no longer the case. `Link` in capital case is now available as well. This means you can import the `Link` component in one of these ways:

```
var Link = require('yarr.js').Link;
var {Link} = require('yarr.js');
import {Link} from 'yarr.js';
```

## API

### page(path, callback[, callback ...])

  Defines a route mapping `path` to the given `callback(s)`.

```js
yarr('/', user.list)
yarr('/user/:id', user.load, user.show)
yarr('/user/:id/edit', user.load, user.edit)
yarr('*', notfound)
```

Then with your react code use the yarr.link for any internal routable links.

```js
var Link = require('yarr').link;

//use it as follows:
Link({href:'/my-route'}, "click here");

//or in JSX:
<Link href="/my-route">click here</Link>
```

### yarr(callback)

  This is equivalent to `yarr('*', callback)` for generic "middleware".

### yarr(path)

  Navigate to the given `path`.

```js
  yarr('/user/12')
```

### yarr.show(path)

  Identical to `yarr(path)` above.

### yarr([options])

  Register yarr's `popstate` bindings. The following options are available:

  - `popstate` bind to popstate [true]
  - `dispatch` perform initial dispatch [true]

  If you wish to load serve initial content
  from the server you likely will want to
  set `dispatch` to __false__.

### yarr.start([options])

  Identical to `yarr([options])` above.

### yarr.stop()

  Unbind both the `popstate` and `click` handlers.

### yarr.base([path])

  Get or set the base `path`. For example if yarr.js
  is operating within "/blog/*" set the base path to "/blog". 

### Context

  Routes are passed `Context` objects, these may
  be used to share state, for example `ctx.user =`,
  as well as the history "state" `ctx.state` that
  the `pushState` API provides.

#### Context#save()

  Saves the context using `replaceState()`. For example
  this is useful for caching HTML or other resources
  that were loaded for when a user presses "back".

#### Context#canonicalPath

  Pathname including the "base" (if any) and query string "/admin/login?foo=bar".

#### Context#path

  Pathname and query string "/login?foo=bar".

#### Context#querystring

  Query string void of leading `?` such as "foo=bar", defaults to "".

#### Context#pathname

  The pathname void of query string "/login".

#### Context#state

  The `pushState` state object.

#### Context#title

  The `pushState` title.

## Routing

  The router uses the same string-to-regexp conversion
  that Express does, so things like ":id", ":id?", and "*" work
  as you might expect.

  Another aspect that is much like Express is the ability to
  pass multiple callbacks. You can use this to your advantage
  to flatten nested callbacks, or simply to abstract components.

### Separating concerns

  For example suppose you had a route to _edit_ users, and a
  route to _view_ users. In both cases you need to load the user.
  One way to achieve this is with several callbacks as shown here:

```js
yarr('/user/:user', load, show)
yarr('/user/:user/edit', load, edit)
```

  Using the `*` character we could alter this to match all
  routes prefixed with "/user" to achieve the same result:

```js
yarr('/user/*', load)
yarr('/user/:user', show)
yarr('/user/:user/edit', edit)
```

  Likewise `*` may be used as catch-alls after all routes
  acting as a 404 handler, before all routes, in-between and
  so on. For example:

```js
yarr('/user/:user', load, show)
yarr('*', function(){
  // render not found
})
```

### Default 404 behaviour

  By default when a route is not matched,
  yarr.js will invoke `yarr.stop()` to unbind
  itself, and proceed with redirecting to the
  location requested. This means you may use
  yarr.js with a multi-page application _without_
  explicitly binding to certain links.

### Working with parameters and contexts

  Much like `request` and `response` objects are
  passed around in Express, yarr.js has a single
  "Context" object. Using the previous examples
  of `load` and `show` for a user, we can assign
  arbitrary properties to `ctx` to maintain state
  between callbacks.

  First to build a `load` function that will load
  the user for subsequent routes you'll need to
  access the ":id" passed. You can do this with
  `ctx.params.NAME` much like Express:

```js
function load(ctx, next){
  var id = ctx.params.id
}
```

  Then perform some kind of action against the server,
  assigning the user to `ctx.user` for other routes to
  utilize. `next()` is then invoked to pass control to
  the following matching route in sequence, if any.

```js
function load(ctx, next){
  var id = ctx.params.id
  $.getJSON('/user/' + id + '.json', function(user){
    ctx.user = user
    next()
  })
}
```

  The "show" function might look something like this,
  however you may render templates or do anything you
  want. Note that here `next()` is _not_ invoked, because
  this is considered the "end point", and no routes
  will be matched until another link is clicked or
  `yarr(path)` is called.

```js
function show(ctx){
  React.renderComponent({user:ctx.user.name}, document.body);
}
```

  Finally using them like so:

```js
yarr('/user/:id', load, show)
```

### Working with state

  When working with the `pushState` API,
  and thus yarr.js you may optionally provide
  state objects available when the user navigates
  the history.

  For example if you had a photo application
  and you performed a relatively expensive
  search to populate a list of images,
  normally when a user clicks "back" in
  the browser the route would be invoked
  and the query would be made yet-again.

  Perhaps the route callback looks like this:

```js
function show(ctx){
  $.getJSON('/photos', function(images){
    displayImages(images)
  })
}
```

   You may utilize the history's state
   object to cache this result, or any
   other values you wish. This makes it
   possible to completely omit the query
   when a user presses back, providing
   a much nicer experience.

```js
function show(ctx){
  if (ctx.state.images) {
    displayImages(ctx.state.images)
  } else {
    $.getJSON('/photos', function(images){
      ctx.state.images = images
      ctx.save()
      displayImages(images)
    })
  }
}
```

  __NOTE__: `ctx.save()` must be used
  if the state changes _after_ the first
  tick (xhr, setTimeout, etc), otherwise
  it is optional and the state will be
  saved after dispatching.

### Matching paths

  Here are some examples of what's possible
  with the string to `RegExp` conversion.

  Match an explicit path:
  
```js
yarr('/about', callback)
```

  Match with required parameter accessed via `ctx.params.name`:

```js
yarr('/user/:name', callback)
```

  Match with several params, for example `/user/tj/edit` or
  `/user/tj/view`.

```js
yarr('/user/:name/:operation', callback)
```

  Match with one optional and one required, now `/user/tj`
  will match the same route as `/user/tj/show` etc:

```js
yarr('/user/:name/:operation?', callback)
```

  Use the wildcard char `*` to match across segments,
  available via `ctx.params[N]` where __N__ is the
  index of `*` since you may use several. For example
  the following will match `/user/12/edit`, `/user/12/albums/2/admin`
  and so on.

```js
yarr('/user/*', loadUser)
```

  Named wildcard accessed, for example `/file/javascripts/jquery.js`
  would provide "/javascripts/jquery.js" as `ctx.params.file`:

```js
yarr('/file/:file(*)', loadUser)
```

  And of course `RegExp` literals, where the capture
  groups are available via `ctx.params[N]` where __N__
  is the index of the capture group.

```js
yarr(/^\/commits\/(\d+)\.\.(\d+)/, loadUser)
```

### Pull Requests

  * Break commits into a single objective.
  * An objective should be a chunk of code that is related but requires explaination.
  * Commits should be in the form of what-it-is: how-it-does-it and or why-it's-needed or what-it-is for trivial changes
  * Pull requests and commits should be a guide to the code.

  In specific I would love:
  * Tests
  * Examples
  * Bug Fixes

## License 

(The MIT License)

Copyright (c) 2014 Naman Goel &lt;naman34@gmail.com&gt;

Original Page.js by:
TJ Holowaychuk &lt;tj@vision-media.ca&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
