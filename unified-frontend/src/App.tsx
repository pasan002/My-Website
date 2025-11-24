import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout.tsx';
import FinancialLayout from './components/financial/FinancialLayout.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import EventLayout from './components/event/EventLayout';
import TransportLayout from './components/transport/TransportLayout';
import UserManagementLayout from './components/user-management/UserManagementLayout';
import UserLayout from './components/user/UserLayout';
import FeedbackLayout from './components/feedback/FeedbackLayout';

// Home Page
import Home from './pages/Home.tsx';
import About from './pages/About.tsx';
import Contact from './pages/Contact.tsx';

// Financial Management Routes
import FinancialDashboard from './pages/financial/Dashboard.tsx';
import FinancialExpenses from './pages/financial/Expenses.tsx';
import FinancialIncomes from './pages/financial/Incomes.tsx';
import FinancialReports from './pages/financial/Reports.tsx';

// Event Management Routes
import EventDashboard from './pages/event/Dashboard.tsx';
import EventList from './pages/event/EventList.tsx';
import EventCreate from './pages/event/EventCreate.tsx';
// import EventBookings from './pages/event/EventBookings.tsx';

// Feedback Management Routes
import FeedbackDashboard from './pages/feedback/Dashboard.tsx';
import FeedbackList from './pages/feedback/FeedbackList.tsx';
import ComplaintList from './pages/feedback/ComplaintList.tsx';
import FeedbackForm from './pages/feedback/FeedbackForm.tsx';
import ComplaintForm from './pages/feedback/ComplaintForm.tsx';

// Transport Management Routes
import TransportDashboard from './pages/transport/Dashboard.tsx';
import BinManagement from './pages/transport/BinManagement.tsx';
import CollectorManagement from './pages/transport/CollectorManagement.tsx';
import TruckManagement from './pages/transport/TruckManagement.tsx';
import DriverInterface from './pages/transport/DriverInterface.tsx';
import TransportTest from './pages/transport/TransportTest.tsx';
import APITest from './pages/transport/APITest.tsx';
import DebugAPI from './pages/transport/DebugAPI.tsx';

// User Management Routes
import UserDashboard from './pages/user/UserDashboard.tsx';
import UserList from './pages/user/UserList.tsx';
import UserProfile from './pages/user/UserProfile.tsx';
import Login from './pages/user/Login.tsx';
import Register from './pages/user/Register.tsx';
import AdminDashboard from './pages/user/AdminDashboard.tsx';
import AddRequest from './pages/user/AddRequest.tsx';

// Admin User Management Routes
import UserManagementDashboard from './pages/user-management/Dashboard.tsx';
import UserManagementRequests from './pages/user-management/Requests.tsx';

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
				<Route element={<Layout />}>
					{/* Home page */}
					<Route index element={<Home />} />
					<Route path="/" element={<Home />} />
					
					{/* About and Contact pages */}
					<Route path="/about" element={<About />} />
					<Route path="/contact" element={<Contact />} />
					
					{/* Financial Management Routes - Financial Admin Only */}
					<Route path="/financial" element={
						<ProtectedRoute allowedRoles={['financial_admin']}>
							<FinancialLayout />
						</ProtectedRoute>
					}>
						<Route path="dashboard" element={<FinancialDashboard />} />
						<Route path="expenses" element={<FinancialExpenses />} />
						<Route path="incomes" element={<FinancialIncomes />} />
						<Route path="reports" element={<FinancialReports />} />
					</Route>
					
                    {/* Event Management Routes - Event Admin Only */}
                    <Route path="/event" element={
                        <ProtectedRoute allowedRoles={['event_admin']}>
							<EventLayout />
						</ProtectedRoute>
					}>
                        <Route path="dashboard" element={<EventDashboard />} />
                        <Route path="events" element={<EventList />} />
                        <Route path="create" element={<EventCreate />} />
                    </Route>
                    {/* Bookings page removed */}
					
                    {/* Feedback Management Routes - Feedback Admin Only */}
                    <Route path="/feedback" element={
                        <ProtectedRoute allowedRoles={['feedback_admin']}>
                            <FeedbackLayout />
                        </ProtectedRoute>
                    }>
                        <Route path="dashboard" element={<FeedbackDashboard />} />
                        <Route path="feedbacks" element={<FeedbackList />} />
                        <Route path="complaints" element={<ComplaintList />} />
                    </Route>
                    
                    {/* User Feedback Routes - For regular users */}
                    <Route path="/feedback/feedbacks" element={
                        <ProtectedRoute allowedRoles={['user', 'driver', 'moderator', 'organizer']}>
                            <FeedbackForm />
                        </ProtectedRoute>
                    } />
                    <Route path="/feedback/complaints" element={
                        <ProtectedRoute allowedRoles={['user', 'driver', 'moderator', 'organizer']}>
                            <ComplaintForm />
                        </ProtectedRoute>
                    } />
                    
                    {/* Submit Feedback and Complaint Forms - For regular users */}
                    <Route path="/feedback/submit-feedback" element={
                        <ProtectedRoute allowedRoles={['user', 'driver', 'moderator', 'organizer']}>
                            <FeedbackForm />
                        </ProtectedRoute>
                    } />
                    <Route path="/feedback/submit-complaint" element={
                        <ProtectedRoute allowedRoles={['user', 'driver', 'moderator', 'organizer']}>
                            <ComplaintForm />
                        </ProtectedRoute>
                    } />
					
					{/* Transport Management Routes - Transport Admin Only */}
					<Route path="/transport" element={
						<ProtectedRoute allowedRoles={['admin', 'transport_admin']}>
							<TransportLayout />
						</ProtectedRoute>
					}>
						<Route path="dashboard" element={<TransportDashboard />} />
						<Route path="bins" element={<BinManagement />} />
						<Route path="collectors" element={<CollectorManagement />} />
						<Route path="trucks" element={<TruckManagement />} />
						<Route path="driver" element={<DriverInterface />} />
					</Route>
					<Route path="/transport/test" element={
						<ProtectedRoute allowedRoles={['admin']}>
							<TransportTest />
						</ProtectedRoute>
					} />
					<Route path="/transport/api-test" element={
						<ProtectedRoute allowedRoles={['admin']}>
							<APITest />
						</ProtectedRoute>
					} />
					<Route path="/transport/debug" element={
						<ProtectedRoute allowedRoles={['admin']}>
							<DebugAPI />
						</ProtectedRoute>
					} />
					
					{/* User Routes - Regular Users */}
					<Route path="/user" element={
						<ProtectedRoute allowedRoles={['user', 'driver', 'moderator', 'organizer']}>
							<UserLayout />
						</ProtectedRoute>
					}>
						<Route path="dashboard" element={<UserDashboard />} />
						<Route path="profile" element={<UserProfile />} />
						<Route path="add-request" element={<AddRequest />} />
					</Route>
					
					{/* Public User Routes */}
					<Route path="/user/login" element={<Login />} />
					<Route path="/user/register" element={<Register />} />
					<Route path="/user/users" element={<UserList />} />
					<Route path="/user/admin" element={<AdminDashboard />} />
					
					{/* Admin User Management Routes */}
					<Route path="/user-management" element={
						<ProtectedRoute allowedRoles={['admin', 'user_admin']}>
							<UserManagementLayout />
						</ProtectedRoute>
					}>
						<Route path="dashboard" element={<UserManagementDashboard />} />
						<Route path="requests" element={<UserManagementRequests />} />
					</Route>
				</Route>
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
