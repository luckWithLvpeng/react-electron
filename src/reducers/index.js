import layout from './layout'
import log from './log'
import feature from './feature'
import upload from './upload'
import requestfeature from './requestfeature'


export default {
  ...layout,
  ...upload,
  ...feature,
  ...log,
  ...requestfeature
}