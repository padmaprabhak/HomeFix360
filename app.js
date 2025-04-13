const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware Setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true
}));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/homefix3600')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));


// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    phone: String
});
const User = mongoose.model('User', userSchema);
app.get('/api/services', async (req, res) => { // Duplicate route
    try {
        const services = await Service.find(); // Fetch all services
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/login', (req, res) => {
    const { email, password, serviceProvider } = req.body;
    
    // Authenticate the user (check credentials in the database, etc.)
    
    if (serviceProvider) {
        // If service provider, redirect to all-categories.html
        return res.redirect('/all-categories.html');
    } else {
        // If regular user, redirect to home.html
        return res.redirect('/home.html');
    }
});
app.post('/sign_up', (req, res) => {
    const { name, email, password, phone, serviceProvider } = req.body;
    
    // Save user details in the database
    
    if (serviceProvider) {
        // Redirect to all-categories.html if service provider
        return res.redirect('/all-categories.html');
    } else {
        // Redirect to home.html if regular user
        return res.redirect('/home.html');
    }
});

// Service Schema
const serviceSchema = new mongoose.Schema({
    name: String,
    category: String,
    city: String,
    state: String,
    tags: [String],
    ownerName: String,
    ownerNumber: String,
    experience: Number,
    customersServed: Number
});
const Service = mongoose.model('Service', serviceSchema);
app.get('/api/services/name/:name', async (req, res) => {
    try {
        const serviceName = req.params.name;
        const service = await Service.findOne({ name: serviceName }); // Fetch from DB
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }
        res.json(service);
    } catch (error) {
        console.error("Error fetching service by name:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Serve Login Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ✅ FIXED: Get all services
app.get("/get-services", async (req, res) => {
    try {
        const services = await Service.find(); // ✅ Corrected Query
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch services" });
    }
});

// Signup Route
app.post('/sign_up', async (req, res) => {
    const { name, email, password, phone } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).send('Email already registered!');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, phone });
    await newUser.save();
    res.redirect('/login.html');
});

// Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = user;
        res.redirect('/all-categories.html'); // ✅ Proper Redirection
    } else {
        res.status(401).send('Invalid email or password.');
    }
});

// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login.html');
    });
});

// Add Service Route
app.post('/add-service', async (req, res) => {
    try {
        const newService = new Service(req.body);
        await newService.save();
        res.json({ message: "✅ Service added successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/services/name/:serviceName', async (req, res) => {
    try {
        const serviceName = req.params.serviceName; // Get the service name from the URL
        const service = await Service.findOne({ name: serviceName }); // Query the DB

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.json(service); // Send the service details as JSON
    } catch (error) {
        console.error('Error fetching service details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
// Start Server
app.listen(3000, () => {
    console.log('🚀 Server running on http://localhost:3000');
});
