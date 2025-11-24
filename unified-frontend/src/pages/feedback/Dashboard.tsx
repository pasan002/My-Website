import { useState, useEffect } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../lib/api';

type Feedback = {
    _id: string;
    name: string;
    email: string;
    rating: number;
    comment: string;
    category: string;
    status: string;
    date: string;
};

type Complaint = {
    _id: string;
    name: string;
    email: string;
    issueType: string;
    priority: string;
    problem: string;
    status: string;
    date: string;
};

type DashboardData = {
    totalFeedbacks: number;
    totalComplaints: number;
    averageRating: number;
    pendingComplaints: number;
    resolvedComplaints: number;
    recentFeedbacks: Feedback[];
    recentComplaints: Complaint[];
};

export default function FeedbackDashboard() {
    const [data, setData] = useState<DashboardData>({
        totalFeedbacks: 0,
        totalComplaints: 0,
        averageRating: 0,
        pendingComplaints: 0,
        resolvedComplaints: 0,
        recentFeedbacks: [],
        recentComplaints: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load feedbacks summary
            const feedbacksResponse = await api.get('/feedbacks/summary');
            const feedbacksData = feedbacksResponse.data.data;

            // Load complaints summary
            const complaintsResponse = await api.get('/complaints/summary');
            const complaintsData = complaintsResponse.data.data;

            // Load recent feedbacks
            const recentFeedbacksResponse = await api.get('/feedbacks?limit=3');
            const recentFeedbacks = recentFeedbacksResponse.data.data.feedbacks;

            // Load recent complaints
            const recentComplaintsResponse = await api.get('/complaints?limit=3');
            const recentComplaints = recentComplaintsResponse.data.data.complaints;

            // Calculate statistics
            const pendingComplaints = complaintsData.statusDistribution.find((s: any) => s._id === 'pending')?.count || 0;
            const resolvedComplaints = complaintsData.statusDistribution.find((s: any) => s._id === 'resolved')?.count || 0;

            setData({
                totalFeedbacks: feedbacksData.totalFeedbacks,
                totalComplaints: complaintsData.totalComplaints,
                averageRating: feedbacksData.averageRating,
                pendingComplaints,
                resolvedComplaints,
                recentFeedbacks,
                recentComplaints
            });
        } catch (error: any) {
            console.error('Error loading dashboard data:', error);
            setError(error.response?.data?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex">
                {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ⭐
                    </span>
                ))}
            </div>
        );
    };

    const downloadPdf = () => {
        const docTitle = 'Feedback & Complaint Analysis';
        const now = new Date().toLocaleString();

        // Build a print-friendly HTML using current state
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${docTitle}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111827; }
    h1 { margin: 0 0 4px 0; font-size: 22px; }
    .muted { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    .label { color: #6b7280; font-size: 12px; }
    .value { font-size: 20px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
    th { background: #f3f4f6; }
  </style>
</head>
<body>
  <h1>${docTitle}</h1>
  <div class="muted">Generated on ${now}</div>
  <div class="grid">
    <div class="card"><div class="label">Total Feedbacks</div><div class="value">${data.totalFeedbacks}</div></div>
    <div class="card"><div class="label">Average Rating</div><div class="value">${data.averageRating.toFixed(1)}</div></div>
    <div class="card"><div class="label">Pending Complaints</div><div class="value">${data.pendingComplaints}</div></div>
    <div class="card"><div class="label">Resolved Complaints</div><div class="value">${data.resolvedComplaints}</div></div>
  </div>

  <h2 style="margin-top:20px; font-size:16px;">Recent Feedback</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Rating</th>
        <th>Comment</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${data.recentFeedbacks.map(f => `
        <tr>
          <td>${f.name}</td>
          <td>${f.email}</td>
          <td>${f.rating}</td>
          <td>${(f.comment || '').replace(/</g,'&lt;')}</td>
          <td>${new Date(f.date).toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2 style="margin-top:20px; font-size:16px;">Recent Complaints</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Issue Type</th>
        <th>Priority</th>
        <th>Status</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${data.recentComplaints.map(c => `
        <tr>
          <td>${c.name}</td>
          <td>${c.email}</td>
          <td>${c.issueType}</td>
          <td>${c.priority}</td>
          <td>${c.status}</td>
          <td>${new Date(c.date).toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <script>
    window.onload = function() {
      window.print();
      setTimeout(() => window.close(), 500);
    };
  </script>
</body>
</html>`;

        const w = window.open('', '_blank');
        if (!w) return;
        w.document.open();
        w.document.write(html);
        w.document.close();
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader 
                    title="Feedback Management Dashboard" 
                    description="Overview of feedback, complaints, and user interactions." 
                />
                <div className="text-center py-8">
                    <div className="text-gray-500">Loading dashboard data...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <PageHeader 
                    title="Feedback Management Dashboard" 
                    description="Overview of feedback, complaints, and user interactions." 
                />
                <div className="text-center py-8">
                    <div className="text-red-500">Error: {error}</div>
                    <button 
                        onClick={loadDashboardData}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Feedback Management Dashboard" 
                description="Overview of feedback, complaints, and user interactions." 
                actions={
                    <Button onClick={downloadPdf} className="flex items-center">
                        Download PDF
                    </Button>
                }
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="font-medium">💬 Total Feedback</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="text-3xl font-bold text-blue-600">{data.totalFeedbacks}</div>
                        <p className="text-sm text-gray-500">All time</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="font-medium">⚠️ Complaints</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="text-3xl font-bold text-red-600">{data.pendingComplaints}</div>
                        <p className="text-sm text-gray-500">Pending resolution</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="font-medium">✅ Resolved</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="text-3xl font-bold text-green-600">{data.resolvedComplaints}</div>
                        <p className="text-sm text-gray-500">Resolved complaints</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="font-medium">⭐ Rating</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="text-3xl font-bold text-yellow-600">{data.averageRating.toFixed(1)}</div>
                        <p className="text-sm text-gray-500">Average rating</p>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="font-medium">Recent Feedback</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {data.recentFeedbacks.length > 0 ? (
                                data.recentFeedbacks.map((feedback) => (
                                    <div key={feedback._id} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">{feedback.name}</h4>
                                            {renderStars(feedback.rating)}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{feedback.comment}</p>
                                        <p className="text-xs text-gray-500 mt-2">- {feedback.email}, {formatDate(feedback.date)}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-500">
                                    No feedback yet
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="font-medium">Recent Complaints</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            {data.recentComplaints.length > 0 ? (
                                data.recentComplaints.map((complaint) => (
                                    <div key={complaint._id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                                        <h4 className="font-medium text-red-800">{complaint.issueType}</h4>
                                        <p className="text-sm text-red-600 mt-1">{complaint.problem}</p>
                                        <p className="text-xs text-red-500 mt-2">- {complaint.name}, {formatDate(complaint.date)}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-500">
                                    No complaints yet
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}