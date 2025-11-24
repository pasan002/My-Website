import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function TransportTest() {
    const [bins, setBins] = useState([]);
    const [collectors, setCollectors] = useState([]);
    const [trucks, setTrucks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Loading transport data...');

                const [binsResponse, collectorsResponse, trucksResponse] = await Promise.all([
                    api.get('/bins'),
                    api.get('/collectors'),
                    api.get('/trucks')
                ]);

                console.log('Bins response:', binsResponse.data);
                console.log('Collectors response:', collectorsResponse.data);
                console.log('Trucks response:', trucksResponse.data);

                if (binsResponse.data.success) {
                    setBins(binsResponse.data.data.bins);
                }
                if (collectorsResponse.data.success) {
                    setCollectors(collectorsResponse.data.data.collectors);
                }
                if (trucksResponse.data.success) {
                    setTrucks(trucksResponse.data.data.trucks);
                }
            } catch (err: any) {
                console.error('Error loading data:', err);
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Transport System Test</h1>
                <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                    <span>Loading data...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Transport System Test</h1>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    <strong>Error:</strong> {error}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Transport System Test</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-3">Bins ({bins.length})</h2>
                    {bins.map((bin: any) => (
                        <div key={bin._id} className="mb-2 p-2 bg-gray-50 rounded">
                            <div className="font-medium">{bin.location}</div>
                            <div className="text-sm text-gray-600">{bin.city} • {bin.status}</div>
                        </div>
                    ))}
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-3">Collectors ({collectors.length})</h2>
                    {collectors.map((collector: any) => (
                        <div key={collector._id} className="mb-2 p-2 bg-gray-50 rounded">
                            <div className="font-medium">{collector.name}</div>
                            <div className="text-sm text-gray-600">{collector.city} • {collector.status}</div>
                        </div>
                    ))}
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-3">Trucks ({trucks.length})</h2>
                    {trucks.map((truck: any) => (
                        <div key={truck._id} className="mb-2 p-2 bg-gray-50 rounded">
                            <div className="font-medium">{truck.plateNumber}</div>
                            <div className="text-sm text-gray-600">{truck.capacity} • {truck.status}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
