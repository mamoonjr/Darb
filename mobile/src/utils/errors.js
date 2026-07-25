export function localizeApiError(err, t) {
  const map = {
    DRIVER_BUSY_SINGLE: t('driverBusySingle'),
    DRIVER_DUAL_ONLY_BOX_CARPOOL: t('driverDualOnlyBoxCarpool'),
    DRIVER_MAX_ACTIVE_RIDES: t('driverMaxActiveRides'),
    INSUFFICIENT_BALANCE: t('insufficientBalance'),
  };
  return map[err?.code] || err?.message || t('error');
}
