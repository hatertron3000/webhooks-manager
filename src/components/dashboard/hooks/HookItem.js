import React from 'react'
import {
    Row,
    Col,
    ButtonGroup,
    Button
} from 'react-bootstrap'

const lang = {
    en: require('../../../lang/en.json')
}

export default function HookItem({ event, hook, hooks, populateAside, putHook, postHook, deleteHook, setHooksState, currentEvents }) {
    return (<Row as="div" className="d-flex justify-content-between">
        <Col>{event}</Col>
        <Col className="d-flex justify-content-end">
            {currentEvents.includes(event)
                ? <ButtonGroup>
                    <Button variant="info" onClick={() => populateAside({
                        title: event,
                        content: hook
                    })}>
                        {lang.en.view_label}
                    </Button>
                    {hook.is_active
                        ? <Button
                            variant="success"
                            onClick={() => {
                                putHook({
                                    id: hook.id,
                                    body: {
                                        is_active: false
                                    }
                                })
                                    .then(data => {
                                        let newHooks = hooks.map(hook => hook.id === data.id ? data : hook)
                                        setHooksState(newHooks)
                                        populateAside({
                                            title: data.scope,
                                            content: data
                                        })
                                    })
                                    .catch(err => console.log(err))
                            }}>
                            {lang.en.pause_label}
                        </Button>
                        : <Button
                            variant="light"
                            onClick={() => {
                                console.log(hook)
                                putHook({
                                    id: hook.id,
                                    body: {
                                        is_active: true
                                    }
                                })
                                    .then(data => {
                                        let newHooks = hooks.map(hook => hook.id === data.id ? data : hook)
                                        setHooksState(newHooks)
                                        populateAside({
                                            title: data.scope,
                                            content: data
                                        }
                                        )
                                    })
                                    .catch(err => console.log(err))
                            }}>
                            {lang.en.start_label}
                        </Button>}
                    <Button
                        variant="danger"
                        onClick={() => {
                            deleteHook(hook.id)
                                .then(data => {
                                    let newHooks = hooks.filter(hook => hook.id !== data.id)
                                    setHooksState(newHooks)
                                })
                                .catch(err => console.log(err))
                        }}>{lang.en.delete_label}</Button>
                </ButtonGroup>
                : <Button variant="primary" onClick={() => {
                    postHook(event).then(data => {
                        populateAside({
                            title: data.scope,
                            content: data
                        })
                    }).catch(err => console.log(err))
                }}>
                    {lang.en.create_label}
                </Button>}
        </Col>
    </Row >)
}