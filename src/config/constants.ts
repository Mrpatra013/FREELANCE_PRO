export const PROJECT_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  PAUSED: 'PAUSED',
} as const;

export const DEFAULT_PROJECT_STATUS = PROJECT_STATUS.ACTIVE;

export const INVOICE_STATUS = {
  PAID: 'PAID',
  UNPAID: 'UNPAID',
} as const;

export const APP_CONFIG = {
  NAME: 'FreelancePro',
} as const;