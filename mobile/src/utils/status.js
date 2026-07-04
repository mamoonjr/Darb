export function statusKey(status) {
  const map = {
    PENDING_RECEIVER_APPROVAL: 'pendingReceiverApproval',
    REQUESTED: 'requested',
    ACCEPTED: 'accepted',
    DRIVER_ARRIVED: 'driverArrived',
    IN_PROGRESS: 'inProgress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };
  return map[status] || status;
}
