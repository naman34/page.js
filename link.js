'use strict';

var React = require('react')
var yarr = require('./yarr')

var Tappable = require('react-tappable')
Object.assign = require('react/lib/Object.assign')

module.exports = React.createClass({

  getInitialState: function(){
    return {};
  },

  route: function(event){

    if(event.getModifierState('Shift') || event.getModifierState('Alt') || event.getModifierState('Control') || event.button === 2 || event.button === 1) {return;}

    event.preventDefault();

    var shouldRoute = true;
    var ret = true;

    if(this.props.onClick){
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

    return false
  },

  render: function(){

    var props = Object.assign({}, this.props);

    props.onTap = this.route;
    props.pressDelay = 500;
    props.moveThreshold = 5;
    props.component = props.component || 'a';
    props.onClick = function(e){
      e.preventDefault()
    }

    return React.createElement(Tappable,
      props,
      this.props.children
    );
  }

});
