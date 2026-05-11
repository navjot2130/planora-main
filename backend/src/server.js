const { app } = require('./app');
const { startEmailReminderScheduler } = require('./services/notifications/emailReminderScheduler');

const port = process.env.PORT || 8080;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Planora backend listening on http://localhost:${port}`);
  startEmailReminderScheduler();
});



