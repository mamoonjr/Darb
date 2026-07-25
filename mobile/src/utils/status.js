export function statusKey(status) {
  const map = {
    PENDING_RECEIVER_APPROVAL: 'pendingReceiverApproval',
    REQUESTED: 'requested',
    ACCEPTED: 'accepted',
    DRIVER_ARRIVED: 'driverArrived',
    IN_PROGRESS: 'inProgress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    // Route carpool
    DRAFT: 'carpoolDraft',
    PUBLISHED: 'carpoolPublishedStatus',
    RECEIVING_REQUESTS: 'carpoolReceiving',
    CONFIRMED: 'carpoolConfirmed',
    STARTED: 'carpoolStarted',
    RATED: 'carpoolRated',
    CLOSED: 'carpoolClosed',
    PRICE_PROPOSED: 'carpoolPriceProposedStatus',
    PASSENGER_ACCEPTED: 'carpoolPassengerAccepted',
    REJECTED: 'rejected',
  };
  return map[status] || status;
}
