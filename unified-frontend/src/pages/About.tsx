import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Leaf, 
  Recycle, 
  TreePine, 
  Users, 
  Target, 
  Award, 
  Truck, 
  Globe,
  Heart,
  Sparkles,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function About() {
  const { user, logout, isAuthenticated } = useAuth();
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3
      }));
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  const stats = [
    { number: '10,000+', label: 'Active Users', icon: <Users className="h-6 w-6" /> },
    { number: '50,000+', label: 'Collections Made', icon: <Truck className="h-6 w-6" /> },
    { number: '95%', label: 'Recycling Rate', icon: <Recycle className="h-6 w-6" /> },
    { number: '25', label: 'Cities Covered', icon: <Globe className="h-6 w-6" /> }
  ];

  const values = [
    {
      icon: <Leaf className="h-8 w-8 text-emerald-500" />,
      title: 'Environmental Responsibility',
      description: 'We are committed to reducing waste and promoting sustainable practices that protect our planet for future generations.'
    },
    {
      icon: <Users className="h-8 w-8 text-emerald-500" />,
      title: 'Community Impact',
      description: 'Building stronger communities through efficient waste management and creating local employment opportunities.'
    },
    {
      icon: <Target className="h-8 w-8 text-emerald-500" />,
      title: 'Innovation & Technology',
      description: 'Leveraging cutting-edge technology to optimize waste collection routes and improve service efficiency.'
    },
    {
      icon: <Heart className="h-8 w-8 text-emerald-500" />,
      title: 'Customer Care',
      description: 'Providing exceptional service with transparent pricing, real-time tracking, and responsive customer support.'
    }
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=300&auto=format&fit=crop',
      description: 'Environmental engineer with 15+ years in sustainable waste management.'
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300&auto=format&fit=crop',
      description: 'Tech innovator focused on smart city solutions and IoT integration.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Operations',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=300&auto=format&fit=crop',
      description: 'Operations expert ensuring seamless waste collection services.'
    },
    {
      name: 'David Kim',
      role: 'Sustainability Director',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
      description: 'Environmental scientist driving our green initiatives and impact measurement.'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
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
        
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-emerald-200/30 to-green-300/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-teal-200/30 to-cyan-300/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-green-200/40 to-emerald-300/20 rounded-full blur-lg animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 text-white shadow-lg sticky top-0 border-t border-gray-600 border-b border-gray-600" style={{backgroundColor: '#008080'}}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold">WasteWise</Link>
              <div className="hidden md:flex space-x-6">
                <Link to="/" className="hover:text-emerald-200 transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md hover:transform hover:-translate-y-0.5">Home</Link>
                <span className="text-emerald-200 font-medium px-3 py-2 rounded-md bg-white/10">About Us</span>
                <Link to="/contact" className="hover:text-emerald-200 transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md hover:transform hover:-translate-y-0.5">Contact Us</Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm">Welcome, {user?.firstName || user?.username}</span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/user/login" className="hover:text-emerald-200 transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md hover:transform hover:-translate-y-0.5">Login</Link>
                  <Link to="/user/register" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                About WasteWise
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              We're revolutionizing waste management through technology, sustainability, and community engagement. 
              Our mission is to create a cleaner, greener future for everyone.
            </p>
            <div className="flex justify-center">
              <Link 
                to="/user/register" 
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Join Our Mission
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                <div className="flex justify-center mb-4 text-emerald-500">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-gray-800">
                Our Mission & Vision
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">Mission</h3>
                    <p className="text-gray-600">
                      To transform waste management through innovative technology, making it more efficient, 
                      sustainable, and accessible for communities worldwide.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Globe className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">Vision</h3>
                    <p className="text-gray-600">
                      A world where waste is seen as a resource, communities are cleaner and healthier, 
                      and technology enables sustainable living for all.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-8 text-white">
                <div className="text-center">
                  <TreePine className="h-16 w-16 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Making a Difference</h3>
                  <p className="text-lg opacity-90">
                    Every collection, every user, every innovation brings us closer to a sustainable future.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative z-10 py-20 px-6 bg-white/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These principles guide everything we do and shape our commitment to excellence.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-shadow">
                <div className="flex justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Passionate individuals working together to create a sustainable future.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-shadow">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{member.name}</h3>
                <p className="text-emerald-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-12 text-white">
            <Award className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users who are already making their communities cleaner and more sustainable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/user/register" 
                className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Get Started Today
              </Link>
              <a 
                href="#contact" 
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-emerald-600 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-800 text-white py-12 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <TreePine className="h-8 w-8 text-emerald-400 mr-2" />
            <span className="text-2xl font-bold">WasteWise</span>
          </div>
          <p className="text-gray-400 mb-6">
            Making waste management smarter, cleaner, and more sustainable.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-emerald-400">About Us</span>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            <Link to="/user/login" className="hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
