import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react';

type UserStats = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
};

type User = {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
};

type RecentUser = {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
};

export default function UserManagementDashboard() {
  const { user: authUser, token } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user management overview
        const overviewResponse = await fetch('http://localhost:5000/api/user-management/overview');

        if (overviewResponse.ok) {
          const overviewData = await overviewResponse.json();
          if (overviewData.success) {
            setStats(overviewData.data);
          }
        }

        // Fetch recent users
        const usersResponse = await fetch('http://localhost:5000/api/users?limit=5');

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          if (usersData.success) {
            setRecentUsers(usersData.data.users);
          }
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'driver': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
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

  const downloadRecentLoginsPdf = () => {
    const title = 'Recent User Logins Report';
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
        <th>Role</th>
        <th>Signed Up</th>
        <th>Last Login</th>
      </tr>
    </thead>
    <tbody>
      ${(recentUsers || []).map(u => `
        <tr>
          <td>${safe(u.firstName)} ${safe(u.lastName)}</td>
          <td>${safe(u.email)}</td>
          <td>${safe(u.role)}</td>
          <td>${u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}</td>
          <td>${'' /* lastLogin not in recentUsers type; backend may include later */}</td>
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-sky-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">User Management Dashboard</h1>
            <p className="text-emerald-100">Manage users, roles, and system access</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-emerald-100">Admin Panel</div>
            <div className="font-semibold capitalize">Administrator</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.activeUsers}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</div>
                <div className="text-sm text-gray-600">Pending Requests</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.completedRequests}</div>
                <div className="text-sm text-gray-600">Completed Requests</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                Recent Users
              </h3>
              <Button onClick={downloadRecentLoginsPdf} className="flex items-center">Download PDF</Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-emerald-600 font-semibold">
                          {user.firstName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(user.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Quick Actions
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => window.location.href = '/user-management/requests'}
              >
                <Clock className="h-4 w-4 mr-2" />
                Manage Requests
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => window.location.href = '/user/register'}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
