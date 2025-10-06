# Finance Tracker Frontend

Personal Finance Tracker application built with React 18+ featuring role-based access control, analytics dashboard with charts, and transaction management.

## Features

✅ **User Authentication**
- JWT-based authentication
- Role-based access control (Admin, User, Read-only)
- Protected routes
- Persistent login with token

✅ **Dashboard Analytics**
- Interactive charts (Pie, Line, Bar charts using Recharts)
- Monthly/Yearly financial overview
- Category-wise expense breakdown
- Income vs Expense trends

✅ **Transaction Management**
- Add, Edit, Delete transactions (Admin & User only)
- Search and filter transactions
- Infinite scroll pagination
- Category-based organization

✅ **Performance Optimizations**
- React.lazy() for code splitting
- React.Suspense for loading states
- useContext for global state management
- useCallback & useMemo for optimization
- Debounced search
- Caching support

✅ **UI/UX Features**
- Dark/Light theme toggle
- Responsive design
- Loading states
- Empty states
- Error handling
- Role-based UI rendering

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running on http://localhost:5000

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd frontend
```

2. Install dependencies
```bash
npm install
```

3. Create .env file
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start development server
```bash
npm start
```

The app will open at http://localhost:3000

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Navbar.jsx           # Navigation bar with theme toggle
│   │   │   └── ProtectedRoute.jsx   # Route protection HOC
│   │   ├── Auth/
│   │   │   ├── Login.jsx            # Login page with demo credentials
│   │   │   └── Register.jsx         # Registration page
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx        # Main dashboard component
│   │   │   ├── OverviewCard.jsx     # Summary cards
│   │   │   ├── PieChartCard.jsx     # Pie chart for categories
│   │   │   ├── LineChartCard.jsx    # Line chart for trends
│   │   │   └── BarChartCard.jsx     # Bar chart for comparison
│   │   ├── Transactions/
│   │   │   ├── TransactionList.jsx  # Transaction list with infinite scroll
│   │   │   ├── TransactionForm.jsx  # Add/Edit transaction form
│   │   │   └── TransactionFilters.jsx # Filter components
│   │   └── Admin/
│   │       └── UserManagement.jsx   # User management (Admin only)
│   ├── context/
│   │   ├── AuthContext.jsx          # Authentication context
│   │   └── ThemeContext.jsx         # Theme context
│   ├── services/
│   │   └── api.js                   # API service with axios
│   ├── utils/
│   │   └── helpers.js               # Utility functions
│   ├── App.js                       # Main App component with routing
│   ├── App.css                      # Global styles
│   └── index.js                     # Entry point
├── public/
├── package.json
└── .env
```

## Available Scripts

### `npm start`
Runs the app in development mode. Open http://localhost:3000 to view it in the browser.

### `npm run build`
Builds the app for production to the `build` folder.

### `npm test`
Launches the test runner in interactive watch mode.

## Demo Credentials

### Admin Account
- Email: admin@example.com
- Password: password123
- Access: Full access to all features

### User Account
- Email: user@example.com
- Password: password123
- Access: Can manage own transactions

### Read-only Account
- Email: readonly@example.com
- Password: password123
- Access: View-only access

## React Hooks Usage

### useContext
- `AuthContext` - Global authentication state
- `ThemeContext` - Theme management (light/dark mode)

### useCallback
- Event handlers in forms
- Filter change handlers
- Transaction CRUD operations
- Prevents unnecessary re-renders

### useMemo
- Chart data calculations
- Filtered and sorted lists
- Expensive computations (totals, statistics)

### Other Hooks
- `useState` - Component state
- `useEffect` - Side effects, API calls
- `useNavigate` - Programmatic navigation
- `useLocation` - Current route information

## Performance Features

1. **Code Splitting**
   - Lazy loading with React.lazy()
   - Route-based code splitting
   - Suspense boundaries

2. **Optimization**
   - Memoized calculations with useMemo
   - Memoized callbacks with useCallback
   - Debounced search input
   - Infinite scroll for large datasets

3. **Caching**
   - Backend caching with Redis
   - Analytics data cached for 15 minutes
   - Categories cached for 1 hour

## API Endpoints Used

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Transactions
- GET /api/transactions
- GET /api/transactions/:id
- POST /api/transactions
- PUT /api/transactions/:id
- DELETE /api/transactions/:id
- GET /api/transactions/categories

### Analytics
- GET /api/analytics/overview
- GET /api/analytics/category-breakdown
- GET /api/analytics/trends

### Admin
- GET /api/users
- PUT /api/users/:id/role
- DELETE /api/users/:id

## Environment Variables

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Drag and drop build folder to Netlify
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "build", "-p", "3000"]
EXPOSE 3000
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### API Connection Issues
- Ensure backend is running on http://localhost:5000
- Check REACT_APP_API_URL in .env file
- Verify CORS is enabled on backend

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Chart Not Rendering
- Ensure recharts is installed: `npm install recharts`
- Check browser console for errors
- Verify data format matches chart requirements

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@financetracker.com or open an issue in the repository.