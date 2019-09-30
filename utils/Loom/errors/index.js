import { requireArguments } from '../utils/requireArguments'

export class BaseError extends Error {
  constructor(message) {
    requireArguments({ message }, { caller: 'BaseError#constructor' })
    super(...arguments)
  }
}

export class InvokationError extends BaseError {}
