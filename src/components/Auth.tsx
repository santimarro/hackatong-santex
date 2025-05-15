import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [localError, setLocalError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const { signIn, signUp, loading, error, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      // Get intended destination from location state or go to dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSignupSuccess(null);
    try {
      if (authMode === 'signin') {
        await signIn(email, password);
      } else {
        if (!fullName.trim()) {
          setLocalError('Please provide your full name');
          return;
        }
        try {
          await signUp(email, password, fullName);
          setSignupSuccess('A confirmation email has been sent to your address. Please check your inbox and follow the instructions to activate your account. This may take a few minutes.');
        } catch (signupError: any) {
          throw signupError;
        }
      }
    } catch (error: any) {
      console.error(`Error during ${authMode}:`, error);
      setLocalError(error.message || `Failed to ${authMode === 'signin' ? 'sign in' : 'sign up'}`);
    }
  };

  // Quick debug function to check if environment variables are available
  const debugInfo = {
    supabaseUrl: (import.meta.env as any).VITE_SUPABASE_URL 
      ? `${(import.meta.env as any).VITE_SUPABASE_URL.slice(0, 12)}...` 
      : 'Missing',
    supabaseKey: (import.meta.env as any).VITE_SUPABASE_ANON_KEY 
      ? `${(import.meta.env as any).VITE_SUPABASE_ANON_KEY.slice(0, 5)}...` 
      : 'Missing',
    mode: (import.meta.env as any).MODE || 'Unknown'
  };

  // If user is already authenticated, don't render the auth form
  if (user) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Harvey
          </CardTitle>
          <CardDescription className="text-center">
            Your pediatric health assistant
          </CardDescription>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Harvey, a platform for child-centered healthcare
            </p>
          </div>
          {/* Add a hidden button to toggle debug info */}
          <div className="text-xs text-right">
            <button type="button" onClick={() => setShowDebug(!showDebug)}>
              {showDebug ? 'Hide Debug' : '.'}
            </button>
          </div>
          {showDebug && (
            <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
              <div><strong>Environment:</strong> {debugInfo.mode}</div>
              <div><strong>Supabase URL:</strong> {debugInfo.supabaseUrl}</div>
              <div><strong>Supabase Key:</strong> {debugInfo.supabaseKey}</div>
            </div>
          )}
        </CardHeader>
        <Tabs defaultValue="signin" onValueChange={(value) => setAuthMode(value as 'signin' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <CardContent className="pt-6">
            {(error || localError) && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {localError || error}
                </AlertDescription>
              </Alert>
            )}
            {signupSuccess && (
              <Alert variant="default" className="mb-4">
                <AlertDescription>
                  {signupSuccess}
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleAuth}>
              <div className="space-y-4">
                {authMode === 'signup' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">
                        Parent/Guardian Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        This name will appear in your child's medical profile and emergency documents
                      </p>
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <CardFooter className="flex justify-center pt-6 pb-0">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading
                    ? 'Loading...'
                    : authMode === 'signin'
                    ? 'Sign In'
                    : 'Sign Up'}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}