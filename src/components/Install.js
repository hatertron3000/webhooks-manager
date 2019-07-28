import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { Auth } from 'aws-amplify'
import { Form, Container, Alert, Button, Card } from 'react-bootstrap'


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
            <Container>
                <h1>
                    {lang.en.thank_you}
                </h1>
                {this.state.error
                    ? <Alert variant="warning">
                        {lang.en.installation_error}
                    </Alert>
                    : null}
                {this.state.installation_complete
                    ? <Alert variant="success">
                        <Alert.Heading>{lang.en.installation_success}</Alert.Heading>
                        {lang.en.reopen_app}
                    </Alert>
                    : null}
                <Form>
                    {lang.en.tos_agreement}
                    <Form.Group controlId="tosInpt">
                        <Form.Check
                            type="checkbox"
                            id="tos">
                            <Form.Check.Input type="checkbox" onClick={this.onClickTOS} />
                            <Form.Check.Label>You agree to the <a href="#">terms of service</a> of the app.</Form.Check.Label>
                        </Form.Check>

                    </Form.Group>
                    <Button
                        disabled={this.state.disabled}
                        onClick={this.onClickSignup}
                        variant="primary">
                        {lang.en.signup}
                    </Button>
                </Form>
            </Container >
        )
    }
}

export default Install
