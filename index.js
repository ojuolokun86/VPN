require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'https://techitoon-vpn.netlify.app'
  ],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
};






const app = express();
app.use(cors(corsOptions));
app.use(express.json());

const VPS_API = 'http://89.168.115.234:4000';
// Add this above your /create-user route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (email === adminEmail && password === adminPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/get-user', async (req, res) => {
  const { username } = req.body;

  try {
    const response = await axios.post(`${VPS_API}/get-user`, { username });
    res.status(200).json(response.data); // expects { qr: '/qr/gedion.png', conf: '/conf/gedion.conf' }
  } catch (err) {
    console.error('❌ Error getting user info:', err.message);
    res.status(404).json({ error: 'User not found or error retrieving config' });
  }
});

app.post('/create-user', async (req, res) => {
  console.log('📥 Received request to create VPN user:', req.body);
  try {
    const { username } = req.body;
    const response = await axios.post(`${VPS_API}/create-user`, { username });
    console.log('✅ VPN user created:', response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('❌ Error creating VPN user:', error.response?.data || error.message);
    res.status(500).json({ error: 'VPN user creation failed' });
  }
});

// 🔴 DELETE VPN user endpoint
app.delete('/delete-user', async (req, res) => {
  console.log('🗑️ Received request to delete VPN user:', req.body);
  try {
    const { username } = req.body;
    const response = await axios.delete(`${VPS_API}/delete-user`, {
      data: { username }
    });
    console.log('✅ VPN user deleted:', response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('❌ Error deleting VPN user:', error.response?.data || error.message);
    res.status(500).json({ error: 'VPN user deletion failed' });
  }
});

// 🔵 Get all VPN users from VPS
app.get('/users', async (req, res) => {
  try {
    const response = await axios.get(`${VPS_API}/users`);
    res.status(200).json(response.data); // expects [ "gedion", "anotherUser" ]
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// DELETE /delete-all-users (proxy to VPS)
app.delete('/delete-all-users', async (req, res) => {
  try {
    const response = await axios.delete(`${VPS_API}/delete-all-users`);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('❌ Error deleting all users:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to delete all VPN users' });
  }
});

// Forward /qr/* requests to VPS
app.use('/qr', (req, res) => {
  const fileUrl = `${VPS_API}/qr${req.url}`;
  axios.get(fileUrl, { responseType: 'stream' })
    .then(response => response.data.pipe(res))
    .catch(() => res.status(404).send('QR not found'));
});

// Forward /conf/* requests to VPS
app.get('/conf/:filename', async (req, res) => {
  const fileUrl = `${VPS_API}/conf/${req.params.filename}`;
  try {
    const fileStream = await axios.get(fileUrl, { responseType: 'stream' });
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
    fileStream.data.pipe(res);
  } catch (err) {
    res.status(404).send('Config not found');
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend is running on ${PORT}`);
});
