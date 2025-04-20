import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BottomNavigationProps {
  className?: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  return (
    <div className={`fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white h-16 z-50 ${className}`}>
      <div className="grid grid-cols-5 h-full">
        <button 
          className={`flex flex-col items-center justify-center space-y-1 ${isActive('/') ? 'text-primary' : ''}`}
          onClick={() => navigate('/')}
        >
          <div className={`p-1 rounded-full ${isActive('/') ? 'bg-primary-light' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xs">Home</span>
        </button>
        
        <button 
          className={`flex flex-col items-center justify-center space-y-1 ${isActive('/chat') ? 'text-primary' : ''}`}
          onClick={() => navigate('/chat')}
        >
          <div className={`p-1 rounded-full ${isActive('/chat') ? 'bg-primary-light' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 12H8.01M12 12H12.01M16 12H16.01M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.933 3.58002 15.7219 4.58922 17.2088C4.71174 17.3797 4.76538 17.5916 4.736 17.8022L4.39459 20.3687C4.34956 20.7054 4.6371 21 4.97836 21H12Z" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xs">Chat</span>
        </button>
        
        <button 
          className={`flex flex-col items-center justify-center space-y-1 ${
            isActive('/notes') || isActive('/appointments') || isActive('/appointment') || isActive('/consultation') ? 'text-primary' : ''
          }`}
          onClick={() => navigate('/notes')}
        >
          <div className={`p-1 rounded-full ${
            isActive('/notes') || isActive('/appointments') || isActive('/appointment') || isActive('/consultation') ? 'bg-primary-light' : ''
          }`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xs">Consultations</span>
        </button>
        
        <button 
          className={`flex flex-col items-center justify-center space-y-1 ${isActive('/reminders') ? 'text-primary' : ''}`}
          onClick={() => navigate('/reminders')}
        >
          <div className={`p-1 rounded-full ${isActive('/reminders') ? 'bg-primary-light' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2H14L17.5 11H13L14.5 19L5 11H10V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xs">Reminders</span>
        </button>
        
        <button 
          className={`flex flex-col items-center justify-center space-y-1 ${isActive('/profile') ? 'text-primary' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <div className={`p-1 rounded-full ${isActive('/profile') ? 'bg-primary-light' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation; 