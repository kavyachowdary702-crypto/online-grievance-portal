import React from 'react';
import PropTypes from 'prop-types';

const MaterialButton = ({ variant = 'contained', size = 'md', children, className = '', fullWidth = false, ...rest }) => {
  const cls = [
    'md-btn',
    `md-btn--${variant}`,
    `md-btn--${size}`,
    fullWidth ? 'md-btn--full' : '',
    className
  ].join(' ').trim();

  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
};

MaterialButton.propTypes = {
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
};

export default MaterialButton;
