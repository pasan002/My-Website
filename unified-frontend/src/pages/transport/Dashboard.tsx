import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { MapPin, Users, Truck, Clock, CheckCircle } from 'lucide-react';

type Bin = {
    _id: string;
    location: string;
    city: string;
    reportedAt: string;
    status: 'Pending' | 'Assigned' | 'Collected' | 'Skipped';
    assignedTo?: {
        _id: string;
        name: string;
    };
};

type Collector = {
    _id: string;
    name: string;
    city: string;
    status: 'active' | 'collecting' | 'idle' | 'offline';
    truck?: {
        _id: string;
        plateNumber: string;
        capacity: string;
    };
    assignedBins?: Bin[];
    currentLocation?: string;
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

export default function TransportDashboard() {
    const { token } = useAuth();
    const [bins, setBins] = useState<Bin[]>([]);
    const [collectors, setCollectors] = useState<Collector[]>([]);
    const [trucks, setTrucks] = useState<Truck[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBins = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/bins');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) setBins(data.data.bins);
                }
            } catch (e) {
                // fallback to empty list
                setBins([]);
            }
        };

        // Mock collectors and trucks for now
        const mockCollectors: Collector[] = [
            {
                _id: 'c1',
                name: 'John Smith',
                city: 'Colombo',
                status: 'active',
                truck: { _id: 't1', plateNumber: 'TR-001', capacity: '15 tons' },
                assignedBins: [],
                currentLocation: 'Main Street, Colombo'
            },
            {
                _id: 'c2',
                name: 'Jane Doe',
                city: 'Kandy',
                status: 'collecting',
                truck: { _id: 't2', plateNumber: 'TR-002', capacity: '12 tons' },
                assignedBins: [],
                currentLocation: 'Garden Street, Kandy'
            },
            {
                _id: 'c3',
                name: 'Bob Johnson',
                city: 'Galle',
                status: 'idle',
                truck: { _id: 't3', plateNumber: 'TR-003', capacity: '18 tons' },
                assignedBins: [],
                currentLocation: 'Depot, Galle'
            }
        ];

        const mockTrucks: Truck[] = [
            {
                _id: 't1',
                plateNumber: 'TR-001',
                capacity: '15 tons',
                status: 'active',
                assignedTo: { _id: 'c1', name: 'John Smith' }
            },
            {
                _id: 't2',
                plateNumber: 'TR-002',
                capacity: '12 tons',
                status: 'active',
                assignedTo: { _id: 'c2', name: 'Jane Doe' }
            },
            {
                _id: 't3',
                plateNumber: 'TR-003',
                capacity: '18 tons',
                status: 'maintenance',
                assignedTo: { _id: 'c3', name: 'Bob Johnson' }
            },
            {
                _id: 't4',
                plateNumber: 'TR-004',
                capacity: '20 tons',
                status: 'active',
            }
        ];

        setCollectors(mockCollectors);
        setTrucks(mockTrucks);
        fetchBins().finally(() => setLoading(false));
    }, [token]);

    // Calculate statistics
    const pendingBins = bins.filter(bin => bin.status === 'Pending' || bin.status === 'Assigned').length;
    const collectedBins = bins.filter(bin => bin.status === 'Collected').length;
    const skippedBins = bins.filter(bin => bin.status === 'Skipped').length;
    const activeCollectors = collectors.filter(c => c.status === 'active' || c.status === 'collecting').length;
    const availableTrucks = trucks.filter(t => !t.assignedTo).length;

    // Calculate collector performance
    const calculatePerformance = (collector: Collector) => {
        const assignedBins = collector.assignedBins || [];
        if (assignedBins.length === 0) return 0;
        
        const collectedBins = assignedBins.filter(bin => bin.status === 'Collected').length;
        return Math.round((collectedBins / assignedBins.length) * 100);
    };

    const topPerformers = collectors
        .slice()
        .sort((a, b) => calculatePerformance(b) - calculatePerformance(a))
        .slice(0, 3);

    const downloadPdf = () => {
        const title = 'Transport Management Dashboard Report';
        const now = new Date().toLocaleString();
        const safe = (s: any) => String(s ?? '').replace(/</g, '&lt;');

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111827; }
    h1 { margin: 0 0 4px 0; font-size: 22px; }
    h2 { margin: 18px 0 8px 0; font-size: 16px; }
    .muted { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    .label { color: #6b7280; font-size: 12px; }
    .value { font-size: 20px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
    th { background: #f3f4f6; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="muted">Generated on ${now}</div>
  <div class="grid">
    <div class="card"><div class="label">Pending/Assigned Bins</div><div class="value">${pendingBins}</div></div>
    <div class="card"><div class="label">Collected Bins</div><div class="value">${collectedBins}</div></div>
    <div class="card"><div class="label">Skipped Bins</div><div class="value">${skippedBins}</div></div>
    <div class="card"><div class="label">Active Collectors</div><div class="value">${activeCollectors}</div></div>
  </div>

  <h2>Recent Bin Activity</h2>
  <table>
    <thead>
      <tr>
        <th>Location</th>
        <th>City</th>
        <th>Status</th>
        <th>Assigned To</th>
        <th>Reported At</th>
      </tr>
    </thead>
    <tbody>
      ${(bins || []).slice(0, 10).map(b => `
        <tr>
          <td>${safe(b.location)}</td>
          <td>${safe(b.city)}</td>
          <td>${safe(b.status)}</td>
          <td>${safe(b.assignedTo?.name || '')}</td>
          <td>${b.reportedAt ? new Date(b.reportedAt).toLocaleString() : ''}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Top Performing Collectors</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>City</th>
        <th>Performance</th>
        <th>Assigned Bins</th>
        <th>Truck</th>
      </tr>
    </thead>
    <tbody>
      ${(topPerformers || []).map(c => `
        <tr>
          <td>${safe(c.name)}</td>
          <td>${safe(c.city)}</td>
          <td>${calculatePerformance(c)}%</td>
          <td>${c.assignedBins?.length || 0}</td>
          <td>${safe(c.truck?.plateNumber || '')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Truck Fleet</h2>
  <table>
    <thead>
      <tr>
        <th>Plate Number</th>
        <th>Capacity</th>
        <th>Status</th>
        <th>Assigned To</th>
      </tr>
    </thead>
    <tbody>
      ${(trucks || []).slice(0, 20).map(t => `
        <tr>
          <td>${safe(t.plateNumber)}</td>
          <td>${safe(t.capacity)}</td>
          <td>${safe(t.status)}</td>
          <td>${safe(t.assignedTo?.name || '')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <script>
    window.onload = function() { window.print(); setTimeout(() => window.close(), 500); };
  </script>
</body>
</html>`;

        const w = window.open('', '_blank');
        if (!w) return;
        w.document.open();
        w.document.write(html);
        w.document.close();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <span className="ml-2">Loading transport dashboard...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Transport Management Dashboard"
                description="Overview of waste collection operations, bins, collectors, and trucks"
                actions={
                    <Button onClick={downloadPdf} className="flex items-center">
                        Download PDF
                    </Button>
                }
            />

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="font-medium flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-600" />
                            Pending Bins
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="text-3xl font-bold text-orange-600">{pendingBins}</div>
                        <p className="text-sm text-gray-500">Awaiting collection</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="font-medium flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Collected Today
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="text-3xl font-bold text-green-600">{collectedBins}</div>
                        <p className="text-sm text-gray-500">Successfully collected</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="font-medium flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            Active Collectors
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="text-3xl font-bold text-blue-600">{activeCollectors}</div>
                        <p className="text-sm text-gray-500">Currently working</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="font-medium flex items-center gap-2">
                            <Truck className="h-5 w-5 text-purple-600" />
                            Available Trucks
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="text-3xl font-bold text-purple-600">{availableTrucks}</div>
                        <p className="text-sm text-gray-500">Ready for assignment</p>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Collection Status Overview */}
                <Card>
                    <CardHeader>
                        <h3 className="font-medium">Collection Status Overview</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                    <span>Pending/Assigned</span>
                                </div>
                                <span className="font-semibold">{pendingBins}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span>Collected</span>
                                </div>
                                <span className="font-semibold">{collectedBins}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span>Skipped</span>
                                </div>
                                <span className="font-semibold">{skippedBins}</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Top Performing Collectors */}
                <Card>
                    <CardHeader>
                        <h3 className="font-medium">Top Performing Collectors</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {topPerformers.map((collector, index) => (
                                <div key={collector._id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                            index === 0 ? 'bg-yellow-500 text-white' :
                                            index === 1 ? 'bg-gray-400 text-white' :
                                            'bg-orange-500 text-white'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium">{collector.name}</div>
                                            <div className="text-sm text-gray-500">{collector.city}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">{calculatePerformance(collector)}%</div>
                                        <div className="text-xs text-gray-500">
                                            {collector.assignedBins?.length || 0} bins
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <h3 className="font-medium">Recent Bin Activity</h3>
                </CardHeader>
                <CardBody>
                    <div className="space-y-3">
                        {bins.slice(0, 5).map((bin) => (
                            <div key={bin._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-gray-500" />
                                    <div>
                                        <div className="font-medium">{bin.location}</div>
                                        <div className="text-sm text-gray-500">{bin.city}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        bin.status === 'Collected' ? 'bg-green-100 text-green-800' :
                                        bin.status === 'Skipped' ? 'bg-red-100 text-red-800' :
                                        bin.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                                        'bg-orange-100 text-orange-800'
                                    }`}>
                                        {bin.status}
                                    </span>
                                    {bin.assignedTo && (
                                        <span className="text-sm text-gray-500">
                                            {bin.assignedTo.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}