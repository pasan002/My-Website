import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, MessageCircle, AlertTriangle } from 'lucide-react';

export default function FeedbackSidebar() {
    const { user } = useAuth();
    
    const navItems = [
        {
            path: '/feedback/dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard className="h-5 w-5" />
        },
        {
            path: '/feedback/feedbacks',
            label: 'Feedbacks',
            icon: <MessageCircle className="h-5 w-5" />
        },
        {
            path: '/feedback/complaints',
            label: 'Complaints',
            icon: <AlertTriangle className="h-5 w-5" />
        }
    ];

    return (
        <div className="w-64 bg-white shadow-lg h-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Feedback Management</h2>
                    </div>
                </div>
            </div>

            {/* User Profile */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                            {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'F'}
                        </span>
                    </div>
                    <div>
                        <p className="font-medium text-gray-800">
                            {user?.firstName || user?.username || 'Feedback Admin'}
                        </p>
                        <p className="text-sm text-gray-500">Feedback Administrator</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="p-4">
                <ul className="space-y-2">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                        isActive
                                            ? 'bg-emerald-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                    }`
                                }
                            >
                                <span className={navItems.find(n => n.path === item.path)?.path === '/feedback/dashboard' ? 'text-emerald-500' : 'text-gray-400'}>
                                    {item.icon}
                                </span>
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                <div className="text-center">
                    <p className="text-xs text-gray-500">WasteWise Platform</p>
                    <p className="text-xs text-gray-400">Feedback Management System</p>
                </div>
            </div>
        </div>
    );
}
