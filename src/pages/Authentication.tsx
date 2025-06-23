import React from "react";
import { LoginForm } from "../components/login-form";

interface AuthenticationProps {
  setIsLoggedIn: (loggedIn: boolean) => void;
  onAuthSuccess?: () => void;
}

const Authentication: React.FC<AuthenticationProps> = ({ setIsLoggedIn, onAuthSuccess }) => {
  return (
    <LoginForm 
      setIsLoggedIn={setIsLoggedIn} 
      onAuthSuccess={onAuthSuccess}
    />
  );
};

export default Authentication; 