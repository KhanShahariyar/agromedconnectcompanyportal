/**
 * The key set is authoritative: `TranslationKey` is derived from this object,
 * so a key added here without a bn-BD counterpart fails parity.test.ts.
 */
export const enUS = {
  'app.name': 'AgroMedConnect',
  'app.portal': 'Company Portal',

  'nav.dashboard': 'Dashboard',
  'nav.market': 'Market Intelligence',
  'nav.products': 'Products',
  'nav.services': 'Services',
  'nav.solutions': 'Solution Center',
  'nav.inventory': 'Inventory',
  'nav.orders': 'Orders',
  'nav.discounts': 'Discounts',
  'nav.reviews': 'Reviews & Trust',
  'nav.payments': 'Payments & Payouts',
  'nav.reports': 'Reports',
  'nav.feedback': 'Feedback',
  'nav.notifications': 'Notifications',
  'nav.profile': 'Company Profile',
  'nav.verification': 'Verification',
  'nav.team': 'Team',
  'nav.settings': 'Settings',
  'nav.help': 'Help Center',
  'nav.support': 'Contact Support',
  'nav.deliveries': 'My Deliveries',
  'nav.history': 'History',
  'nav.group.company': 'Company',
  'nav.group.support': 'Support',

  'state.loading': 'Loading…',
  'state.empty.title': 'Nothing here yet',
  'state.empty.body': 'When there is something to show, it will appear here.',
  'state.error.title': 'Something went wrong',
  'state.error.retry': 'Try again',

  'action.save': 'Save',
  'action.cancel': 'Cancel',
  'action.search': 'Search',
  'action.signIn': 'Sign in',
  'action.signOut': 'Sign out',

  'gate.unverified': 'Verification in progress — you can prepare this, but not publish it yet.',
  'gate.forbidden': 'Your role does not permit this action.',
  'gate.blacklisted': 'This account is suspended. Contact support.',

  'paging.showing': 'Showing {from}–{to} of {total}',
  'locale.toggle': 'বাংলা',
} as const
