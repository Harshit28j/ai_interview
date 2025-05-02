import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

interface AuthProps {
    onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);

    return isLogin ? (
        <Login
            onSuccess={onAuthSuccess}
            onSwitchToRegister={() => setIsLogin(false)}
        />
    ) : (
        <Register
            onSuccess={onAuthSuccess}
            onSwitchToLogin={() => setIsLogin(true)}
        />
    );
};

export default Auth;