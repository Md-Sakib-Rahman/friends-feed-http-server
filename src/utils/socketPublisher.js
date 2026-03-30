const Redis = require("ioredis");
const redisPublisher = new Redis(process.env.REDIS_URL);

const publishNotification = (toUserId, type, payload) => {
  const message = JSON.stringify({
    to: toUserId,
    type: type,  
    payload: payload
  });
  
  redisPublisher.publish("NOTIFICATION_CHANNEL", message);
};

module.exports = publishNotification;