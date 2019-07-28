import React, { Component } from 'react'
import { Route } from 'react-router-dom'
import { Auth } from 'aws-amplify'
import Notification from './common/Notification'
import Loader from './common/Loader'

const lang = {
    en: require('../lang/en.json')
}

class PrivateRoute extends Component {
    constructor(props) {
        super(props)
        this.state = {
            authenticated: null,
            authInProgress: true
        }
    }

    componentDidMount(props) {
        Auth.currentAuthenticatedUser()
            .then(user => {
                this.setState({
                    authenticated: true
                })
            })
            .catch(err => console.log('error from private route: ', err))
    }

    render() {
        return this.state.authenticated
            ? <Route exact path={this.props.path} component={this.props.component} {...this.props} />
            : this.state.authInProgress
                ? <Route exact path={this.props.path} render={() => <Loader />} />
                : <Route exact path={this.props.path} render={() => <Notification message={lang.en.auth_error} type='danger' />} />

    }
}

export default PrivateRoute