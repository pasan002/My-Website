import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Calendar, Users, BookOpen, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../lib/api';

type Event = {
    _id: string;
    title: string;
    description: string;
    location: string;
    date: string;
    time: string;
    status: 'active' | 'draft' | 'cancelled' | 'completed';
    maxAttendees: number;
    currentAttendees: number;
    price: number;
    currency: string;
    category: string;
};

type Booking = {
    _id: string;
    event: Event;
    amount: number;
    status: 'confirmed' | 'pending' | 'cancelled';
    bookingDate: string;
    paymentStatus: 'paid' | 'pending' | 'refunded';
};

export default function EventDashboard() {
    const [events, setEvents] = useState<Event[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [stats, setStats] = useState({
        totalEvents: 0,
        totalBookings: 0,
        upcomingEvents: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Fetch real events from API
            const eventsResponse = await api.get('/events');
            const realEvents = eventsResponse.data?.data?.events || [];

            // Fetch recent bookings from API
            let realBookings: Booking[] = [];
            try {
                const bookingsResponse = await api.get('/bookings', { params: { limit: 10 } });
                const apiBookings = bookingsResponse.data?.data?.bookings || [];
                realBookings = apiBookings.map((b: any) => ({
                    _id: b._id,
                    event: b.event,
                    amount: b.pricing?.finalPrice ?? 0,
                    status: b.status,
                    bookingDate: b.createdAt,
                    paymentStatus: b.paymentStatus
                }));
            } catch (e) {
                realBookings = [];
            }

            setEvents(realEvents);
            setBookings(realBookings);

            const upcomingEvents = realEvents.filter((event: Event) => 
                new Date(event.date) > new Date() && event.status === 'active'
            ).length;

            const totalRevenue = realBookings
                .filter(booking => booking.status === 'confirmed' && booking.paymentStatus === 'paid')
                .reduce((sum, booking) => sum + (booking.amount || 0), 0);

            setStats({
                totalEvents: realEvents.length,
                totalBookings: realBookings.length,
                upcomingEvents,
                totalRevenue
            });

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Fallback to empty state
            setEvents([]);
            setBookings([]);
            setStats({
                totalEvents: 0,
                totalBookings: 0,
                upcomingEvents: 0,
                totalRevenue: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
        try {
            await api.put(`/bookings/${bookingId}/status`, { status });
            if (status === 'cancelled') {
                // Delete rejected bookings
                await api.delete(`/bookings/${bookingId}`);
                setBookings(prev => prev.filter(b => b._id !== bookingId));
            } else {
                setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status } : b));
            }
        } catch (error) {
            console.error('Failed to update booking status:', error);
            alert('Failed to update booking status.');
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await api.delete(`/events/${eventId}`);
                // Reload dashboard data after deletion
                loadDashboardData();
            } catch (error) {
                console.error('Error deleting event:', error);
                alert('Failed to delete event. Please try again.');
            }
        }
    };

    const downloadPdf = () => {
        const docTitle = 'Event Management Dashboard Report';
        const now = new Date().toLocaleString();

        const safe = (s: any) => String(s ?? '').replace(/</g, '&lt;');

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${docTitle}</title>
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
  <h1>${docTitle}</h1>
  <div class="muted">Generated on ${now}</div>
  <div class="grid">
    <div class="card"><div class="label">Total Events</div><div class="value">${stats.totalEvents}</div></div>
    <div class="card"><div class="label">Total Bookings</div><div class="value">${stats.totalBookings}</div></div>
    <div class="card"><div class="label">Upcoming Events</div><div class="value">${stats.upcomingEvents}</div></div>
    <div class="card"><div class="label">Total Revenue (LKR)</div><div class="value">${stats.totalRevenue}</div></div>
  </div>

  <h2>My Recent Events</h2>
  <table>
    <thead>
      <tr>
        <th>Title</th>
        <th>Location</th>
        <th>Date</th>
        <th>Time</th>
        <th>Status</th>
        <th>Attendees</th>
        <th>Price</th>
      </tr>
    </thead>
    <tbody>
      ${(events || []).slice(0, 10).map(ev => `
        <tr>
          <td>${safe(ev.title)}</td>
          <td>${safe(ev.location)}</td>
          <td>${ev.date ? new Date(ev.date).toLocaleDateString() : ''}</td>
          <td>${safe(ev.time)}</td>
          <td>${safe(ev.status)}</td>
          <td>${ev.currentAttendees}/${ev.maxAttendees}</td>
          <td>${ev.price === 0 ? 'Free' : `${safe(ev.currency)} ${ev.price}`}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Recent Bookings</h2>
  <table>
    <thead>
      <tr>
        <th>Event</th>
        <th>Location</th>
        <th>Booked On</th>
        <th>Status</th>
        <th>Payment</th>
        <th>Amount (LKR)</th>
      </tr>
    </thead>
    <tbody>
      ${(bookings || []).slice(0, 10).map(b => `
        <tr>
          <td>${safe(b.event?.title)}</td>
          <td>${safe(b.event?.location)}</td>
          <td>${b.bookingDate ? new Date(b.bookingDate).toLocaleString() : ''}</td>
          <td>${safe(b.status)}</td>
          <td>${safe(b.paymentStatus)}</td>
          <td>${b.amount ?? 0}</td>
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
            <div className="flex justify-center items-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Event Management Dashboard" 
                description="Manage and track your events, bookings, and analytics." 
                actions={
                    <Button onClick={downloadPdf} className="flex items-center">
                        Download PDF
                    </Button>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardBody>
                        <div className="flex items-center">
                            <div className="bg-emerald-100 p-3 rounded-lg">
                                <Calendar className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Events</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center">
                            <div className="bg-yellow-100 p-3 rounded-lg">
                                <Users className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center">
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <Calendar className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">LKR {stats.totalRevenue}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Events */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium">My Events</h3>
                            <Link to="/event/create">
                                <Button size="sm" className="flex items-center">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Event
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {events.length === 0 ? (
                            <div className="text-center py-8">
                                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No events created yet</p>
                                <Link to="/event/create" className="text-emerald-600 hover:text-emerald-700 font-medium">
                                    Create your first event
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {events.slice(0, 5).map((event) => (
                                    <div key={event._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">{event.title}</h4>
                                                <p className="text-sm text-gray-600">{event.location}</p>
                                                <p className="text-sm text-gray-500">
                                                    {format(new Date(event.date), 'MMM dd, yyyy')} at {event.time}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                                        event.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {event.status}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {event.currentAttendees}/{event.maxAttendees} attendees
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2 ml-4">
                                                <Link
                                                    to={`/event/events/${event._id}`}
                                                    className="p-2 text-gray-400 hover:text-emerald-600"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                <Link
                                                    to={`/event/create?edit=${event._id}`}
                                                    className="p-2 text-gray-400 hover:text-emerald-600"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteEvent(event._id)}
                                                    className="p-2 text-gray-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {events.length > 5 && (
                                    <Link to="/event/events" className="block text-center text-emerald-600 hover:text-emerald-700 font-medium">
                                        View all events
                                    </Link>
                                )}
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Recent Bookings */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium">Recent Bookings</h3>
                            <Link to="/event/bookings" className="text-emerald-600 hover:text-emerald-700 font-medium">
                                View all
                            </Link>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {bookings.length === 0 ? (
                            <div className="text-center py-8">
                                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No bookings yet</p>
                                <Link to="/event/events" className="text-emerald-600 hover:text-emerald-700 font-medium">
                                    Browse events
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {bookings.slice(0, 5).map((booking) => (
                                    <div key={booking._id} className="border rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900">{booking.event.title}</h4>
                                        <p className="text-sm text-gray-600">{booking.event.location}</p>
                                        <p className="text-sm text-gray-500">
                                            Booked on {format(new Date(booking.bookingDate), 'MMM dd, yyyy')}
                                        </p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {booking.status}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900">
                                                    LKR {booking.amount}
                                                </span>
                                                {booking.status === 'pending' && (
                                                    <>
                                                        <Button size="sm" onClick={() => updateBookingStatus(booking._id, 'confirmed')}>Approve</Button>
                                                        <Button size="sm" variant="secondary" onClick={() => updateBookingStatus(booking._id, 'cancelled')}>Reject</Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}