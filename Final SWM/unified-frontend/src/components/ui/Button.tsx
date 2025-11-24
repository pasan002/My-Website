import { type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
}

const base = 'inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<ButtonVariant, string> = {
	primary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-600',
	secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400',
	ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300',
	danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
};

const sizes: Record<ButtonSize, string> = {
	sm: 'px-2 py-1 text-sm',
	md: 'px-3 py-2 text-sm',
	lg: 'px-4 py-2 text-base',
};

export default function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
	return (
		<button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
	);
}
