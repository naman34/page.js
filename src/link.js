/* @flow */
import React, {PropTypes} from 'react'
import yarr from './yarr'
import Tappable from 'react-tappable'

import type {ReactKeyboardEvent} from './types'

type Props = {
  onClick(evt: Object): boolean;
  href: string;
  component?: string;
};
type State = void;

const modifierKeyPressed = event => event.getModifierState && (
  event.getModifierState('Shift') ||
  event.getModifierState('Alt') ||
  event.getModifierState('Control') ||
  event.getModifierState('Meta') ||
  event.button > 1
)

class Link extends React.Component<void, Props, State> {
  contructor() {
    this.route = this.route.bind(this)
    this.routeOnEnter = this.routeOnEnter.bind(this)
  }

  route(event: ReactKeyboardEvent): ?boolean {
    if (modifierKeyPressed(event)) {
      return null
    }
    event.nativeEvent && event.preventDefault && event.preventDefault()

    let shouldRoute = true
    let ret = true

    if (this.props.onClick) {
      var evt = {}
      evt.preventDefault = function() {
        shouldRoute = false
      }

      ret = this.props.onClick(evt)
    }

    shouldRoute = ret === false ? false : shouldRoute

    if (!shouldRoute) {
      return null
    }

    if (this.props.href) {
      yarr.show(this.props.href)
    }

    return false
  }

  routeOnEnter(e: ReactKeyboardEvent): void {
    if (e.keyCode === 13) {
      this.route(e)
    }
  }

  onClick(event: ReactKeyboardEvent): void {
    if (modifierKeyPressed(event)) {
      return
    }
    event.nativeEvent && event.preventDefault && event.preventDefault()
  }

  render(): ReactElement {
    const props = Object.assign({}, this.props, {
      onTap: this.route,
      pressDelay: 500,
      moveThreshold: 5,
      component: this.props.component || 'a',
      onClick: this.onClick,
      onKeyUp: this.routeOnEnter
    })

    return <Tappable {...props} />
  }

}

Link.displayName = 'Link'
Link.propTypes = {
  onClick: PropTypes.func,
  href: PropTypes.string,
  component: PropTypes.string
}

export default Link
