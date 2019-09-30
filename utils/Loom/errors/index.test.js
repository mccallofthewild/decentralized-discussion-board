import { BaseError, InvokationError } from '../errors'

test(BaseError.name + '#constructor', () => {
  expect(_ => new BaseError()).toThrow(InvokationError)
  expect(new BaseError('uh oh!').message).toBe('uh oh!')
})
