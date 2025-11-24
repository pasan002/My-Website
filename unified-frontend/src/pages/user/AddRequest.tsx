import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  MapPin, 
  FileText, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Plus,
  Map,
  Navigation
} from 'lucide-react';

const TYPE_PRICES = {
  Organic: 3000,
  Recyclable: 2000,
  Other: 4000,
};

type FormData = {
  name: string;
  address: string;
  email: string;
  mobileNumber: string;
  type: string;
  description: string;
  typePrice: number;
  deliveryFee: number;
  totalPrice: number;
  latitude?: number;
  longitude?: number;
};

type Coordinates = {
  lat: number;
  lng: number;
};

export default function AddRequest() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: user?.firstName || "",
    address: "",
    email: user?.email || "",
    mobileNumber: user?.phone || "",
    type: "",
    description: "",
    typePrice: 0,
    deliveryFee: 1200,
    totalPrice: 0,
    latitude: undefined,
    longitude: undefined,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [coords, setCoords] = useState<Coordinates>({ lat: 6.9147, lng: 79.9733 }); // Default to Colombo
  const [distance, setDistance] = useState(0);
  const [geocodeLoading, setGeocodeLoading] = useState(false);

  // Auto-populate form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.firstName || prev.name,
        email: user.email || prev.email,
        mobileNumber: user.phone || prev.mobileNumber,
      }));
    }
  }, [user]);

  // Auto-fetch delivery fee when email changes
  useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (formData.email && formData.email.includes('@')) {
        // Mock delivery fee based on email domain
        const fee = formData.email.includes('colombo') ? 1200 : 1000;
        setFormData(prev => ({
          ...prev,
          deliveryFee: fee,
          totalPrice: prev.typePrice + fee
        }));
      }
    };

    const timeoutId = setTimeout(fetchDeliveryFee, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  // Location tracking functions
  const handleTrackLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setCoords({ lat: latitude, lng: longitude });
          setDistance(accuracy);
          setFormData(prev => ({
            ...prev,
            latitude: latitude,
            longitude: longitude
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enter address manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const geocodeAddress = async () => {
    if (!formData.address.trim()) {
      alert('Please enter an address first.');
      return;
    }
    try {
      setGeocodeLoading(true);
      // Try Google Geocoding API if key provided, otherwise fallback to OpenStreetMap Nominatim
      const googleKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
      if (googleKey) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formData.address)}&key=${googleKey}`;
        const res = await fetch(url);
        const data = await res.json();
        const loc = data?.results?.[0]?.geometry?.location;
        if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
          setCoords({ lat: loc.lat, lng: loc.lng });
          setFormData(prev => ({ ...prev, latitude: loc.lat, longitude: loc.lng }));
          setShowMap(true);
          return;
        }
      }
      // Fallback: Nominatim (no API key), suitable for dev
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.address)}&format=json&limit=1`;
      const osmRes = await fetch(osmUrl, { headers: { 'Accept-Language': 'en' } });
      const osmData = await osmRes.json();
      const first = osmData?.[0];
      if (first && first.lat && first.lon) {
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        setCoords({ lat, lng });
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
        setShowMap(true);
      } else {
        alert('Could not locate this address. Please refine it or use Track Location.');
      }
    } catch (e) {
      console.error('Geocode error:', e);
      alert('Failed to locate the address. Try again or use Track Location.');
    } finally {
      setGeocodeLoading(false);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    // Handle mobile number validation
    if (name === 'mobileNumber') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => {
        const next = { ...prev, [name]: value };
        if (name === 'type') {
          next.typePrice = TYPE_PRICES[value as keyof typeof TYPE_PRICES] || 0;
        }
        next.totalPrice = Number(next.typePrice || 0) + Number(next.deliveryFee || 0);
        return next;
      });
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (isNaN(Number(formData.mobileNumber))) {
      newErrors.mobileNumber = "Mobile number must be numeric";
    } else if (formData.mobileNumber.length !== 10) {
      newErrors.mobileNumber = "Mobile number must be exactly 10 digits";
    }
    
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    
    if (!formData.type) {
      newErrors.type = "Please select a waste type";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      setErrors(prev => ({ ...prev, submit: "No account email found. Please log in again." }));
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      // Check if user is authenticated
      if (!user || !token) {
        setErrors(prev => ({ ...prev, submit: "Please log in to submit a request." }));
        setIsLoading(false);
        return;
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        address: formData.address,
        type: formData.type,
        description: formData.description,
        typePrice: formData.typePrice,
        deliveryFee: formData.deliveryFee,
        coordinates: {
          latitude: coords.lat,
          longitude: coords.lng
        }
      };
      
      console.log('Submitting request with payload:', payload);
      
      const response = await fetch('http://localhost:5000/api/user-management/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit request');
      }
      
      setIsSubmitted(true);
      navigate('/user/dashboard');
    } catch (err: any) {
      console.error('Submit error:', err);
      setErrors(prev => ({ ...prev, submit: err.message || "Failed to submit request. Please try again." }));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md text-center">
          <CardBody className="p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your waste collection request has been received and will be processed shortly.
            </p>
            <Button onClick={() => navigate('/user/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Waste Collection Request</h1>
        <p className="text-gray-600">Fill out the form below to schedule your waste pickup</p>
      </div>
      
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="name"
                  label="Full Name (Pre-filled from your account)"
                  value={formData.name}
                  onChange={(value) => handleInputChange('name', value)}
                  placeholder="Enter your full name"
                  required
                  error={errors.name}
                />
                
                <Input
                  name="email"
                  label="Email Address (Pre-filled from your account)"
                  type="email"
                  value={formData.email}
                  onChange={(value) => handleInputChange('email', value)}
                  placeholder="your.email@example.com"
                  required
                  error={errors.email}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="mobileNumber"
                  label="Mobile Number (Pre-filled from your account)"
                  type="text"
                  value={formData.mobileNumber}
                  onChange={(value) => handleInputChange('mobileNumber', value)}
                  placeholder="Enter 10-digit mobile number"
                  required
                  error={errors.mobileNumber}
                />
                
                <Select
                  name="type"
                  label="Waste Type"
                  value={formData.type}
                  onChange={(value) => handleInputChange('type', value)}
                  options={[
                    { value: "", label: "Select waste type" },
                    { value: "Organic", label: "🌱 Organic Waste" },
                    { value: "Recyclable", label: "♻️ Recyclable Materials" },
                    { value: "Other", label: "📦 Other" }
                  ]}
                  required
                  error={errors.type}
                />
              </div>
            </div>
            
            {/* Collection Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                Collection Details
              </h3>
              
              <div className="space-y-3">
                <Input
                  name="address"
                  label="Collection Address"
                  value={formData.address}
                  onChange={(value) => handleInputChange('address', value)}
                  placeholder="Enter the complete address where waste should be collected"
                  required
                  error={errors.address}
                />
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleTrackLocation}
                    className="flex items-center gap-2"
                  >
                    <Navigation className="h-4 w-4" />
                    Track Location
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={geocodeAddress}
                    disabled={geocodeLoading}
                    className="flex items-center gap-2"
                  >
                    {geocodeLoading ? (
                      <div className="flex items-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>Locating...</div>
                    ) : (
                      <><MapPin className="h-4 w-4" /> Find Address on Map</>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setShowMap(true)}
                    className="flex items-center gap-2"
                  >
                    <Map className="h-4 w-4" />
                    View on Map
                  </Button>
                </div>
                
                {coords.lat !== 6.9147 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2 text-green-800">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-medium">Location captured:</span>
                    </div>
                    <div className="text-sm text-green-700 mt-1">
                      Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
                      {distance > 0 && <span> (Accuracy: {Math.round(distance)}m)</span>}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Additional Information
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Provide any additional details about your waste collection request"
                  rows={4}
                  required
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
            </div>

            {/* Map Display */}
            {showMap && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Map className="h-5 w-5 text-emerald-600" />
                    Location Map
                  </h3>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setShowMap(false)}
                    size="sm"
                  >
                    Close Map
                  </Button>
                </div>
                
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="space-y-3">
                    <div className="bg-white rounded overflow-hidden border">
                      <iframe
                        title="Google Map"
                        width="100%"
                        height="320"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=16&output=embed`}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}{distance > 0 && (<span> (±{Math.round(distance)}m)</span>)}
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={handleTrackLocation}>
                          <Navigation className="h-4 w-4 mr-1" /> Update Location
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`, '_blank')}
                        >
                          Open in Google Maps
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Pricing Summary
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type Price (auto)
                  </label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" 
                    type="number" 
                    value={formData.typePrice} 
                    readOnly 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Fee (auto)
                  </label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" 
                    type="number" 
                    value={formData.deliveryFee} 
                    readOnly 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total (LKR)
                  </label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-emerald-50 font-semibold" 
                    type="number" 
                    value={formData.totalPrice} 
                    readOnly 
                  />
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errors.submit}
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isLoading || !formData.email}
                className="px-8"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    Submit Request
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
