const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL);

const publishNotification = (userId, type, payload) => {
  const message = JSON.stringify({
    to: userId,
    type: type, // e.g., 'new_message' or 'friend_request'
    payload: payload
  });
  
  redis.publish("NOTIFICATION_CHANNEL", message);
};

module.exports = publishNotification;