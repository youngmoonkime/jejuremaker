import React from 'react';
import { ToastProvider } from './ToastContext';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { TokenProvider } from './TokenContext';
import { ProjectProvider } from './ProjectContext';
import { NotificationProvider } from './NotificationContext';

export const RootProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      <AuthProvider>
        <ThemeProvider>
          <TokenProvider>
            <ProjectProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </ProjectProvider>
          </TokenProvider>
        </ThemeProvider>
      </AuthProvider>
    </ToastProvider>
  );
};
