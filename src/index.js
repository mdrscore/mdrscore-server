require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', userRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    app: 'mdrscore API',
    message: 'Server mdrscore berjalan dengan baik',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api'
  });
});


app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});