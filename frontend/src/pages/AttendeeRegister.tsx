import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authService } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Eye, EyeOff, User } from 'lucide-react';

export default function AttendeeRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState(localStorage.getItem("devfest-username") ?? "");
  const [password, setPassword] = useState(localStorage.getItem("devfest-username") ?? "");
  const [confirmPassword, setConfirmPassword] = useState(localStorage.getItem("devfest-username") ?? "");
  const [displayName, setDisplayName] = useState(localStorage.getItem("devfest-username") ?? "");
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("devfest-username")) {
      navigate('/sessions');
    }
  }, [])

  function generateRandomPassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
  const handleKeyPress = () => {
    const generatedPassword = generateRandomPassword();
    setPassword(generatedPassword);
    setConfirmPassword(generatedPassword);
    setDisplayName(username)
    handleRegister(null)
    setConfirmPassword(username)


  }
  const handleRegister = async (e: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setError('');
    console.log(password);
    console.log(username);
    console.log(displayName);
    console.log(confirmPassword);


    // Validation
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    // if (password.length < 6) {
    //   setError('Password must be at least 6 characters');
    //   return;
    // }

    // if (password !== confirmPassword) {
    //   setError('Passwords do not match');
    //   return;
    // }

    setLoading(true);

    try {
      const response = await authService.registerAudience(
        username,
        password,
        displayName || username
      );

      // Update auth context (which also saves to localStorage)
      login(response.token, response.username, false);

      // Navigate to session selection
      navigate('/sessions');
    } catch (err: any) {
      console.error('Registration failed:', err);
      if (err.response?.data) {
        // Handle specific error messages from backend
        const errorData = err.response.data;
        if (errorData.username) {
          setError(`Username: ${errorData.username.join(', ')}`);
        } else if (errorData.password) {
          setError(`Password: ${errorData.password.join(', ')}`);
        } else if (errorData.detail) {
          setError(errorData.detail);
        } else {
          setError('Registration failed. Please try again.');
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12 space-y-4">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-foreground">
            Choose Your Display Name
          </h1>
          <p className="text-lg text-muted-foreground">
            Just so we know what to call you!!
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter your name or nickname"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              className="h-14 text-lg border-2 focus:border-primary transition-colors"
              maxLength={50}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}
            {username && (
              <p className="text-sm text-muted-foreground">
                {username.length}/50 characters
              </p>
            )}
          </div>

          <Button
            disabled={loading}
            onClick={handleKeyPress}
            className="w-full h-14 text-lg font-medium shadow-material-md hover:shadow-material-lg transition-all"
            size="lg"
          >
            Continue
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-primary transition-colors text-sm"
          >
            ← Back to role selection
          </button>
        </div>
      </div>
    </div>
  );
}
