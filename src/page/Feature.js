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
var store = new Store({name: "userData"})
class Log extends Component {
  pickerFolder() {
    const {dispatch, feature,t} = this.props
    if(feature.loading) {
      return toastr.warning(t("download in progress"))
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
    const {server, feature, dispatch,t} = this.props;
    if (!server.ip) {
      return toastr.error(t("please input IP"))
    } else if (!server.port) {
      return toastr.error(t("please input port"))
    }
    if (!feature.path) {
      return toastr.error(t("specify a saved directory"))
    }
    dispatch(actions.export_feature['request']())
  }

  render() {
    const {feature, dispatch,t} = this.props
    return (
      <Form autoComplete="off" horizontal
            onSubmit={this.exportFeature.bind(this)}>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            {t("save directory")} :
          </Col>
          <Col xs={7}>
            <InputGroup>
              <FormControl
                type="text"
                value={feature.path}
                placeholder={t("save directory")}
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
                  {t("select folder")}
                </Button>
              </InputGroup.Button>
            </InputGroup>
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            {t("upload at most")} :
          </Col>
          <Col xs={7}>
            <FormControl
              type="text"
              value={feature.max}
              placeholder={t("limit number, export all data without filling in")}
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
                {t("feature gallery")}:
              </Col>
              <Col xs={7}>
                <FormControl
                  componentClass="select"
                  onChange={(e) => dispatch(actions.feature['success']({
                    ...feature,
                    sublibId: e.target.value
                  }))}
                  value={feature.sublibId}>
                  <option value="">{t("all")}</option>
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
            {t("upload status")} :
          </Col>
          <Col xs={7}>
            <FormControl
              componentClass="select"
              onChange={e => dispatch(actions.feature['success']({
                ...feature,
                status: e.target.value
              }))}
              value={feature.status}>
              <option value="0">{t("all")}</option>
              <option value="1">{t("success")}</option>
              <option value="2">{t("fail")}</option>
            </FormControl>
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} xs={3}>
            {t("face image name")} :
          </Col>
          <Col xs={7}>
            <FormControl
              type="text"
              value={feature.name}
              placeholder= {t("face image name")}
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
                {t("getting data")} ...
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
                    t("export records",{allNumber:feature.allNumber}) :
                    t("save records",{allNumber:feature.allNumber,savedNumber: feature.savedNumber})}
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
            {t("failure message")}： {feature.error}
          </div>
        ): null}
        <br/>
        <FormGroup>
          <Col xs={12} className="text-center">
            {
              feature.loading ?
                (<Button bsSize="small" className="btn_cancel" onClick={() => dispatch(actions.export_feature['failure']())}>{t("cancel task")}</Button>)
                :
                (<Button bsSize="small" className="btn_default" type="submit">{t("start export")}</Button>)
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
}), null)(withTranslation()(Log)))
