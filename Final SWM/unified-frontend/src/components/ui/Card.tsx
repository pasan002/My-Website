import { type HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div className={`rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow ${className}`} {...props} />;
}

export function CardHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div className={`border-b px-5 py-4 ${className}`} {...props} />;
}

export function CardBody({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div className={`px-5 py-5 ${className}`} {...props} />;
}
