import React, { Component } from 'react'
import { API } from 'aws-amplify';
import Loader from '../common/Loader'
import Notification from '../common/Notification'
import { Card } from 'react-bootstrap'
import HookTypeList from './hooks/HookTypeList'


const config = require('../../config.json')

const lang = {
    en: require('../../lang/en.json')
}

class Hooks extends Component {
    constructor(props) {
        super(props)
        this.state = {
            hooks: [],
            loading: true,
            error: false,
        }

        //bindings
        this.postHook = this.postHook.bind(this)
        this.putHook = this.putHook.bind(this)
        this.deleteHook = this.deleteHook.bind(this)
        this.setHooksState = this.setHooksState.bind(this)
    }

    setHooksState(hooks) {
        this.setState({ hooks })
    }

    postHook(scope) {
        return new Promise((resolve, reject) => {
            const init = {
                body: { scope, destination: process.env.REACT_APP_WEBHOOKSENDPOINT },
            }

            API.post(process.env.REACT_APP_WEBHOOKSAPI, process.env.REACT_APP_WEBHOOKSAPIPATH, init)
                .then(res => {
                    if (!res.data) {
                        reject(new Error('Error creating hook'))
                    }
                    else {
                        let hooks = this.state.hooks
                        hooks.push(res.data)
                        this.setState({
                            hooks
                        })
                        this.props.populateAside({ title: res.data.scope, content: res.data })
                        resolve(res.data)
                    }

                })
                .catch(err => reject(err))
        })
    }

    deleteHook(id) {
        return new Promise((resolve, reject) => {
            API.del(process.env.REACT_APP_WEBHOOKSAPI, `${process.env.REACT_APP_WEBHOOKSAPIPATH}/${id}`)
                .then(res => {
                    if (!res.data)
                        reject('Error deleting hook')
                    else {
                        let hooks = this.state.hooks
                        hooks.filter(hook => hook.id !== res.data.id)
                        this.setState({ hooks })
                    }
                    resolve(res.data)
                })
        })
    }

    putHook({ id, body }) {
        return new Promise((resolve, reject) => {
            const init = {
                body
            }
            API.put(process.env.REACT_APP_WEBHOOKSAPI, `${process.env.REACT_APP_WEBHOOKSAPIPATH}/${id}`, init)
                .then(res => {
                    if (!res.data)
                        reject('Error updating hook')
                    else {
                        let hooks = this.state.hooks
                        hooks.map(hook => hook.scope === res.data.scope
                            ? res.data
                            : hook)
                        this.setState({
                            hooks
                        })
                        resolve(res.data)
                    }
                })
                .catch(err => reject(err))
        })
    }

    componentDidMount() {
        API.get(process.env.REACT_APP_WEBHOOKSAPI, process.env.REACT_APP_WEBHOOKSAPIPATH)
            .then(res => {
                if (res.data)
                    this.setState({
                        hooks: res.data.length > 0 ? res.data : [],
                        loading: false
                    })
                else
                    this.setState({
                        hooks: [],
                        loading: false,
                        error: true,
                    })
            })
            .catch(err => {
                this.setState({
                    hooks: [],
                    loading: false,
                    error: true
                })
            })

    }

    render() {
        return <Card as="div" className="bg-white text-dark" style={{ height: '100%', width: '100%' }}>
            <Card.Title as="h3" className="py-4 px-4 mb-0 bg-dark text-light">{lang.en.webhooks_header}</Card.Title>
            {this.state.loading
                ? <div className="col-12 px-4 pb-4">
                    <div className="d-flex justify-content-center"><Loader className="mt-50" /></div>
                </div>
                : this.state.error
                    ? <Notification type="warning" message={lang.en.load_hooks_error} />
                    : config.hooks.map((hookType, index) => <HookTypeList
                        hooks={this.state.hooks}
                        postHook={this.postHook}
                        putHook={this.putHook}
                        deleteHook={this.deleteHook}
                        hookType={hookType}
                        populateAside={this.props.populateAside}
                        setHooksState={this.setHooksState}
                        key={index} />)
            }
        </Card>
    }
}

export default Hooks