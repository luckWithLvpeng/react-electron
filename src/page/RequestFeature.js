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
var savePath = userStore.get('feature_save_path');
var imgPath = userStore.get('feature_img_path');

class RequestFeature extends Component {
    state = {
        imgPath: imgPath,
        savePath: savePath
    }

    pickerImgFolder() {
        const {requestfeature, t} = this.props
        if (requestfeature.loading) {
            return toastr.warning(t("in the process of acquiring features"))
        }
        var path = dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        if (path && path[0]) {
            userStore.set("feature_img_path", path[0])
            this.setState({imgPath: path[0]})
        }
    }

    pickerSaveFolder() {
        const {requestfeature, t} = this.props
        if (requestfeature.loading) {
            return toastr.warning(t("in the process of acquiring features"))
        }
        var path = dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        if (path && path[0]) {
            userStore.set("feature_save_path", path[0])
            this.setState({savePath: path[0]})
        }
    }

    requestFeature(e) {
        e.preventDefault();
        const {server, requestfeature, dispatch, t} = this.props;
        const {imgPath, savePath} = this.state
        if (requestfeature.loading) {
            return toastr.warning(t("in the process of acquiring features"))
        } else if (requestfeature.success) {
            return toastr.success(t("success in feature acquisition"))
        }
        if (!server.ip) {
            return toastr.error(t("please input IP"))
        } else if (!server.port) {
            return toastr.error(t("please input port"))
        }
        if (!imgPath || imgPath === "") {
            return toastr.error(t("please specify the picture folder"))
        }
        if (!savePath || savePath === "") {
            return toastr.error(t("please specify the feature storage directory"))
        }

        dispatch(actions.request_feature['request']({
            payload: {imgPath, savePath}
        }))
    }

    clear(e) {
        e.preventDefault()
        e.stopPropagation()
        const {dispatch} = this.props
        dispatch(actions.request_feature['failure']());

    }

    render() {
        const {requestfeature, t} = this.props
        const {loading, imgNum, complete, requestOkNum, requestErrNum, errorText} = requestfeature
        const {imgPath, savePath} = this.state
        return (
            <Form autoComplete="off" horizontal
                  onSubmit={this.requestFeature.bind(this)}>
                <FormGroup bsSize="small">
                    <Col componentClass={ControlLabel} xs={3}>
                        {t("extract picture folder")} :
                    </Col>
                    <Col xs={7}>
                        <InputGroup>
                            <FormControl
                                type="text"
                                value={imgPath}
                                onChange={() => this.pickerImgFolder()}
                                placeholder={t("extract picture folder")}
                            />
                            <InputGroup.Button>
                                <Button
                                    onClick={this.pickerImgFolder.bind(this)}
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
                        {t("feature save to")} :
                    </Col>
                    <Col xs={7}>
                        <InputGroup>
                            <FormControl
                                type="text"
                                value={savePath}
                                onChange={() => this.pickerSaveFolder()}
                                placeholder={t("feature save to")}
                            />
                            <InputGroup.Button>
                                <Button
                                    onClick={this.pickerSaveFolder.bind(this)}
                                    className="btn_default"
                                    bsSize="small">
                                    {t("select folder")}
                                </Button>
                            </InputGroup.Button>
                        </InputGroup>
                    </Col>
                </FormGroup>

                {
                    loading ? (
                        <FormGroup bsSize="small">
                            <Col componentClass={ControlLabel} xs={3}>
                                {t("traversing through directories")} ...
                            </Col>
                            <Col xs={7} componentClass={ControlLabel} style={{textAlign: "left"}}>
                                {imgNum}
                            </Col>
                        </FormGroup>

                    ) : null
                }
                {
                    loading ?
                        <Row>
                            <Col xs={3} className="text-right">
                                {t("progress") + `[ ${requestOkNum} / ${imgNum} ]`}
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
                                {t("feature extraction")}
                            </Col>
                            <Col xs={7} componentClass={ControlLabel} style={{textAlign: "left"}}>
                                {t("success")} [ {requestOkNum} ] ， {t("fail")} [ {requestErrNum} ]。
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
                ) : null}

                <br/>
                <FormGroup>
                    <Col xs={12} className="text-center">
                        {loading ? <Button bsSize="small" className="btn_cancel"
                                           onClick={(e) => this.clear(e)}>{t("cancel task")}</Button> :
                            <Button bsSize="small" className="btn_default" type="submit">{t("start upload")}</Button>}
                    </Col>
                </FormGroup>
            </Form>
        )
    }
}

export default withRouter(connect(state => ({
    server: state.SERVER || {},
    requestfeature: state.REQUESTFEATURE || {},
}), null)(withTranslation()(RequestFeature)))
