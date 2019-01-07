export const config = {
  api: {
    login: "/v1/user/login",
    getConfig: "/v1/public/getConfig",
    getChannelAll: "/v1/channel/getAll",
    getFeature: "/v1/feature/get",
    compare: "/v1/feature/comparison",
    compareSublib: "/v1/feature/comparisonSublib",
    getUser: "/v1/user/get",
    addUser: "/v1/user/add",
    deleteUser: "/v1/user/delete",
    resetPassword: "/v1/user/editPasswd",
    editUser: "/v1/user/edit",
    getRole: "/v1/role/get",
    getSublib: "/v1/sublib/get",
    editSublib: "/v1/sublib/edit",
    addSublib: "/v1/sublib/add",
    deleteSublib: "/v1/sublib/delete",
    channelGet: "/v1/channel/get",
    reverseChannel: "/v1/channel/reverse",
    addChannel: "/v1/channel/add",
    editChannel: "/v1/channel/edit",
    deleteChannel: "/v1/channel/delete",
    reloadChannel: "/v1/channel/reload",
    clearLogChannel: "/v1/log/deleteByChannelId",
    delFeature: "/v1/feature/delete", //删除特征
    addFeature: "/v1/feature/add", //添加特征
    addFeatureById: "/v1/feature/addbyId", //添加特征
    getEngineLoaded: "/v1/public/getEngineLoaded", //获取引擎状态
    getLog: "/v1/log/get",
    clearLog: "/v1/log/deleteAll",
    getExcel: "/v1/log/getExcel",
    getLogMatchedNum: "/v1/log/getLogMatchedNum",
    queryname: "/v1/log/querynames",  //  查询一条记录的名称和分库名称
    resetTime: "/v1/public/resetTime",  //  重置时间
  }
}