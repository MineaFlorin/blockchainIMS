
import express from 'express';
import morgan from 'morgan';
import session from 'express-session';
import logging from './middleware/logging.js';
import items from './routes/items.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import mobileApi from './api/mobileApi.js'; // Import the mobile API routes
import logger from './logger.js';
import connectDB from './config/db.js';
// Import the full db.js file to ensure everything is loaded (including environment variables)
import './config/db.js'; // This ensures the db file is executed, including environment variable loading and logging
import fabricRoutes from './routes/fabricRoutes.js';



import { registerAndEnrollAdmin } from './adminuser/registerAndEnrollAdmin.js';

// Call the function to register and enroll the admin user when starting the app
registerAndEnrollAdmin()
    .then(() => {
        console.log("Admin registration and enrollment completed.");
    })
    .catch((error) => {
        console.error("Error in registration and enrollment:", error);
    });




const app = express();
app.use(logging); // Middleware - used to show concept
app.use(morgan('dev')); // Logs requests to the console
app.use(express.static('public'));
app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

// Mobile API route
app.use('/api/mobile', mobileApi); // Mount the mobile API router at /api/mobile
app.use('/fabric', fabricRoutes);

// Auth and Dashboard routes
app.use('/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/items', items);

// Error handler
app.use((err, req, res, next) => {
    logger.error(err.message);
    res.status(err.status || 500).send('Something went wrong!');
});

const startServer = async () => {
    try {
        await connectDB(); // Connect to MongoDB or other database
        const PORT = process.env.PORT || 3000;
        const HOST = process.env.HOST || '0.0.0.0'; // Default fallback to '0.0.0.0'

        app.listen(PORT,HOST, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        logger.error('Error starting server: ' + err.message);
        process.exit(1);
    }
};

startServer();
