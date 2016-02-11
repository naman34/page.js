/* @flow */
type ModifierKeys = 'Shift'
                  | 'Alt'
                  | 'Control'
                  | 'Meta'

export type ReactKeyboardEvent = {
  getModifierState: (key: ModifierKeys) => boolean;
  button: number;
  nativeEvent: Object;
  keyCode: number;
  preventDefault(): void;
}
