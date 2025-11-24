import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function DebugAPI() {
    const [logs, setLogs] = useState<string[]>([]);
    const [data, setData] = useState<any>(null);

    const addLog = (message: string) => {
        console.log(message);
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    useEffect(() => {
        const testAPI = async () => {
            addLog('Starting API test...');
            addLog(`API Base URL: ${api.defaults.baseURL}`);
            
            try {
                addLog('Testing collectors API...');
                const collectorsResponse = await api.get('/collectors');
                addLog(`Collectors API response: ${JSON.stringify(collectorsResponse.data).substring(0, 100)}...`);
                
                if (collectorsResponse.data.success) {
                    addLog(`Found ${collectorsResponse.data.data.collectors.length} collectors`);
                    setData(collectorsResponse.data.data);
                } else {
                    addLog('API returned success: false');
                }
            } catch (err: any) {
                addLog(`API Error: ${err.message}`);
                addLog(`Error details: ${JSON.stringify(err.response?.data || err.message)}`);
            }
        };

        testAPI();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">API Debug Test</h1>
            
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Debug Logs:</h2>
                <div className="bg-gray-100 p-4 rounded max-h-64 overflow-y-auto">
                    {logs.map((log, index) => (
                        <div key={index} className="text-sm font-mono">{log}</div>
                    ))}
                </div>
            </div>

            {data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded shadow">
                        <h3 className="font-semibold">Collectors ({data.collectors?.length || 0})</h3>
                        {data.collectors?.map((collector: any) => (
                            <div key={collector._id} className="text-sm mt-2 p-2 bg-gray-50 rounded">
                                <div className="font-medium">{collector.name}</div>
                                <div className="text-gray-600">{collector.email}</div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="bg-white p-4 rounded shadow">
                        <h3 className="font-semibold">Trucks ({data.trucks?.length || 0})</h3>
                        {data.trucks?.map((truck: any) => (
                            <div key={truck._id} className="text-sm mt-2 p-2 bg-gray-50 rounded">
                                <div className="font-medium">{truck.plateNumber}</div>
                                <div className="text-gray-600">{truck.capacity}</div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="bg-white p-4 rounded shadow">
                        <h3 className="font-semibold">Bins ({data.bins?.length || 0})</h3>
                        {data.bins?.map((bin: any) => (
                            <div key={bin._id} className="text-sm mt-2 p-2 bg-gray-50 rounded">
                                <div className="font-medium">{bin.location}</div>
                                <div className="text-gray-600">{bin.city}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
