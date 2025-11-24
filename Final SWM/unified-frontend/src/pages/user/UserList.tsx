import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function UserList() {
    const users = [
        {
            id: 1,
            name: "John Smith",
            email: "john@example.com",
            role: "Administrator",
            status: "Active",
            lastLogin: "2024-03-15 10:30",
            joinDate: "2023-01-15"
        },
        {
            id: 2,
            name: "Jane Doe",
            email: "jane@example.com",
            role: "Manager",
            status: "Active",
            lastLogin: "2024-03-14 16:45",
            joinDate: "2023-03-20"
        },
        {
            id: 3,
            name: "Bob Johnson",
            email: "bob@example.com",
            role: "User",
            status: "Pending",
            lastLogin: "Never",
            joinDate: "2024-03-10"
        },
        {
            id: 4,
            name: "Alice Brown",
            email: "alice@example.com",
            role: "User",
            status: "Inactive",
            lastLogin: "2024-02-28 14:20",
            joinDate: "2023-06-10"
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader 
                title="User Management" 
               description="Manage system users, their roles, and permissions." 
                actions={
                    <Button>Add New User</Button>
                }
            />

            <Card className="overflow-hidden">
                <CardHeader>
                    <h3 className="font-medium">All Users</h3>
                </CardHeader>
                <CardBody className="p-0">
                    <div className="max-h-96 overflow-auto">
                        <Table>
                            <THead>
                                <tr>
                                    <TH>Name</TH>
                                    <TH>Email</TH>
                                    <TH>Role</TH>
                                    <TH>Status</TH>
                                    <TH>Last Login</TH>
                                    <TH>Join Date</TH>
                                    <TH>Actions</TH>
                                </tr>
                            </THead>
                            <TBody>
                                {users.map(user => (
                                    <TR key={user.id} className="hover:bg-emerald-50">
                                        <TD className="font-medium">{user.name}</TD>
                                        <TD>{user.email}</TD>
                                        <TD>
                                            <Badge variant={
                                                user.role === 'Administrator' ? 'danger' : 
                                                user.role === 'Manager' ? 'warning' : 'default'
                                            }>
                                                {user.role}
                                            </Badge>
                                        </TD>
                                        <TD>
                                            <Badge variant={
                                                user.status === 'Active' ? 'success' : 
                                                user.status === 'Pending' ? 'warning' : 'default'
                                            }>
                                                {user.status}
                                            </Badge>
                                        </TD>
                                        <TD>{user.lastLogin}</TD>
                                        <TD>{user.joinDate}</TD>
                                        <TD>
                                            <Button size="sm" variant="secondary" className="mr-2">Edit</Button>
                                            <Button size="sm" variant="danger">Delete</Button>
                                        </TD>
                                    </TR>
                                ))}
                            </TBody>
                        </Table>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
