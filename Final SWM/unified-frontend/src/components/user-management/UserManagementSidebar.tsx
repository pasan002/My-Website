import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, ClipboardList } from 'lucide-react';

export default function UserManagementSidebar() {
    const { user } = useAuth();
    const navItems = [
        {
            path: '/user-management/dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard className="h-5 w-5" />
        },
        {
            path: '/user-management/requests',
            label: 'Waste Requests',
            icon: <ClipboardList className="h-5 w-5" />
        },
    ];

    return (
        <div className="w-64 bg-white shadow-lg h-full">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-emerald-700">User Management</h2>
            </div>
            <div className="px-6 pb-6">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-emerald-600 font-semibold text-lg">
                            {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                        </span>
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">
                            {user?.firstName || user?.username || 'User Admin'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {user?.lastName || 'Administrator'}
                        </p>
                    </div>
                </div>
            </div>
            <nav className="px-4 pb-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                                isActive
                                    ? 'bg-emerald-600 text-white'
                                    : 'text-gray-700 hover:bg-emerald-100'
                            }`
                        }
                    >
                        <span className="text-emerald-600 group-hover:text-white">
                            {item.icon}
                        </span>
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
