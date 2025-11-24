import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Calendar, 
  MapPin, 
  Star, 
  Clock,
  CheckCircle,
  Plus,
  Eye
} from 'lucide-react';
import Input from '../../components/ui/Input';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  joinDate: string;
  lastActive: string;
  status: 'active' | 'inactive' | 'pending';
};

type Request = {
  id: string;
  type: string;
  status: string;
  date: string;
  location: string;
  description: string;
};

type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  attendees: number;
  image?: string;
};

export default function UserDashboard() {
  const { user: authUser, token } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState<{open: boolean; eventId?: string}>({ open: false });
  const [joinForm, setJoinForm] = useState({ firstName: '', lastName: '', email: '', specialRequests: '' });
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [toast, setToast] = useState<string>('');

  const openJoin = (id: string) => {
    setShowJoin({ open: true, eventId: id });
    setJoinError('');
  };

  const submitJoin = async () => {
    if (!token || !showJoin.eventId) return;
    if (!joinForm.firstName || !joinForm.lastName || !joinForm.email) {
      setJoinError('Please fill all required fields');
      return;
    }
    try {
      setJoinLoading(true);
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: showJoin.eventId,
          attendeeDetails: {
            firstName: joinForm.firstName,
            lastName: joinForm.lastName,
            email: joinForm.email
          },
          specialRequests: joinForm.specialRequests
        })
      });
    if (!res.ok) {
      let serverMessage = 'Failed to create booking';
      try {
        const err = await res.json();
        serverMessage = err?.message || serverMessage;
      } catch (_) {
        try { serverMessage = await res.text(); } catch (_) {}
      }
      throw new Error(serverMessage);
    }
      setShowJoin({ open: false });
      setToast('Participant booking added and pending approval.');
      setTimeout(() => setToast(''), 3000);
    } catch (e: any) {
      setJoinError(e.message || 'Failed to participate');
    } finally {
      setJoinLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!authUser || !token) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user requests
        const requestsResponse = await fetch('http://localhost:5000/api/user-management/requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          if (requestsData.success) {
            const transformedRequests: Request[] = requestsData.data.requests.map((req: any) => ({
              id: req._id,
              type: req.type,
              status: req.status.charAt(0).toUpperCase() + req.status.slice(1).replace('-', ' '),
              date: new Date(req.createdAt).toISOString().split('T')[0],
              location: req.address,
              description: req.description
            }));
            setRequests(transformedRequests);
          }
        }

        // Fetch upcoming events from API
        const eventsResponse = await fetch('http://localhost:5000/api/events/upcoming?limit=5');
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          if (eventsData.success) {
            const transformedEvents: Event[] = eventsData.data.events.map((ev: any) => ({
              id: ev._id,
              title: ev.title,
              date: new Date(ev.date).toLocaleDateString(),
              location: ev.location || ev.venue?.city || 'TBA',
              description: ev.description,
              attendees: ev.currentAttendees || 0,
              image: ev.image || undefined
            }));
            setEvents(transformedEvents);
          }
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authUser, token]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-sky-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {authUser?.firstName}!</h1>
            <p className="text-emerald-100">Here's what's happening with your waste management activities.</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-emerald-100">Role</div>
            <div className="font-semibold capitalize">{authUser?.role}</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{requests.length}</div>
                <div className="text-sm text-gray-600">Total Requests</div>
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
                <div className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'Completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
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
                <div className="text-2xl font-bold text-gray-900">
                  {requests.filter(r => r.status === 'Pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">4.8</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                Recent Requests
              </h3>
              <Link to="/user/add-request">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {requests.slice(0, 3).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium">{request.type}</div>
                      <div className="text-sm text-gray-600">{request.location}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{request.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Intentionally left no second column; the card above spans both columns */}
      </div>

      {/* Upcoming Events (moved down, with larger images) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Upcoming Events
            </h3>
            <Button size="sm" variant="secondary">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.slice(0, 4).map((event) => (
              <div key={event.id} className="bg-white rounded-lg border overflow-hidden">
                {event.image && (
                  <div className="w-full h-40 md:h-48 bg-gray-200">
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-gray-900 mr-3 line-clamp-2">{event.title}</h4>
                    <Button size="sm" variant="secondary" onClick={() => openJoin(event.id)}>
                      Join
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{event.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {event.attendees} attendees
                    </span>
                  </div>
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/user/add-request">
              <Button className="h-20 flex flex-col items-center justify-center gap-2 w-full">
                <Plus className="h-6 w-6" />
                <span>New Request</span>
              </Button>
            </Link>
            <Link to="/feedback/submit-feedback">
              <Button variant="secondary" className="h-20 flex flex-col items-center justify-center gap-2 w-full">
                <Star className="h-6 w-6" />
                <span>Feedback</span>
              </Button>
            </Link>
            <Link to="/feedback/submit-complaint">
              <Button variant="secondary" className="h-20 flex flex-col items-center justify-center gap-2 w-full">
                <Star className="h-6 w-6" />
                <span>Complaint</span>
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* Join Modal */}
      {showJoin.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Participate in Event</h3>
            {joinError && <div className="mb-3 text-sm text-red-600">{joinError}</div>}
            <div className="grid grid-cols-1 gap-3">
              <Input name="firstName" label="First Name" value={joinForm.firstName} onChange={(v) => setJoinForm(f => ({...f, firstName: v}))} required />
              <Input name="lastName" label="Last Name" value={joinForm.lastName} onChange={(v) => setJoinForm(f => ({...f, lastName: v}))} required />
              <Input name="email" label="Email" type="email" value={joinForm.email} onChange={(v) => setJoinForm(f => ({...f, email: v}))} required />
              <Input name="specialRequests" label="Special Requests (optional)" value={joinForm.specialRequests} onChange={(v) => setJoinForm(f => ({...f, specialRequests: v}))} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowJoin({ open: false })}>Cancel</Button>
              <Button onClick={submitJoin} disabled={joinLoading}>{joinLoading ? 'Submitting...' : 'Participate'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
