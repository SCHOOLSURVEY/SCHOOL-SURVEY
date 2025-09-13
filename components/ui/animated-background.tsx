"use client"

import { useEffect, useState } from "react"

interface AnimatedBackgroundProps {
  children: React.ReactNode
}

export function AnimatedBackground({ children }: AnimatedBackgroundProps) {
  const [particles, setParticles] = useState<Array<{ 
    id: number; 
    x: number; 
    y: number; 
    size: number;
    opacity: number;
    speedX: number;
    speedY: number;
    glowIntensity: number;
  }>>([])

  // Initialize particles
  useEffect(() => {
    const newParticles = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.3 + 0.1,
      speedX: (Math.random() - 0.5) * 0.01,
      speedY: (Math.random() - 0.5) * 0.01,
      glowIntensity: Math.random() * 0.5 + 0.3
    }))
    setParticles(newParticles)
  }, [])

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => {
        let newX = particle.x + particle.speedX
        let newY = particle.y + particle.speedY

        // Wrap around screen edges
        if (newX > 100) newX = -5
        if (newX < -5) newX = 100
        if (newY > 100) newY = -5
        if (newY < -5) newY = 100

        // Subtle opacity pulsing
        const time = Date.now() * 0.001
        const newOpacity = particle.opacity + Math.sin(time + particle.id) * 0.1

        return {
          ...particle,
          x: newX,
          y: newY,
          opacity: Math.max(0.05, Math.min(0.4, newOpacity))
        }
      }))
    }, 80)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-green/5 via-royal-blue/5 to-white">
      {/* Base Layer - Soft Particle Animation */}
      <div className="absolute inset-0">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              background: `radial-gradient(circle, rgba(46, 204, 113, ${particle.glowIntensity}) 0%, rgba(30, 136, 229, ${particle.glowIntensity * 0.7}) 50%, transparent 100%)`,
              filter: `blur(${particle.size * 0.5}px)`,
              boxShadow: `0 0 ${particle.size * 3}px rgba(46, 204, 113, ${particle.opacity * 0.5})`
            }}
          />
        ))}
      </div>

      {/* Accent Layer - Geometric Wave Lines */}
      <div className="absolute inset-0 opacity-12">
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2ECC71" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#1E88E5" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#2ECC71" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E88E5" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#2ECC71" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#1E88E5" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path
            d="M0,300 Q300,200 600,300 T1200,300 L1200,800 L0,800 Z"
            fill="url(#waveGradient1)"
            className="animate-wave-1"
          />
          <path
            d="M0,400 Q400,300 800,400 T1200,400 L1200,800 L0,800 Z"
            fill="url(#waveGradient2)"
            className="animate-wave-2"
          />
          <path
            d="M0,500 Q500,400 1000,500 T1200,500 L1200,800 L0,800 Z"
            fill="url(#waveGradient1)"
            className="animate-wave-3"
          />
        </svg>
      </div>

      {/* Radial Glow Layer - Behind Login Form */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="absolute w-96 h-96 rounded-full animate-pulse-glow"
          style={{
            background: `radial-gradient(circle, rgba(46, 204, 113, 0.4) 0%, rgba(30, 136, 229, 0.3) 30%, rgba(46, 204, 113, 0.1) 60%, transparent 80%)`,
            filter: 'blur(40px)',
            transform: 'translateZ(0)',
            opacity: 0.6
          }}
        />
        {/* Additional smaller glow for more visibility */}
        <div 
          className="absolute w-64 h-64 rounded-full animate-pulse-glow"
          style={{
            background: `radial-gradient(circle, rgba(46, 204, 113, 0.6) 0%, rgba(30, 136, 229, 0.4) 50%, transparent 70%)`,
            filter: 'blur(20px)',
            transform: 'translateZ(0)',
            opacity: 0.8,
            animationDelay: '2s'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        {children}
      </div>

      <style jsx>{`
        @keyframes wave-1 {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(100px); }
        }
        
        @keyframes wave-2 {
          0% { transform: translateX(-150px); }
          100% { transform: translateX(150px); }
        }
        
        @keyframes wave-3 {
          0% { transform: translateX(-200px); }
          100% { transform: translateX(200px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            opacity: 0.4;
            transform: scale(1);
          }
          50% { 
            opacity: 0.7;
            transform: scale(1.15);
          }
        }
        
        .animate-wave-1 {
          animation: wave-1 20s linear infinite;
        }
        
        .animate-wave-2 {
          animation: wave-2 25s linear infinite;
        }
        
        .animate-wave-3 {
          animation: wave-3 30s linear infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
