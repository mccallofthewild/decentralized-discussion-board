import { Store } from 'vuex'

/* 
  Formats action/mutation names before they are dispatched/comitted to make 
  constant-naming convention ([name files](./../store-names)) work with nuxt module syntax
*/

const formatStoreMethodName = name =>
  // continue if already formatted
  name.includes('/')
    ? name
    : name
        .split('__')
        .map((v, index) => (index == 0 ? `${v.toLowerCase()}/${v}__` : v))
        .join('')

const { dispatch, commit } = Store.prototype

Store.prototype.dispatch = function(action, payload, ...args) {
  return dispatch.bind(this)(formatStoreMethodName(action), payload, ...args)
}

Store.prototype.commit = function(mutation, payload, ...args) {
  return commit.bind(this)(formatStoreMethodName(mutation), payload, ...args)
}
