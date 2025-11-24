import { useMemo, useState, useEffect } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../lib/api';

type Complaint = {
    _id: string;
    name: string;
    email: string;
    phone: string;
    issueType: string;
    problem: string;
    date: string;
    status: string;
    priority: string;
    address?: string;
    notes?: string;
};

export default function ComplaintList() {
    const [items, setItems] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'resolved' | 'closed'>('all');
    const [issueTypeFilter, setIssueTypeFilter] = useState<'all' | 'Bin Issues' | 'Transport Issues' | 'Finance Issues' | 'Staff Issues' | 'Service Issues' | 'Others'>('all');

    useEffect(() => {
        loadComplaints();
    }, []);

    const loadComplaints = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/complaints');
            setItems(response.data.data.complaints);
        } catch (error: any) {
            console.error('Error loading complaints:', error);
            setError(error.response?.data?.message || 'Failed to load complaints');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        return items
            .filter((c) => (statusFilter === 'all' ? true : c.status === statusFilter))
            .filter((c) => (issueTypeFilter === 'all' ? true : c.issueType === issueTypeFilter))
            .filter((c) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                return (
                    c.name.toLowerCase().includes(q) ||
                    c.email.toLowerCase().includes(q) ||
                    c.issueType.toLowerCase().includes(q) ||
                    c.problem.toLowerCase().includes(q) ||
                    c.date.includes(q)
                );
            })
            .sort((a, b) => (a.date < b.date ? 1 : -1));
    }, [items, search, statusFilter, issueTypeFilter]);

    function handleDelete(id: string) {
        if (!confirm('Delete this complaint?')) return;
        
        api.delete(`/complaints/${id}`)
            .then(() => {
                setItems(prev => prev.filter(c => c._id !== id));
            })
            .catch(error => {
                console.error('Error deleting complaint:', error);
                alert('Failed to delete complaint');
            });
    }

    function handleStatusUpdate(id: string, newStatus: string) {
        api.put(`/complaints/${id}/status`, { status: newStatus })
            .then(() => {
                setItems(prev => prev.map(c => 
                    c._id === id ? { ...c, status: newStatus } : c
                ));
            })
            .catch(error => {
                console.error('Error updating status:', error);
                alert('Failed to update status');
            });
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'resolved':
            case 'closed':
                return 'success';
            case 'in-progress':
                return 'warning';
            case 'pending':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    const getPriorityBadgeVariant = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'urgent':
            case 'high':
                return 'danger';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'secondary';
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Complaint List" 
                description="View and manage all user complaints and issues." 
            />

            <Card className="overflow-hidden">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <h3 className="font-medium">All Complaints</h3>
                        <div className="flex items-center gap-3">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, email, issue type, problem..."
                                className="w-64 rounded border px-3 py-2 text-sm"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="rounded border px-3 py-2 text-sm"
                            >
                                <option value="all">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                            <select
                                value={issueTypeFilter}
                                onChange={(e) => setIssueTypeFilter(e.target.value as any)}
                                className="rounded border px-3 py-2 text-sm"
                            >
                                <option value="all">All types</option>
                                <option value="Bin Issues">Bin Issues</option>
                                <option value="Transport Issues">Transport Issues</option>
                                <option value="Finance Issues">Finance Issues</option>
                                <option value="Staff Issues">Staff Issues</option>
                                <option value="Service Issues">Service Issues</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="p-4">
                    {loading ? (
                        <div className="py-10 text-center text-gray-500">Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-10 text-center text-gray-500">{items.length === 0 ? 'No complaints yet.' : 'No matching results.'}</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((complaint) => (
                                <div key={complaint._id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="h-40 bg-gradient-to-r from-red-50 to-orange-50 flex items-center justify-center">
                                        <div className="text-3xl">⚠️</div>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-semibold text-gray-900">{complaint.name}</div>
                                                <div className="text-sm text-gray-500">{complaint.email}</div>
                                            </div>
                                            <Badge variant={getStatusBadgeVariant(complaint.status)}>
                                                {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-700 line-clamp-3" title={complaint.problem}>{complaint.problem}</div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Badge variant={getPriorityBadgeVariant(complaint.priority)}>{complaint.priority}</Badge>
                                            <span>{new Date(complaint.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <select
                                                value={complaint.status}
                                                onChange={(e) => handleStatusUpdate(complaint._id, e.target.value)}
                                                className="text-xs rounded border px-2 py-1"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="closed">Closed</option>
                                            </select>
                                            <Button size="sm" variant="danger" onClick={() => handleDelete(complaint._id)}>Delete</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}