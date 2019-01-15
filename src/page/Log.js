import React, {Component} from 'react';
import {withRouter} from 'react-router-dom'
import * as actions from "../actions";
import {Button, Col, ControlLabel, Form, FormControl, FormGroup, InputGroup, ProgressBar, Row} from 'react-bootstrap'
import {connect} from "react-redux";
import $ from 'jquery'
import 'daterangepicker'
import moment from "moment/moment";
import toastr from "toastr";

const electron = window.require('electron');
const Store = electron.remote.require('electron-store');
const {dialog} = electron.remote;
var store = new Store({name: "userData"})
class Log extends Component {

  resetTime() {
    const {log, dispatch} = this.props;
    var rangerDate = {}
    rangerDate["今天"] = [moment().startOf('day'), moment().endOf('day')];
    rangerDate["昨天"] = [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf("day")];
    rangerDate["过去7天"] = [moment().subtract(6, 'days').startOf('day'), moment()];
    rangerDate["过去30天"] = [moment().subtract(29, 'days').startOf('day'), moment()];
    rangerDate["这个月"] = [moment().startOf('month'), moment().endOf('month')];
    rangerDate["上个月"] = [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')];
    $('input[name="filterDaterange"]').daterangepicker({
      timePicker: true,
      timePicker24Hour: true,
      timePickerSeconds: true,
      startDate: moment.unix(log.begin).format("YYYY-MM-DD HH:mm:ss"),
      endDate: moment.unix(log.end).format("YYYY-MM-DD HH:mm:ss"),
      locale: {
        'format': 'YYYY-MM-DD HH:mm:ss',
        'applyLabel': '应用',
        'cancelLabel': "取消",
        'fromLabel': '开始',
        'toLabel': '结束',
        'monthNames': "一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"),
        'daysOfWeek': "日_一_二_三_四_五_六".split("_"),
        customRangeLabel: "自定义"
      },
      'language': 'zn-ch',
      'showDropdowns': false,
      'applyClass': 'btn-success sure',
      ranges: rangerDate,
      showCustomRangeLabel: true,
    }, function (start, end) {
      dispatch(actions.log["success"]({begin: start.unix(), end: end.unix()}))
    });
  }

  componentDidMount() {
    this.resetTime()
  }


  pickerFolder() {
    const {dispatch, log} = this.props
    if(log.loading) {
      return toastr.warning("正在执行下载任务")
    }
    var path = dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (path) {
      dispatch(actions.log['success']({
        ...log,
        path: path[0],
      }))
      store.set('fileFolder', path[0], {expires: 999})
    }
  }

  exportLog(e) {
    e.preventDefault();
    const {server, log, dispatch} = this.props;
    if (!server.ip) {
      return toastr.error("请填写IP")
    } else if (!server.port) {
      return toastr.error("请填写端口")
    }
    if (!log.path) {
      return toastr.error("请指定保存目录")
    }
    dispatch(actions.export_log['request']())
  }

