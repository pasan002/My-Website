import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { X, Truck } from 'lucide-react';
import api from '../../lib/api';

type TruckFormData = {
    plateNumber: string;
    capacity: string;
    capacityKg: string;
    fuelType: 'diesel' | 'petrol' | 'electric' | 'hybrid';
    fuelCapacity: string;
    manufacturer: string;
    model: string;
    year: string;
    status: 'active' | 'maintenance' | 'inactive';
};

type AddTruckModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    truck?: any; // For editing existing truck
};

export default function AddTruckModal({ isOpen, onClose, onSuccess, truck }: AddTruckModalProps) {
    const [formData, setFormData] = useState<TruckFormData>({
        plateNumber: '',
        capacity: '',
        capacityKg: '',
        fuelType: 'diesel',
        fuelCapacity: '',
        manufacturer: '',
        model: '',
        year: '',
        status: 'active'
    });

    useEffect(() => {
        if (truck) {
            setFormData({
                plateNumber: truck.plateNumber || '',
                capacity: truck.capacity || '',
                capacityKg: truck.capacityKg?.toString() || '',
                fuelType: truck.fuelType || 'diesel',
                fuelCapacity: truck.fuelCapacity?.toString() || '',
                manufacturer: truck.manufacturer || '',
                model: truck.model || '',
                year: truck.year?.toString() || '',
                status: truck.status || 'active'
            });
        } else {
            setFormData({
                plateNumber: '',
                capacity: '',
                capacityKg: '',
                fuelType: 'diesel',
                fuelCapacity: '',
                manufacturer: '',
                model: '',
                year: '',
                status: 'active'
            });
        }
    }, [truck, isOpen]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (field: keyof TruckFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.plateNumber.trim() || !formData.capacity.trim()) {
            setError('Plate number and capacity are required');
            return;
        }

        if (formData.year && (parseInt(formData.year) < 1990 || parseInt(formData.year) > new Date().getFullYear() + 1)) {
            setError('Please enter a valid year');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const submitData = {
                ...formData,
                plateNumber: formData.plateNumber.toUpperCase(),
                capacityKg: formData.capacityKg ? parseFloat(formData.capacityKg) : undefined,
                fuelCapacity: formData.fuelCapacity ? parseFloat(formData.fuelCapacity) : undefined,
                year: formData.year ? parseInt(formData.year) : undefined
            };

            let response;
            if (truck) {
                // Update existing truck
                response = await api.put(`/trucks/${truck._id}`, submitData);
            } else {
                // Create new truck
                response = await api.post('/trucks', submitData);
            }

            if (response.data.success) {
                alert(`Truck ${truck ? 'updated' : 'added'} successfully!`);
                setFormData({
                    plateNumber: '',
                    capacity: '',
                    capacityKg: '',
                    fuelType: 'diesel',
                    fuelCapacity: '',
                    manufacturer: '',
                    model: '',
                    year: '',
                    status: 'active'
                });
                onSuccess();
                onClose();
            } else {
                setError(response.data.message || `Failed to ${truck ? 'update' : 'add'} truck`);
            }
        } catch (err: any) {
            console.error('Error saving truck:', err);
            setError(err.response?.data?.message || `Failed to ${truck ? 'update' : 'add'} truck. Please try again.`);
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
                            <Truck className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-lg font-medium">Add New Truck</h3>
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
                                name="plateNumber"
                                label="Plate Number *"
                                value={formData.plateNumber}
                                onChange={(value) => handleInputChange('plateNumber', value)}
                                placeholder="Enter plate number"
                                required
                            />
                            <Input
                                name="capacity"
                                label="Capacity *"
                                value={formData.capacity}
                                onChange={(value) => handleInputChange('capacity', value)}
                                placeholder="e.g., 5 tons"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                name="capacityKg"
                                label="Capacity (kg)"
                                type="number"
                                value={formData.capacityKg}
                                onChange={(value) => handleInputChange('capacityKg', value)}
                                placeholder="e.g., 5000"
                            />
                            <Input
                                name="fuelCapacity"
                                label="Fuel Capacity (L)"
                                type="number"
                                value={formData.fuelCapacity}
                                onChange={(value) => handleInputChange('fuelCapacity', value)}
                                placeholder="e.g., 200"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                name="fuelType"
                                label="Fuel Type"
                                value={formData.fuelType}
                                onChange={(value) => handleInputChange('fuelType', value as any)}
                                options={[
                                    { value: 'diesel', label: 'Diesel' },
                                    { value: 'petrol', label: 'Petrol' },
                                    { value: 'electric', label: 'Electric' },
                                    { value: 'hybrid', label: 'Hybrid' }
                                ]}
                            />
                            <Select
                                name="status"
                                label="Status"
                                value={formData.status}
                                onChange={(value) => handleInputChange('status', value as any)}
                                options={[
                                    { value: 'active', label: 'Active' },
                                    { value: 'maintenance', label: 'Maintenance' },
                                    { value: 'inactive', label: 'Inactive' }
                                ]}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                name="manufacturer"
                                label="Manufacturer"
                                value={formData.manufacturer}
                                onChange={(value) => handleInputChange('manufacturer', value)}
                                placeholder="e.g., Tata"
                            />
                            <Input
                                name="model"
                                label="Model"
                                value={formData.model}
                                onChange={(value) => handleInputChange('model', value)}
                                placeholder="e.g., Ace"
                            />
                            <Input
                                name="year"
                                label="Year"
                                type="number"
                                value={formData.year}
                                onChange={(value) => handleInputChange('year', value)}
                                placeholder="e.g., 2020"
                            />
                        </div>

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
                                {loading ? 'Adding...' : 'Add Truck'}
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
}
