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
var savePath = userStore.get('feature_save_path');
var imgPath = userStore.get('feature_img_path');
class RequestFeature extends Component {
  state ={
    imgPath:imgPath,
    savePath:savePath
  }

  pickerImgFolder() {
    const { requestfeature} = this.props
    if (requestfeature.loading) {
      return toastr.warning("正在获取特征中")
    }
    var path = dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (path && path[0]) {
      userStore.set("feature_img_path",path[0])
      this.setState({imgPath:path[0]})
    }
  }

  pickerSaveFolder() {
    const { requestfeature} = this.props
    if (requestfeature.loading) {
      return toastr.warning("正在获取特征中")
    }
    var path = dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (path && path[0]) {
      userStore.set("feature_save_path",path[0])
      this.setState({savePath:path[0]})
    }
  }

  requestFeature(e) {
    e.preventDefault();
    const {server, requestfeature,dispatch} = this.props;
    const {imgPath,savePath} = this.state
    if (requestfeature.loading) {
      return toastr.warning("正在获取特征中")
    }else if(requestfeature.success) {
      return toastr.success("获取特征成功")
    }
    if (!server.ip) {
      return toastr.error("请填写IP")
    } else if (!server.port) {
      return toastr.error("请填写端口")
    }
    if (!imgPath||imgPath==="") {
      return toastr.error("请指定图片目录")
    }
    if (!savePath||savePath==="") {
      return toastr.error("请指定特征存储目录")
    }

    dispatch(actions.request_feature['request']({
      payload:{imgPath,savePath}
    }))
  }

  clear(e) {
    e.preventDefault()
    e.stopPropagation()
    const {dispatch, requestfeature} = this.props
    dispatch(actions.request_feature['failure']());

  }

  render() {
    const {requestfeature, dispatch} = this.props
    const {loading,imgNum,complete,requestOkNum,requestErrNum,errorText} = requestfeature
    const {imgPath,savePath} = this.state
    return (
      <Form autoComplete="off" horizontal
            onSubmit={this.requestFeature.bind(this)}>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            提取图片目录 :
          </Col>
          <Col xs={7}>
            <InputGroup>
              <FormControl
                type="text"
                value={imgPath}
                onChange={()=>this.pickerImgFolder()}
                placeholder="图片目录"
              />
              <InputGroup.Button>
                <Button
                  onClick={this.pickerImgFolder.bind(this)}
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
            保存特征目录 :
          </Col>
          <Col xs={7}>
            <InputGroup>
              <FormControl
                type="text"
                value={savePath}
                onChange={()=>this.pickerSaveFolder()}
                placeholder="图片目录"
              />
              <InputGroup.Button>
                <Button
                  onClick={this.pickerSaveFolder.bind(this)}
                  className="btn_default"
                  bsSize="small">
                  选择目录
                </Button>
              </InputGroup.Button>
            </InputGroup>
          </Col>
        </FormGroup>

        {
          loading ? (
            <FormGroup bsSize="small">
              <Col componentClass={ControlLabel} xs={3}>
                遍历目录中...
              </Col>
              <Col xs={7} componentClass={ControlLabel} style={{textAlign: "left"}}>
                {`${imgNum}张图片`}
              </Col>
            </FormGroup>

          ) : null
        }
        {
          loading? 
            <Row>
              <Col xs={3} className="text-right">
                {`进度[ ${requestOkNum} / ${imgNum} ]`}
              </Col>
              <Col xs={7}>
                <ProgressBar
                  striped
                  now={Math.floor((requestOkNum) / imgNum * 100)}/>
              </Col>
            </Row>
           : null
        }
        {
          complete ? (
            <FormGroup bsSize="small">
              <Col componentClass={ControlLabel} xs={3}>
                {"特征提取"}
              </Col>
              <Col xs={7} componentClass={ControlLabel} style={{textAlign: "left"}}>
                成功 [ {requestOkNum} ] 条， 失败 [ {requestErrNum} ]条。
              </Col>
            </FormGroup>

          ) : null
        }
        <br/>

        {errorText ? (
          <div className={"text-danger  text-center"}>
            {
              errorText
            }
          </div>
        ): null}

        <br/>
        <FormGroup>
          <Col xs={12} className="text-center">
                {loading? <Button bsSize="small" className="btn_cancel"
                         onClick={(e) => this.clear(e)}>取消任务</Button>  :
                <Button bsSize="small" className="btn_default" type="submit">开始上传</Button>}
          </Col>
        </FormGroup>
      </Form>
    )
  }
}

export default withRouter(connect(state => ({
  server: state.SERVER || {},
  requestfeature: state.REQUESTFEATURE || {},
}), null)(RequestFeature))
