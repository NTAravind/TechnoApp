'use client'
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute h-full rounded-full animate-pulse"
          style={{
            backgroundColor: 'oklch(0.7227 0.1920 149.5793)',
            width: '40%',
            animation: 'slide 1.5s ease-in-out infinite'
          }}
        />
      </div>
      <style jsx>{`
        @keyframes slide {
          0% {
            left: -40%;
          }
          50% {
            left: 100%;
          }
          100% {
            left: -40%;
          }
        }
      `}</style>
    </div>
  );
}