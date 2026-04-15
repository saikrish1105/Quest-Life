import React, { useEffect, useRef } from 'react'

/**
 * ConfettiOverlay — canvas-based confetti burst
 * Call via ref: confettiRef.current.burst(x, y)
 */
export default function ConfettiOverlay({ innerRef }) {
  const canvasRef = useRef(null)
  const particles = useRef([])
  const rafRef    = useRef(null)

  const COLORS = [
    '#C4714A', '#87A878', '#D4A847', '#F7D7C4',
    '#A875C4', '#5A8FC4', '#C45A5A', '#F0C4A8',
  ]

  function burst(x, y, count = 60) {
    const canvas = canvasRef.current
    if (!canvas) return

    for (let i = 0; i < count; i++) {
      const angle  = (Math.random() * Math.PI * 2)
      const speed  = 4 + Math.random() * 8
      particles.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4 + Math.random() * 6,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        life: 1.0,
        decay: 0.012 + Math.random() * 0.01,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      })
    }

    cancelAnimationFrame(rafRef.current)
    animate()
  }

  function animate() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.current = particles.current.filter(p => p.life > 0)

    for (const p of particles.current) {
      p.x  += p.vx
      p.y  += p.vy
      p.vy += 0.3 // gravity
      p.vx *= 0.98
      p.life -= p.decay
      p.rotation += p.rotSpeed

      ctx.save()
      ctx.globalAlpha = p.life
      ctx.fillStyle   = p.color
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    if (particles.current.length > 0) {
      rafRef.current = requestAnimationFrame(animate)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // expose burst via innerRef
  useEffect(() => {
    if (innerRef) innerRef.current = { burst }
  })

  return (
    <canvas
      ref={canvasRef}
      className="confetti-overlay"
      aria-hidden="true"
    />
  )
}
