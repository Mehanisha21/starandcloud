require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT;

// ✅ Middleware
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    express.json()(req, res, next);
  } else {
    next();
  }
});

// ✅ Routes
const loginRoutes = require('./routes/login');
const profileRoutes = require('./routes/profile');
const rfqRoutes = require('./routes/rfq');
const poRoutes = require('./routes/po'); 
const goodsReceiptRoutes = require('./routes/goodrec');
const invoiceRoutes = require('./routes/invoice');
const payageRoutes = require('./routes/payage');
const memoRoutes = require('./routes/memo');
const invpdfRoutes = require('./routes/invpdf');

app.use(cors());

app.use('/api', loginRoutes);
app.use('/api', profileRoutes);
app.use('/api', rfqRoutes);
app.use('/api', poRoutes);
app.use('/api', goodsReceiptRoutes); 
app.use('/api', invoiceRoutes);
app.use('/api/payage', payageRoutes);
app.use('/api/memo', memoRoutes);
app.use('/api', invpdfRoutes);  


app.use(cors({ origin: 'http://localhost:4200' })); // Allow Angular dev server

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});