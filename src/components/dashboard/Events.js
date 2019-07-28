import React from 'react'

export default function Events(props) {
    return <div style={{ height: "100%", width: "100%" }}>
        <iframe src={process.env.REACT_APP_REQUESTBIN} style={{ width: "100%", height: "100%" }}></iframe>
    </div>
}