import { type HTMLAttributes } from 'react';

interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
	title: string;
	description?: string;
	actions?: React.ReactNode;
}

export default function PageHeader({ title, description, actions, className = '', ...props }: PageHeaderProps) {
	return (
		<div className={`mb-4 flex items-start justify-between ${className}`} {...props}>
			<div>
				<h2 className="text-2xl font-semibold">{title}</h2>
				{description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
			</div>
			{actions ? <div className="flex items-center gap-2">{actions}</div> : null}
		</div>
	);
}
