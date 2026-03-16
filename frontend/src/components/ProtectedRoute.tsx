import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface ProtectedRouteProps {
  requireSpeaker?: boolean;
}

export const ProtectedRoute = ({ requireSpeaker = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isSpeaker, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requireSpeaker && !isSpeaker) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />; 
};
