import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Clock,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

type Event = {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  location: string;
  date: string;
  time: string;
  status: 'active' | 'draft' | 'cancelled' | 'completed';
  maxAttendees: number;
  currentAttendees: number;
  price: number;
  currency: string;
  category: string;
  image?: string;
};

export default function EventList() {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    city: '',
    dateFrom: '',
    dateTo: '',
    priceMin: '',
    priceMax: ''
  });

  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const eventsPerPage = 12;

  const categories = [
    'workshop', 'seminar', 'meeting', 'community', 'training', 
    'exhibition', 'conference', 'networking', 'other'
  ];

  useEffect(() => {
    loadEvents(); // Removed authentication check
  }, [currentPage, filters, sortBy, sortOrder]);

  const loadEvents = async () => {
    setLoading(true);
    
    try {
      // Basic client-side filter validations
      if (filters.dateFrom && filters.dateTo && new Date(filters.dateFrom) > new Date(filters.dateTo)) {
        throw new Error('From date cannot be after To date');
      }
      const priceMinNum = filters.priceMin === '' ? undefined : Number(filters.priceMin);
      const priceMaxNum = filters.priceMax === '' ? undefined : Number(filters.priceMax);
      if ((priceMinNum !== undefined && priceMinNum < 0) || (priceMaxNum !== undefined && priceMaxNum < 0)) {
        throw new Error('Prices cannot be negative');
      }
      if (priceMinNum !== undefined && priceMaxNum !== undefined && priceMinNum > priceMaxNum) {
        throw new Error('Min price cannot be greater than Max price');
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', eventsPerPage.toString());
      // params.append('status', 'active'); // Removed status filter to show all events
      
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      const response = await api.get(`/events?${params.toString()}`);
      const { events, pagination } = response.data.data;

      setEvents(events);
      setTotalEvents(pagination.totalEvents);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
      setTotalEvents(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      city: '',
      dateFrom: '',
      dateTo: '',
      priceMin: '',
      priceMax: ''
    });
    setCurrentPage(1);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/events/${eventId}`);
      // Reload events after deletion
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  const handleEditEvent = (eventId: string) => {
    // Navigate to edit page with event ID
    window.location.href = `/event/create?edit=${eventId}`;
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const isUpcoming = (date: string) => {
    return new Date(date) > new Date();
  };

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {event.image && (
        <div className="h-48 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}
      <CardBody>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {event.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {event.shortDescription || event.description}
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-emerald-600" />
            <span>{formatDate(event.date)}</span>
            <span className="mx-2">•</span>
            <span>{formatTime(event.time)}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-emerald-600" />
            <span className="truncate">{event.location}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2 text-emerald-600" />
            <span>{event.currentAttendees} / {event.maxAttendees} attendees</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-lg font-semibold text-gray-900">
            <DollarSign className="h-4 w-4 mr-1" />
            {event.price === 0 ? 'Free' : `${event.currency} ${event.price}`}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              {event.category}
            </span>
            {!isUpcoming(event.date) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <Clock className="h-3 w-3 mr-1" />
                Past
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Link
            to={`/event/events/${event._id}`}
            className="w-full btn-primary text-center block"
          >
            View Details
          </Link>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleEditEvent(event._id)}
              className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
            <button
              onClick={() => handleDeleteEvent(event._id)}
              className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  const EventListItem = ({ event }: { event: Event }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardBody>
        <div className="flex items-start space-x-4">
          {event.image && (
            <div className="flex-shrink-0">
              <img
                src={event.image}
                alt={event.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {event.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {event.shortDescription || event.description}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  {event.category}
                </span>
                {!isUpcoming(event.date) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Past
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-emerald-600" />
                <span>{formatDate(event.date)}</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-emerald-600" />
                <span>{formatTime(event.time)}</span>
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-emerald-600" />
                <span className="truncate">{event.location}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-emerald-600" />
                  <span>{event.currentAttendees} / {event.maxAttendees}</span>
                </div>
                <div className="flex items-center text-lg font-semibold text-gray-900">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {event.price === 0 ? 'Free' : `${event.currency} ${event.price}`}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-4">
            <Link
              to={`/event/events/${event._id}`}
              className="flex items-center px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Link>
            <button
              onClick={() => handleEditEvent(event._id)}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
            <button
              onClick={() => handleDeleteEvent(event._id)}
              className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Discover and join amazing events happening around you"
      />

      {/* Removed authentication check - events are now public */}

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full"
                />
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="secondary"
                className="flex items-center"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="price">Price</option>
              </select>
              
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="City"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
              
              <input
                type="date"
                placeholder="From Date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
              
              <input
                type="date"
                placeholder="To Date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
              
              <input
                type="number"
                placeholder="Min Price"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
                min="0"
              />
              
              <input
                type="number"
                placeholder="Max Price"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
                min="0"
              />
              
              <Button
                onClick={clearFilters}
                variant="secondary"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {((currentPage - 1) * 12) + 1} to {Math.min(currentPage * 12, totalEvents)} of {totalEvents} events
        </p>
      </div>

      {/* Events Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded mb-4"></div>
              <CardBody>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters.</p>
          <Button
            onClick={clearFilters}
            variant="primary"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <EventListItem key={event._id} event={event} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="secondary"
              size="sm"
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  variant={currentPage === page ? "primary" : "secondary"}
                  size="sm"
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              variant="secondary"
              size="sm"
              className="flex items-center"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}