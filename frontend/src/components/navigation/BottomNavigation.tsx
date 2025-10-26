import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Map, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: MessageSquare, label: 'AI Explorer' },
    { path: '/routes', icon: Map, label: 'Routes' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isActive
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              <Icon className={cn("w-6 h-6 mb-1", isActive && "stroke-[2.5]")} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;