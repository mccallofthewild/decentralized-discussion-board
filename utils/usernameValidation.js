// via https://stackoverflow.com/a/12019115/6368143
const lastUsernameCharRegex = /([_.]$)/gim
export const inverseUsernameRegex = /(^[_.])|([_.](?=[_.]))|([^a-zA-Z0-9._])/gim
export const usernameRegex = /^(?=.{0,30}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/gim /*
                                └─────┬────┘└───┬──┘└─────┬─────┘└─────┬─────┘ └───┬───┘
                                      │         │         │            │           no _ or . at the end
                                      │         │         │            │
                                      │         │         │            allowed characters
                                      │         │         │
                                      │         │         no __ or _. or ._ or .. inside
                                      │         │
                                      │         no _ or . at the beginning
                                      │
                                      username is 1-30 characters long
*/
export const formatUsername = (username, { end = true } = {}) => {
  let copy = username + ''
  copy = copy.toLowerCase()
  let prev
  let iterations = 0
  copy = copy.slice(0, 30)
  while (prev != copy) {
    prev = copy
    copy = copy.replace(inverseUsernameRegex, '')
    if (end) {
      copy = copy.replace(lastUsernameCharRegex, '')
    }
    if (100 < iterations++) return ''
  }
  return copy
}
