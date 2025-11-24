import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  Users, 
  FileText, 
  CreditCard, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings
} from 'lucide-react';

type AdminCard = {
  key: string;
  title: string;
  emoji: string;
  description: string;
  link: string;
  count?: number;
  color: string;
};

export default function AdminDashboard() {
  const [stats] = useState({
    totalUsers: 1247,
    pendingRequests: 23,
    completedRequests: 1847,
    activeEvents: 8,
    totalRevenue: 125000,
    systemHealth: 98
  });

  const cards: AdminCard[] = [
    { 
      key: 'userRequests', 
      title: 'User Requests', 
      emoji: '📋', 
      description: 'View and manage pickup requests', 
      link: '/user/requests',
      count: stats.pendingRequests,
      color: 'bg-blue-500'
    },
    { 
      key: 'feedback', 
      title: 'Feedback & Complaints', 
      emoji: '💬', 
      description: 'Read user feedback and complaints', 
      link: '/feedback/dashboard',
      count: 12,
      color: 'bg-green-500'
    },
    { 
      key: 'transports', 
      title: 'Transports', 
      emoji: '🚚', 
      description: 'Manage transport schedules and fleet', 
      link: '/transport/dashboard',
      count: 15,
      color: 'bg-orange-500'
    },
    { 
      key: 'payments', 
      title: 'Payment Details', 
      emoji: '💳', 
      description: 'Review invoices and payments', 
      link: '/financial/dashboard',
      count: stats.totalRevenue,
      color: 'bg-purple-500'
    },
    { 
      key: 'logins', 
      title: 'Login Details', 
      emoji: '🔐', 
      description: 'Audit user logins and roles', 
      link: '/user/users',
      count: stats.totalUsers,
      color: 'bg-indigo-500'
    },
    { 
      key: 'events', 
      title: 'Event Details', 
      emoji: '📅', 
      description: 'Create and track events', 
      link: '/event/dashboard',
      count: stats.activeEvents,
      color: 'bg-pink-500'
    }
  ];

  const recentActivities = [
    { id: 1, action: 'New user registration', user: 'John Doe', time: '2 minutes ago', type: 'user' },
    { id: 2, action: 'Pickup request completed', user: 'Jane Smith', time: '15 minutes ago', type: 'success' },
    { id: 3, action: 'Payment received', user: 'Bob Johnson', time: '1 hour ago', type: 'payment' },
    { id: 4, action: 'Complaint submitted', user: 'Alice Brown', time: '2 hours ago', type: 'warning' },
    { id: 5, action: 'Event created', user: 'Admin', time: '3 hours ago', type: 'info' }
  ];

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'user': return <Users className="h-4 w-4 text-blue-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'payment': return <CreditCard className="h-4 w-4 text-purple-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <Calendar className="h-4 w-4 text-indigo-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-sky-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-emerald-100">Quick overview and management shortcuts</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-emerald-100">System Health</div>
            <div className="text-2xl font-bold">{stats.systemHealth}%</div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Users</div>
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
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.completedRequests.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Completed Requests</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">₦{stats.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link
            key={card.key}
            to={card.link}
            className="group block"
          >
            <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardBody className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${card.color} bg-opacity-10`}>
                    <span className="text-2xl">{card.emoji}</span>
                  </div>
                  {card.count !== undefined && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {typeof card.count === 'number' && card.count > 1000 
                          ? card.count.toLocaleString() 
                          : card.count}
                      </div>
                      <div className="text-xs text-gray-500">items</div>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{card.description}</p>
                <div className="flex items-center text-emerald-600 font-medium group-hover:translate-x-2 transition-transform">
                  Open
                  <Settings className="ml-2 h-4 w-4" />
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h3 className="font-medium flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Recent Activity
          </h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{activity.action}</div>
                  <div className="text-sm text-gray-600">by {activity.user}</div>
                </div>
                <div className="text-sm text-gray-500">{activity.time}</div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="font-medium">Quick Actions</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center gap-2">
              <Users className="h-6 w-6" />
              <span>Manage Users</span>
            </Button>
            <Button variant="secondary" className="h-20 flex flex-col items-center justify-center gap-2">
              <FileText className="h-6 w-6" />
              <span>View Reports</span>
            </Button>
            <Button variant="secondary" className="h-20 flex flex-col items-center justify-center gap-2">
              <Settings className="h-6 w-6" />
              <span>System Settings</span>
            </Button>
            <Button variant="secondary" className="h-20 flex flex-col items-center justify-center gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>Analytics</span>
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
