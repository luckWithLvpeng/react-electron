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

toastr.options.showMethod = 'slideDown';
toastr.options.positionClass = 'toast-top-center';
toastr.options.progressBar = true;

class Layout extends Component {
  testIpAndPort(e) {
    e.preventDefault();
    const {dispatch, server} = this.props
    if (!server.ip) {
      return toastr.error("请输入IP!");
    } else if (!server.port) {
      return toastr.error("请输入端口!");
    }
    dispatch(actions.server['request'](server))
  }
  componentDidMount() {
    this.props.history && this.props.history.push("/")
    const {dispatch,server} = this.props
    if (server.ip && server.port) {
      dispatch(actions.server['request'](server))
    }
  }
  render() {
    const {server, dispatch} = this.props;
    return (
      <div className="App">
        <h1> </h1>
        <Nav/>
        <div className="content">
          <div>
            <Form autoComplete="off" horizontal
                  onSubmit={this.testIpAndPort.bind(this)}>
              <FormGroup bsSize="small">
                <Col componentClass={ControlLabel} xs={3}>
                  盒子地址 :
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
                      placeholder="端口"
                      onChange={(e) => dispatch(actions.server['success']({
                        ...server,
                        port: e.target.value.toString().trim(),
                        test: false
                      }))}
                    />
                    <InputGroup.Button>
                      <Button
                        bsSize="small"
                        type={"submit"}
                        className={server.test ? "success btn_default" : "btn_default"}>
                        {server.test ? "已连接" : "链接"}
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
            </Switch>
          </div>
        </div>
      </div>
    )
  }
}

export default withRouter(connect(state => ({
  server: state.SERVER || {}
}), null)(Layout))
