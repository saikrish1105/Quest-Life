import React from 'react'

/**
 * GlassCard — frosted glass container
 * @param {'normal'|'heavy'} variant
 */
export default function GlassCard({ children, className = '', variant = 'normal', style, onClick, id }) {
  return (
    <div
      id={id}
      className={`${variant === 'heavy' ? 'glass-card-heavy' : 'glass-card'} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
