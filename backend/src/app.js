const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const { corsOptions } = require('./config/cors');

const tasksRoutes = require('./routes/tasks.routes');
const plannerRoutes = require('./routes/planner.routes');
const plannerAcceptRoutes = require('./routes/plannerAccept.routes');

const chatRoutes = require('./routes/chat.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const remindersRoutes = require('./routes/reminders.routes');
const profileRoutes = require('./routes/profile.routes');
const adminRoutes = require('./routes/admin.routes');

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));

app.use(
  cors(corsOptions)
);

app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 200),
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/tasks', tasksRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/planner', plannerAcceptRoutes);

app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };



