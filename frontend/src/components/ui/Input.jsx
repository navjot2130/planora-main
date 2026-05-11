import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(props, ref) {
  return <input ref={ref} className="input" {...props} />;
});

