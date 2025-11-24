import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { X, User } from 'lucide-react';
import api from '../../lib/api';

type CollectorFormData = {
    name: string;
    email: string;
    phone: string;
    password: string;
    city: string;
    driverLicense: string;
    truck?: string;
};

type AddCollectorModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    trucks: Array<{ _id: string; plateNumber: string; capacity: string; status: string; assignedTo?: string }>;
    collector?: any; // For editing existing collector
};

export default function AddCollectorModal({ isOpen, onClose, onSuccess, trucks, collector }: AddCollectorModalProps) {
    const [formData, setFormData] = useState<CollectorFormData>({
        name: '',
        email: '',
        phone: '',
        password: '',
        city: '',
        driverLicense: '',
        truck: ''
    });

    useEffect(() => {
        if (collector) {
            setFormData({
                name: collector.name || '',
                email: collector.email || '',
                phone: collector.phone || '',
                password: '', // Don't pre-fill password for security
                city: collector.city || '',
                driverLicense: collector.driverLicense || '',
                truck: collector.truck?._id || ''
            });
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                password: '',
                city: '',
                driverLicense: '',
                truck: ''
            });
        }
    }, [collector, isOpen]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (field: keyof CollectorFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || 
            !formData.city.trim() || !formData.driverLicense.trim()) {
            setError('All fields are required');
            return;
        }

        // Only require password for new collectors
        if (!collector && (!formData.password.trim() || formData.password.length < 6)) {
            setError('Password must be at least 6 characters long');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const submitData = {
                ...formData,
                truck: formData.truck || undefined
            };

            let response;
            if (collector) {
                // Update existing collector
                response = await api.put(`/collectors/${collector._id}`, submitData);
            } else {
                // Create new collector
                response = await api.post('/collectors/register', submitData);
            }

            if (response.data.success) {
                alert(`Collector ${collector ? 'updated' : 'added'} successfully!`);
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    password: '',
                    city: '',
                    driverLicense: '',
                    truck: ''
                });
                onSuccess();
                onClose();
            } else {
                setError(response.data.message || `Failed to ${collector ? 'update' : 'add'} collector`);
            }
        } catch (err: any) {
            console.error('Error saving collector:', err);
            setError(err.response?.data?.message || `Failed to ${collector ? 'update' : 'add'} collector. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-lg font-medium">Add New Collector</h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardBody>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                name="name"
                                label="Full Name *"
                                value={formData.name}
                                onChange={(value) => handleInputChange('name', value)}
                                placeholder="Enter full name"
                                required
                            />
                            <Input
                                name="email"
                                label="Email *"
                                type="email"
                                value={formData.email}
                                onChange={(value) => handleInputChange('email', value)}
                                placeholder="Enter email address"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                name="phone"
                                label="Phone Number *"
                                value={formData.phone}
                                onChange={(value) => handleInputChange('phone', value)}
                                placeholder="Enter phone number"
                                required
                            />
                            <Input
                                name="driverLicense"
                                label="Driver License *"
                                value={formData.driverLicense}
                                onChange={(value) => handleInputChange('driverLicense', value)}
                                placeholder="Enter driver license number"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                name="city"
                                label="City *"
                                value={formData.city}
                                onChange={(value) => handleInputChange('city', value)}
                                placeholder="Enter city"
                                required
                            />
                            <Input
                                name="password"
                                label="Password *"
                                type="password"
                                value={formData.password}
                                onChange={(value) => handleInputChange('password', value)}
                                placeholder="Enter password (min 6 characters)"
                                required
                            />
                        </div>

                        <Select
                            name="truck"
                            label="Assign Truck (Optional)"
                            value={formData.truck}
                            onChange={(value) => handleInputChange('truck', value)}
                            options={[
                                { value: '', label: 'No truck assigned' },
                                ...trucks.filter(truck => truck.status === 'active' && !truck.assignedTo).map(truck => ({
                                    value: truck._id,
                                    label: `${truck.plateNumber} - ${truck.capacity}`
                                }))
                            ]}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Adding...' : 'Add Collector'}
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
}
