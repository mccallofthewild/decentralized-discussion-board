import EventEmitter from 'eventemitter3'

const createXHREventEmitter = () => {
  const emitter = new EventEmitter()
  const origOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function(...args) {
    emitter.emit('start', args)
    this.addEventListener('load', function() {
      emitter.emit('end', args)
    })
    origOpen.apply(this, arguments)
  }
  return emitter
}
let xhrEmitter
export const monitorXHR = ({
  onRequestStart = () => {},
  onRequestEnd = () => {}
}) => {
  xhrEmitter = xhrEmitter || createXHREventEmitter()
  xhrEmitter.on('start', ([method, url]) => {
    onRequestStart(method, url)
  })
  xhrEmitter.on('end', ([method, url]) => {
    onRequestEnd(method, url)
  })
  return true
}
