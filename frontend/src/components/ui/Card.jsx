import React from 'react';

export function Card({ solid = false, className = '', ...props }) {
  return (
    <section className={['card', solid ? 'cardSolid' : '', className].join(' ')} {...props} />
  );
}

