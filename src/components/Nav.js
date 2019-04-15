import React, {Component} from 'react';
import {NavLink} from 'react-router-dom'
import "./Nav.css"
class Nav extends Component {
  render() {
    return (
      <div className="left_nav">
        <NavLink
          to="/"
          exact
          className="upload"
          activeClassName="active upload_active"
        >
          入库
        </NavLink>
        <NavLink
          to="/log"
          className="log"
          activeClassName="active log_active"
        >
          导出历史日志
        </NavLink>
        <NavLink
          to="/feature"
          className="feature"
          activeClassName="active feature_active"
        >
          导出底库图片
        </NavLink>
        <NavLink
          to="/requestfeature"
          className="requestfeature"
          activeClassName="active requestfeature_active"
        >
          获取图片特征
        </NavLink>
      </div>
    )
  }
}

export default (Nav);
