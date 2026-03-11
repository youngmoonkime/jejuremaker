import React from 'react';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { TokenProvider } from './TokenContext';
import { ProjectProvider } from './ProjectContext';
import { NotificationProvider } from './NotificationContext';

export const RootProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
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
  );
};
