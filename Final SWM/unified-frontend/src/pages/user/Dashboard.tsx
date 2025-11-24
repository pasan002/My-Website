import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';

export default function UserDashboard() {
    return (
        <div className="space-y-6">
            <PageHeader 
                title="User Management Dashboard" 
                description="Overview of users, roles, and user management activities." 
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="font-medium">👥 Total Users</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="text-3xl font-bold text-blue-600">1,245</div>
                        <p className="text-sm text-gray-500">Registered users</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="font-medium">👤 Active Users</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="text-3xl font-bold text-green-600">1,180</div>
                        <p className="text-sm text-gray-500">This month</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="font-medium">🔐 Admin Users</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="text-3xl font-bold text-purple-600">8</div>
                        <p className="text-sm text-gray-500">System administrators</p>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="font-medium">📧 New Signups</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="text-3xl font-bold text-orange-600">45</div>
                        <p className="text-sm text-gray-500">This week</p>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="font-medium">Recent Users</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <div>
                                    <h4 className="font-medium">John Smith</h4>
                                    <p className="text-sm text-gray-500">john@example.com</p>
                                </div>
                                <span className="text-green-600">✅ Active</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                <div>
                                    <h4 className="font-medium">Jane Doe</h4>
                                    <p className="text-sm text-gray-500">jane@example.com</p>
                                </div>
                                <span className="text-yellow-600">⏳ Pending</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div>
                                    <h4 className="font-medium">Bob Johnson</h4>
                                    <p className="text-sm text-gray-500">bob@example.com</p>
                                </div>
                                <span className="text-blue-600">🆕 New</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="font-medium">User Roles</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <div>
                                    <h4 className="font-medium">Administrators</h4>
                                    <p className="text-sm text-gray-500">Full system access</p>
                                </div>
                                <span className="text-purple-600">8 users</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div>
                                    <h4 className="font-medium">Managers</h4>
                                    <p className="text-sm text-gray-500">Department management</p>
                                </div>
                                <span className="text-blue-600">25 users</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <div>
                                    <h4 className="font-medium">Regular Users</h4>
                                    <p className="text-sm text-gray-500">Basic system access</p>
                                </div>
                                <span className="text-green-600">1,212 users</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
