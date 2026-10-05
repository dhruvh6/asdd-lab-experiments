// Dates are bucketed in Indian Standard Time so a day's tokens and sales
// roll over at midnight on campus, not midnight UTC.
const TIME_ZONE = 'Asia/Kolkata';

function istDate(date) {
  return date.toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
}

function istHour(date) {
  return Number(date.toLocaleString('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', hourCycle: 'h23' }));
}

module.exports = { istDate, istHour };
