function createRequestTypes(base) {
  return ['REQUEST', 'SUCCESS', 'FAILURE'].reduce((acc, type) => {
    acc[type] = `${base}_${type}`
    return acc
  }, {})
}

function action(type) {
  return function (payload = {}) {
    if (payload.type) {
      return {type}
    } else {
      return {
        type,
        ...payload
      }
    }
  }
}

function actionGenerate(type) {
  return {
    request: action(type["REQUEST"]),
    success: action(type["SUCCESS"]),
    failure: action(type["FAILURE"])
  }
}

export const SERVER = createRequestTypes("SERVER")
export const LOG = createRequestTypes("LOG")
export const CHANNEL = createRequestTypes("CHANNEL")
export const SUBLIB = createRequestTypes("SUBLIB")
export const EXPORT_LOG = createRequestTypes("EXPORT_LOG")
export const FEATURE = createRequestTypes("FEATURE")
export const EXPORT_FEATURE = createRequestTypes("EXPORT_FEATURE")
export const UPLOAD = createRequestTypes("UPLOAD")
export const UPLOAD_FEATURE = createRequestTypes("UPLOAD_FEATURE")

export const server = actionGenerate(SERVER)
export const log = actionGenerate(LOG)
export const channel = actionGenerate(CHANNEL)
export const sublib = actionGenerate(SUBLIB)
export const export_log = actionGenerate(EXPORT_LOG)
export const feature = actionGenerate(FEATURE)
export const export_feature = actionGenerate(EXPORT_FEATURE)
export const upload = actionGenerate(UPLOAD)
export const upload_feature = actionGenerate(UPLOAD_FEATURE)