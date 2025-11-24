import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Star, Send, MessageCircle, Edit3, LogOut } from 'lucide-react';
import api from '../../lib/api';

type Feedback = {
    _id: string;
    name: string;
    email: string;
    rating: number;
    comment: string;
    category: string;
    status: string;
    date: string;
    replies?: Array<{
        _id: string;
        admin: string;
        text: string;
        date: string;
    }>;
};

export default function FeedbackForm() {
    const { user, logout, isAuthenticated } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        rating: 0,
        comment: '',
        category: 'service'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [recentFeedbacks, setRecentFeedbacks] = useState<Feedback[]>([]);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadRecentFeedbacks();
    }, []);

    const loadRecentFeedbacks = async () => {
        try {
            const response = await api.get('/feedbacks?limit=3');
            setRecentFeedbacks(response.data.data.feedbacks);
        } catch (error: any) {
            console.error('Error loading feedbacks:', error);
            // Don't show error for recent feedbacks, just log it
        }
    };

    const handleInputChange = (name: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRatingClick = (rating: number) => {
        setFormData(prev => ({
            ...prev,
            rating
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.rating || !formData.comment) {
            setError('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            await api.post('/feedbacks', formData);
            
            // Reload recent feedbacks
            await loadRecentFeedbacks();
            
            // Reset form
            setFormData({ name: '', email: '', rating: 0, comment: '', category: 'service' });
            setHoveredRating(0);
            setSuccess('Thank you for your feedback! We appreciate your input.');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (error: any) {
            console.error('Error submitting feedback:', error);
            setError(error.response?.data?.message || 'Failed to submit feedback. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStars = (rating: number, interactive = false) => {
        return (
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`text-2xl ${
                            interactive
                                ? 'cursor-pointer hover:text-yellow-400'
                                : 'cursor-default'
                        } ${
                            star <= (interactive ? hoveredRating || formData.rating : rating)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                        }`}
                        onClick={interactive ? () => handleRatingClick(star) : undefined}
                        onMouseEnter={interactive ? () => setHoveredRating(star) : undefined}
                        onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
                    >
                        ★
                    </button>
                ))}
            </div>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Green Navigation Bar */}
            <header className="text-white shadow-md sticky top-0 z-10 border-t border-gray-600 border-b border-gray-600" style={{backgroundColor: '#008080'}}>
                <div className="container-app flex items-center justify-between h-16 px-6">
                    {/* Left Nav Links */}
                    <nav className="flex items-center space-x-4">
                        <NavLink to="/" className="text-white hover:text-emerald-200 text-sm font-medium transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md hover:transform hover:-translate-y-0.5">Home</NavLink>
                        <NavLink to="/about" className="text-white hover:text-emerald-200 text-sm font-medium transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md hover:transform hover:-translate-y-0.5">About Us</NavLink>
                        <NavLink to="/contact" className="text-white hover:text-emerald-200 text-sm font-medium transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md hover:transform hover:-translate-y-0.5">Contact Us</NavLink>
                        {isAuthenticated && (
                            <NavLink to={
                                user?.role === 'user_admin' || user?.role === 'admin' ? '/user-management/dashboard' :
                                user?.role === 'financial_admin' ? '/financial/dashboard' :
                                user?.role === 'event_admin' ? '/event/dashboard' :
                                user?.role === 'feedback_admin' ? '/feedback/dashboard' :
                                user?.role === 'transport_admin' ? '/transport/dashboard' :
                                '/user/dashboard'
                            } className="text-white hover:text-emerald-200 text-sm font-medium transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md hover:transform hover:-translate-y-0.5">My Dashboard</NavLink>
                        )}
                    </nav>

                    {/* Right User Info & Logout */}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated && (
                            <>
                                <span className="text-white text-sm">Welcome, {user?.firstName || user?.username}</span>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-emerald-600 hover:bg-emerald-700 transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="p-6">
                <div className="space-y-6">
                    <PageHeader
                        title="Share Your Feedback"
                        description="Your feedback helps us improve our waste management services and create a cleaner environment for everyone."
                    />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Feedback Form */}
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            <MessageCircle className="h-5 w-5 mr-2 text-emerald-600" />
                            Submit Your Feedback
                        </h2>
                    </CardHeader>
                    <CardBody>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-sm text-green-600">{success}</p>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                name="name"
                                label="Name *"
                                value={formData.name}
                                onChange={(value) => handleInputChange('name', value)}
                                placeholder="Your full name"
                                required
                            />

                            <Input
                                name="email"
                                label="Email *"
                                type="email"
                                value={formData.email}
                                onChange={(value) => handleInputChange('email', value)}
                                placeholder="your.email@example.com"
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Star className="h-4 w-4 inline mr-1" />
                                    Rating *
                                </label>
                                <div className="flex items-center space-x-2">
                                    {renderStars(formData.rating, true)}
                                    <span className="text-sm text-gray-500 ml-2">
                                        {formData.rating > 0 && `${formData.rating} star${formData.rating > 1 ? 's' : ''}`}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Edit3 className="h-4 w-4 inline mr-1" />
                                    Comment *
                                </label>
                                <textarea
                                    name="comment"
                                    value={formData.comment}
                                    onChange={(e) => handleInputChange('comment', e.target.value)}
                                    placeholder="Share your experience with our service"
                                    required
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || !formData.name || !formData.email || !formData.rating || !formData.comment}
                                className="w-full"
                            >
                                <Send className="h-4 w-4 mr-2" />
                                {isLoading ? 'Submitting...' : 'Submit Feedback'}
                            </Button>
                        </form>
                    </CardBody>
                </Card>

                {/* Recent Feedback */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900">Recent Feedback</h3>
                    </CardHeader>
                    <CardBody>
                        {recentFeedbacks.length > 0 ? (
                            <div className="space-y-4">
                                {recentFeedbacks.map((feedback) => (
                                    <div key={feedback._id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-900">{feedback.name}</span>
                                            <span className="text-sm text-gray-500">{formatDate(feedback.date)}</span>
                                        </div>
                                        <div className="mb-2">
                                            {renderStars(feedback.rating)}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{feedback.comment}</p>
                                        
                                        {feedback.replies && feedback.replies.length > 0 && (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
                                                <h4 className="text-sm font-medium text-emerald-800 mb-2">Admin Response:</h4>
                                                {feedback.replies.map((reply) => (
                                                    <div key={reply._id} className="text-sm text-emerald-700">
                                                        <p>{reply.text}</p>
                                                        <span className="text-xs text-emerald-600">
                                                            - {reply.admin}, {formatDate(reply.date)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No feedback yet. Be the first to share your experience!</p>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
                </div>
            </div>
        </div>
    );
}
