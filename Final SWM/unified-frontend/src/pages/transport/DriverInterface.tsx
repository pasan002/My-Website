import { useState, useEffect } from 'react';
// import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { 
    MapPin, 
    Truck, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Navigation, 
    User, 
    Calendar, 
    LogOut,
    // RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Bin = {
    _id: string;
    location: string;
    city: string;
    reportedAt: string;
    status: 'Pending' | 'Assigned' | 'Collected' | 'Skipped';
    collectedAt?: string;
    updatedAt?: string;
};

type Driver = {
    _id: string;
    name: string;
    city: string;
    status: 'active' | 'collecting' | 'idle' | 'offline';
    truck?: {
        _id: string;
        plateNumber: string;
        capacity: string;
    };
    currentLocation?: string;
    lastUpdated?: string;
};

type TodayStats = {
    total: number;
    collected: number;
    missed: number;
    pending: number;
};

export default function DriverInterface() {
    const { user } = useAuth();
    const [driver, setDriver] = useState<Driver | null>(null);
    const [assignedBins, setAssignedBins] = useState<Bin[]>([]);
    const [todayStats, setTodayStats] = useState<TodayStats>({
        total: 0,
        collected: 0,
        missed: 0,
        pending: 0
    });
    const [currentLocation, setCurrentLocation] = useState('');
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [driverId, setDriverId] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Calculate today's stats
    const calculateTodayStats = (bins: Bin[]) => {
        setTodayStats({
            total: bins.length,
            collected: bins.filter(bin => bin.status === 'Collected').length,
            missed: bins.filter(bin => bin.status === 'Skipped').length,
            pending: bins.filter(bin => bin.status === 'Assigned' || bin.status === 'Pending').length
        });
    };

    // Fetch driver data
    const fetchDriverData = async () => {
        try {
            setLoading(true);
            
            // Mock data for testing
            const mockDriver: Driver = {
                _id: driverId,
                name: 'John Smith',
                city: 'Colombo',
                status: 'active',
                truck: { _id: 't1', plateNumber: 'TR-001', capacity: '15 tons' },
                currentLocation: 'Main Street, Colombo',
                lastUpdated: new Date().toISOString()
            };

            const mockBins: Bin[] = [
                {
                    _id: 'b1',
                    location: 'Main Street, Block A',
                    city: 'Colombo',
                    reportedAt: '2024-03-15T08:30:00Z',
                    status: 'Assigned'
                },
                {
                    _id: 'b2',
                    location: 'Park Road, Block B',
                    city: 'Colombo',
                    reportedAt: '2024-03-15T09:15:00Z',
                    status: 'Collected',
                    collectedAt: '2024-03-15T10:30:00Z'
                },
                {
                    _id: 'b3',
                    location: 'Garden Street, Block C',
                    city: 'Colombo',
                    reportedAt: '2024-03-15T10:00:00Z',
                    status: 'Skipped',
                    updatedAt: '2024-03-15T11:00:00Z'
                },
                {
                    _id: 'b4',
                    location: 'Market Road, Block D',
                    city: 'Colombo',
                    reportedAt: '2024-03-15T11:30:00Z',
                    status: 'Pending'
                }
            ];

            setDriver(mockDriver);
            setAssignedBins(mockBins);
            setCurrentLocation(mockDriver.currentLocation || '');
            calculateTodayStats(mockBins);
            
        } catch (error) {
            console.error('Error fetching driver data:', error);
            alert('Error loading driver data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Update location manually
    const updateLocationManually = async () => {
        if (!currentLocation.trim()) {
            alert('Please enter a location first.');
            return;
        }
        
        if (!driverId) {
            alert('Please login first.');
            return;
        }
        
        try {
            // Mock location update
            setDriver(prev => prev ? {
                ...prev,
                currentLocation: currentLocation,
                lastUpdated: new Date().toISOString()
            } : null);
            
            alert('✅ Location updated successfully! The transport manager can now see your location.');
            
        } catch (error) {
            console.error('Error updating location:', error);
            alert('⚠️ Location update feature might not be fully implemented yet. Your bin operations will still work.');
        }
    };

    // Update bin status
    const updateBinStatus = async (binId: string, status: 'Collected' | 'Skipped') => {
        try {
            setUpdatingStatus(binId);
            
            // Mock status update
            const updatedBins = assignedBins.map(bin =>
                bin._id === binId ? { 
                    ...bin, 
                    status, 
                    collectedAt: status === 'Collected' ? new Date().toISOString() : undefined,
                    updatedAt: new Date().toISOString()
                } : bin
            );
            
            setAssignedBins(updatedBins);
            calculateTodayStats(updatedBins);
            
            alert(`Bin marked as ${status.toLowerCase()} successfully!`);
            
        } catch (error) {
            console.error('Error updating bin status:', error);
            alert('Error updating bin status. Please try again.');
        } finally {
            setUpdatingStatus(null);
        }
    };

    // Handle login
    const handleLogin = () => {
        const id = prompt('Please enter your Collector ID:');
        if (id) {
            setDriverId(id);
            setIsLoggedIn(true);
            localStorage.setItem('driverId', id);
        }
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('driverId');
        setDriverId('');
        setDriver(null);
        setAssignedBins([]);
        setCurrentLocation('');
        setIsLoggedIn(false);
    };

    // Check for saved driver ID on component mount
    useEffect(() => {
        const savedDriverId = localStorage.getItem('driverId');
        if (savedDriverId) {
            setDriverId(savedDriverId);
            setIsLoggedIn(true);
        }
    }, []);

    // Fetch data when a driver is logged in
    useEffect(() => {
        if (user && user.role === 'driver') {
            setDriver({
                _id: user._id || '',
                name: user.firstName || user.username || 'Driver',
                city: user?.address?.city || user.city || '',
                status: 'active', // initial
                truck: undefined,
                currentLocation: user?.address?.city || '',
                lastUpdated: new Date().toISOString()
            });
            setIsLoggedIn(true);
            setDriverId(user._id || '');
            fetchDriverData();
            return; 
        }
        if (isLoggedIn) {
            fetchDriverData();
        }
    }, [user, isLoggedIn, driverId]);

    // Login screen
    if (!isLoggedIn && !(user && user.role === 'driver')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardBody className="text-center p-8">
                        <Truck size={64} className="mx-auto mb-4 text-emerald-600" />
                        <h2 className="text-2xl font-bold mb-2">Driver Login</h2>
                        <p className="text-gray-600 mb-6">Please enter your Collector ID to continue</p>
                        <Button onClick={handleLogin} className="w-full">
                            Enter Collector ID
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // Loading screen
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p>Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                <User className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold">Welcome, {driver?.name || 'Driver'}!</h1>
                                <p className="text-sm text-gray-600">
                                    {driver?.city ? `Operating in ${driver.city}` : 'Ready for collection'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Truck className="h-4 w-4" />
                                <span>{driver?.truck?.plateNumber || 'No truck assigned'}</span>
                                <span className="text-gray-400">•</span>
                                <span>{driver?.truck?.capacity || ''}</span>
                            </div>
                            
                            <Button variant="secondary" size="sm" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardBody className="p-4">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Calendar className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <div className="text-2xl font-bold text-blue-600">{todayStats.total}</div>
                                    <div className="text-sm text-gray-600">Total Assigned</div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="p-4">
                            <div className="flex items-center">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <Clock className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div className="ml-4">
                                    <div className="text-2xl font-bold text-yellow-600">{todayStats.pending}</div>
                                    <div className="text-sm text-gray-600">Pending</div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="p-4">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <div className="text-2xl font-bold text-green-600">{todayStats.collected}</div>
                                    <div className="text-sm text-gray-600">Collected</div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="p-4">
                            <div className="flex items-center">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <XCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <div className="ml-4">
                                    <div className="text-2xl font-bold text-red-600">{todayStats.missed}</div>
                                    <div className="text-sm text-gray-600">Skipped</div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Location Update Section */}
                <Card className="mb-6">
                    <CardHeader>
                        <h3 className="font-medium flex items-center gap-2">
                            <Navigation className="h-5 w-5 text-emerald-600" />
                            Update Your Current Location
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="flex items-center gap-4">
                            <Input
                                name="location"
                                label=""
                                placeholder="Enter your current address or location..."
                                value={currentLocation}
                                onChange={(value) => setCurrentLocation(value)}
                                className="flex-1"
                            />
                            <Button 
                                onClick={updateLocationManually}
                                disabled={!currentLocation.trim()}
                            >
                                <Navigation className="h-4 w-4 mr-2" />
                                Update Location
                            </Button>
                        </div>
                        {driver?.currentLocation && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm font-medium text-gray-700">Last Updated Location:</div>
                                <div className="text-sm text-gray-600">{driver.currentLocation}</div>
                                {driver.lastUpdated && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        At: {new Date(driver.lastUpdated).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Assigned Bins List */}
                <Card>
                    <CardHeader>
                        <h3 className="font-medium flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-emerald-600" />
                            Your Assigned Bins
                            <span className="text-sm text-gray-500">({assignedBins.length} total)</span>
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-4">
                            {assignedBins.map((bin) => (
                                <BinCard
                                    key={bin._id}
                                    bin={bin}
                                    onStatusUpdate={updateBinStatus}
                                    updating={updatingStatus === bin._id}
                                />
                            ))}
                            
                            {assignedBins.length === 0 && (
                                <div className="text-center py-12">
                                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No bins assigned to you</p>
                                    <span className="text-sm text-gray-400">Check back later for new assignments</span>
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}

// Bin Card Component
type BinCardProps = {
    bin: Bin;
    onStatusUpdate: (binId: string, status: 'Collected' | 'Skipped') => void;
    updating: boolean;
};

function BinCard({ bin, onStatusUpdate, updating }: BinCardProps) {
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Collected': return 'border-green-200 bg-green-50';
            case 'Skipped': return 'border-red-200 bg-red-50';
            case 'Assigned': return 'border-blue-200 bg-blue-50';
            case 'Pending': return 'border-orange-200 bg-orange-50';
            default: return 'border-gray-200 bg-gray-50';
        }
    };

    const getTimeAgo = (dateString: string) => {
        if (!dateString) return 'Unknown';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 60) {
            return `${diffMins} min ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hr ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    return (
        <div className={`border rounded-lg p-4 ${getStatusColor(bin.status)}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                        <div className="font-medium">{bin.location || 'Unknown location'}</div>
                        <div className="text-sm text-gray-600">{bin.city || 'Unknown city'}</div>
                    </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                    bin.status === 'Collected' ? 'bg-green-100 text-green-800' :
                    bin.status === 'Skipped' ? 'bg-red-100 text-red-800' :
                    bin.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                    'bg-orange-100 text-orange-800'
                }`}>
                    {bin.status}
                </span>
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
                <div>Reported: {getTimeAgo(bin.reportedAt)}</div>
                {bin.collectedAt && (
                    <div>Collected: {getTimeAgo(bin.collectedAt)}</div>
                )}
            </div>
            
            {(bin.status === 'Assigned' || bin.status === 'Pending') && (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={() => onStatusUpdate(bin._id, 'Collected')}
                        disabled={updating}
                        className="flex-1"
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {updating ? 'Updating...' : 'Mark Collected'}
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onStatusUpdate(bin._id, 'Skipped')}
                        disabled={updating}
                        className="flex-1"
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        {updating ? 'Updating...' : 'Mark Skipped'}
                    </Button>
                </div>
            )}
            
            {bin.status === 'Collected' && (
                <div className="flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Completed • {bin.collectedAt ? getTimeAgo(bin.collectedAt) : 'Recently'}</span>
                </div>
            )}
            
            {bin.status === 'Skipped' && (
                <div className="flex items-center gap-2 text-red-700 text-sm">
                    <XCircle className="h-4 w-4" />
                    <span>Skipped • {bin.updatedAt ? getTimeAgo(bin.updatedAt) : 'Recently'}</span>
                </div>
            )}
        </div>
    );
}
