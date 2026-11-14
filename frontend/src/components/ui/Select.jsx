import React, { useEffect, useRef } from 'react';

export function Select({
  value,
  onChange,
  options = [],
  className = '',
  id,
  'aria-label': ariaLabel,
  ...props
}) {
  const selectRef = useRef(null);

  useEffect(() => {
    if (selectRef.current) {
      const len = (value || '').length;
      selectRef.current.style.width = `${Math.max(len + 3, 6)}ch`;
    }
  }, [value]);

  return (
    <select
      ref={selectRef}
      id={id}
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      className={`font-inherit tracking-inherit text-[#E60B09] bg-transparent border-0 border-b-2 border-b-[rgba(27,22,48,0.2)] focus:border-b-[#E60B09] rounded-none px-1 py-0 cursor-pointer appearance-none outline-none transition-colors duration-200 ${className}`}
      {...props}
    >
      {options.map((opt) => (
        <option
          key={opt}
          value={opt}
          className="font-sans font-medium text-[16px] text-[#1B1630] bg-[#FAF3E8]"
        >
          {opt}
        </option>
      ))}
    </select>
  );
}
