import React from 'react'

function Button({ message, type, ...rest }) {
    return <button
        type="button"
        className={`btn btn-${type}`}
        {...rest}>
        {message}
    </button>
}

export default Button