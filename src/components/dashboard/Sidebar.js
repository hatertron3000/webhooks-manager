import React from 'react'
import { Card } from 'react-bootstrap'
import { ListGroup } from 'react-bootstrap';

const links = [
    {
        name: 'Hooks',
        path: "/dashboard/hooks",
    },
    {
        name: 'Events',
        path: "/dashboard/events"
    }
]

function Sidebar(props) {
    return <div className="bg-dark text-light" style={{ height: '100%', width: '100%' }}>
        <ListGroup variant="flush" style={{ position: 'sticky', top: '0%' }}>
            {links.map((link, index) => <ListGroup.Item action href={link.path} className="list-item bg-dark text-light w-100" key={index}>
                {link.name}
            </ListGroup.Item>)}
        </ListGroup>
    </div>
}

export default Sidebar