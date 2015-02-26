'use strict';

var React = require('react');
var yarr = require('./yarr');

var Tappable = React.createFactory(require('react-tappable'));
Object.assign = require('react/lib/Object.assign')

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

    var props = Object.assign({}, this.props);
    
    props.onTap = this.route;
    props.preventDefault = true;
    props.stopPropagation = true;
    props.pressDelay = 500;
    props.component = props.component || 'a';
    

    return Tappable(
      props,
      this.props.children
    );
  }

});
