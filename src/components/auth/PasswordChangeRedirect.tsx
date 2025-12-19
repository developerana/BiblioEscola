import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function PasswordChangeRedirect() {
  const { user, mustChangePassword, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if user is logged in, must change password, 
    // not loading, and not already on settings page
    if (!loading && user && mustChangePassword && location.pathname !== '/configuracoes') {
      navigate('/configuracoes', { replace: true });
    }
  }, [user, mustChangePassword, loading, location.pathname, navigate]);

  return null;
}
