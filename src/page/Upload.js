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
var userStore = new Store({name: "userData"})
class Log extends Component {

  pickerFolder() {
    const {dispatch, upload} = this.props
    if (upload.loading) {
      return toastr.warning("正在执行上传任务")
    }
    var path = dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (path && path[0]) {
      var store = new Store({name: path[0].replace(/\//g, "_")})
      if (!store.has("failureNum")) {
        store.set("failureNum",1)
      }
      var fNum = store && store.get("failureNum")
      dispatch(actions.upload['success']({
        ...upload,
        path: path[0],
        savedNumber: store? store.size - fNum : 0,
        failureNumber: store? fNum - 1 : 0,
        allNumber: 0
      }))
      userStore.set('fileFolder_upload', path[0], {expires: 999})
    }
  }

  pickerFolderFailure() {
    const {dispatch, upload} = this.props
    if (upload.loading) {
      return toastr.warning("正在执行上传任务")
    }
    var path = dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (path) {
      dispatch(actions.upload['success']({
        ...upload,
        faildPath: path[0],
      }))
      userStore.set('fileFolder_upload_failure', path[0], {expires: 999})
    }
  }

  uploadFeature(e) {
    e.preventDefault();
    const {server, upload, dispatch} = this.props;
    if ((upload.savedNumber + upload.failureNumber) === upload.allNumber && upload.savedNumber !== 0) {
      return toastr.success("已经全部上传")
    }
    if (!server.ip) {
      return toastr.error("请填写IP")
    } else if (!server.port) {
      return toastr.error("请填写端口")
    }
    if (!upload.path) {
      return toastr.error("请指定图片目录")
    }
    if (!upload.faildPath) {
      return toastr.error("请指定上传失败图片保存目录")
    }
    if (!upload.sublibId) {
      return toastr.error("请指定分库，无分库请点击链接按钮")
    }
    dispatch(actions.upload_feature['request']())
  }

  clear() {
    const {dispatch, upload} = this.props
    if (upload.loading) {
      return toastr.warning("正在执行上传任务")
    }
    dispatch(actions.upload['failure']({clear: true}));
  }

  render() {
    const {upload, dispatch} = this.props
    return (
      <Form autoComplete="off" horizontal
            onSubmit={this.uploadFeature.bind(this)}>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            失败图片保存到 :
          </Col>
          <Col xs={7}>
            <InputGroup>
              <FormControl
                type="text"
                value={upload.faildPath}
                placeholder="指定失败图片存储的位置"
                onChange={(e) => dispatch(actions.upload['success']({
                  ...upload,
                  faildPath: e.target.value.toString().trim(),
                }))}
              />
              <InputGroup.Button>
                <Button
                  onClick={this.pickerFolderFailure.bind(this)}
                  className="btn_default"
                  bsSize="small">
                  选择目录
                </Button>
              </InputGroup.Button>
            </InputGroup>
          </Col>
        </FormGroup>
        {
          this.props.sublibs.length > 0 ? (
            <FormGroup bsSize="small"
            >
              <Col componentClass={ControlLabel} xs={3}>
                选择分库:
              </Col>
              <Col xs={7}>
                <FormControl
                  componentClass="select"
                  onChange={(e) => dispatch(actions.upload['success']({
                    ...upload,
                    sublibId: e.target.value
                  }))}
                  value={upload.sublibId}>
                  <option value="">请选择分库</option>
                  {
                    this.props.sublibs.filter(v => v.Id !== 2).map(v => (
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
          </Col>
          <Col style={{textAlign: "left"}} xs={7}>
            <a className="pull-right clearBtn" onClick={this.clear.bind(this)}>清除缓存</a>
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            上传图片目录 :
          </Col>
          <Col xs={7}>
            <InputGroup>
              <FormControl
                type="text"
                value={upload.path}
                placeholder="图片目录"
                onChange={(e) => dispatch(actions.upload['success']({
                  ...upload,
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
        {
          upload.savedNumber || upload.failureNumber ? (
            <FormGroup bsSize="small">
              <Col componentClass={ControlLabel} xs={3}>
                历史入库：
              </Col>
              <Col xs={7} componentClass={ControlLabel} style={{textAlign: "left"}}>
                成功 [ {upload.savedNumber} ] 条， 失败 [ {upload.failureNumber} ]条。
              </Col>
            </FormGroup>

          ) : null
        }
        {
          (upload.savedNumber || upload.failureNumber) && upload.allNumber ? (
            <Row>
              <Col xs={3} className="text-right">
                {`进度[ ${upload.savedNumber + upload.failureNumber} / ${upload.allNumber} ]`}
              </Col>
              <Col xs={7}>
                <ProgressBar
                  striped
                  now={Math.floor((upload.savedNumber + upload.failureNumber) / upload.allNumber * 100)}/>
              </Col>
            </Row>
          ) : null
        }
        <br/>
        <br/>

        <FormGroup>
          <Col xs={12} className="text-center">
            {
              upload.loading ?
                (<Button bsSize="small" className="btn_cancel"
                         onClick={() => dispatch(actions.upload_feature['failure']())}>取消任务</Button>)
                :
                (<Button bsSize="small" className="btn_default" type="submit">开始上传</Button>)
            }
          </Col>
        </FormGroup>
      </Form>
    )
  }
}

export default withRouter(connect(state => ({
  server: state.SERVER || {},
  upload: state.UPLOAD || {},
  sublibs: state.SUBLIB || [],
}), null)(Log))
