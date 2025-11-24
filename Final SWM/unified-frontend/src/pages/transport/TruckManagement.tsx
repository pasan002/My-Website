import { useState, useEffect } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import { Truck, Plus, Edit, Trash2, Users } from 'lucide-react';
import api from '../../lib/api';
import AddTruckModal from '../../components/transport/AddTruckModal';

type Truck = {
    _id: string;
    plateNumber: string;
    capacity: string;
    capacityKg?: number;
    status: 'active' | 'maintenance' | 'inactive' | 'in-use';
    fuelType?: 'diesel' | 'petrol' | 'electric' | 'hybrid';
    fuelCapacity?: number;
    manufacturer?: string;
    model?: string;
    year?: number;
    currentLocation?: string;
    assignedTo?: {
        _id: string;
        name: string;
        email: string;
        phone: string;
        city: string;
        status: string;
    };
    performance?: {
        totalTrips: number;
        totalDistance: number;
        averageFuelConsumption: number;
    };
};

export default function TruckManagement() {
    const [trucks, setTrucks] = useState<Truck[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTruck, setEditingTruck] = useState<Truck | null>(null);

    const loadTrucks = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await api.get('/trucks');
            if (response.data.success) {
                setTrucks(response.data.data.trucks);
            } else {
                setError('Failed to load trucks');
            }
        } catch (err) {
            console.error('Error loading trucks:', err);
            setError('Failed to load trucks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTrucks();
    }, []);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'maintenance': return 'bg-yellow-100 text-yellow-800';
            case 'inactive': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleAddTruck = () => {
        setEditingTruck(null);
        setShowAddModal(true);
    };

    const handleEditTruck = (truck: Truck) => {
        setEditingTruck(truck);
        setShowAddModal(true);
    };

    const handleDeleteTruck = async (truckId: string) => {
        if (!window.confirm('Are you sure you want to delete this truck?')) return;
        
        try {
            const response = await api.delete(`/trucks/${truckId}`);
            if (response.data.success) {
                alert('Truck deleted successfully!');
                loadTrucks(); // Reload data from API
            } else {
                alert('Failed to delete truck: ' + response.data.message);
            }
        } catch (err: any) {
            console.error('Error deleting truck:', err);
            alert('Failed to delete truck. Please try again.');
        }
    };

    const handleSubmitTruck = async (formData: any) => {
        try {
            if (editingTruck) {
                // Update existing truck
                const response = await api.put(`/trucks/${editingTruck._id}`, formData);
                if (response.data.success) {
                    alert('Truck updated successfully!');
                    loadTrucks(); // Reload data from API
                    setShowAddModal(false);
                    setEditingTruck(null);
                } else {
                    alert('Failed to update truck: ' + response.data.message);
                }
            } else {
                // Create new truck
                const response = await api.post('/trucks', formData);
                if (response.data.success) {
                    alert('Truck created successfully!');
                    loadTrucks(); // Reload data from API
                    setShowAddModal(false);
                } else {
                    alert('Failed to create truck: ' + response.data.message);
                }
            }
        } catch (err: any) {
            console.error('Error saving truck:', err);
            alert('Failed to save truck. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <span className="ml-2">Loading trucks...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Truck Management"
                    description="Manage waste collection trucks and their assignments"
                />
                <Card>
                    <CardBody className="text-center py-12">
                        <div className="text-red-600 mb-4">
                            <Truck className="h-12 w-12 mx-auto mb-2" />
                            <p className="text-lg font-medium">Error Loading Trucks</p>
                            <p className="text-sm">{error}</p>
                        </div>
                        <Button onClick={loadTrucks} variant="secondary">
                            Try Again
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <PageHeader
                    title="Truck Management"
                    description="Manage waste collection vehicles and their assignments"
                />

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <h3 className="font-medium">Trucks Management</h3>
                        <Button onClick={handleAddTruck}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Truck
                        </Button>
                    </div>
                </CardHeader>
                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <THead>
                                <tr>
                                    <TH>Plate Number</TH>
                                    <TH>Capacity</TH>
                                    <TH>Status</TH>
                                    <TH>Assigned To</TH>
                                    <TH>Actions</TH>
                                </tr>
                            </THead>
                            <TBody>
                                {trucks.map(truck => (
                                    <TR key={truck._id} className="hover:bg-gray-50">
                                        <TD>
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-4 w-4 text-gray-500" />
                                                <span className="font-medium">{truck.plateNumber}</span>
                                            </div>
                                        </TD>
                                        <TD>{truck.capacity}</TD>
                                        <TD>
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(truck.status)}`}>
                                                {truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
                                            </span>
                                        </TD>
                                        <TD>
                                            {truck.assignedTo ? (
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-gray-500" />
                                                    <span className="font-medium">{truck.assignedTo.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">Available</span>
                                            )}
                                        </TD>
                                        <TD>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleEditTruck(truck)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => handleDeleteTruck(truck._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TD>
                                    </TR>
                                ))}
                            </TBody>
                        </Table>
                    </div>
                    {trucks.length === 0 && (
                        <div className="text-center py-12">
                            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No trucks found. Add one to get started.</p>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Add/Edit Truck Modal */}
            {showAddModal && (
                <TruckModal
                    truck={editingTruck}
                    onSubmit={handleSubmitTruck}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingTruck(null);
                    }}
                />
            )}
        </div>

        <AddTruckModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
                loadTrucks();
                setShowAddModal(false);
            }}
            truck={editingTruck}
        />
        </>
    );
}

// Truck Modal Component
type TruckModalProps = {
    truck: Truck | null;
    onSubmit: (formData: any) => void;
    onClose: () => void;
};

function TruckModal({ truck, onSubmit, onClose }: TruckModalProps) {
    const [formData, setFormData] = useState({
        plateNumber: truck?.plateNumber || '',
        capacity: truck?.capacity || '',
        status: truck?.status || 'active'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.plateNumber.trim()) {
            newErrors.plateNumber = 'Plate number is required';
        }

        if (!formData.capacity.trim()) {
            newErrors.capacity = 'Capacity is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">
                    {truck ? 'Edit Truck' : 'Add Truck'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plate Number *
                        </label>
                        <input
                            type="text"
                            value={formData.plateNumber}
                            onChange={(e) => handleChange('plateNumber', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                errors.plateNumber ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="e.g., TR-005"
                        />
                        {errors.plateNumber && <p className="text-red-500 text-xs mt-1">{errors.plateNumber}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Capacity *
                        </label>
                        <input
                            type="text"
                            value={formData.capacity}
                            onChange={(e) => handleChange('capacity', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                errors.capacity ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="e.g., 15 tons"
                        />
                        {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                            <option value="active">Active</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {truck ? 'Update' : 'Add'} Truck
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}