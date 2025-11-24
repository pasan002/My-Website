import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Leaf, 
  Recycle, 
  TreePine, 
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  Headphones,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export default function Contact() {
  const { user, logout, isAuthenticated } = useAuth();
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    }, 2000);
  };

  const contactInfo = [
    {
      icon: <Mail className="h-6 w-6 text-emerald-500" />,
      title: 'Email Us',
      details: ['support@wastewise.com', 'info@wastewise.com'],
      description: 'Send us an email anytime'
    },
    {
      icon: <Phone className="h-6 w-6 text-emerald-500" />,
      title: 'Call Us',
      details: ['+1 (555) 123-4567', '+1 (555) 987-6543'],
      description: 'Mon-Fri 9AM-6PM EST'
    },
    {
      icon: <MapPin className="h-6 w-6 text-emerald-500" />,
      title: 'Visit Us',
      details: ['123 Green Street', 'Eco City, EC 12345'],
      description: 'Come say hello'
    },
    {
      icon: <Clock className="h-6 w-6 text-emerald-500" />,
      title: 'Business Hours',
      details: ['Monday - Friday: 9AM - 6PM', 'Saturday: 10AM - 4PM'],
      description: 'We\'re here to help'
    }
  ];

  const faqs = [
    {
      question: 'How do I schedule a waste pickup?',
      answer: 'Simply log into your account, click "Request Collection", fill out the form with your details, and we\'ll schedule a pickup within 24 hours.'
    },
    {
      question: 'What types of waste do you collect?',
      answer: 'We collect household waste, recyclables, organic waste, and electronic waste. We also offer specialized collection for businesses.'
    },
    {
      question: 'How much does the service cost?',
      answer: 'Our pricing varies by location and waste type. Basic household collection starts at $15 per pickup. Check our pricing calculator for accurate estimates.'
    },
    {
      question: 'Do you offer same-day pickup?',
      answer: 'Yes! We offer same-day pickup for urgent requests, subject to availability. Additional fees may apply for expedited service.'
    },
    {
      question: 'How can I track my collection?',
      answer: 'You can track your collection in real-time through our mobile app or web dashboard. You\'ll receive notifications at each step of the process.'
    },
    {
      question: 'What if I need to cancel or reschedule?',
      answer: 'You can cancel or reschedule your pickup up to 2 hours before the scheduled time through your account dashboard or by calling our support team.'
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
            {particle.id % 3 === 0 ? (
              <Leaf className="h-4 w-4 text-emerald-400" />
            ) : particle.id % 3 === 1 ? (
              <Recycle className="h-3 w-3 text-green-400" />
            ) : (
              <Sparkles className="h-3 w-3 text-teal-400" />
            )}
          </div>
        ))}
        
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-emerald-200/30 to-green-300/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-teal-200/30 to-cyan-300/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 text-white shadow-lg sticky top-0 border-t border-gray-600 border-b border-gray-600" style={{backgroundColor: '#008080'}}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold">WasteWise</Link>
              <div className="hidden md:flex space-x-6">
                <Link to="/" className="hover:text-emerald-200 transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md hover:transform hover:-translate-y-0.5">Home</Link>
                <Link to="/about" className="hover:text-emerald-200 transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md hover:transform hover:-translate-y-0.5">About Us</Link>
                <span className="text-emerald-200 font-medium px-3 py-2 rounded-md bg-white/10">Contact Us</span>
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
                Contact Us
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Have questions? Need help? We're here to assist you. Get in touch with our friendly team 
              and let's work together towards a cleaner future.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="relative z-10 py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <div key={index} className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-shadow">
                <div className="flex justify-center mb-4">
                  {info.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{info.title}</h3>
                <div className="space-y-1 mb-3">
                  {info.details.map((detail, i) => (
                    <p key={i} className="text-gray-600 font-medium">{detail}</p>
                  ))}
                </div>
                <p className="text-sm text-gray-500">{info.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <MessageCircle className="h-8 w-8 text-emerald-500 mr-3" />
                <h2 className="text-3xl font-bold text-gray-800">Send us a Message</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
                
                {submitStatus === 'success' && (
                  <div className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-700 font-medium">Message sent successfully!</span>
                  </div>
                )}
              </form>
            </div>

            {/* Map & Additional Info */}
            <div className="space-y-8">
              {/* Map Placeholder */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Find Us</h3>
                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl h-64 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Interactive Map</p>
                    <p className="text-sm text-gray-500">123 Green Street, Eco City</p>
                  </div>
                </div>
              </div>

              {/* Quick Support */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 text-white">
                <div className="flex items-center mb-4">
                  <Headphones className="h-8 w-8 mr-3" />
                  <h3 className="text-2xl font-bold">Need Immediate Help?</h3>
                </div>
                <p className="mb-6 opacity-90">
                  Our support team is available 24/7 to assist you with any urgent issues.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 mr-3" />
                    <span className="font-medium">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 mr-3" />
                    <span className="font-medium">support@wastewise.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-20 px-6 bg-white/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find answers to common questions about our services and platform.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-12 text-white">
            <TreePine className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join our community and start making a positive impact on the environment today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/user/register" 
                className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                to="/user/login" 
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-emerald-600 transition-colors"
              >
                Sign In
              </Link>
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
            <a href="/about" className="hover:text-white transition-colors">About Us</a>
            <span className="text-emerald-400">Contact</span>
            <Link to="/user/login" className="hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
