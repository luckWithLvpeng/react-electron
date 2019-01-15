import React, {Component} from 'react';
import {withRouter} from 'react-router-dom'
import * as actions from "../actions";
import {Button, Col, ControlLabel, Form, FormControl, FormGroup, InputGroup, ProgressBar, Row} from 'react-bootstrap'
import {connect} from "react-redux";
import 'daterangepicker'
import toastr from "toastr";

const electron = window.require('electron');
const {dialog} = electron.remote;
const Store = electron.remote.require('electron-store');
var store = new Store({name: "userData"})
class Log extends Component {
  pickerFolder() {
    const {dispatch, feature} = this.props
    if(feature.loading) {
      return toastr.warning("正在执行下载任务")
    }
    var path = dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (path) {
      dispatch(actions.feature['success']({
        ...feature,
        path: path[0],
      }))
      store.set('fileFolder_feature', path[0])
    }
  }

  exportFeature(e) {
    e.preventDefault();
    const {server, feature, dispatch} = this.props;
    if (!server.ip) {
      return toastr.error("请填写IP")
    } else if (!server.port) {
      return toastr.error("请填写端口")
    }
    if (!feature.path) {
      return toastr.error("请指定保存目录")
    }
    dispatch(actions.export_feature['request']())
  }

  render() {
    const {feature, dispatch} = this.props
    return (
      <Form autoComplete="off" horizontal
            onSubmit={this.exportFeature.bind(this)}>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            保存目录 :
          </Col>
          <Col xs={7}>
            <InputGroup>
              <FormControl
                type="text"
                value={feature.path}
                placeholder="保存目录"
                onChange={(e) => dispatch(actions.feature['success']({
                  ...feature,
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
              value={feature.max}
              placeholder="限制数量,不填则导出所有数据"
              onChange={(e) => dispatch(actions.feature['success']({
                ...feature,
                max: parseInt(e.target.value, 10) || ""
              }))}
            />
          </Col>
        </FormGroup>
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
                  onChange={(e) => dispatch(actions.feature['success']({
                    ...feature,
                    sublibId: e.target.value
                  }))}
                  value={feature.sublibId}>
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
            入库状态 :
          </Col>
          <Col xs={7}>
            <FormControl
              componentClass="select"
              onChange={e => dispatch(actions.feature['success']({
                ...feature,
                status: e.target.value
              }))}
              value={feature.status}>
              <option value="0">全部</option>
              <option value="1">成功</option>
              <option value="2">失败</option>
            </FormControl>
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            照片名 :
          </Col>
          <Col xs={7}>
            <FormControl
              type="text"
              value={feature.name}
              placeholder="照片名"
              onChange={(e) => dispatch(actions.feature['success']({
                ...feature,
                name: e.target.value.trim()
              }))}
            />
          </Col>
        </FormGroup>
        {
          feature.allNumber && feature.savedNumber !== feature.allNumber ? (
            <Row>
              <Col xs={3} className="text-right">
                获取数据 ...
              </Col>
              <Col xs={7}>
                <ProgressBar
                  striped
                  now={Math.floor(feature.acquiredNumber / feature.allNumber * 100)}/>
              </Col>
            </Row>
          ) : null
        }
        {
          feature.savedNumber ? (
            <Row>
              <Col xs={3} className="text-right">
                {feature.savedNumber === feature.allNumber ?
                  `导出 [ ${feature.allNumber} ] 条记录` :
                  ` 保存数据 [ ${feature.savedNumber} / ${feature.allNumber} ]`}
              </Col>
              <Col xs={7}>
                <ProgressBar
                  striped
                  now={Math.floor(feature.savedNumber / feature.allNumber * 100)}/>
              </Col>
            </Row>
          ) : null
        }
        {feature.error ? (
          <div className={"text-danger text-center"}>
            失败信息： {feature.error}
          </div>
        ): null}
        <br/>
        <FormGroup>
          <Col xs={12} className="text-center">
            {
              feature.loading ?
                (<Button bsSize="small" className="btn_cancel" onClick={() => dispatch(actions.export_feature['failure']())}>取消任务</Button>)
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
  feature: state.FEATURE || {},
  sublibs: state.SUBLIB || [],
}), null)(Log))
