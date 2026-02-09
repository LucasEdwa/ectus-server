import express from 'express';
import { getConnectionInfo } from '../utils/networkUtils';

const router = express.Router();

// Get server connection information
router.get('/connection-info', (req, res) => {
  const port = parseInt(process.env.PORT || '4000', 10);
  const connectionInfo = getConnectionInfo(port);
  
  res.json({
    success: true,
    data: connectionInfo,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;