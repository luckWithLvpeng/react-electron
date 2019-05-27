import React, {Component} from 'react';
import {NavLink} from 'react-router-dom'
import "./Nav.css"
import {withTranslation} from 'react-i18next';
class Nav extends Component {
    render() {
        const {t} = this.props
        return (
            <div className="left_nav">
                <NavLink
                    to="/"
                    exact
                    className="upload"
                    activeClassName="active upload_active"
                >
                    {t("upload image to library")}
                </NavLink>
                <NavLink
                    to="/log"
                    className="log"
                    activeClassName="active log_active"
                >
                    {t("export history log")}
                </NavLink>
                <NavLink
                    to="/feature"
                    className="feature"
                    activeClassName="active feature_active"
                >
                    {t("export image from library")}
                </NavLink>
                <NavLink
                    to="/requestfeature"
                    className="requestfeature"
                    activeClassName="active requestfeature_active"
                >
                    {t("get picture features")}
                </NavLink>
            </div>
        )
    }
}

export default (withTranslation()(Nav));
