'use strict';

var React = require('react');
var yarr = require('./yarr');
var mergeInto = require('react/lib/mergeInto');

module.exports = React.createClass({

  getInitialState: function(){
    return {};
  },

  route: function(event){
    
    if(event.getModifierState('Shift') || event.getModifierState('Alt') || event.getModifierState('Control')) {return;}

    event.preventDefault();

    var last = this.state.lastTime || 0;
    var now = Date.now();

    this.state.lastTime = now;

    if(now - last < 500){
      return;
    }

    var shouldRoute = true;
    var ret = true;

    if(!!this.props.onClick){
      var evt = {};
      evt.preventDefault = function(){
        shouldRoute = false;
      };

      ret = this.props.onClick(evt);
    }

    shouldRoute = ret === false ? false : shouldRoute;

    if(!shouldRoute){
      return;
    }

    if(this.props.href){
      yarr.show(this.props.href);  
    }
  },

  render: function(){

    var props = {};
    props.href = this.props.href || '#!';

    if(!!this.props.className){
      props.className = this.props.className;
    }
    if(!!this.props.style){
      props.style = this.props.style;
    }
    if(!!this.props.id){
      props.id = this.props.id;
    }
    props.onClick = this.route;
    // update this to support the other kinds of props as well.
    

    return React.DOM.a(
      props,
      this.props.children
    );
  }

});
