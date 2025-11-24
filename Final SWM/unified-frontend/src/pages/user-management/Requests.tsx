import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Clock, 
  Search, 
  Filter, 
  CheckCircle,
  AlertCircle,
  Eye,
  XCircle,
  MapPin,
  Calendar,
  User
} from 'lucide-react';

type Request = {
  _id: string;
  name: string;
  email: string;
  mobileNumber: string;
  address: string;
  type: string;
  description: string;
  typePrice: number;
  deliveryFee: number;
  totalPrice: number;
  status: string;
  assignedCollector?: {
    _id: string;
    name: string;
  };
  assignedTruck?: {
    _id: string;
    plateNumber: string;
  };
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

type Pagination = {
  currentPage: number;
  totalPages: number;
  totalRequests: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export default function UserManagementRequests() {
  const { user: authUser, token } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalRequests: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const fetchRequests = async () => {
      if (!authUser || !token) {
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          page: pagination.currentPage.toString(),
          limit: '10'
        });

        if (statusFilter !== 'all') params.append('status', statusFilter);

        const response = await fetch(`http://localhost:5000/api/user-management/requests?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setRequests(data.data.requests);
            setPagination(data.data.pagination);
          }
        }
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [authUser, token, pagination.currentPage, statusFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Filter requests locally for now
  };

  const approveRequest = async (id: string) => {
    if (!token) return;
    const res = await fetch(`http://localhost:5000/api/user-management/requests/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ notes: 'Approved by admin' })
    });
    if (res.ok) {
      const data = await res.json();
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'confirmed' } : r));
    }
  };

  const rejectRequest = async (id: string) => {
    if (!token) return;
    const res = await fetch(`http://localhost:5000/api/user-management/requests/${id}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason: 'Not eligible' })
    });
    if (res.ok) {
      // Remove the request from the list instead of just changing status
      setRequests(prev => prev.filter(r => r._id !== id));
    }
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Organic': return 'bg-green-100 text-green-800';
      case 'Recyclable': return 'bg-blue-100 text-blue-800';
      case 'Other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const downloadRequestsPdf = () => {
    const title = 'Waste Collection Requests';
    const now = new Date().toLocaleString();
    const safe = (s: any) => String(s ?? '').replace(/</g, '&lt;');

    const rows = (filteredRequests || []).map(r => `
      <tr>
        <td>${safe(r.name)}</td>
        <td>${safe(r.email)}</td>
        <td>${safe(r.mobileNumber)}</td>
        <td>${safe(r.type)}</td>
        <td>${safe(r.status)}</td>
        <td>${safe(r.address)}</td>
        <td>${formatCurrency(r.totalPrice)}</td>
        <td>${r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111827; }
    h1 { margin: 0 0 8px 0; font-size: 22px; }
    .muted { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
    th { background: #f3f4f6; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="muted">Generated on ${now}</div>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Mobile</th>
        <th>Type</th>
        <th>Status</th>
        <th>Address</th>
        <th>Total Price</th>
        <th>Created At</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
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

  // Filter requests based on search term and type filter
  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || request.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Waste Collection Requests</h1>
          <p className="text-gray-600">Manage and track waste collection requests</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or address..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select
                value={statusFilter}
                onChange={handleStatusFilter}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Waste Type</label>
              <Select
                value={typeFilter}
                onChange={handleTypeFilter}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'Organic', label: 'Organic' },
                  { value: 'Recyclable', label: 'Recyclable' },
                  { value: 'Other', label: 'Other' }
                ]}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Requests ({filteredRequests.length})
            </h3>
            <Button onClick={downloadRequestsPdf} className="flex items-center">Download PDF</Button>
          </div>
        </CardHeader>
        <CardBody>
          {filteredRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Request Details</TH>
                    <TH>Type</TH>
                    <TH>Status</TH>
                    <TH>Location</TH>
                    <TH>Price</TH>
                    <TH>Date</TH>
                    <TH>Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {filteredRequests.map((request) => (
                    <TR key={request._id}>
                      <TD>
                        <div>
                          <div className="font-medium text-gray-900">{request.name}</div>
                          <div className="text-sm text-gray-500">{request.email}</div>
                          <div className="text-xs text-gray-400">{request.mobileNumber}</div>
                        </div>
                      </TD>
                      <TD>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(request.type)}`}>
                          {request.type}
                        </span>
                      </TD>
                      <TD>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('-', ' ')}
                        </span>
                      </TD>
                      <TD>
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="truncate max-w-32">{request.address}</span>
                        </div>
                      </TD>
                      <TD>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(request.totalPrice)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(request.typePrice)} + {formatCurrency(request.deliveryFee)}
                        </div>
                      </TD>
                      <TD>
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDate(request.createdAt)}
                        </div>
                      </TD>
                      <TD>
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => approveRequest(request._id)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => rejectRequest(request._id)}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalRequests)} of {pagination.totalRequests} requests
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
