import React, { useEffect, useRef } from 'react';

export function Input({
  value,
  onChange,
  placeholder,
  autoSize = false,
  error = false,
  className = '',
  type = 'text',
  id,
  'aria-label': ariaLabel,
  ...props
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoSize && inputRef.current && type !== 'datetime-local') {
      const len = Math.max(
        (value || '').toString().length,
        (placeholder || '').toString().length
      );
      inputRef.current.style.width = `${Math.max(len + 1, 3)}ch`;
    }
  }, [value, placeholder, autoSize, type]);

  const borderClass = error
    ? 'border-b-[#C21A12] border-b-2'
    : 'border-b-[rgba(27,22,48,0.2)] focus:border-b-[#E60B09]';

  return (
    <input
      ref={inputRef}
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-invalid={error ? 'true' : 'false'}
      className={`font-inherit tracking-inherit text-[#E60B09] bg-transparent border-0 border-b-2 rounded-none px-1 py-0 transition-colors duration-200 outline-none placeholder:text-[#665F75]/50 ${borderClass} ${className}`}
      {...props}
    />
  );
}
