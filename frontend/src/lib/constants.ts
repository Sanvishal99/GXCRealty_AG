// ── Role constants (mirrors Prisma Role enum) ────────────────────────────────
export const ROLE = {
  ADMIN:   'ADMIN',
  COMPANY: 'COMPANY',
  AGENT:   'AGENT',
} as const;
export type RoleType = typeof ROLE[keyof typeof ROLE];

// ── User status constants ─────────────────────────────────────────────────────
export const USER_STATUS = {
  PENDING_KYC:      'PENDING_KYC',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE:           'ACTIVE',
  SUSPENDED:        'SUSPENDED',
} as const;

// ── Property status constants ────────────────────────────────────────────────
export const PROPERTY_STATUS = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  AVAILABLE:        'AVAILABLE',
  SOLD:             'SOLD',
  REJECTED:         'REJECTED',
  INACTIVE:         'INACTIVE',
} as const;

// ── Visit status constants ───────────────────────────────────────────────────
export const VISIT_STATUS = {
  PENDING:   'PENDING',
  APPROVED:  'APPROVED',
  REJECTED:  'REJECTED',
  COMPLETED: 'COMPLETED',
} as const;

// ── Project type + stage ─────────────────────────────────────────────────────
export const PROJECT_TYPE = {
  APARTMENT:  'APARTMENT',
  VILLA:      'VILLA',
  PLOT:       'PLOT',
  COMMERCIAL: 'COMMERCIAL',
} as const;

export const PROJECT_STAGE = {
  UPCOMING:           'UPCOMING',
  UNDER_CONSTRUCTION: 'UNDER_CONSTRUCTION',
  READY_TO_MOVE:      'READY_TO_MOVE',
} as const;

// ── localStorage keys ────────────────────────────────────────────────────────
export const STORAGE_KEY = {
  AUTH_TOKEN:   'gxc-auth-token',
  USER_PROFILE: 'gxc-user-profile',
  APP_CONFIG:   'gxc-app-config',
  THEME:        'gxc-theme',
  CURRENCY:     'gxc-currency',
} as const;

// ── Role helpers ─────────────────────────────────────────────────────────────
export function isAdmin(role?: string)   { return role?.toUpperCase() === ROLE.ADMIN; }
export function isCompany(role?: string) { return role?.toUpperCase() === ROLE.COMPANY; }
export function isAgent(role?: string)   { return role?.toUpperCase() === ROLE.AGENT; }

// ── Role badge styles ────────────────────────────────────────────────────────
export const ROLE_BADGE_CLASS: Record<string, string> = {
  [ROLE.ADMIN]:   'text-rose-600 bg-rose-50 border-rose-200',
  [ROLE.COMPANY]: 'text-amber-600 bg-amber-50 border-amber-200',
  [ROLE.AGENT]:   'text-indigo-600 bg-indigo-50 border-indigo-200',
};

export const ROLE_GRADIENT: Record<string, string> = {
  [ROLE.ADMIN]:   'from-rose-500 to-orange-500',
  [ROLE.COMPANY]: 'from-amber-500 to-yellow-500',
  [ROLE.AGENT]:   'from-indigo-500 to-cyan-500',
};

export const ROLE_EMOJI: Record<string, string> = {
  [ROLE.ADMIN]:   '👑',
  [ROLE.COMPANY]: '🏗️',
  [ROLE.AGENT]:   '🏠',
};
