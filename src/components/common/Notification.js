import React from 'react'

const Notification = (props) => {
    return <div className={`alert alert-${props.type}`} role="alert">
        {props.message}
    </div>
}

export default Notification