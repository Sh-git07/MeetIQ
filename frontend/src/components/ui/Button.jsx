import React from 'react';
import { Link } from 'react-router-dom';

export function Button({
  children,
  to,
  href,
  variant = 'primary',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const baseClass = variant === 'primary' ? 'btn-primary' : 'btn-ghost';
  const combinedClass = `${baseClass} ${className}`;

  if (to) {
    return (
      <Link
        to={to}
        className={combinedClass}
        data-magnetic="true"
        onClick={disabled ? (e) => e.preventDefault() : onClick}
        aria-disabled={disabled}
        {...props}
      >
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className={combinedClass}
        data-magnetic="true"
        onClick={disabled ? (e) => e.preventDefault() : onClick}
        aria-disabled={disabled}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={combinedClass}
      disabled={disabled}
      onClick={onClick}
      data-magnetic="true"
      {...props}
    >
      {children}
    </button>
  );
}
