import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { useAuth } from "../../contexts/AuthContext";
import { User, ArrowRight, Leaf, Recycle, TreePine, Sparkles, Users, Truck } from "lucide-react";

const colomboCities = [
  { name: "Colombo", value: 1000 },
  { name: "Dehiwala-Mount Lavinia", value: 1200 },
  { name: "Sri Jayawardenepura Kotte", value: 1500 },
  { name: "Moratuwa", value: 900 },
  { name: "Maharagama", value: 1100 },
  { name: "Kesbewa", value: 800 },
  { name: "Kaduwela", value: 700 },
  { name: "Kolonnawa", value: 1300 },
  { name: "Padukka", value: 600 },
  { name: "Ratmalana", value: 1400 },
  { name: "Nugegoda", value: 1000 },
  { name: "Piliyandala", value: 950 },
  { name: "Malabe", value: 1150 },
  { name: "Battaramulla", value: 1050 },
  { name: "Boralesgamuwa", value: 1250 },
  { name: "Kadawatha", value: 1350 },
  { name: "Kelaniya", value: 900 },
  { name: "Pannipitiya", value: 1000 },
  { name: "Athurugiriya", value: 1100 },
  { name: "Homagama", value: 850 },
  { name: "Thalawathugoda", value: 950 },
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    province: "",
    city: "",
    cityValue: "",
    role: "user",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
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

  const handleCityChange = (value: string) => {
    const selectedCity = colomboCities.find((c) => c.name === value);
    setForm((prev) => ({
      ...prev,
      city: selectedCity?.name || "",
      cityValue: selectedCity?.value?.toString() || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Client-side validation
    if (!form.username || !form.email || !form.mobile || !form.password || !form.confirmPassword || !form.province) {
      setError("Please fill all required fields.");
      return;
    }
    if (form.province === "Colombo" && (!form.city || !form.cityValue)) {
      setError("Please select your city for Colombo province.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      
      // Prepare registration data
      const registrationData = {
        username: form.username,
        email: form.email,
        password: form.password,
        firstName: form.username, // Using username as firstName for now
        lastName: "User", // Default lastName
        role: form.role, // Use selected role
        phone: form.mobile,
        address: {
          city: form.city || form.province,
          state: form.province,
          country: "Sri Lanka"
        }
      };
      
      await register(registrationData);
      setMessage("Account created successfully!");
      
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        if (form.role === 'driver') {
          navigate('/transport/driver');
        } else {
          navigate('/user/dashboard');
        }
      }, 1500);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || "Registration failed. Please try again.");
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
            {particle.id % 4 === 0 ? (
              <Leaf className="h-4 w-4 text-emerald-400" />
            ) : particle.id % 4 === 1 ? (
              <Recycle className="h-3 w-3 text-green-400" />
            ) : particle.id % 4 === 2 ? (
              <Sparkles className="h-3 w-3 text-teal-400" />
            ) : (
              <TreePine className="h-4 w-4 text-green-500" />
            )}
          </div>
        ))}
        
        {/* Subtle geometric shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-emerald-200/30 to-green-300/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-teal-200/30 to-cyan-300/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-green-200/40 to-emerald-300/20 rounded-full blur-lg animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-gradient-to-br from-teal-200/30 to-green-300/20 rounded-full blur-lg animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Left side - Hero content */}
        <div className="hidden lg:flex flex-col justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Join WasteWise
                  </h1>
                  <p className="text-sm text-gray-600">Smart Waste Management</p>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Start Your Eco Journey!</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Schedule pickups, track recycling and earn eco-rewards in minutes. 
                Join our community of environmentally conscious users making a real difference.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <Truck className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Fast pickup requests</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
                  <div className="p-2 bg-teal-500 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Impact tracking</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Leaf className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Rewards and perks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Register form */}
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
                  Create Account
                </h2>
                <p className="text-gray-600">Join WasteWise and start your eco-friendly journey</p>
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
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-red-500 rounded-full">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  name="username"
                  label="Username"
                  value={form.username}
                  onChange={(value) => handleChange('username', value)}
                  placeholder="Enter your username"
                  required
                />

                <Input
                  name="email"
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(value) => handleChange('email', value)}
                  placeholder="Enter your email"
                  required
                />

                <Input
                  name="mobile"
                  label="Mobile Number"
                  type="text"
                  value={form.mobile}
                  onChange={(value) => handleChange('mobile', value)}
                  placeholder="Enter 10-digit mobile number"
                  required
                />

                <Input
                  name="password"
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(value) => handleChange('password', value)}
                  placeholder="Enter your password (min 6 chars, uppercase, lowercase, number)"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  Password must contain at least 6 characters with uppercase, lowercase, and number
                </div>

                <Input
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(value) => handleChange('confirmPassword', value)}
                  placeholder="Re-enter your password"
                  required
                />

                <Select
                  name="role"
                  label="Account Type"
                  value={form.role}
                  onChange={(value) => handleChange('role', value)}
                  options={[
                    { value: "user", label: "Regular User" },
                    { value: "driver", label: "Waste Collection Driver" }
                  ]}
                  required
                />

                <Select
                  name="province"
                  label="Province"
                  value={form.province}
                  onChange={(value) => handleChange('province', value)}
                  options={[
                    { value: "", label: "Select Province" },
                    { value: "Colombo", label: "Colombo" }
                  ]}
                  required
                />

                {form.province === "Colombo" && (
                  <Select
                    name="city"
                    label="City"
                    value={form.city}
                    onChange={handleCityChange}
                    options={[
                      { value: "", label: "Select City" },
                      ...colomboCities.map((c) => ({
                        value: c.name,
                        label: `${c.name} (Rs. ${c.value})`
                      }))
                    ]}
                    required
                  />
                )}

                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      <span>Creating your account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <User className="h-5 w-5 mr-2" />
                      <span>Create Account</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <span className="text-gray-600">Already have an account? </span>
                <Link 
                  to="/user/login" 
                  className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors"
                >
                  Sign In
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
            </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
