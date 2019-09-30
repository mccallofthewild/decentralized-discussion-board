const reqAvatars = require.context(
  '~/assets/images/avatars/People in bubbles_ Icons8_SVG/',
  true,
  /\.svg$/
)
export const avatars = reqAvatars.keys().map(key => reqAvatars(key))
