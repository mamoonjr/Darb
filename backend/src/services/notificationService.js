const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendPush(token, { title, body, data = {} }) {
  if (!token) return;

  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      }),
    });
  } catch (err) {
    console.error('Push notification failed:', err.message);
  }
}

async function notifyUser(userId, message, data = {}) {
  const prisma = require('../config/database');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushToken: true },
  });
  if (user?.pushToken) {
    await sendPush(user.pushToken, { ...message, data: { ...message.data, ...data } });
  }
}

// Notify a registered receiver that a package is on the way and needs their
// approval + current GPS location before a driver is dispatched.
async function notifyBoxReceiver(ride) {
  if (!ride.receiverId) return;
  await notifyUser(
    ride.receiverId,
    {
      title: 'طرد جديد بانتظار موافقتك',
      body: `أرسل لك ${ride.rider?.name || 'مستخدم'} طرداً عبر درب بوكس. وافق وشارك موقعك للاستلام.`,
      data: { rideId: ride.id, type: 'BOX_APPROVAL' },
    },
    { rideId: ride.id, type: 'BOX_APPROVAL' }
  );
}

const RIDE_MESSAGES = {
  REQUESTED: { title: 'طلب رحلة جديد', titleEn: 'New ride request' },
  ACCEPTED: { title: 'تم قبول رحلتك', titleEn: 'Ride accepted' },
  DRIVER_ARRIVED: { title: 'السائق وصل', titleEn: 'Driver arrived' },
  IN_PROGRESS: { title: 'بدأت الرحلة', titleEn: 'Ride started' },
  COMPLETED: { title: 'اكتملت الرحلة', titleEn: 'Ride completed' },
  CANCELLED: { title: 'تم إلغاء الرحلة', titleEn: 'Ride cancelled' },
};

async function notifyRideStatus(ride, status) {
  const msg = RIDE_MESSAGES[status];
  if (!msg) return;

  const recipients = [ride.riderId];
  if (ride.driverId) recipients.push(ride.driverId);

  const prisma = require('../config/database');
  const users = await prisma.user.findMany({
    where: { id: { in: recipients }, pushToken: { not: null } },
    select: { pushToken: true },
  });

  await Promise.all(
    users.map((u) =>
      sendPush(u.pushToken, {
        title: msg.title,
        body: `رحلة ${ride.pickupAddress} → ${ride.dropoffAddress}`,
        data: { rideId: ride.id, status },
      })
    )
  );
}

module.exports = {
  sendPush,
  notifyUser,
  notifyRideStatus,
  notifyBoxReceiver,
};
