import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function APITest() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const testAPI = async () => {
            try {
                console.log('Testing API connection...');
                console.log('API base URL:', api.defaults.baseURL);
                
                const [collectorsResponse, trucksResponse, binsResponse] = await Promise.all([
                    api.get('/collectors'),
                    api.get('/trucks'),
                    api.get('/bins')
                ]);

                console.log('Collectors response:', collectorsResponse.data);
                console.log('Trucks response:', trucksResponse.data);
                console.log('Bins response:', binsResponse.data);

                setData({
                    collectors: collectorsResponse.data.data.collectors,
                    trucks: trucksResponse.data.data.trucks,
                    bins: binsResponse.data.data.bins
                });
            } catch (err: any) {
                console.error('API Test Error:', err);
                setError(err.message || 'Failed to connect to API');
            } finally {
                setLoading(false);
            }
        };

        testAPI();
    }, []);

    if (loading) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
                <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                    <span>Testing API connection...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    <strong>Error:</strong> {error}
                </div>
                <div className="mt-4 text-sm text-gray-600">
                    <p>API Base URL: {api.defaults.baseURL}</p>
                    <p>Make sure the backend is running on port 5000</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">API Connection Test - SUCCESS!</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-3">Collectors ({data.collectors.length})</h2>
                    {data.collectors.map((collector: any) => (
                        <div key={collector._id} className="mb-2 p-2 bg-gray-50 rounded">
                            <div className="font-medium">{collector.name}</div>
                            <div className="text-sm text-gray-600">{collector.email} • {collector.city}</div>
                        </div>
                    ))}
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-3">Trucks ({data.trucks.length})</h2>
                    {data.trucks.map((truck: any) => (
                        <div key={truck._id} className="mb-2 p-2 bg-gray-50 rounded">
                            <div className="font-medium">{truck.plateNumber}</div>
                            <div className="text-sm text-gray-600">{truck.capacity} • {truck.status}</div>
                        </div>
                    ))}
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-3">Bins ({data.bins.length})</h2>
                    {data.bins.map((bin: any) => (
                        <div key={bin._id} className="mb-2 p-2 bg-gray-50 rounded">
                            <div className="font-medium">{bin.location}</div>
                            <div className="text-sm text-gray-600">{bin.city} • {bin.status}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
