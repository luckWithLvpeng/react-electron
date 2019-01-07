import layout from './layout'
import log from './log'
import feature from './feature'
import upload from './upload'

export default {
  ...layout,
  ...upload,
  ...feature,
  ...log,
}