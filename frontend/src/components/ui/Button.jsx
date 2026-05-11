import React from 'react';

export function Button({ variant = 'default', className = '', ...props }) {
  const cls = [
    'btn',
    variant === 'primary' ? 'btnPrimary' : '',
    variant === 'ghost' ? 'btnGhost' : '',
    className
  ].join(' ');
  return <button className={cls} {...props} />;
}

