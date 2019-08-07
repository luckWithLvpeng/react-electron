import React, {Component} from 'react';
import {withRouter} from 'react-router-dom'
import * as actions from "../actions";
import {Button, Col, ControlLabel, Form, FormControl, FormGroup, InputGroup, ProgressBar, Row} from 'react-bootstrap'
import {connect} from "react-redux";
import $ from 'jquery'
import 'daterangepicker'
import moment from "moment/moment";
import toastr from "toastr";
import {withTranslation} from "react-i18next";

const electron = window.require('electron');
const Store = electron.remote.require('electron-store');
const {dialog} = electron.remote;
const fs = electron.remote.require('fs');
var store = new Store({name: "userData"})

class Log extends Component {

    resetTime() {
        const {log, dispatch, t, i18n} = this.props;
        var monthNames = "一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_")
        var daysOfWeek = "日_一_二_三_四_五_六".split("_")
        if (i18n.language === "ch") {
            monthNames = "一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_")
            daysOfWeek = "日_一_二_三_四_五_六".split("_")
        } else {
            monthNames = "JAN_FEB_MAR_APR_MAY_JUN_JUL_AUG_SEP_OCT_NOV_DEC".split("_")
            daysOfWeek = "S_M_T_W_T_F_S".split("_")
        }
        var rangerDate = {}
        rangerDate[t("today")] = [moment().startOf('day'), moment().endOf('day')];
        rangerDate[t("yesterday")] = [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf("day")];
        rangerDate[t("past 7 days")] = [moment().subtract(6, 'days').startOf('day'), moment()];
        rangerDate[t("past 30 days")] = [moment().subtract(29, 'days').startOf('day'), moment()];
        rangerDate[t("this month")] = [moment().startOf('month'), moment().endOf('month')];
        rangerDate[t("last month")] = [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')];
        $('input[name="filterDaterange"]').daterangepicker({
            timePicker: true,
            timePicker24Hour: true,
            timePickerSeconds: true,
            startDate: moment.unix(log.begin).format("YYYY-MM-DD HH:mm:ss"),
            endDate: moment.unix(log.end).format("YYYY-MM-DD HH:mm:ss"),
            locale: {
                'format': 'YYYY-MM-DD HH:mm:ss',
                'applyLabel': t("apply"),
                'cancelLabel': t("cancel"),
                'fromLabel': t("start"),
                'toLabel': t("end"),
                'monthNames': monthNames, // 不支持数组类型的翻译
                'daysOfWeek': daysOfWeek,
                customRangeLabel: t("custom")
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
        const {dispatch, log,t} = this.props
        if (log.loading) {
            return toastr.warning(t("download in progress"))
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
        const {server, log, dispatch,t} = this.props;
        if (!server.ip) {
            return toastr.error(t("please input IP"))
        } else if (!server.port) {
            return toastr.error(t("please input port"))
        }
        if (!log.path) {
            return toastr.error(t("specify a saved directory"))
        }
        try {
            fs.accessSync(log.path)
        } catch (e) {
            return toastr.error(t("specify a saved directory"))
        }
        dispatch(actions.export_log['request']())
    }

    render() {
        const {log, dispatch, t} = this.props
        return (
            <Form autoComplete="off" horizontal
                  onSubmit={this.exportLog.bind(this)}>
                <FormGroup bsSize="small">
                    <Col componentClass={ControlLabel} xs={3}>
                        {t("save directory")}:
                    </Col>
                    <Col xs={7}>
                        <InputGroup>
                            <FormControl
                                type="text"
                                value={log.path}
                                placeholder={t("save directory")}
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
                            value={log.max}
                            placeholder={t("limit number, export all data without filling in")}
                            onChange={(e) => dispatch(actions.log['success']({
                                ...log,
                                max: parseInt(e.target.value, 10) || ""
                            }))}
                        />
                    </Col>
                </FormGroup>
                <FormGroup bsSize="small">
                    <Col componentClass={ControlLabel} xs={3}>
                        {t("select time")} :
                    </Col>
                    <Col xs={7}>
                        <FormControl
                            type="text"
                            name={"filterDaterange"}
                            placeholder={t("select time")}
                        />
                    </Col>
                </FormGroup>
                <FormGroup bsSize="small">
                    <Col componentClass={ControlLabel} xs={3}>
                        {t("export mode")} :
                    </Col>
                    <Col xs={7}>
                        <FormControl
                            componentClass="select"
                            onChange={e => dispatch(actions.log['success']({
                                ...log,
                                logmode: e.target.value
                            }))}
                            value={log.logmode}>
                            <option value="1">{t("collection and feature image")}</option>
                            <option value="4">{t("collection, feature and scene image")}</option>
                            <option value="2">{t("collection image")}</option>
                            <option value="3">{t("feature image")}</option>
                            <option value="5">{t("scene image")}</option>

                        </FormControl>
                    </Col>
                </FormGroup>
                <FormGroup bsSize="small">
                    <Col componentClass={ControlLabel} xs={3}>
                        {t("whether match")} :
                    </Col>
                    <Col xs={7}>
                        <FormControl
                            componentClass="select"
                            onChange={e => dispatch(actions.log['success']({
                                ...log,
                                hit_count: e.target.value
                            }))}
                            value={log.hit_count}>
                            <option value="">{t("all")}</option>
                            <option value="1">{t("match")}</option>
                            <option value="0">{t("unmatch")}</option>
                        </FormControl>
                    </Col>
                </FormGroup>
                {
                    this.props.channels.length > 0 ? (
                        <FormGroup
                        >
                            <Col componentClass={ControlLabel} xs={3}>
                                {t("select camera")}:
                            </Col>
                            <Col xs={7}>
                                <FormControl
                                    componentClass="select"
                                    onChange={(e) => dispatch(actions.log['success']({
                                        ...log,
                                        channel_id: e.target.value
                                    }))}
                                    value={log.channel_id}>
                                    <option value="">{t("all")}</option>
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
                                {t("feature gallery")}:
                            </Col>
                            <Col xs={7}>
                                <FormControl
                                    componentClass="select"
                                    onChange={(e) => dispatch(actions.log['success']({
                                        ...log,
                                        sublib_id: e.target.value
                                    }))}
                                    value={log.sublib_id}>
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
                        {t("minimum score")} :
                    </Col>
                    <Col xs={7}>
                        <FormControl
                            type="text"
                            value={log.score_s}
                            placeholder={t("minimum score")}
                            onChange={(e) => dispatch(actions.log['success']({
                                ...log,
                                score_s: parseInt(e.target.value, 10) || 0
                            }))}
                        />
                    </Col>
                </FormGroup>
                <FormGroup bsSize="small">
                    <Col componentClass={ControlLabel} xs={3}>
                        {t("maximum score")} :
                    </Col>
                    <Col xs={7}>
                        <FormControl
                            type="text"
                            value={log.score_b}
                            placeholder={t("maximum score")}
                            onChange={(e) => dispatch(actions.log['success']({
                                ...log,
                                score_b: parseInt(e.target.value, 10) || 0
                            }))}
                        />
                    </Col>
                </FormGroup>
                <FormGroup bsSize="small">
                    <Col componentClass={ControlLabel} xs={3}>
                        {t("picture name")} :
                    </Col>
                    <Col xs={7}>
                        <FormControl
                            type="text"
                            value={log.name}
                            placeholder={t("picture name")}
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
                                {t("getting data")} ...
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
                                    t("export records",{allNumber:log.allNumber}) :
                                    t("save records",{allNumber:log.allNumber,savedNumber: log.savedNumber})}
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
                ) : null}
                <FormGroup>
                    <Col xs={12} className="text-center">
                        {
                            log.loading ?
                                (<Button bsSize="small" className="btn_cancel"
                                         onClick={() => dispatch(actions.export_log['failure']())}>{t("cancel task")}</Button>)
                                :
                                (<Button bsSize="small" className="btn_default"
                                         type="submit">{t("start export")}</Button>)
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
}), null)(withTranslation()(Log)))
