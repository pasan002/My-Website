import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import api from '../../lib/api';
import { validateDate, validateAmount, validateCategory, validateDescription, validateFile, validateForm } from '../../lib/validation';

const INCOME_CATEGORIES = [
	'service_fees',
	'waste_collection',
	'recycling_revenue',
	'government_grants',
	'donations',
	'sponsorships',
	'consulting',
	'equipment_sales',
	'rental_income',
	'penalties',
	'licensing',
	'training_fees',
	'other'
];

type Income = {
	_id?: string;
	title: string;
	description: string;
	amount: number;
	currency: string;
	category: string;
	source: string;
	date: string;
	status: string;
	paymentMethod: string;
	client?: {
		name: string;
		type: string;
	};
	taxAmount?: number;
	invoiceId?: string;
};

// const TARGET_KEY = 'finance_income_target_v1'; // Removed for mock data

export default function FinancialIncomes() {
	const [items, setItems] = useState<Income[]>([]);
	const [editing, setEditing] = useState<Income | null>(null);
	const [target, setTarget] = useState<number>(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [query, setQuery] = useState('');
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [formData, setFormData] = useState({
		title: '',
		description: '',
		amount: '',
		category: '',
		source: '',
		date: '',
		paymentMethod: 'cash',
		clientName: '',
		clientType: 'individual',
		taxAmount: '',
		invoiceId: '',
		document: null as File | null,
	});

	useEffect(() => {
		loadIncomes();
	}, []);

	const loadIncomes = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await api.get('/incomes');
			setItems(response.data.data.incomes);
		} catch (error: any) {
			console.error('Error loading incomes:', error);
			setError(error.response?.data?.message || 'Failed to load incomes');
		} finally {
			setLoading(false);
		}
	};

	const totals = useMemo(() => {
		const now = new Date();
		const month = now.getMonth();
		const year = now.getFullYear();
		let monthly = 0;
		let yearly = 0;
		for (const it of items) {
			const d = new Date(it.date);
			if (d.getFullYear() === year) {
				yearly += it.amount;
				if (d.getMonth() === month) monthly += it.amount;
			}
		}
		return { monthly, yearly };
	}, [items]);

	const progress = target > 0 ? Math.min(100, (totals.monthly / target) * 100) : 0;

	const filteredItems = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return items;
		return items.filter(it => {
			const dateStr = String(it.date).slice(0,10);
			const fields = [
				dateStr,
				it.title || '',
				it.category || '',
				it.description || '',
				it.source || '',
				it.client?.name || '',
				String(it.amount ?? ''),
				it.status || '',
				it.paymentMethod || ''
			].join(' ').toLowerCase();
			return fields.includes(q);
		});
	}, [items, query]);

	function resetForm() { 
		setEditing(null);
		setFormData({
			title: '',
			description: '',
			amount: '',
			category: '',
			source: '',
			date: '',
			paymentMethod: 'cash',
			clientName: '',
			clientType: 'individual',
			taxAmount: '',
			invoiceId: '',
			document: null,
		});
		setFormErrors({});
	}

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setSuccess(null);
		setFormErrors({});

		// Validate form data
		const validationRules = {
			title: [validateDescription],
			description: [validateDescription],
			amount: [validateAmount],
			category: [(value: string) => validateCategory(value, INCOME_CATEGORIES)],
			source: [(value: string) => value ? { isValid: true } : { isValid: false, message: 'Source is required' }],
			date: [(value: string) => validateDate(value, true)], // Allow future dates for incomes
			paymentMethod: [(value: string) => value ? { isValid: true } : { isValid: false, message: 'Payment method is required' }],
			clientName: [(value: string) => value ? { isValid: true } : { isValid: false, message: 'Client name is required' }],
			document: [(value: File | null) => validateFile(value, { maxSize: 10, allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'], required: false })],
		};

		const errors = validateForm(formData, validationRules);
		if (Object.keys(errors).length > 0) {
			setFormErrors(errors);
			return;
		}

		try {
			const isEditing = Boolean(editing?._id);
			const incomeData = {
				title: formData.title,
				description: formData.description,
				amount: Number(formData.amount),
				category: formData.category,
				source: formData.source,
				date: formData.date,
				paymentMethod: formData.paymentMethod,
				client: {
					name: formData.clientName,
					type: formData.clientType
				},
				taxAmount: formData.taxAmount ? Number(formData.taxAmount) : 0,
				invoiceId: formData.invoiceId || undefined
			};

			if (isEditing && editing?._id) {
				// Update existing income
				await api.put(`/incomes/${editing._id}`, incomeData);
			} else {
				// Add new income
				await api.post('/incomes', incomeData);
			}

			// Reload incomes
			await loadIncomes();
			
			// Success
			resetForm();
			setSuccess('Income ' + (isEditing ? 'updated' : 'added') + ' successfully');
			setTimeout(() => setSuccess(null), 3000);
		} catch (err: any) {
			console.error('Error saving income:', err);
			setError(err.response?.data?.message || 'Save failed');
		}
	}

	function onEdit(it: Income) { 
		setEditing(it);
		setFormData({
			title: it.title || '',
			description: it.description || '',
			amount: String(it.amount || ''),
			category: it.category || '',
			source: it.source || '',
			date: it.date?.slice(0, 10) || '',
			paymentMethod: it.paymentMethod || 'cash',
			clientName: it.client?.name || '',
			clientType: it.client?.type || 'individual',
			taxAmount: String(it.taxAmount || ''),
			invoiceId: it.invoiceId || '',
			document: null,
		});
		setFormErrors({});
	}

	async function onDelete(id?: string) {
		if (!id) return;
		setError(null);
		try {
			await api.delete(`/incomes/${id}`);
			await loadIncomes();
			if (editing?._id === id) resetForm();
			setSuccess('Income deleted successfully');
			setTimeout(() => setSuccess(null), 3000);
		} catch (err: any) {
			console.error('Error deleting income:', err);
			setError(err.response?.data?.message || 'Delete failed');
		}
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Incomes"
				description="Add, view, edit, and delete income records with categories and uploads."
				actions={
					<div className="flex items-center gap-2">
						<input
							className="w-40 rounded border px-3 py-2 text-sm"
							type="number"
							placeholder="Monthly target (LKR)"
							value={target || ''}
							onChange={e => setTarget(parseFloat(e.target.value) || 0)}
						/>
						<Badge variant="success">{target > 0 ? `Progress: ${progress.toFixed(0)}%` : 'No target set'}</Badge>
					</div>
				}
			/>

			<Card>
				<CardHeader>
					<h3 className="font-medium">{editing ? 'Edit Income' : 'Add Income'}</h3>
				</CardHeader>
				<CardBody>
					{success ? (
						<div className="mb-3 rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
							{success}
						</div>
					) : null}
					<form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
						<Input
							name="title"
							label="Title"
							type="text"
							required
							placeholder="e.g., Service fees collected"
							value={formData.title}
							onChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
							validation={[validateDescription]}
							error={formErrors.title}
						/>
						<Input
							name="amount"
							label="Amount (LKR)"
							type="number"
							required
							step="0.01"
							min="0"
							value={formData.amount}
							onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
							validation={[validateAmount]}
							error={formErrors.amount}
						/>
						<Select
							name="category"
							label="Category"
							required
							value={formData.category}
							onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
							options={INCOME_CATEGORIES.map(cat => ({ 
								value: cat, 
								label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')
							}))}
							validation={[(value: string) => validateCategory(value, INCOME_CATEGORIES)]}
							error={formErrors.category}
						/>
						<Input
							name="source"
							label="Source"
							type="text"
							required
							placeholder="e.g., ABC Company"
							value={formData.source}
							onChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
							error={formErrors.source}
						/>
						<Input
							name="date"
							label="Date"
							type="date"
							required
							value={formData.date}
							onChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
							validation={[(value: string) => validateDate(value, true)]}
							error={formErrors.date}
						/>
						<Select
							name="paymentMethod"
							label="Payment Method"
							required
							value={formData.paymentMethod}
							onChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
							options={[
								{ value: 'cash', label: 'Cash' },
								{ value: 'bank_transfer', label: 'Bank Transfer' },
								{ value: 'cheque', label: 'Cheque' },
								{ value: 'online_payment', label: 'Online Payment' },
								{ value: 'other', label: 'Other' }
							]}
							error={formErrors.paymentMethod}
						/>
						<Input
							name="clientName"
							label="Client Name"
							type="text"
							required
							placeholder="e.g., John Doe"
							value={formData.clientName}
							onChange={(value) => setFormData(prev => ({ ...prev, clientName: value }))}
							error={formErrors.clientName}
						/>
						<Select
							name="clientType"
							label="Client Type"
							required
							value={formData.clientType}
							onChange={(value) => setFormData(prev => ({ ...prev, clientType: value }))}
							options={[
								{ value: 'individual', label: 'Individual' },
								{ value: 'business', label: 'Business' },
								{ value: 'government', label: 'Government' },
								{ value: 'ngo', label: 'NGO' }
							]}
						/>
						<Input
							name="taxAmount"
							label="Tax Amount (LKR)"
							type="number"
							step="0.01"
							min="0"
							placeholder="0.00"
							value={formData.taxAmount}
							onChange={(value) => setFormData(prev => ({ ...prev, taxAmount: value }))}
						/>
						<Input
							name="invoiceId"
							label="Invoice ID"
							type="text"
							placeholder="e.g., INV-2024-001"
							value={formData.invoiceId}
							onChange={(value) => setFormData(prev => ({ ...prev, invoiceId: value }))}
						/>
						<Input
							name="description"
							label="Description"
							type="text"
							placeholder="Additional details"
							value={formData.description}
							onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
							validation={[validateDescription]}
							error={formErrors.description}
						/>
						<div className="md:col-span-2">
							<label className="block text-sm text-gray-700">
								Upload Document (optional)
							</label>
							<input 
								name="document" 
								className={`mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 ${
									formErrors.document 
										? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
										: 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
								}`}
								type="file" 
								accept=".pdf,.jpg,.jpeg,.png"
								onChange={(e) => {
									const file = e.target.files?.[0] || null;
									setFormData(prev => ({ ...prev, document: file }));
									// Clear error on change
									if (formErrors.document) {
										setFormErrors(prev => ({ ...prev, document: '' }));
									}
								}}
							/>
							{formErrors.document && (
								<p className="mt-1 text-sm text-red-600">{formErrors.document}</p>
							)}
							{editing?.invoiceId ? <p className="mt-1 text-xs text-gray-500">Current: {editing.invoiceId}</p> : null}
						</div>
						<div className="md:col-span-2 flex items-center gap-2">
							<Button type="submit">{editing ? 'Save Changes' : 'Add Income'}</Button>
							{editing ? <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button> : null}
						</div>
					</form>
				</CardBody>
			</Card>

			<Card className="overflow-hidden">
				<CardHeader className="flex items-center justify-between">
					<h3 className="font-medium">Records</h3>
					<div className="flex items-center gap-3">
						<input
							className="w-56 rounded border px-3 py-2 text-sm"
							placeholder="Search by title, category, source, client, amount, status"
							value={query}
							onChange={e => setQuery(e.target.value)}
						/>
						<div className="text-sm text-gray-600">This month: LKR {totals.monthly.toFixed(2)} • Year: LKR {totals.yearly.toFixed(2)}</div>
					</div>
				</CardHeader>
				<CardBody className="p-0">
					<div className="max-h-96 overflow-auto">
						<Table>
							<THead>
								<tr>
									<TH>Date</TH>
									<TH>Title</TH>
									<TH>Category</TH>
									<TH>Source</TH>
									<TH>Client</TH>
									<TH>Amount (LKR)</TH>
									<TH>Status</TH>
									<TH>Actions</TH>
								</tr>
							</THead>
							<TBody>
								{loading ? (
									<TR><TD className="py-6 text-center" colSpan={8}>Loading...</TD></TR>
								) : filteredItems.length === 0 ? (
									<TR>
										<TD className="py-6 text-center text-gray-500" colSpan={8}>{items.length === 0 ? 'No incomes yet.' : 'No matching results.'}</TD>
									</TR>
								) : (
									filteredItems.map(it => (
										<TR key={it._id} className="hover:bg-emerald-50">
											<TD>{String(it.date).slice(0,10)}</TD>
											<TD>{it.title}</TD>
											<TD><Badge>{it.category.charAt(0).toUpperCase() + it.category.slice(1).replace('_', ' ')}</Badge></TD>
											<TD>{it.source}</TD>
											<TD>{it.client?.name || '-'}</TD>
											<TD>LKR {Number(it.amount).toFixed(2)}</TD>
											<TD>
												<Badge variant={it.status === 'received' ? 'success' : it.status === 'confirmed' ? 'warning' : 'danger'}>
													{it.status.charAt(0).toUpperCase() + it.status.slice(1)}
												</Badge>
											</TD>
											<TD>
												<Button size="sm" variant="secondary" className="mr-2" onClick={() => onEdit(it)}>Edit</Button>
												<Button size="sm" variant="danger" onClick={() => onDelete(it._id as string)}>Delete</Button>
											</TD>
										</TR>
									))
								)}
							</TBody>
						</Table>
					</div>
				</CardBody>
			</Card>
			{error ? <p className="text-sm text-red-600">{error}</p> : null}
		</div>
	);
}
