import { useState } from 'react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import { X, MapPin } from 'lucide-react';
import api from '../../lib/api';

type BinFormData = {
    location: string;
    city: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    binType: 'household' | 'commercial' | 'industrial' | 'recycling';
    notes: string;
    coordinates: {
        latitude: string;
        longitude: string;
    };
};

type AddBinModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export default function AddBinModal({ isOpen, onClose, onSuccess }: AddBinModalProps) {
    const [formData, setFormData] = useState<BinFormData>({
        location: '',
        city: '',
        priority: 'medium',
        binType: 'household',
        notes: '',
        coordinates: {
            latitude: '',
            longitude: ''
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (field: keyof BinFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCoordinateChange = (field: 'latitude' | 'longitude', value: string) => {
        setFormData(prev => ({
            ...prev,
            coordinates: {
                ...prev.coordinates,
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.location.trim() || !formData.city.trim()) {
            setError('Location and city are required');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const submitData = {
                ...formData,
                coordinates: formData.coordinates.latitude && formData.coordinates.longitude ? {
                    latitude: parseFloat(formData.coordinates.latitude),
                    longitude: parseFloat(formData.coordinates.longitude)
                } : undefined
            };

            const response = await api.post('/bins', submitData);

            if (response.data.success) {
                alert('Bin added successfully!');
                setFormData({
                    location: '',
                    city: '',
                    priority: 'medium',
                    binType: 'household',
                    notes: '',
                    coordinates: {
                        latitude: '',
                        longitude: ''
                    }
                });
                onSuccess();
                onClose();
            } else {
                setError(response.data.message || 'Failed to add bin');
            }
        } catch (err: any) {
            console.error('Error adding bin:', err);
            setError(err.response?.data?.message || 'Failed to add bin');
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
                            <MapPin className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-lg font-medium">Add New Bin</h3>
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
                                name="location"
                                label="Location *"
                                value={formData.location}
                                onChange={(value) => handleInputChange('location', value)}
                                placeholder="Enter bin location"
                                required
                            />
                            <Input
                                name="city"
                                label="City *"
                                value={formData.city}
                                onChange={(value) => handleInputChange('city', value)}
                                placeholder="Enter city"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                name="priority"
                                label="Priority"
                                value={formData.priority}
                                onChange={(value) => handleInputChange('priority', value as any)}
                                options={[
                                    { value: 'low', label: 'Low' },
                                    { value: 'medium', label: 'Medium' },
                                    { value: 'high', label: 'High' },
                                    { value: 'urgent', label: 'Urgent' }
                                ]}
                            />
                            <Select
                                name="binType"
                                label="Bin Type"
                                value={formData.binType}
                                onChange={(value) => handleInputChange('binType', value as any)}
                                options={[
                                    { value: 'household', label: 'Household' },
                                    { value: 'commercial', label: 'Commercial' },
                                    { value: 'industrial', label: 'Industrial' },
                                    { value: 'recycling', label: 'Recycling' }
                                ]}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                name="latitude"
                                label="Latitude (Optional)"
                                type="number"
                                step="any"
                                value={formData.coordinates.latitude}
                                onChange={(value) => handleCoordinateChange('latitude', value)}
                                placeholder="e.g., 6.9271"
                            />
                            <Input
                                name="longitude"
                                label="Longitude (Optional)"
                                type="number"
                                step="any"
                                value={formData.coordinates.longitude}
                                onChange={(value) => handleCoordinateChange('longitude', value)}
                                placeholder="e.g., 79.8612"
                            />
                        </div>

                        <Textarea
                            name="notes"
                            label="Notes (Optional)"
                            value={formData.notes}
                            onChange={(value) => handleInputChange('notes', value)}
                            placeholder="Additional notes about the bin"
                            rows={3}
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
                                {loading ? 'Adding...' : 'Add Bin'}
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
}
