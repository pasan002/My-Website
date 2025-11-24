import { type HTMLAttributes, type TableHTMLAttributes, type ThHTMLAttributes, type TdHTMLAttributes } from 'react';

export function Table({ className = '', ...props }: TableHTMLAttributes<HTMLTableElement>) {
	return <table className={`min-w-full text-sm ${className}`} {...props} />;
}

export function THead({ className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) {
	return <thead className={`text-left text-gray-600 bg-gray-50 sticky top-0 ${className}`} {...props} />;
}

export function TBody({ className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) {
	return <tbody className={`divide-y divide-gray-100 ${className}`} {...props} />;
}

export function TR({ className = '', ...props }: HTMLAttributes<HTMLTableRowElement>) {
	return <tr className={`odd:bg-white even:bg-gray-50 ${className}`} {...props} />;
}

export function TH({ className = '', ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
	return <th className={`py-3 pr-4 font-semibold ${className}`} {...props} />;
}

export function TD({ className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
	return <td className={`py-3 pr-4 ${className}`} {...props} />;
}
