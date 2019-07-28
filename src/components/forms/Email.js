import React, { Component } from 'react'

class Email extends Component {

    constructor(props) {
        super(props)
        this.state = {
            email: '',
            emailIsValid: false,
        }

        this.onChangeEmail = this.onChangeEmail.bind(this)
    }

    emailIsValid(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    onChangeEmail(e) {
        this.setState({
            email: e.target.value,
            emailIsValid: this.emailIsValid(e.target.value)
        })
    }

    render() {
        return <div className="form-group">
            <input
                type="email"
                className={`form-control border border-${this.state.emailIsValid ? 'success' : 'primary'}`}
                id="emailInput"
                onChange={this.onChangeEmail}
                placeholder="username@example.com" />
            <small class="form-text text-muted">Email Address</small>
        </div>
    }
}

export default Email