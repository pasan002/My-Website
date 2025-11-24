import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../contexts/AuthContext";
import { User, ArrowRight, Eye, EyeOff, Leaf, Recycle, TreePine, Sparkles } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3
      }));
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.email || !form.password) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting login with email:', form.email);
      await login(form.email, form.password);
      setMessage("Login successful");
      
      // Redirect based on user role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Login successful, user role:', user.role);
      switch (user.role) {
        case 'admin':
        case 'user_admin':
          navigate('/user-management/dashboard');
          break;
        case 'financial_admin':
          navigate('/financial/dashboard');
          break;
        case 'event_admin':
          navigate('/event/dashboard');
          break;
        case 'feedback_admin':
          navigate('/feedback/dashboard');
          break;
        case 'transport_admin':
          navigate('/transport/dashboard');
          break;
        case 'driver':
          navigate('/transport/driver');
          break;
        default:
          navigate('/user/dashboard');
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute animate-float opacity-20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            {particle.id % 3 === 0 ? (
              <Leaf className="h-4 w-4 text-emerald-400" />
            ) : particle.id % 3 === 1 ? (
              <Recycle className="h-3 w-3 text-green-400" />
            ) : (
              <Sparkles className="h-3 w-3 text-teal-400" />
            )}
          </div>
        ))}
        
        {/* Subtle geometric shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-emerald-200/30 to-green-300/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-teal-200/30 to-cyan-300/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-green-200/40 to-emerald-300/20 rounded-full blur-lg animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Left side - Hero content */}
        <div className="hidden lg:flex flex-col justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <TreePine className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    WasteWise
                  </h1>
                  <p className="text-sm text-gray-600">Smart Waste Management</p>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome Back!</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Join thousands of users who are making a difference in waste management. 
                Access your personalized dashboard, track your environmental impact, 
                and continue your journey towards a greener future.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <Recycle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Track your recycling impact</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
                  <div className="p-2 bg-teal-500 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Schedule smart pickups</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Leaf className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Earn eco-rewards</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Login form */}
        <div className="flex items-center justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
            <Card className="relative w-full max-w-md bg-white/95 backdrop-blur-sm border border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                    <User className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-600">Please sign in to your account to continue</p>
              </CardHeader>
            <CardBody>
              {message && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-green-500 rounded-full">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">{message}</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-red-500 rounded-full">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">{error}</span>
                  </div>
                  {error.includes('Invalid credentials') && (
                    <div className="mt-3 text-sm space-y-1 pl-6">
                      <p>• If you recently changed your password, please use your NEW password.</p>
                      <p>• If you forgot your password, please contact support.</p>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  name="email"
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(value) => handleChange('email', value)}
                  placeholder="Enter your email"
                  required
                />

                <div className="relative">
                  <Input
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(value) => handleChange('password', value)}
                    placeholder="Enter your password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 bottom-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      <span>Signing you in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <User className="h-5 w-5 mr-2" />
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <span className="text-gray-600">Don't have an account? </span>
                <Link 
                  to="/user/register" 
                  className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors"
                >
                  Create Account
                </Link>
              </div>

              <div className="mt-4 text-center">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </Button>
              </div>

              {/* Demo accounts section removed */}
            </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
