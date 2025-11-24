import { Outlet, NavLink } from 'react-router-dom';
import UserManagementSidebar from './UserManagementSidebar';
import { useAuth } from '../../contexts/AuthContext';

export default function UserManagementLayout() {
    const { user, logout, isAuthenticated } = useAuth();
    return (
        <div className="flex h-screen bg-gray-50">
            <UserManagementSidebar />
            <div className="flex-1 overflow-auto">
                {/* Green Top Nav Bar */}
                <div className="text-white flex justify-between items-center h-16 px-8 border-t border-gray-600 border-b border-gray-600" style={{backgroundColor: '#008080'}}>
                    <nav className="flex items-center space-x-8">
                        <NavLink to="/" className="font-semibold hover:underline transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md hover:transform hover:-translate-y-0.5">Home</NavLink>
                        <NavLink to="/about" className="font-semibold hover:underline transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md hover:transform hover:-translate-y-0.5">About Us</NavLink>
                        <NavLink to="/contact" className="font-semibold hover:underline transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md hover:transform hover:-translate-y-0.5">Contact Us</NavLink>
                    </nav>
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <span className="text-sm">Welcome, {user?.firstName || user?.username}</span>
                        ) : (
                            <NavLink to="/user/login" className="font-semibold hover:underline transition-all duration-300 hover:bg-white/10 px-3 py-2 rounded-md hover:transform hover:-translate-y-0.5">Login</NavLink>
                        )}
                        {isAuthenticated && (
                            <button
                                onClick={logout}
                                className="px-3 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white ml-2 hover:bg-emerald-700 transition-all duration-300 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </div>
                <div className="p-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
