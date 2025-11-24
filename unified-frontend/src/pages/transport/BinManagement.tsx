import { useState, useEffect } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import { MapPin, Search, RotateCcw, Trash2, Plus } from 'lucide-react';
import api from '../../lib/api';
import AddBinModal from '../../components/transport/AddBinModal';

type Bin = {
    _id: string;
    location: string;
    city: string;
    reportedAt: string;
    status: 'Pending' | 'Assigned' | 'Collected' | 'Skipped';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    binType: 'household' | 'commercial' | 'industrial' | 'recycling';
    notes?: string;
    assignedTo?: {
        _id: string;
        name: string;
        email: string;
        phone: string;
        city: string;
        status: string;
    };
    reportedBy?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
};

type Collector = {
    _id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    status: 'active' | 'idle' | 'offline' | 'on-duty';
    driverLicense: string;
    truck?: {
        _id: string;
        plateNumber: string;
        capacity: string;
        status: string;
    };
};

export default function BinManagement() {
    const [bins, setBins] = useState<Bin[]>([]);
    const [collectors, setCollectors] = useState<Collector[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedPriority, setSelectedPriority] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);

    const loadBins = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await api.get('/bins');
            if (response.data.success) {
                setBins(response.data.data.bins);
            } else {
                setError('Failed to load bins');
            }
        } catch (err) {
            console.error('Error loading bins:', err);
            setError('Failed to load bins');
        } finally {
            setLoading(false);
        }
    };

    const loadCollectors = async () => {
        try {
            const response = await api.get('/collectors');
            if (response.data.success) {
                setCollectors(response.data.data.collectors);
            }
        } catch (err) {
            console.error('Error loading collectors:', err);
        }
    };

    useEffect(() => {
        loadBins();
        loadCollectors();
    }, []);

    // Filter bins
    const filteredBins = bins.filter(bin => {
        const matchesCity = selectedCity === 'all' || bin.city === selectedCity;
        const matchesStatus = selectedStatus === 'all' || bin.status === selectedStatus;
        const matchesPriority = selectedPriority === 'all' || bin.priority === selectedPriority;
        const matchesSearch = searchTerm === '' || 
            bin.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bin.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (bin.assignedTo && bin.assignedTo.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            bin.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bin.priority.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bin.binType.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesCity && matchesStatus && matchesPriority && matchesSearch;
    });

    // Get unique cities
    const cities = [...new Set(bins.map(bin => bin.city))];

    // Get available collectors for a bin
    const getAvailableCollectors = (bin: Bin) => {
        const eligible = collectors.filter(collector => 
            (collector.status === 'active' || collector.status === 'idle')
        );
        // Prefer same-city first; if none, return all eligible
        const sameCity = eligible.filter(c => c.city === bin.city && c._id !== bin.assignedTo?._id);
        if (sameCity.length > 0) return sameCity;
        return eligible.filter(c => c._id !== bin.assignedTo?._id);
    };

    const handleAssignCollector = async (binId: string, collectorId: string) => {
        if (!collectorId) {
            alert('Please select a collector');
            return;
        }

        try {
            const response = await api.put(`/bins/${binId}/assign-collector`, {
                collectorId: collectorId
            });

            if (response.data.success) {
                loadBins(); // Reload bins to get updated data
            } else {
                alert(response.data.message || 'Failed to assign collector');
            }
        } catch (err) {
            console.error('Error assigning collector:', err);
            alert('Failed to assign collector');
        }
    };

    const handleReassignSkippedBin = async (binId: string, collectorId: string) => {
        if (!collectorId) {
            alert('Please select a collector');
            return;
        }

        try {
            const response = await api.put(`/bins/${binId}/reassign`, {
                collectorId: collectorId,
                status: 'Assigned'
            });

            if (response.data.success) {
                alert('Skipped bin reassigned successfully!');
                loadBins(); // Reload bins to get updated data
            } else {
                alert(response.data.message || 'Failed to reassign bin');
            }
        } catch (err) {
            console.error('Error reassigning bin:', err);
            alert('Failed to reassign bin');
        }
    };

    const handleResetBinStatus = async (binId: string) => {
        try {
            const response = await api.put(`/bins/${binId}/reset-status`, {
                status: 'Pending'
            });

            if (response.data.success) {
                alert('Bin status reset to Pending!');
                loadBins(); // Reload bins to get updated data
            } else {
                alert(response.data.message || 'Failed to reset bin status');
            }
        } catch (err) {
            console.error('Error resetting bin status:', err);
            alert('Failed to reset bin status');
        }
    };

    const handleDeleteBin = async (binId: string) => {
        if (!window.confirm('Are you sure you want to delete this bin?')) return;
        
        try {
            const response = await api.delete(`/bins/${binId}`);

            if (response.data.success) {
                alert('Bin deleted successfully!');
                loadBins(); // Reload bins to get updated data
            } else {
                alert(response.data.message || 'Failed to delete bin');
            }
        } catch (err) {
            console.error('Error deleting bin:', err);
            alert('Failed to delete bin');
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Pending': return 'bg-orange-100 text-orange-800';
            case 'Assigned': return 'bg-blue-100 text-blue-800';
            case 'Collected': return 'bg-green-100 text-green-800';
            case 'Skipped': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <span className="ml-2">Loading bins...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Bin Management"
                    description="Manage waste bins, assign collectors, and track collection status"
                />
                <Card>
                    <CardBody className="text-center py-12">
                        <div className="text-red-600 mb-4">
                            <MapPin className="h-12 w-12 mx-auto mb-2" />
                            <p className="text-lg font-medium">Error Loading Bins</p>
                            <p className="text-sm">{error}</p>
                        </div>
                        <Button onClick={loadBins} variant="secondary">
                            Try Again
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Bin Management"
                description="Manage waste bins, assign collectors, and track collection status"
            />

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <h3 className="font-medium">Full Bins Dashboard</h3>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                name="search"
                                label=""
                                placeholder="Search by location, city, collector, or status..."
                                value={searchTerm}
                                onChange={(value) => setSearchTerm(value)}
                                className="pl-10"
                            />
                            </div>
                            <Select
                                name="city"
                                label=""
                                value={selectedCity}
                                onChange={(value) => setSelectedCity(value)}
                                options={[
                                    { value: 'all', label: 'All Cities' },
                                    ...cities.map(city => ({ value: city, label: city }))
                                ]}
                            />
                            <Select
                                name="status"
                                label=""
                                value={selectedStatus}
                                onChange={(value) => setSelectedStatus(value)}
                                options={[
                                    { value: 'all', label: 'All Status' },
                                    { value: 'Pending', label: 'Pending' },
                                    { value: 'Assigned', label: 'Assigned' },
                                    { value: 'Collected', label: 'Collected' },
                                    { value: 'Skipped', label: 'Skipped' }
                                ]}
                            />
                            <Select
                                name="priority"
                                label=""
                                value={selectedPriority}
                                onChange={(value) => setSelectedPriority(value)}
                                options={[
                                    { value: 'all', label: 'All Priority' },
                                    { value: 'low', label: 'Low' },
                                    { value: 'medium', label: 'Medium' },
                                    { value: 'high', label: 'High' },
                                    { value: 'urgent', label: 'Urgent' }
                                ]}
                            />
                            <Button onClick={() => setShowAddModal(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Bin
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <THead>
                                <tr>
                                    <TH>Location</TH>
                                    <TH>City</TH>
                                    <TH>Priority</TH>
                                    <TH>Type</TH>
                                    <TH>Reported</TH>
                                    <TH>Status</TH>
                                    <TH>Assigned To</TH>
                                    <TH>Actions</TH>
                                </tr>
                            </THead>
                            <TBody>
                                {filteredBins.map(bin => (
                                    <TR key={bin._id} className="hover:bg-gray-50">
                                        <TD>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-500" />
                                                {bin.location}
                                            </div>
                                        </TD>
                                        <TD>{bin.city}</TD>
                                        <TD>
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                bin.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                                bin.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                bin.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {bin.priority}
                                            </span>
                                        </TD>
                                        <TD>
                                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                                {bin.binType}
                                            </span>
                                        </TD>
                                        <TD className="text-sm text-gray-600">
                                            {formatDate(bin.reportedAt)}
                                        </TD>
                                        <TD>
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(bin.status)}`}>
                                                {bin.status}
                                            </span>
                                        </TD>
                                        <TD>
                                            {bin.assignedTo ? bin.assignedTo.name : 'Not assigned'}
                                        </TD>
                                        <TD>
                                            <div className="flex items-center gap-2">
                                                {(bin.status === 'Pending' || bin.status === 'Assigned') && (
                                                    <Select
                                                        name={`assign-${bin._id}`}
                                                        label=""
                                                        value={bin.assignedTo?._id || ''}
                                                        onChange={(value) => handleAssignCollector(bin._id, value)}
                                                        options={(() => {
                                                            const opts = [] as { value: string; label: string }[];
                                                            opts.push({ value: '', label: 'Assign Collector' });
                                                            if (bin.assignedTo) {
                                                                opts.push({ value: bin.assignedTo._id, label: `${bin.assignedTo.name} (current)` });
                                                            }
                                                            const available = getAvailableCollectors(bin);
                                                            available.forEach(c => {
                                                                opts.push({ value: c._id, label: `${c.name} • ${c.city} • ${c.status}` });
                                                            });
                                                            return opts;
                                                        })()}
                                                        className="min-w-32"
                                                    />
                                                )}
                                                {bin.status === 'Skipped' && (
                                                    <div className="flex items-center gap-1">
                                                        <Select
                                                            name={`reassign-${bin._id}`}
                                                            label=""
                                                            value=""
                                                            onChange={(value) => handleReassignSkippedBin(bin._id, value)}
                                                            options={[
                                                                { value: '', label: 'Reassign' },
                                                                ...getAvailableCollectors(bin).map(collector => ({
                                                                    value: collector._id,
                                                                    label: collector.name
                                                                }))
                                                            ]}
                                                            className="min-w-32"
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => handleResetBinStatus(bin._id)}
                                                            title="Reset to Pending"
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => handleDeleteBin(bin._id)}
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
                    {filteredBins.length === 0 && (
                        <div className="text-center py-12">
                            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {searchTerm || selectedCity !== 'all' 
                                    ? 'No bins found matching your search criteria.' 
                                    : 'No bins found. Add some bins to get started.'
                                }
                            </p>
                            {(searchTerm || selectedCity !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all') && (
                                <Button 
                                    variant="secondary" 
                                    onClick={() => { 
                                        setSearchTerm(''); 
                                        setSelectedCity('all'); 
                                        setSelectedStatus('all');
                                        setSelectedPriority('all');
                                    }}
                                    className="mt-2"
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    )}
                </CardBody>
            </Card>

            <AddBinModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    loadBins();
                    setShowAddModal(false);
                }}
            />
        </div>
    );
}