const AppLogo = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left Hand */}
      <path
        d="M25 55 Q20 50 18 45 L15 48 Q17 53 22 58 Z"
        fill="#6366f1"
        opacity="0.8"
      />
      
      {/* Right Hand */}
      <path
        d="M75 55 Q80 50 82 45 L85 48 Q83 53 78 58 Z"
        fill="#6366f1"
        opacity="0.8"
      />
      
      {/* Map Pin Body */}
      <path
        d="M50 15 C38 15 28 25 28 37 C28 52 50 70 50 70 C50 70 72 52 72 37 C72 25 62 15 50 15 Z"
        fill="#6366f1"
      />
      
      {/* Inner Circle */}
      <circle
        cx="50"
        cy="37"
        r="8"
        fill="white"
      />
      
      {/* Left Arm */}
      <path
        d="M30 45 Q25 48 22 52"
        stroke="#6366f1"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
      
      {/* Right Arm */}
      <path
        d="M70 45 Q75 48 78 52"
        stroke="#6366f1"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
    </svg>
  );
};

export default AppLogo;