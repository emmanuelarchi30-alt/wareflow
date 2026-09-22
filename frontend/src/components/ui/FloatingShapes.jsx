import { motion } from 'framer-motion';

const shapes = [
  { size: 300, x: '10%', y: '20%', delay: 0, color: 'var(--accent-blue)' },
  { size: 200, x: '80%', y: '10%', delay: 1, color: 'var(--accent-orange)' },
  { size: 250, x: '5%', y: '70%', delay: 2, color: 'var(--accent-yellow)' },
  { size: 180, x: '85%', y: '80%', delay: 3, color: 'var(--accent-blue)' },
  { size: 220, x: '50%', y: '50%', delay: 1.5, color: 'var(--accent-orange)' },
];

export function FloatingShapes({ className = '', count = 5 }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {shapes.slice(0, count).map((shape, i) => (
        <motion.div
          key={i}
          className="floating-shape"
          style={{
            width: shape.size,
            height: shape.size,
            left: shape.x,
            top: shape.y,
            background: `radial-gradient(circle at 30% 30%, ${shape.color}40, transparent 70%)`,
            animationDelay: `${shape.delay}s`,
          }}
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}