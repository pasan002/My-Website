import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function FinancialSidebar() {
    const { user } = useAuth();

    const navItems = [
        {
            path: '/financial/dashboard',
            label: 'Dashboard',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                </svg>
            )
        },
        {
            path: '/financial/expenses',
            label: 'Expenses',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
            )
        },
        {
            path: '/financial/incomes',
            label: 'Income',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            path: '/financial/reports',
            label: 'Reports',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        }
    ];

    return (
        <div className="w-64 bg-white shadow-lg h-full">
            {/* Main Title (no app logo block) */}
            <div className="p-6">
                <h2 className="text-2xl font-bold text-emerald-700">Financial Management</h2>
            </div>

            {/* User Profile Section */}
            <div className="px-6 pb-6">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-emerald-600 font-semibold text-lg">
                            {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'F'}
                        </span>
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">
                            {user?.firstName || user?.username || 'Financial Admin'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {user?.lastName || 'Administrator'}
                        </p>
                    </div>
                </div>
            </div>
            {/* Navigation Links */}
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
                        <span className={navItems.find(nav => nav.path === item.path)?.path === item.path ? 'text-white' : 'text-emerald-600'}>
                            {/* All icons updated to use green (emerald-600) when active, gray when not */}
                            {item.label === 'Dashboard' && (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <rect x="3" y="11" width="6" height="9" rx="2" className="fill-current" />
                                    <rect x="15" y="7" width="6" height="13" rx="2" className="fill-current" />
                                    <rect x="9" y="3" width="6" height="17" rx="2" className="fill-current" />
                                </svg>
                            )}
                            {item.label === 'Expenses' && (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" className="stroke-current" />
                                </svg>
                            )}
                            {item.label === 'Income' && (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" className="stroke-current" />
                                </svg>
                            )}
                            {item.label === 'Reports' && (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="stroke-current" />
                                </svg>
                            )}
                        </span>
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
