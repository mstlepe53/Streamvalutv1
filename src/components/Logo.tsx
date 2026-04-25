import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
}

const textSize: Record<LogoSize, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
};

const iconSize: Record<LogoSize, string> = {
  sm: 'w-7 h-7',
  md: 'w-8 h-8 md:w-9 md:h-9',
  lg: 'w-11 h-11',
};

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  return (
    <Link
      to="/"
      className={`flex items-center gap-2 group select-none ${className}`}
      aria-label="StreamVault – Go to homepage"
    >
      <div className={`${iconSize[size]} bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-200`}>
        <Play className="w-[55%] h-[55%] text-white fill-current ml-[5%]" />
      </div>
      {showText && (
        <span className={`${textSize[size]} font-black tracking-tight text-gray-900 dark:text-white group-hover:opacity-80 transition-opacity duration-200`}>
          Stream<span className="text-blue-600 dark:text-blue-400">Vault</span>
        </span>
      )}
    </Link>
  );
}
