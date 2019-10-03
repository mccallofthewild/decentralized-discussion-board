const reqIcons = require.context(
  '~/assets/images/icons/',
  true,
  /\.svg$/
)
export const icons = reqIcons.keys().reduce((prev, key) => {
  prev[key.split('/').pop().split('.').shift()] = reqIcons(key);
  return prev;
}, {})
