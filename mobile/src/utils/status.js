export function statusKey(status) {
  const map = {
    REQUESTED: 'requested',
    ACCEPTED: 'accepted',
    DRIVER_ARRIVED: 'driverArrived',
    IN_PROGRESS: 'inProgress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };
  return map[status] || status;
}
