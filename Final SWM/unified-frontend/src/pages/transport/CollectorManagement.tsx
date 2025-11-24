import { useState, useEffect } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import { Users, Plus, Edit, Trash2, Truck } from 'lucide-react';
import api from '../../lib/api';
import AddCollectorModal from '../../components/transport/AddCollectorModal';

type Collector = {
    _id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    status: 'active' | 'idle' | 'offline' | 'on-duty';
    driverLicense: string;
    currentLocation?: string;
    truck?: {
        _id: string;
        plateNumber: string;
        capacity: string;
        status: string;
    };
    assignedBins?: Array<{
        _id: string;
        location: string;
        city: string;
        status: string;
        reportedAt: string;
    }>;
    performance?: {
        totalCollections: number;
        totalSkipped: number;
        averageRating: number;
    };
};

type Truck = {
    _id: string;
    plateNumber: string;
    capacity: string;
    status: 'active' | 'maintenance' | 'inactive';
    assignedTo?: {
        _id: string;
        name: string;
    };
};

export default function CollectorManagement() {
    const [collectors, setCollectors] = useState<Collector[]>([]);
    const [trucks, setTrucks] = useState<Truck[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCollector, setEditingCollector] = useState<Collector | null>(null);

    const loadCollectors = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await api.get('/collectors');
            if (response.data.success) {
                setCollectors(response.data.data.collectors);
            } else {
                setError('Failed to load collectors');
            }
        } catch (err) {
            console.error('Error loading collectors:', err);
            setError('Failed to load collectors');
        } finally {
            setLoading(false);
        }
    };

    const loadTrucks = async () => {
        try {
            const response = await api.get('/trucks');
            if (response.data.success) {
                setTrucks(response.data.data.trucks);
            }
        } catch (err) {
            console.error('Error loading trucks:', err);
        }
    };

    useEffect(() => {
        loadCollectors();
        loadTrucks();
    }, []);

    // Get available trucks (not assigned to any collector)
    const availableTrucks = trucks.filter(truck => !truck.assignedTo);

    // Calculate collector performance percentage
    const calculatePerformance = (collector: Collector) => {
        const assignedBins = collector.assignedBins || [];
        if (assignedBins.length === 0) return 0;
        
        const collectedBins = assignedBins.filter(bin => bin.status === 'Collected').length;
        return Math.round((collectedBins / assignedBins.length) * 100);
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'collecting': return 'bg-blue-100 text-blue-800';
            case 'idle': return 'bg-yellow-100 text-yellow-800';
            case 'offline': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleAddCollector = () => {
        setEditingCollector(null);
        setShowAddModal(true);
    };

    const handleEditCollector = (collector: Collector) => {
        setEditingCollector(collector);
        setShowAddModal(true);
    };

    const handleDeleteCollector = async (collectorId: string) => {
        if (!window.confirm('Are you sure you want to delete this collector?')) return;
        
        try {
            const response = await api.delete(`/collectors/${collectorId}`);
            if (response.data.success) {
                alert('Collector deleted successfully!');
                loadCollectors(); // Reload data from API
                loadTrucks(); // Reload trucks in case assignment changed
            } else {
                alert('Failed to delete collector: ' + response.data.message);
            }
        } catch (err: any) {
            console.error('Error deleting collector:', err);
            alert('Failed to delete collector. Please try again.');
        }
    };

    const handleSubmitCollector = async (formData: any) => {
        try {
            if (editingCollector) {
                // Update existing collector
                const response = await api.put(`/collectors/${editingCollector._id}`, formData);
                if (response.data.success) {
                    alert('Collector updated successfully!');
                    loadCollectors(); // Reload data from API
                    loadTrucks(); // Reload trucks in case assignment changed
                    setShowAddModal(false);
                    setEditingCollector(null);
                } else {
                    alert('Failed to update collector: ' + response.data.message);
                }
            } else {
                // Create new collector
                const response = await api.post('/collectors/register', formData);
                if (response.data.success) {
                    alert('Collector created successfully!');
                    loadCollectors(); // Reload data from API
                    loadTrucks(); // Reload trucks in case assignment changed
                    setShowAddModal(false);
                } else {
                    alert('Failed to create collector: ' + response.data.message);
                }
            }
        } catch (err: any) {
            console.error('Error saving collector:', err);
            alert('Failed to save collector. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <span className="ml-2">Loading collectors...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Driver/Collector Management"
                    description="Manage waste collectors and their assignments"
                />
                <Card>
                    <CardBody className="text-center py-12">
                        <div className="text-red-600 mb-4">
                            <Users className="h-12 w-12 mx-auto mb-2" />
                            <p className="text-lg font-medium">Error Loading Collectors</p>
                            <p className="text-sm">{error}</p>
                        </div>
                        <Button onClick={loadCollectors} variant="secondary">
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
                    title="Driver/Collector Management"
                    description="Manage waste collection staff, assign trucks, and track performance"
                />

            {/* Warning if no trucks available */}
            {availableTrucks.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Truck className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                No available trucks!
                            </h3>
                            <p className="text-sm text-yellow-700 mt-1">
                                Please add trucks before creating collectors.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <h3 className="font-medium">Drivers/Collectors Management</h3>
                        <Button
                            onClick={handleAddCollector}
                            disabled={availableTrucks.length === 0}
                            title={availableTrucks.length === 0 ? "No available trucks. Please add a truck first." : ""}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Driver/Collector
                        </Button>
                    </div>
                </CardHeader>
                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <THead>
                                <tr>
                                    <TH>Name</TH>
                                    <TH>City</TH>
                                    <TH>Status</TH>
                                    <TH>Truck</TH>
                                    <TH>Assigned Bins</TH>
                                    <TH>Current Location</TH>
                                    <TH>Performance</TH>
                                    <TH>Actions</TH>
                                </tr>
                            </THead>
                            <TBody>
                                {collectors.map(collector => (
                                    <TR key={collector._id} className="hover:bg-gray-50">
                                        <TD>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-gray-500" />
                                                <span className="font-medium">{collector.name}</span>
                                            </div>
                                        </TD>
                                        <TD>{collector.city}</TD>
                                        <TD>
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(collector.status)}`}>
                                                {collector.status.charAt(0).toUpperCase() + collector.status.slice(1)}
                                            </span>
                                        </TD>
                                        <TD>
                                            {collector.truck ? (
                                                <div className="flex items-center gap-2">
                                                    <Truck className="h-4 w-4 text-gray-500" />
                                                    <div>
                                                        <div className="font-medium">{collector.truck.plateNumber}</div>
                                                        <div className="text-sm text-gray-500">{collector.truck.capacity}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">No truck assigned</span>
                                            )}
                                        </TD>
                                        <TD>
                                            <div className="text-center">
                                                <div className="font-semibold">{collector.assignedBins?.length || 0}</div>
                                                {collector.assignedBins && collector.assignedBins.length > 0 && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {collector.assignedBins.slice(0, 2).map(bin => (
                                                            <div key={bin._id} className="truncate">
                                                                {bin.location} ({bin.status})
                                                            </div>
                                                        ))}
                                                        {collector.assignedBins.length > 2 && (
                                                            <div>+{collector.assignedBins.length - 2} more</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TD>
                                        <TD className="text-sm text-gray-600">
                                            {collector.currentLocation || 'Unknown'}
                                        </TD>
                                        <TD>
                                            <div className="text-center">
                                                <div className="font-semibold">{calculatePerformance(collector)}%</div>
                                                <div className="text-xs text-gray-500">Success rate</div>
                                            </div>
                                        </TD>
                                        <TD>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleEditCollector(collector)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => handleDeleteCollector(collector._id)}
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
                    {collectors.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {availableTrucks.length === 0 
                                    ? "No collectors found. Add trucks first to create collectors." 
                                    : "No collectors found. Add one to get started."
                                }
                            </p>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Add/Edit Collector Modal */}
            {showAddModal && (
                <CollectorModal
                    collector={editingCollector}
                    trucks={availableTrucks}
                    onSubmit={handleSubmitCollector}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingCollector(null);
                    }}
                />
            )}
        </div>

        <AddCollectorModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
                loadCollectors();
                loadTrucks();
                setShowAddModal(false);
            }}
            trucks={trucks.map(truck => ({
                _id: truck._id,
                plateNumber: truck.plateNumber,
                capacity: truck.capacity,
                status: truck.status,
                assignedTo: truck.assignedTo?._id
            }))}
            collector={editingCollector}
        />
        </>
    );
}

// Collector Modal Component
type CollectorModalProps = {
    collector: Collector | null;
    trucks: Truck[];
    onSubmit: (formData: any) => void;
    onClose: () => void;
};

function CollectorModal({ collector, trucks, onSubmit, onClose }: CollectorModalProps) {
    const [formData, setFormData] = useState({
        name: collector?.name || '',
        city: collector?.city || '',
        status: collector?.status || 'active',
        truck: collector?.truck?._id || ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (/\d/.test(formData.name)) {
            newErrors.name = 'Name should not contain numbers';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }

        if (!collector && !formData.truck) {
            newErrors.truck = 'Truck assignment is required';
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
                    {collector ? 'Edit Driver/Collector' : 'Add Driver/Collector'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter collector's name"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                        </label>
                        <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => handleChange('city', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                errors.city ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter city"
                        />
                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
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
                            <option value="idle">Idle</option>
                            <option value="offline">Offline</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assign Truck {!collector && '*'}
                            {trucks.length === 0 && !collector && (
                                <span className="text-red-500 text-xs ml-1">(No available trucks)</span>
                            )}
                        </label>
                        <select
                            value={formData.truck}
                            onChange={(e) => handleChange('truck', e.target.value)}
                            disabled={trucks.length === 0 && !collector}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                errors.truck ? 'border-red-500' : 'border-gray-300'
                            } ${trucks.length === 0 && !collector ? 'bg-gray-100' : ''}`}
                        >
                            <option value="">
                                {collector ? 'Keep current truck' : 'Select a truck'}
                            </option>
                            {trucks.map(truck => (
                                <option key={truck._id} value={truck._id}>
                                    {truck.plateNumber} - {truck.capacity}
                                </option>
                            ))}
                        </select>
                        {errors.truck && <p className="text-red-500 text-xs mt-1">{errors.truck}</p>}
                        {trucks.length === 0 && !collector && (
                            <p className="text-red-500 text-xs mt-1">
                                No available trucks. Please add trucks first.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {collector ? 'Update' : 'Add'} Driver/Collector
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}