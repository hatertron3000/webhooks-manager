import React from 'react'

export default function Loader(props) {
    return <div className="row" {...props}>
        <div className="d-flex justify-content-center">
            <div className="spinner-grow text-primary" role="status" />
        </div>
    </div>
}