'use client'

import { useEffect, useRef } from 'react'

export default function HeartParticles({ count = 10 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const hearts = []

    for (let i = 0; i < count; i++) {
      const heart = document.createElement('span')
      heart.innerHTML = '\u2764'
      heart.style.cssText = `
        position: fixed;
        font-size: ${Math.random() * 16 + 10}px;
        color: rgba(244, 63, 94, ${Math.random() * 0.2 + 0.08});
        pointer-events: none;
        z-index: 0;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: none;
        transform: translateY(0);
        opacity: ${Math.random() * 0.3 + 0.1};
      `
      container.appendChild(heart)
      hearts.push(heart)
    }

    let animId
    let startTime = Date.now()

    function animate() {
      const elapsed = (Date.now() - startTime) / 1000
      hearts.forEach((heart, i) => {
        const speed = 15 + (i % 5) * 5
        const y = (elapsed * speed) % 120
        heart.style.transform = `translateY(${-y}px) rotate(${elapsed * 20 + i * 45}deg)`
        heart.style.opacity = y > 100 ? 0 : 0.3 - y / 400
      })
      animId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animId)
      hearts.forEach((h) => h.remove())
    }
  }, [count])

  return <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden" />
}
