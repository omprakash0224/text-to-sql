import React from 'react';
import { Header } from '../layout/Header';
import type { DatabaseConnection } from '../../types';

interface AuthNavbarProps {
  activeConnection?: DatabaseConnection | null;
  onOpenConnectModal?: () => void;
  isClerkConfigured?: boolean;
}

export const AuthNavbar: React.FC<AuthNavbarProps> = ({
  activeConnection = null,
  onOpenConnectModal = () => {},
  isClerkConfigured = false,
}) => {
  return (
    <Header
      activeConnection={activeConnection}
      onOpenConnectModal={onOpenConnectModal}
      isClerkConfigured={isClerkConfigured}
    />
  );
};
