import React, {Component} from 'react';
import {withRouter} from 'react-router-dom'
import * as actions from "../actions";
import {Button, Col, ControlLabel, Form, FormControl, FormGroup, InputGroup, ProgressBar, Row} from 'react-bootstrap'
import {connect} from "react-redux";
import 'daterangepicker'
import toastr from "toastr";
import {withTranslation} from "react-i18next";

const electron = window.require('electron');
const {dialog} = electron.remote;
const Store = electron.remote.require('electron-store');
var userStore = new Store({name: "userData"})
class Log extends Component {

  pickerFolder() {
    const {dispatch, upload,t} = this.props
    if (upload.loading) {
      return toastr.warning(t("upload in progress"))
    }
    var path = dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (path && path[0]) {
      var store = new Store({name: path[0].replace(/[\\/:]/g,"_")})
      dispatch(actions.upload['success']({
        ...upload,
        path: path[0],
        savedNumber: store? store.get("savedNumber") || 0: 0,
        failureNumber: store? store.get("failureNumber") || 0: 0,
        allNumber: 0
      }))
      userStore.set('fileFolder_upload', path[0], {expires: 999})
    }
  }

  pickerFolderFailure() {
    const {dispatch, upload,t} = this.props
    if (upload.loading) {
      return toastr.warning(t("upload in progress"))
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
    const {server, upload, dispatch,t} = this.props;
    if ((upload.savedNumber + upload.failureNumber) === upload.allNumber && upload.allNumber !== 0) {
      return toastr.success(t("all uploaded"))
    }
    if (!server.ip) {
      return toastr.error(t("please input IP"))
    } else if (!server.port) {
      return toastr.error(t("please input port"))
    }
    if (!upload.path) {
      return toastr.error(t("please specify the picture folder"))
    }
    if (!upload.faildPath) {
      return toastr.error(t("please specify the failed upload picture folder"))
    }
    if (!upload.sublibId) {
      return toastr.error(t("please specify library if not please reconnect"))
    }
    dispatch(actions.upload_feature['request']())
  }

  clear() {
    const {dispatch, upload,t} = this.props
    if (upload.loading) {
      return toastr.warning(t("upload in progress"))
    }
    dispatch(actions.upload['failure']({clear: true}));
  }

  render() {
    const {upload, dispatch,t} = this.props
    return (
      <Form autoComplete="off" horizontal
            onSubmit={this.uploadFeature.bind(this)}>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            {t("failed image saved to")} :
          </Col>
          <Col xs={7}>
            <InputGroup>
              <FormControl
                type="text"
                value={upload.faildPath}
                placeholder={t("failed image saved to")}
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
                  {t("select folder")}
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
                {t("select library")}:
              </Col>
              <Col xs={7}>
                <FormControl
                  componentClass="select"
                  onChange={(e) => dispatch(actions.upload['success']({
                    ...upload,
                    sublibId: e.target.value
                  }))}
                  value={upload.sublibId}>
                  <option value="">{t("please select library")}</option>
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
            <a className="pull-right clearBtn" onClick={this.clear.bind(this)}>{t("clear cache")}</a>
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            {t("upload picture folder")} :
          </Col>
          <Col xs={7}>
            <InputGroup>
              <FormControl
                type="text"
                value={upload.path}
                placeholder={t("upload picture folder")}
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
                  {t("select folder")}
                </Button>
              </InputGroup.Button>
            </InputGroup>
          </Col>
        </FormGroup>
        {
          upload.loading ? (
            <FormGroup bsSize="small">
              <Col componentClass={ControlLabel} xs={3}>
                {t("traversing through directories")}...
              </Col>
              <Col xs={7} componentClass={ControlLabel} style={{textAlign: "left"}}>
                {upload.allNumber}
              </Col>
            </FormGroup>

          ) : null
        }
        {
          (upload.savedNumber || upload.failureNumber) && upload.allNumber && !upload.traversing ? (
            <Row>
              <Col xs={3} className="text-right">
                {t("progress") + `[ ${upload.savedNumber + upload.failureNumber} / ${upload.allNumber} ]`}
              </Col>
              <Col xs={7}>
                <ProgressBar
                  striped
                  now={Math.floor((upload.savedNumber + upload.failureNumber) / upload.allNumber * 100)}/>
              </Col>
            </Row>
          ) : null
        }
        {
          upload.savedNumber || upload.failureNumber ? (
            <FormGroup bsSize="small">
              <Col componentClass={ControlLabel} xs={3}>
                {upload.loading ? t("upload information"): t("upload history")}
              </Col>
              <Col xs={7} componentClass={ControlLabel} style={{textAlign: "left"}}>
                {t("success")} [ {upload.savedNumber} ] ，{t("fail")}  [ {upload.failureNumber} ]。
              </Col>
            </FormGroup>

          ) : null
        }
        <br/>

        {upload.errorText ? (
          <div className={"text-danger  text-center"}>
            {
              upload.errorText
            }
          </div>
        ): null}

        <br/>
        <FormGroup>
          <Col xs={12} className="text-center">
            {
              upload.loading ?
                (<Button bsSize="small" className="btn_cancel"
                         onClick={() => dispatch(actions.upload_feature['failure']())}>{t("cancel task")}</Button>)
                :
                (<Button bsSize="small" className="btn_default" type="submit">{t("start upload")}</Button>)
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
}), null)(withTranslation()(Log)))
