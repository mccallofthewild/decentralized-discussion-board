export const extract = (obj, props) =>
  props.reduce((prev, prop) => ({ ...prev, [prop]: obj[prop] }), {})
