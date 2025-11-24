# Backend Setup Guide

## MongoDB Atlas Configuration

### Step 1: Update MongoDB Connection String

You need to replace `YOUR_ACTUAL_PASSWORD` in the connection string with your real MongoDB Atlas password.

**Current connection string:**
```
mongodb+srv://achi:YOUR_ACTUAL_PASSWORD@cluster0.gpd2z4o.mongodb.net/smart_waste_management?retryWrites=true&w=majority&appName=Cluster0
```

**What you need to do:**
1. Replace `YOUR_ACTUAL_PASSWORD` with your actual MongoDB Atlas password
2. The password should be URL-encoded if it contains special characters

### Step 2: Test the Connection

Run the test script to verify your connection:

```bash
# First, update the password in test-connection.js
# Then run:
node test-connection.js
```

### Step 3: Start the Backend Server

Once the connection test passes, start the server:

```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

## Environment Variables (Optional)

You can also set environment variables instead of hardcoding:

### Windows (Command Prompt):
```cmd
set MONGODB_URI=mongodb+srv://achi:YOUR_PASSWORD@cluster0.gpd2z4o.mongodb.net/smart_waste_management?retryWrites=true&w=majority&appName=Cluster0
set JWT_SECRET=your_jwt_secret_here
set PORT=5000
npm run dev
```

### Windows (PowerShell):
```powershell
$env:MONGODB_URI="mongodb+srv://achi:YOUR_PASSWORD@cluster0.gpd2z4o.mongodb.net/smart_waste_management?retryWrites=true&w=majority&appName=Cluster0"
$env:JWT_SECRET="your_jwt_secret_here"
$env:PORT="5000"
npm run dev
```

### Linux/Mac:
```bash
export MONGODB_URI="mongodb+srv://achi:YOUR_PASSWORD@cluster0.gpd2z4o.mongodb.net/smart_waste_management?retryWrites=true&w=majority&appName=Cluster0"
export JWT_SECRET="your_jwt_secret_here"
export PORT="5000"
npm run dev
```

## Troubleshooting

### Authentication Failed Error
- **Problem**: `MongoServerError: bad auth : authentication failed`
- **Solution**: Check your username and password in MongoDB Atlas
- **Check**: Make sure the user `achi` exists and has the correct password

### Connection Timeout
- **Problem**: Connection timeout or ECONNREFUSED
- **Solution**: Check your internet connection and MongoDB Atlas cluster status
- **Check**: Verify the cluster is running in MongoDB Atlas dashboard

### Network Access
- **Problem**: IP not whitelisted
- **Solution**: Add your IP address to MongoDB Atlas Network Access
- **Quick Fix**: Add `0.0.0.0/0` to allow all IPs (for development only)

## API Testing

Once the server is running, you can test the API:

### Health Check
```bash
curl http://localhost:5000/health
```

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

## Next Steps

1. ✅ Update the MongoDB password in the connection string
2. ✅ Test the connection with `node test-connection.js`
3. ✅ Start the server with `npm run dev`
4. ✅ Test the API endpoints
5. ✅ Connect the frontend to the backend

## Support

If you encounter any issues:
1. Check the MongoDB Atlas dashboard for cluster status
2. Verify your network access settings
3. Check the server logs for detailed error messages
4. Ensure all dependencies are installed with `npm install`
