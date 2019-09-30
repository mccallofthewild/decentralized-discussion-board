export class LoomProp {
  constructor({ name, required = false, storage = false }) {
    this.name = name
    this.isRequired = required
    this.isStorage = storage
  }
}
