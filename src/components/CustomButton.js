import React from "react";
import PropTypes from 'prop-types';
import classNames from "classnames";

import './Button.css';

const Button = ({ children, onClick, className, disabled, active, id }) => {

    const classes = classNames(
        'btn',
        className,
        { active }
    );

    return (
        <button
            id={id}
            className={classes}
            disabled={disabled}
            onClick={onClick}
        >{children}</button>
    );
};

Button.propTypes = {
    children: PropTypes.node,
    onClick: PropTypes.func,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    active: PropTypes.bool,
    id: PropTypes.string
};

Button.defaultProps = {
    children: 'Кнопка',
    onClick: () => { alert('Нужно добавить обработчик') },
    className: '',
    disabled: false,
    active: false,
};

export default Button;