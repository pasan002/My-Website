import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import api from '../../lib/api';
import { 
  MapPin, 
  Users, 
  Clock, 
  Tag, 
  Image, 
  Save, 
  ArrowLeft,
  Plus,
  Trash2
} from 'lucide-react';

type Speaker = {
  name: string;
  title: string;
  company: string;
  bio: string;
  image: string;
  socialLinks: {
    linkedin: string;
    twitter: string;
    website: string;
  };
};

type AgendaItem = {
  time: string;
  title: string;
  description: string;
  speaker: string;
  duration: number;
};

type EventImage = {
  url: string;
  alt: string;
  isPrimary: boolean;
};

export default function EventCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [images, setImages] = useState<EventImage[]>([]);
  const [primaryImage, setPrimaryImage] = useState<string | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    subcategory: '',
    tags: '',
    date: '',
    endDate: '',
    time: '',
    endTime: '',
    location: '',
    venue: {
      name: '',
      capacity: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    maxAttendees: '',
    price: '',
    currency: 'LKR',
    earlyBirdPrice: '',
    earlyBirdEndDate: '',
    status: 'draft',
    visibility: 'public',
    registrationDeadline: '',
    cancellationDeadline: '',
    allowWaitlist: true,
    allowCancellation: true,
    sendReminders: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    'workshop', 'seminar', 'meeting', 'community', 'training', 
    'exhibition', 'conference', 'networking', 'other'
  ];

  const currencies = ['LKR', 'USD', 'EUR', 'GBP'];
  const statuses = ['draft', 'active', 'cancelled', 'completed', 'postponed'];
  const visibilityOptions = ['public', 'private', 'invite-only'];

  // Check if we're in edit mode
  useEffect(() => {
    const editParam = searchParams.get('edit');
    if (editParam) {
      setIsEditMode(true);
      setEventId(editParam);
      loadEventForEdit(editParam);
    }
  }, [searchParams]);

  const loadEventForEdit = async (id: string) => {
    try {
      const response = await api.get(`/events/${id}`);
      const event = response.data.data.event;
      
      // Populate form with existing event data
      setFormData({
        title: event.title || '',
        description: event.description || '',
        shortDescription: event.shortDescription || '',
        category: event.category || '',
        subcategory: event.subcategory || '',
        tags: event.tags ? event.tags.join(', ') : '',
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
        time: event.time || '',
        endTime: event.endTime || '',
        location: event.location || '',
        venue: {
          name: event.venue?.name || '',
          capacity: event.venue?.capacity || '',
          address: event.venue?.address || '',
          city: event.venue?.city || '',
          state: event.venue?.state || '',
          zipCode: event.venue?.zipCode || '',
          country: event.venue?.country || ''
        },
        maxAttendees: event.maxAttendees?.toString() || '',
        price: event.price?.toString() || '',
        currency: event.currency || 'LKR',
        earlyBirdPrice: event.earlyBirdPrice?.toString() || '',
        earlyBirdEndDate: event.earlyBirdEndDate ? new Date(event.earlyBirdEndDate).toISOString().split('T')[0] : '',
        status: event.status || 'draft',
        visibility: event.visibility || 'public',
        registrationDeadline: event.registrationDeadline || '',
        cancellationDeadline: event.cancellationDeadline || '',
        allowWaitlist: event.settings?.allowWaitlist ?? true,
        allowCancellation: event.settings?.allowCancellation ?? true,
        sendReminders: event.settings?.sendReminders ?? true
      });

      // Initialize images from existing event image if present
      if (event.image) {
        setImages([{ url: event.image, alt: 'Primary image', isPrimary: true }]);
        setPrimaryImage(event.image);
      } else {
        setImages([]);
        setPrimaryImage(null);
      }
    } catch (error) {
      console.error('Error loading event for edit:', error);
      alert('Failed to load event for editing');
    }
  };

  const handleInputChange = (name: string, value: string | boolean) => {
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const validationErrors: Record<string, string> = {};

    const today = new Date();
    const parseDate = (d: string) => (d ? new Date(d) : null);
    const parseTime = (t: string) => (t ? new Date(`2000-01-01T${t}`) : null);

    // Required fields
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      validationErrors.title = 'Title is required (min 3 characters).';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      validationErrors.description = 'Description is required (min 10 characters).';
    }
    if (!formData.category) {
      validationErrors.category = 'Category is required.';
    }
    if (!formData.date) {
      validationErrors.date = 'Event date is required.';
    }
    if (!formData.time) {
      validationErrors.time = 'Start time is required.';
    }
    if (!formData.location.trim()) {
      validationErrors.location = 'Location is required.';
    }

    // Numeric validations
    const maxAttendeesNum = parseInt(formData.maxAttendees);
    if (Number.isNaN(maxAttendeesNum) || maxAttendeesNum < 1) {
      validationErrors.maxAttendees = 'Maximum attendees must be at least 1.';
    }
    const priceNum = formData.price === '' ? 0 : parseFloat(formData.price);
    if (priceNum < 0) {
      validationErrors.price = 'Price cannot be negative.';
    }

    // Date/time ordering
    const eventDate = parseDate(formData.date);
    const endDate = parseDate(formData.endDate);
    const startTime = parseTime(formData.time);
    const endTime = parseTime(formData.endTime);

    if (eventDate && eventDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      validationErrors.date = 'Event date cannot be in the past.';
    }
    if (eventDate && endDate && endDate < eventDate) {
      validationErrors.endDate = 'End date cannot be before event date.';
    }
    if (startTime && endTime && endTime <= startTime) {
      validationErrors.endTime = 'End time must be after start time.';
    }

    // Early bird and deadlines
    const earlyEnd = parseDate(formData.earlyBirdEndDate);
    if (earlyEnd && eventDate && earlyEnd > eventDate) {
      validationErrors.earlyBirdEndDate = 'Early bird end must be on/before event date.';
    }

    const regDeadline = formData.registrationDeadline ? new Date(formData.registrationDeadline) : null;
    const cancelDeadline = formData.cancellationDeadline ? new Date(formData.cancellationDeadline) : null;
    if (regDeadline && eventDate) {
      const regCutoff = new Date(eventDate);
      if (regDeadline > regCutoff) {
        validationErrors.registrationDeadline = 'Registration deadline must be on/before event date.';
      }
    }
    if (cancelDeadline && regDeadline && cancelDeadline > regDeadline) {
      validationErrors.cancellationDeadline = 'Cancellation deadline must be on/before registration deadline.';
    }

    const venueCapacityNum = formData.venue.capacity ? parseInt(formData.venue.capacity) : NaN;
    if (!Number.isNaN(venueCapacityNum) && !Number.isNaN(maxAttendeesNum) && maxAttendeesNum > venueCapacityNum) {
      validationErrors['venue.capacity'] = 'Max attendees cannot exceed venue capacity.';
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Prepare event data for API
      const eventData = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        category: formData.category,
        maxAttendees: parseInt(formData.maxAttendees),
        price: parseFloat(formData.price),
        currency: formData.currency,
        status: formData.status,
        image: primaryImage || undefined
      };

      let response;
      if (isEditMode && eventId) {
        console.log('Updating event:', eventData);
        response = await api.put(`/events/${eventId}`, eventData);
        console.log('Event updated successfully:', response.data);
      } else {
        console.log('Creating event:', eventData);
        response = await api.post('/events', eventData);
        console.log('Event created successfully:', response.data);
      }
      
      navigate('/event/events');
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} event:`, error);
      alert(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} event`);
    } finally {
      setIsLoading(false);
    }
  };

  const addSpeaker = () => {
    setSpeakers([...speakers, {
      name: '',
      title: '',
      company: '',
      bio: '',
      image: '',
      socialLinks: {
        linkedin: '',
        twitter: '',
        website: ''
      }
    }]);
  };

  const updateSpeaker = (index: number, field: string, value: string) => {
    const updatedSpeakers = [...speakers];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      (updatedSpeakers[index] as any)[parent][child] = value;
    } else {
      (updatedSpeakers[index] as any)[field] = value;
    }
    setSpeakers(updatedSpeakers);
  };

  const removeSpeaker = (index: number) => {
    setSpeakers(speakers.filter((_, i) => i !== index));
  };

  const addAgendaItem = () => {
    setAgenda([...agenda, {
      time: '',
      title: '',
      description: '',
      speaker: '',
      duration: 30
    }]);
  };

  const updateAgendaItem = (index: number, field: string, value: string | number) => {
    const updatedAgenda = [...agenda];
    (updatedAgenda[index] as any)[field] = value;
    setAgenda(updatedAgenda);
  };

  const removeAgendaItem = (index: number) => {
    setAgenda(agenda.filter((_, i) => i !== index));
  };

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const dataUrls = await Promise.all(files.map(readFileAsDataUrl));
      const startingLength = images.length;
      const newImages: EventImage[] = dataUrls.map((dataUrl, idx) => ({
        url: dataUrl,
        alt: files[idx]?.name || 'Event image',
        isPrimary: startingLength === 0 && idx === 0
      }));

      const updated = [...images, ...newImages];
      setImages(updated);
      // Set primary image if none set yet
      if (!primaryImage) {
        const first = newImages[0]?.url;
        if (first) setPrimaryImage(first);
      }
    } catch (err) {
      console.error('Failed to read image(s):', err);
      alert('Failed to load selected image(s). Please try again.');
    }
  };

  const removeImage = (index: number) => {
    const removed = images[index];
    const remaining = images.filter((_, i) => i !== index);
    // If removing the primary image, promote the next one
    if (removed?.isPrimary) {
      if (remaining.length > 0) {
        remaining[0].isPrimary = true;
        setPrimaryImage(remaining[0].url);
      } else {
        setPrimaryImage(null);
      }
    }
    setImages(remaining);
  };

  const setPrimaryImageIndex = (index: number) => {
    const updatedImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    setImages(updatedImages);
    const img = updatedImages[index];
    setPrimaryImage(img ? img.url : null);
  };

  // Authentication check removed for testing

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? "Edit Event" : "Create New Event"}
        description={isEditMode ? "Update the event details" : "Fill in the details to create a new event"}
        actions={
          <Button
            onClick={() => navigate('/event/events')}
            variant="secondary"
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        }
      />

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
              <Input
                name="title"
                label="Event Title *"
                value={formData.title}
                onChange={(value) => handleInputChange('title', value)}
                placeholder="Enter event title"
                required
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Describe your event"
                  required
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              <Input
                name="shortDescription"
                label="Short Description"
                value={formData.shortDescription}
                onChange={(value) => handleInputChange('shortDescription', value)}
                placeholder="Brief description (max 200 chars)"
              />

              <Select
                name="category"
                label="Category *"
                value={formData.category}
                onChange={(value) => handleInputChange('category', value)}
                options={[
                  { value: '', label: 'Select category' },
                  ...categories.map(category => ({
                    value: category,
                    label: category.charAt(0).toUpperCase() + category.slice(1)
                  }))
                ]}
                required
              />
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}

              <Input
                name="subcategory"
                label="Subcategory"
                value={formData.subcategory}
                onChange={(value) => handleInputChange('subcategory', value)}
                placeholder="e.g., Tech Workshop, Music Festival"
              />

              <Input
                name="tags"
                label="Tags"
                value={formData.tags}
                onChange={(value) => handleInputChange('tags', value)}
                placeholder="Enter tags separated by commas"
              />
            </div>
          </CardBody>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-emerald-600" />
              Date & Time
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                name="date"
                label="Event Date *"
                type="date"
                value={formData.date}
                onChange={(value) => handleInputChange('date', value)}
                required
              />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}

              <Input
                name="endDate"
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(value) => handleInputChange('endDate', value)}
              />
              {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
                {errors.time && <p className="mt-1 text-sm text-red-600">{errors.time}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-emerald-600" />
              Location
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  name="location"
                  label="Location *"
                  value={formData.location}
                  onChange={(value) => handleInputChange('location', value)}
                  placeholder="Enter event location"
                  required
                />
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
              </div>

              <Input
                name="venue.name"
                label="Venue Name"
                value={formData.venue.name}
                onChange={(value) => handleInputChange('venue.name', value)}
                placeholder="e.g., Convention Center"
              />

              <Input
                name="venue.capacity"
                label="Venue Capacity"
                type="number"
                value={formData.venue.capacity}
                onChange={(value) => handleInputChange('venue.capacity', value)}
                placeholder="Maximum capacity"
                min="1"
              />
              {errors['venue.capacity'] && <p className="mt-1 text-sm text-red-600">{errors['venue.capacity']}</p>}

              <Input
                name="venue.address"
                label="Address"
                value={formData.venue.address}
                onChange={(value) => handleInputChange('venue.address', value)}
                placeholder="Street address"
              />

              <Input
                name="venue.city"
                label="City"
                value={formData.venue.city}
                onChange={(value) => handleInputChange('venue.city', value)}
                placeholder="City"
              />

              <Input
                name="venue.state"
                label="State"
                value={formData.venue.state}
                onChange={(value) => handleInputChange('venue.state', value)}
                placeholder="State/Province"
              />

              <Input
                name="venue.zipCode"
                label="ZIP Code"
                value={formData.venue.zipCode}
                onChange={(value) => handleInputChange('venue.zipCode', value)}
                placeholder="ZIP/Postal code"
              />

              <Input
                name="venue.country"
                label="Country"
                value={formData.venue.country}
                onChange={(value) => handleInputChange('venue.country', value)}
                placeholder="Country"
              />
            </div>
          </CardBody>
        </Card>

        {/* Capacity & Pricing */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-emerald-600" />
              Capacity & Pricing
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                name="maxAttendees"
                label="Maximum Attendees *"
                type="number"
                value={formData.maxAttendees}
                onChange={(value) => handleInputChange('maxAttendees', value)}
                placeholder="Maximum number of attendees"
                min="1"
                required
              />
              {errors.maxAttendees && <p className="mt-1 text-sm text-red-600">{errors.maxAttendees}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <div className="flex">
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="border border-gray-300 rounded-l-md px-3 py-2 border-r-0"
                >
                  {currencies.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
                <input
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                </div>
              </div>

              <Input
                name="earlyBirdPrice"
                label="Early Bird Price"
                type="number"
                value={formData.earlyBirdPrice}
                onChange={(value) => handleInputChange('earlyBirdPrice', value)}
                placeholder="Early bird price"
                min="0"
                step="0.01"
              />

              <Input
                name="earlyBirdEndDate"
                label="Early Bird End Date"
                type="date"
                value={formData.earlyBirdEndDate}
                onChange={(value) => handleInputChange('earlyBirdEndDate', value)}
              />
              {errors.earlyBirdEndDate && <p className="mt-1 text-sm text-red-600">{errors.earlyBirdEndDate}</p>}
            </div>
          </CardBody>
        </Card>

        {/* Event Settings */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Tag className="h-5 w-5 mr-2 text-emerald-600" />
              Event Settings
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                name="status"
                label="Status"
                value={formData.status}
                onChange={(value) => handleInputChange('status', value)}
                options={statuses.map(status => ({
                  value: status,
                  label: status.charAt(0).toUpperCase() + status.slice(1)
                }))}
              />

              <Select
                name="visibility"
                label="Visibility"
                value={formData.visibility}
                onChange={(value) => handleInputChange('visibility', value)}
                options={visibilityOptions.map(option => ({
                  value: option,
                  label: option.charAt(0).toUpperCase() + option.slice(1)
                }))}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Deadline
                </label>
                <input
                  name="registrationDeadline"
                  type="datetime-local"
                  value={formData.registrationDeadline}
                  onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {errors.registrationDeadline && <p className="mt-1 text-sm text-red-600">{errors.registrationDeadline}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Deadline
                </label>
                <input
                  name="cancellationDeadline"
                  type="datetime-local"
                  value={formData.cancellationDeadline}
                  onChange={(e) => handleInputChange('cancellationDeadline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {errors.cancellationDeadline && <p className="mt-1 text-sm text-red-600">{errors.cancellationDeadline}</p>}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <input
                  name="allowWaitlist"
                  type="checkbox"
                  checked={formData.allowWaitlist}
                  onChange={(e) => handleCheckboxChange('allowWaitlist', e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Allow waitlist when event is full
                </label>
              </div>

              <div className="flex items-center">
                <input
                  name="allowCancellation"
                  type="checkbox"
                  checked={formData.allowCancellation}
                  onChange={(e) => handleCheckboxChange('allowCancellation', e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Allow attendees to cancel their registration
                </label>
              </div>

              <div className="flex items-center">
                <input
                  name="sendReminders"
                  type="checkbox"
                  checked={formData.sendReminders}
                  onChange={(e) => handleCheckboxChange('sendReminders', e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Send reminder emails to attendees
                </label>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Image className="h-5 w-5 mr-2 text-emerald-600" />
              Event Images
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        {!image.isPrimary && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImageIndex(index)}
                            className="bg-blue-600 text-white p-1 rounded text-xs"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="bg-red-600 text-white p-1 rounded text-xs"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      {image.isPrimary && (
                        <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Speakers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Speakers</h2>
              <Button
                type="button"
                onClick={addSpeaker}
                variant="secondary"
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Speaker
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {speakers.map((speaker, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Speaker {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeSpeaker(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={speaker.name}
                      onChange={(e) => updateSpeaker(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Speaker name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={speaker.title}
                      onChange={(e) => updateSpeaker(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Job title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={speaker.company}
                      onChange={(e) => updateSpeaker(index, 'company', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={speaker.image}
                      onChange={(e) => updateSpeaker(index, 'image', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Speaker image URL"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={speaker.bio}
                      onChange={(e) => updateSpeaker(index, 'bio', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Speaker biography"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Agenda */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Event Agenda</h2>
              <Button
                type="button"
                onClick={addAgendaItem}
                variant="secondary"
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Agenda Item
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {agenda.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Agenda Item {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeAgendaItem(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time *
                    </label>
                    <input
                      type="time"
                      value={item.time}
                      onChange={(e) => updateAgendaItem(index, 'time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={item.duration}
                      onChange={(e) => updateAgendaItem(index, 'duration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      min="1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateAgendaItem(index, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Session title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Speaker
                    </label>
                    <input
                      type="text"
                      value={item.speaker}
                      onChange={(e) => updateAgendaItem(index, 'speaker', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Speaker name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => updateAgendaItem(index, 'description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Session description"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            onClick={() => navigate('/event/events')}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {isEditMode ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  );
}