  render() {
    const {log, dispatch} = this.props
    return (
      <Form autoComplete="off" horizontal
            onSubmit={this.exportLog.bind(this)}>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            保存目录 :
          </Col>
          <Col xs={7}>
            <InputGroup>
              <FormControl
                type="text"
                value={log.path}
                placeholder="保存目录"
                onChange={(e) => dispatch(actions.log['success']({
                  ...log,
                  path: e.target.value.toString().trim(),
                }))}
              />
              <InputGroup.Button>
                <Button
                  onClick={this.pickerFolder.bind(this)}
                  className="btn_default"
                  bsSize="small">
                  选择目录
                </Button>
              </InputGroup.Button>
            </InputGroup>
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            限制数量 :
          </Col>
          <Col xs={7}>
            <FormControl
              type="text"
              value={log.max}
              placeholder="限制数量,不填则导出所有数据"
              onChange={(e) => dispatch(actions.log['success']({
                ...log,
                max: parseInt(e.target.value, 10) || ""
              }))}
            />
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            选择时间 :
          </Col>
          <Col xs={7}>
            <FormControl
              type="text"
              name={"filterDaterange"}
              placeholder="指定时间"
            />
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            导出模式 :
          </Col>
          <Col xs={7}>
            <FormControl
              componentClass="select"
              onChange={e => dispatch(actions.log['success']({
                ...log,
                logmode: e.target.value
              }))}
              value={log.logmode}>
              <option value="1">采集图和底库图</option>
              <option value="2">采集图</option>
              <option value="3">底库图</option>
            </FormControl>
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            是否比中 :
          </Col>
          <Col xs={7}>
            <FormControl
              componentClass="select"
              onChange={e => dispatch(actions.log['success']({
                ...log,
                hit_count: e.target.value
              }))}
              value={log.hit_count}>
              <option value="">全部</option>
              <option value="1">比中</option>
              <option value="0">未比中</option>
            </FormControl>
          </Col>
        </FormGroup>
        {
          this.props.channels.length > 0 ? (
            <FormGroup
            >
              <Col componentClass={ControlLabel} xs={3}>
                选择相机:
              </Col>
              <Col xs={7}>
                <FormControl
                  componentClass="select"
                  onChange={(e) => dispatch(actions.log['success']({
                    ...log,
                    channel_id: e.target.value
                  }))}
                  value={log.channel_id}>
                  <option value="">全部</option>
                  {
                    this.props.channels.map(v => (
                      <option key={v.Id} value={v.Id}>{v.Name}</option>
                    ))
                  }
                </FormControl>
              </Col>
            </FormGroup>
          ) : null
        }
        {
          this.props.sublibs.length > 0 ? (
            <FormGroup
            >
              <Col componentClass={ControlLabel} xs={3}>
                选择分库:
              </Col>
              <Col xs={7}>
                <FormControl
                  componentClass="select"
                  onChange={(e) => dispatch(actions.log['success']({
                    ...log,
                    sublib_id: e.target.value
                  }))}
                  value={log.sublib_id}>
                  <option value="">全部</option>
                  {
                    this.props.sublibs.map(v => (
                      <option key={v.Id} value={v.Id}>{v.Name}</option>
                    ))
                  }
                </FormControl>
              </Col>
            </FormGroup>
          ) : null
        }
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            最小比分 :
          </Col>
          <Col xs={7}>
            <FormControl
              type="text"
              value={log.score_s}
              placeholder="最小比分"
              onChange={(e) => dispatch(actions.log['success']({
                ...log,
                score_s: parseInt(e.target.value, 10) || 0
              }))}
            />
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            最大比分 :
          </Col>
          <Col xs={7}>
            <FormControl
              type="text"
              value={log.score_b}
              placeholder="最大比分"
              onChange={(e) => dispatch(actions.log['success']({
                ...log,
                score_b: parseInt(e.target.value, 10) || 0
              }))}
            />
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            照片名 :
          </Col>
          <Col xs={7}>
            <FormControl
              type="text"
              value={log.name}
              placeholder="照片名"
              onChange={(e) => dispatch(actions.log['success']({
                ...log,
                name: e.target.value.trim()
              }))}
            />
          </Col>
        </FormGroup>
        {
          log.allNumber && log.savedNumber !== log.allNumber ? (
            <Row>
              <Col xs={3} className="text-right">
                获取数据 ...
              </Col>
              <Col xs={7}>
                <ProgressBar
                  striped
                  now={Math.floor(log.acquiredNumber / log.allNumber * 100)}/>
              </Col>
            </Row>
          ) : null
        }
        {
          log.savedNumber ? (
            <Row>
              <Col xs={3} className="text-right">
                {log.savedNumber === log.allNumber ?
                  `导出 [ ${log.allNumber} ] 条记录` :
                  ` 保存数据 [ ${log.savedNumber} / ${log.allNumber} ]`}
              </Col>
              <Col xs={7}>
                <ProgressBar
                  striped
                  now={Math.floor(log.savedNumber / log.allNumber * 100)}/>
              </Col>
            </Row>
          ) : null
        }
        {log.error ? (
          <div className={"text-danger  text-center"}>
            {
              log.error
            }
          </div>
        ): null}
        <FormGroup>
          <Col xs={12} className="text-center">
            {
              log.loading ?
                (<Button bsSize="small" className="btn_cancel"
                         onClick={() => dispatch(actions.export_log['failure']())}>取消任务</Button>)
                :
                (<Button bsSize="small" className="btn_default" type="submit">开始导出</Button>)
            }
          </Col>
        </FormGroup>
      </Form>
    )
  }
}

export default withRouter(connect(state => ({
  server: state.SERVER || {},
  log: state.LOG || {},
  channels: state.CHANNEL || [],
  sublibs: state.SUBLIB || [],
}), null)(Log))
