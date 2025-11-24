import { type HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
	default: 'bg-gray-200 text-gray-800',
	success: 'bg-green-100 text-green-800',
	warning: 'bg-yellow-100 text-yellow-800',
	danger: 'bg-red-100 text-red-800',
};

export default function Badge({ variant = 'default', className = '', ...props }: BadgeProps) {
	return <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${variants[variant]} ${className}`} {...props} />;
}
