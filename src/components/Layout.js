import React, {Component} from 'react';
import './Layout.css';
import Nav from './Nav'
import {Button, Col, ControlLabel, Form, FormControl, FormGroup, InputGroup} from 'react-bootstrap'
import {connect} from 'react-redux'
import {Route, Switch, withRouter} from 'react-router-dom'
import * as actions from '../actions'
import toastr from "toastr";
import Log from '../page/Log'
import Feature from '../page/Feature'
import Upload from '../page/Upload'
import RequestFeature from '../page/RequestFeature'
import Refresh from '../asset/refresh.png'
import {withTranslation} from 'react-i18next';

const electron = window.require('electron');
const Store = electron.remote.require('electron-store');
var userStore = new Store({name: "userData"})
var lang  = userStore.get("language", "ch")
toastr.options.showMethod = 'slideDown';
toastr.options.positionClass = 'toast-top-center';
toastr.options.progressBar = true;

class Layout extends Component {
    testIpAndPort(e) {
        e.preventDefault();
        const {dispatch, server,t} = this.props
        if (!server.ip) {
            return toastr.error(t("please input IP"));
        } else if (!server.port) {
            return toastr.error(t("please input port"));
        }
        dispatch(actions.server['request'](server))
    }

    componentDidMount() {
        this.props.history && this.props.history.push("/")
        const {dispatch, server} = this.props
        if (server.ip && server.port) {
            dispatch(actions.server['request'](server))
        }
    }

    render() {
        const {server, dispatch} = this.props;
        const {t, i18n} = this.props;
        return (
            <div className="App">
                <h1>
                    <div className="text-center">
                        <select name="lang" id="lang" value={lang} onChange={(e) => {
                            lang = e.target.value
                            i18n.changeLanguage(e.target.value)
                            userStore.set('language', e.target.value , {expires: 999})
                        }}>
                            <option value="ch">中文</option>
                            <option value="en">english</option>
                        </select>
                        {t("title")}
                    </div>
                </h1>
                <Nav/>
                <div className="content">
                    <div>
                        <Form autoComplete="off" horizontal
                              onSubmit={this.testIpAndPort.bind(this)}>
                            <FormGroup bsSize="small">
                                <Col componentClass={ControlLabel} xs={3}>
                                    {t("device address")} :
                                </Col>
                                <Col xs={4}>
                                    <FormControl
                                        type="text"
                                        value={server.ip}
                                        placeholder="IP"
                                        onChange={(e) => {
                                            dispatch(actions.server['success']({
                                                ...server,
                                                ip: e.target.value.toString().trim(),
                                                test: false
                                            }))
                                            dispatch(actions.channel['failure']())
                                            dispatch(actions.sublib['failure']())
                                        }}
                                    />
                                </Col>
                                <span className="pull-left  control-label">:</span>
                                <Col xs={3}>
                                    <InputGroup>
                                        <FormControl
                                            type="text"
                                            value={server.port}
                                            placeholder={t("port")}
                                            onChange={(e) => {
                                                dispatch(actions.server['success']({
                                                    ...server,
                                                    port: e.target.value.toString().trim(),
                                                    test: false
                                                }))
                                                dispatch(actions.channel['failure']())
                                                dispatch(actions.sublib['failure']())
                                            }}
                                        />
                                        <InputGroup.Button>
                                            <Button
                                                bsSize="small"
                                                type={"submit"}
                                                className={server.test ? "success btn_default" : "btn_default"}>
                                                <div style={{width: "74px"}}>
                                                    {server.test ? <img src={Refresh} style={{
                                                        verticalAlign: "text-bottom",
                                                        display: "inline-block",
                                                        marginRight: "5px"
                                                    }} alt=""/> : ""}
                                                    {server.test ? <span>{t("connected")}</span> : t("connect")}
                                                </div>
                                            </Button>
                                        </InputGroup.Button>
                                    </InputGroup>
                                </Col>
                            </FormGroup>
                        </Form>
                        <hr style={{borderColor: "#0054FF"}}/>
                        <Switch>
                            <Route exact path="/" component={Upload}/>
                            <Route path="/log" component={Log}/>
                            <Route path="/feature" component={Feature}/>
                            <Route path="/requestfeature" component={RequestFeature}/>

                        </Switch>
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(connect(state => ({
    server: state.SERVER || {}
}), null)(withTranslation()(Layout)))
