import React, { Component } from 'react'
import { Route, Switch } from 'react-router-dom'
import {
    Container,
    Row,
    Col,
    Card,
    Button,
} from 'react-bootstrap'
import Sidebar from './dashboard/Sidebar'
import Hooks from './dashboard/Hooks'
import Events from './dashboard/Events'


class Dashboard extends Component {
    constructor(props) {
        super(props)
        this.state = {
            aside: {
                title: null,
                content: null
            }
        }
        // bindings
        this.populateAside = this.populateAside.bind(this)
    }

    populateAside({ title, content }) {
        if (typeof content === 'object') {
            this.setState({
                aside: {
                    title,
                    content: <code>{JSON.stringify(content, null, 2)}</code>,
                }
            })
        }
        else {
            this.setState({
                aside: {
                    title,
                    content,
                }
            })
        }
    }

    render() {
        return <Container fluid={true} className="pl-0" style={{ position: 'absolute', top: '0%', bottom: '0%' }} >
            <Row noGutters={true} style={{ height: '100%' }}>
                <Col xs={1}>
                    <Sidebar />
                </Col>
                <Col>
                    <Switch>
                        <Route path="/dashboard/hooks" render={(props) =>
                            <Hooks populateAside={this.populateAside} />
                        } />
                        <Route path="/dashboard/events" component={Events} />
                    </Switch>
                </Col>
                <Col xs={this.state.aside.title === null ? 0 : 4} style={{ transition: "width 2s" }}>
                    {this.state.aside.title === null
                        ? null
                        : <Card style={{ position: 'sticky', top: '0%' }} id="aside">
                            <Card.Header>
                                <Card.Title>
                                    <Row>
                                        <Col>
                                            <Button
                                                variant="dark"
                                                onClick={() => {
                                                    this.setState(
                                                        {
                                                            aside: {
                                                                title: null,
                                                                content: null,
                                                            }
                                                        }
                                                    )
                                                }}>X</Button></Col>
                                        <Col>{this.state.aside.title}</Col>
                                    </Row>
                                </Card.Title>
                            </Card.Header>
                            <Card.Body className="bg-dark">
                                <pre style={{ color: "#00FF00" }}>{this.state.aside.content}</pre>
                            </Card.Body>
                        </Card>}


                </Col>
            </Row>
        </Container>
    }
}

export default Dashboard