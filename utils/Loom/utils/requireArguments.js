import { InvokationError } from '../errors'

/**
 *
 *
 * @param {Object} args - an object whose values must all be defined
 */
export const requireArguments = (args, { caller = 'function' }) => {
  for (const [argName, argValue] of Object.entries(args)) {
    if (argValue == undefined)
      throw new InvokationError(
        `Failed to invoke ${caller}. Argument, "${argName}" is required.`
      )
  }
}
