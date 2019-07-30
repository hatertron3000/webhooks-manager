import React, { Component } from 'react'
import {
    Button,
    Accordion,
    Card,
    ListGroup,
    Row,
    Col,
    ButtonGroup,
    Alert
} from 'react-bootstrap'
import HookItem from './HookItem'

const lang = {
    en: require('../../../lang/en.json')
}

class HookTypeList extends Component {
    constructor(props) {
        super(props)
        this.state = {
            loading: false,
            error: false,
        }
    }

    render() {
        const currentEvents = this.props.hooks.map((hook) => hook.scope)
        return <Accordion>
            <Card className="shadow-sm rounded bg-white">
                <Accordion.Toggle
                    as={Row}
                    className="pl-4 py-2  hooks-accordion-toggle"
                    eventKey={`eventslist-${this.props.hookType.type}`}>
                    <Col xs={11} className="d-flex justify-content-start"><span className="h4 text-dark">{this.props.hookType.type}</span></Col>
                    <Col xs={1}>
                        <span className="badge badge-pill badge-primary">
                            {this.props.hookType.scopes.filter(event => currentEvents.includes(event)).length}
                        </span>
                    </Col>
                </Accordion.Toggle>
                {this.state.error
                    ? <Alert variant="danger" onClose={this.setState({ error: false })} dismissable>
                        <p>{this.state.error}</p>
                    </Alert>
                    : null}

                <Accordion.Collapse eventKey={`eventslist-${this.props.hookType.type}`} className="collapse" id={`eventslist-${this.props.hookType.type}`}>
                    <Card.Body>
                        <ListGroup>
                            {this.props.hookType.scopes.map((event, index) => (
                                <ListGroup.Item
                                    key={index}
                                    className={`hook-item list-group-item ${currentEvents.includes(event)
                                        ? this.props.hooks.filter(hook => hook.scope === event)[0].is_active
                                            ? 'bg-secondary text-light'
                                            : 'bg-dark text-light'
                                        : 'bg-light text-dark'}`
                                    }>
                                    <HookItem
                                        event={event}
                                        currentEvents={currentEvents}
                                        hook={this.props.hooks.filter(hook => hook.scope === event)[0]}
                                        hooks={this.props.hooks}
                                        populateAside={this.props.populateAside}
                                        setHooksState={this.props.setHooksState}
                                        postHook={this.props.postHook}
                                        putHook={this.props.putHook}
                                        deleteHook={this.props.deleteHook} />
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Card.Body>
                </Accordion.Collapse>
            </Card>
        </Accordion >
    }
}

export default HookTypeList