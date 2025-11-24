import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import api from '../../lib/api';

export default function UserProfile() {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        bio: '',
        role: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Auto-populate form with user data
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                bio: user.bio || '',
                role: user.role || 'user'
            });
        }
    }, [user]);

    const handleInputChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const formatPhoneNumber = (phone: string) => {
        // Remove all non-digit characters except + and ensure it starts with 1-9 or +
        let cleaned = phone.replace(/[^\d+]/g, '');
        
        // If it doesn't start with + or 1-9, add a default country code
        if (cleaned && !cleaned.match(/^[\+]?[1-9]/)) {
            cleaned = '+1' + cleaned; // Default to US format
        }
        
        return cleaned;
    };

    const handlePasswordChange = (name: string, value: string) => {
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        // Basic validation
        if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
            setError('Please fill in all required fields');
            setIsLoading(false);
            return;
        }

        try {
            // Prepare data for backend - only send fields that are allowed to be updated
            const updateData: any = {
                firstName: formData.firstName,
                lastName: formData.lastName
            };
            
            // Only include phone if it's not empty and matches the expected format
            if (formData.phone && formData.phone.trim()) {
                const formattedPhone = formatPhoneNumber(formData.phone);
                // Only include if it matches the backend validation pattern
                if (formattedPhone.match(/^[\+]?[1-9][\d]{0,15}$/)) {
                    updateData.phone = formattedPhone;
                } else {
                    setError('Please enter a valid phone number (e.g., +1234567890 or 1234567890)');
                    setIsLoading(false);
                    return;
                }
            }
            
            // Only include bio if it's not empty
            if (formData.bio && formData.bio.trim()) {
                updateData.preferences = {
                    bio: formData.bio
                };
            }
            
            console.log('Sending profile update request:', updateData);
            const response = await api.put('/auth/profile', updateData);
            setMessage('Profile updated successfully!');
            
            // Update the user context with new data
            if (response.data.success) {
                // Update the user context immediately with the new data
                updateUser({
                    firstName: updateData.firstName,
                    lastName: updateData.lastName,
                    email: formData.email, // Keep the original email
                    phone: updateData.phone || user?.phone || '',
                    preferences: updateData.preferences || user?.preferences || {}
                });
                
                // Update the form data to reflect the changes
                setFormData(prev => ({
                    ...prev,
                    firstName: updateData.firstName,
                    lastName: updateData.lastName,
                    phone: updateData.phone || '',
                    bio: updateData.preferences?.bio || ''
                }));
            }
        } catch (err: any) {
            console.error('Profile update error:', err);
            console.error('Error response:', err.response?.data);
            console.error('Request data sent:', updateData);
            
            // Show more detailed error message
            if (err.response?.data?.errors) {
                const errorMessages = err.response.data.errors.map((error: any) => error.msg).join(', ');
                setError(`Validation failed: ${errorMessages}`);
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
                setError('Cannot connect to server. Please check if the backend is running.');
            } else {
                setError(`Failed to update profile: ${err.message || 'Unknown error'}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            console.log('Changing password for user:', user?.email);
            const response = await api.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            
            console.log('Password change response:', response.data);
            
            if (response.data.success) {
                setMessage('Password updated successfully! You will be logged out in 3 seconds. Please log in again with your NEW password.');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                
                // Log out the user after password change for security
                setTimeout(() => {
                    console.log('Logging out user after password change');
                    logout();
                    // Redirect to login page
                    window.location.href = '/user/login';
                }, 3000); // Give user time to see the message
            }
        } catch (err: any) {
            console.error('Password change error:', err);
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="User Profile" 
                description="Manage your personal information and account settings." 
            />

            {/* Message and Error Display */}
            {message && (
                <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
                    {message}
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="font-medium">Profile Picture</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">👤</span>
                            </div>
                            <Button variant="secondary" size="sm">Change Photo</Button>
                        </div>
                    </CardBody>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <h3 className="font-medium">Personal Information</h3>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                name="firstName"
                                label="First Name (Pre-filled from your account)"
                                type="text"
                                value={formData.firstName}
                                onChange={(value) => handleInputChange('firstName', value)}
                                required
                            />
                            <Input
                                name="lastName"
                                label="Last Name (Pre-filled from your account)"
                                type="text"
                                value={formData.lastName}
                                onChange={(value) => handleInputChange('lastName', value)}
                                required
                            />
                            <Input
                                name="email"
                                label="Email (Pre-filled from your account)"
                                type="email"
                                value={formData.email}
                                onChange={(value) => handleInputChange('email', value)}
                                required
                            />
                            <Input
                                name="phone"
                                label="Phone (Pre-filled from your account)"
                                type="text"
                                value={formData.phone}
                                onChange={(value) => handleInputChange('phone', value)}
                            />
                            <div className="md:col-span-2">
                                <label className="block text-sm text-gray-700 mb-2">
                                    Bio
                                </label>
                                <textarea 
                                    className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    rows={3}
                                    value={formData.bio}
                                    onChange={(e) => handleInputChange('bio', e.target.value)}
                                    placeholder="Tell us about yourself..."
                                />
                            </div>
                            <div className="md:col-span-2 flex items-center gap-2">
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <h3 className="font-medium">Account Settings</h3>
                </CardHeader>
                <CardBody>
                    <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            name="currentPassword"
                            label="Current Password"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(value) => handlePasswordChange('currentPassword', value)}
                            placeholder="Enter current password"
                            required
                        />
                        <Input
                            name="newPassword"
                            label="New Password"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(value) => handlePasswordChange('newPassword', value)}
                            placeholder="Enter new password"
                            required
                        />
                        <Input
                            name="confirmPassword"
                            label="Confirm New Password"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(value) => handlePasswordChange('confirmPassword', value)}
                            placeholder="Confirm new password"
                            required
                        />
                        <div className="md:col-span-2">
                            <Input
                                name="role"
                                label="Role (Read-only)"
                                value={formData.role}
                                onChange={() => {}} // Disabled - users can't change their role
                                disabled
                                className="bg-gray-100"
                            />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-2">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </Button>
                            <Button type="button" variant="secondary">Reset Password</Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
}
