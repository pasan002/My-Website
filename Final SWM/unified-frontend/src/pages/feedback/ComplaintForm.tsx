import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { AlertTriangle, Upload, Send, LogOut } from 'lucide-react';
import api from '../../lib/api';

type FormData = {
    name: string;
    email: string;
    phone: string;
    address: string;
    issueType: string;
    weight: string;
    problem: string;
};

export default function ComplaintForm() {
    const { user, logout, isAuthenticated } = useAuth();
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        address: '',
        issueType: '',
        weight: '',
        problem: ''
    });
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const issueTypes = [
        { value: '', label: 'Select issue type...' },
        { value: 'Bin Issues', label: 'Bin Issues' },
        { value: 'Transport Issues', label: 'Transport Issues' },
        { value: 'Finance Issues', label: 'Finance Issues' },
        { value: 'Staff Issues', label: 'Staff Issues' },
        { value: 'Service Issues', label: 'Service Issues' },
        { value: 'Others', label: 'Others' }
    ];

    const handleInputChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhoneChange = (value: string) => {
        // Only allow numbers
        const numericValue = value.replace(/[^0-9]/g, '');
        handleInputChange('phone', numericValue);
    };

    const handleWeightChange = (value: string) => {
        // Only allow numbers and decimal point
        const numericValue = value.replace(/[^0-9.]/g, '');
        handleInputChange('weight', numericValue);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(e.target.files);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.name || !formData.email || !formData.address || !formData.issueType || !formData.problem) {
            setError('Please fill in all required fields');
            return;
        }

        if (formData.phone && !/^[0-9]*$/.test(formData.phone)) {
            setError('Phone number must contain numbers only');
            return;
        }

        if (formData.weight && isNaN(parseFloat(formData.weight))) {
            setError('Volume of Waste must be a valid number');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            // Create FormData for file upload
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('email', formData.email);
            submitData.append('phone', formData.phone);
            submitData.append('address', formData.address);
            submitData.append('issueType', formData.issueType);
            submitData.append('priority', 'medium'); // Default priority
            if (formData.weight) submitData.append('weight', formData.weight);
            submitData.append('problem', formData.problem);

            // Add files if any
            if (selectedFiles) {
                for (let i = 0; i < selectedFiles.length; i++) {
                    submitData.append('files', selectedFiles[i]);
                }
            }

            await api.post('/complaints', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                issueType: '',
                weight: '',
                problem: ''
            });
            setSelectedFiles(null);
            
            setSuccess('Complaint submitted successfully! We will review it and get back to you soon.');
            
            // Clear success message after 5 seconds
            setTimeout(() => setSuccess(null), 5000);
        } catch (error: any) {
            console.error('Error submitting complaint:', error);
            setError(error.response?.data?.message || 'Failed to submit complaint. Please try again.');
        } finally {
            setIsLoading(false);
        }
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
                        title="File a Complaint"
                        description="Report issues with our waste management services. We'll address your concerns promptly."
                    />

            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                        Submit Your Complaint
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                placeholder="Your email address"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                name="phone"
                                label="Phone"
                                value={formData.phone}
                                onChange={handlePhoneChange}
                                placeholder="Your phone number"
                            />

                            <Input
                                name="address"
                                label="City/Address *"
                                value={formData.address}
                                onChange={(value) => handleInputChange('address', value)}
                                placeholder="Your city or full address"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                name="issueType"
                                label="Type of Issue *"
                                value={formData.issueType}
                                onChange={(value) => handleInputChange('issueType', value)}
                                options={issueTypes}
                                required
                            />

                            <Input
                                name="weight"
                                label="Volume of Waste (kg)"
                                type="number"
                                value={formData.weight}
                                onChange={handleWeightChange}
                                placeholder="Enter approximate weight"
                                min="0"
                                step="0.1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Problem/Message *
                            </label>
                            <textarea
                                name="problem"
                                value={formData.problem}
                                onChange={(e) => handleInputChange('problem', e.target.value)}
                                placeholder="Describe your problem in detail..."
                                required
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Attach Files (Optional)
                            </label>
                            <div
                                onClick={() => document.getElementById('file-input')?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                            >
                                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600 mb-1">Click to add files</p>
                                <span className="text-xs text-gray-500">
                                    {selectedFiles && selectedFiles.length > 0
                                        ? `${selectedFiles.length} file(s) selected`
                                        : 'Choose files to upload'
                                    }
                                </span>
                                <input
                                    type="file"
                                    id="file-input"
                                    hidden
                                    multiple
                                    onChange={handleFileChange}
                                    accept="image/*,.pdf,.doc,.docx"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || !formData.name || !formData.email || !formData.address || !formData.issueType || !formData.problem}
                            className="w-full"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            {isLoading ? 'Submitting...' : 'Submit Complaint'}
                        </Button>
                    </form>
                </CardBody>
            </Card>
                </div>
            </div>
        </div>
    );
}
