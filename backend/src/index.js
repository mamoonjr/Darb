const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { port, corsOrigin } = require('./config');
const routes = require('./routes');
const { setupSocket } = require('./socket');
const { UPLOAD_DIR } = require('./services/uploadService');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: corsOrigin === '*' ? true : corsOrigin },
});

app.set('io', io);
setupSocket(io);

app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin }));
// Larger limit so base64 proof-of-delivery photos fit in the JSON body.
app.use(express.json({ limit: '12mb' }));
// Serve uploaded proof-of-delivery images.
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/api', routes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(port, () => {
  console.log(`Darb API running on http://localhost:${port}`);
});
