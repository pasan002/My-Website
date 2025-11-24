# Smart Waste Management System - Unified Frontend

A comprehensive React-based frontend application that integrates all modules of the Smart Waste Management System into a single, unified interface.

## Features

### 🏦 Financial Management
- **Dashboard**: Overview of financial metrics, charts, and reports
- **Expenses**: Track and manage all expenses with categories and document uploads
- **Incomes**: Record and monitor income sources
- **Reports**: Generate detailed financial reports and analytics

### 📅 Event Management
- **Dashboard**: Event overview and statistics
- **Events**: Create, manage, and track events
- **Bookings**: Handle event registrations and attendee management
- **Create Event**: Form to add new events to the system

### 💬 Feedback Management
- **Dashboard**: Feedback and complaint overview
- **Feedbacks**: View and manage user feedback and ratings
- **Complaints**: Track and resolve user complaints

### 🚛 Transport Management
- **Dashboard**: Transport operations overview
- **Bins**: Manage waste bins, locations, and collection status
- **Collectors**: Manage waste collectors and their assignments
- **Trucks**: Fleet management and vehicle tracking

### 👥 User Management
- **Dashboard**: User statistics and overview
- **Users**: Manage system users and their roles
- **Profile**: User profile management and account settings

## Technology Stack

- **React 19** - Latest React with modern features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the unified-frontend directory
3. Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx              # Main layout with navigation
│   └── ui/                     # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Table.tsx
│       ├── Badge.tsx
│       ├── PageHeader.tsx
│       ├── PieChart.tsx
│       └── BarChart.tsx
├── lib/
│   ├── api.ts                  # API configuration
│   └── validation.ts           # Form validation utilities
├── pages/
│   ├── financial/              # Financial management pages
│   ├── event/                  # Event management pages
│   ├── feedback/               # Feedback management pages
│   ├── transport/              # Transport management pages
│   └── user/                   # User management pages
├── App.tsx                     # Main application component
├── main.tsx                    # Application entry point
└── index.css                   # Global styles
```

## Features

### 🎨 Modern UI/UX
- Clean, responsive design
- Consistent component library
- Dark/light theme support
- Mobile-first approach

### 📊 Data Visualization
- Interactive charts and graphs
- Real-time data updates
- Export capabilities
- Comprehensive reporting

### 🔒 Security
- Form validation
- Input sanitization
- Secure API communication
- Role-based access control

### 🚀 Performance
- Fast loading times
- Optimized bundle size
- Lazy loading
- Efficient state management

## API Integration

The frontend integrates with backend APIs for each module:

- **Financial API**: `/api/expenses`, `/api/incomes`, `/api/reports`
- **Event API**: `/api/events`, `/api/bookings`
- **Feedback API**: `/api/feedbacks`, `/api/complaints`
- **Transport API**: `/api/bins`, `/api/collectors`, `/api/trucks`
- **User API**: `/api/users`, `/api/auth`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
