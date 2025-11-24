import { useMemo, useState, useEffect } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../lib/api';

type Reply = { _id: string; admin: string; text: string; date: string };
type Feedback = {
    _id: string;
    name: string;
    email: string;
    rating: number;
    comment: string;
    category: string;
    status: string;
    date: string;
    replies?: Reply[];
};

export default function FeedbackList() {
    const [items, setItems] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [ratingFilter, setRatingFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replyAdmin, setReplyAdmin] = useState('Admin');

    useEffect(() => {
        loadFeedbacks();
    }, []);

    const loadFeedbacks = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/feedbacks');
            setItems(response.data.data.feedbacks);
        } catch (error: any) {
            console.error('Error loading feedbacks:', error);
            setError(error.response?.data?.message || 'Failed to load feedbacks');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        return items
            .filter((f) => (ratingFilter === 'all' ? true : f.rating === Number(ratingFilter)))
            .filter((f) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                return (
                    f.name.toLowerCase().includes(q) ||
                    f.email.toLowerCase().includes(q) ||
                    f.comment.toLowerCase().includes(q) ||
                    f.date.includes(q)
                );
            })
            .sort((a, b) => (a.date < b.date ? 1 : -1));
    }, [items, search, ratingFilter]);

    function handleDelete(id: string) {
        if (!confirm('Delete this feedback?')) return;
        
        api.delete(`/feedbacks/${id}`)
            .then(() => {
                setItems(prev => prev.filter(f => f._id !== id));
            })
            .catch(error => {
                console.error('Error deleting feedback:', error);
                alert('Failed to delete feedback');
            });
    }

    function handleReplySend(id: string) {
        if (!replyText.trim() || !replyAdmin.trim()) return;
        
        api.post(`/feedbacks/${id}/reply`, {
            admin: replyAdmin,
            text: replyText
        })
        .then(() => {
            // Reload feedbacks to get updated data
            loadFeedbacks();
            setReplyText('');
            setReplyingTo(null);
        })
        .catch(error => {
            console.error('Error sending reply:', error);
            alert('Failed to send reply');
        });
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Feedback List" 
                description="View and manage all user feedback and ratings." 
            />

            <Card className="overflow-hidden">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <h3 className="font-medium">All Feedback</h3>
                        <div className="flex items-center gap-3">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, email, message, date..."
                                className="w-64 rounded border px-3 py-2 text-sm"
                            />
                            <select
                                value={ratingFilter}
                                onChange={(e) => setRatingFilter(e.target.value as any)}
                                className="rounded border px-3 py-2 text-sm"
                            >
                                <option value="all">All ratings</option>
                                <option value="5">5 stars</option>
                                <option value="4">4 stars</option>
                                <option value="3">3 stars</option>
                                <option value="2">2 stars</option>
                                <option value="1">1 star</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="p-4">
                    {loading ? (
                        <div className="py-10 text-center text-gray-500">Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-10 text-center text-gray-500">{items.length === 0 ? 'No feedback yet.' : 'No matching results.'}</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((feedback) => (
                                <div key={feedback._id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="h-40 bg-gradient-to-r from-emerald-50 to-sky-50 flex items-center justify-center">
                                        <div className="text-3xl">💬</div>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-semibold text-gray-900">{feedback.name}</div>
                                                <div className="text-sm text-gray-500">{feedback.email}</div>
                                            </div>
                                            <Badge variant={feedback.status === 'reviewed' || feedback.status === 'resolved' ? 'success' : 'warning'}>
                                                {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={`text-lg ${i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}>⭐</span>
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-700 line-clamp-3" title={feedback.comment}>{feedback.comment}</p>
                                        <div className="text-xs text-gray-500">{new Date(feedback.date).toLocaleDateString()}</div>
                                        {replyingTo === feedback._id ? (
                                            <div className="mt-2 space-y-2">
                                                <input value={replyAdmin} onChange={(e) => setReplyAdmin(e.target.value)} placeholder="Admin name" className="w-full rounded border px-2 py-1 text-sm" />
                                                <div className="flex items-center gap-2">
                                                    <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..." className="flex-1 rounded border px-2 py-1 text-sm" />
                                                    <Button size="sm" onClick={() => handleReplySend(feedback._id)}>Send</Button>
                                                    <Button size="sm" variant="secondary" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 pt-1">
                                                <Button size="sm" variant="secondary" onClick={() => setReplyingTo(feedback._id)}>Reply</Button>
                                                <Button size="sm" variant="danger" onClick={() => handleDelete(feedback._id)}>Delete</Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
