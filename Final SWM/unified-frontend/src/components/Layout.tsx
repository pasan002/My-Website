import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
	`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
		isActive
			? 'bg-emerald-600 text-white'
			: 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
	}`;

export default function Layout() {
    // Remove all header/nav logic—just render the outlet for now
    return <Outlet />;
}
