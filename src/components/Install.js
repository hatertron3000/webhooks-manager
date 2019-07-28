import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { Auth } from 'aws-amplify'
import Notification from './common/Notification'
import Button from './common/Button'

const lang =
{
    en: require('../lang/en.json')
}

class Install extends Component {
    constructor(props) {
        super(props)
        this.state = {
            code: '',
            scope: '',
            context: '',
            tosChecked: false,
            error: false,
            installation_complete: false,
            disabled: true,
        }
        this.onClickTOS = this.onClickTOS.bind(this)
        this.onClickSignup = this.onClickSignup.bind(this)
    }

    componentDidMount(props) {
        let params = new URLSearchParams(this.props.location.search)
        this.setState({
            code: params.get('code'),
            scope: params.get('scope'),
            context: params.get('context')
        })
    }

    async onClickSignup(e) {
        this.setState({
            disabled: true
        })
        const result = await Auth.signUp({
            username: this.state.context.split('/')[1],
            password: this.state.code,
            attributes: {
                name: this.state.context.split('/')[1]
            },
            validationData: [
                {
                    Name: 'code',
                    Value: this.state.code,
                },
                {
                    Name: 'scope',
                    Value: this.state.scope,
                },
                {
                    Name: 'context',
                    Value: this.state.context,
                },
            ]
        })
            .catch(err => console.log(err))

        console.log("result: ", result)
        if (result)
            this.setState({
                installation_complete: true,
            })
        else {
            this.setState({
                error: lang.en.installation_error
            })
        }
    }

    onClickTOS(e) {
        this.setState({
            tosChecked: e.target.checked,
            disabled: !e.target.checked
        })
    }

    render() {
        return (
            <div>
                <div className="row h-11">
                    <div className="col-6">
                        <div className="text-md" >
                            {this.props.message}
                        </div>
                    </div>
                </div>
                <div className="row mb-7">
                    <div className="col-12">
                        {this.state.error
                            ? <Notification type="warning" message={lang.en.installation_error} />
                            : null}
                        {this.state.installation_complete
                            ? <Redirect to="/dashboard" />
                            : null}
                    </div>
                </div>
                <div className="row mb-10">
                    <div className="col-3"></div>
                    <div className="col-6">
                        <div className={`form-check mb-3`}>
                            <input
                                type="checkbox"
                                id="tosInput"
                                className="form-check-input"
                                onClick={this.onClickTOS} />
                            <label
                                htmlFor="tosInput"
                                className="form-check-label text-muted align-top">
                                You agree to the <a href="#">terms of service</a> of The App!
                                    </label>
                        </div>
                        <div className="form-group">
                            <Button
                                disabled={this.state.disabled}
                                onClick={this.onClickSignup}
                                message={lang.en.signup}
                                type="primary"
                            />
                        </div>

                    </div>
                    <div className='col-3'></div>
                </div>
            </div>
        )
    }
}

export default Install
