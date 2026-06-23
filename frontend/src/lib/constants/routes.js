export const routes = {
  home: '/',
  signup: '/auth/signup',
  login: '/auth/login',
  dashboard: '/dashboard',
};

export const dashboardMenu = [
  { label: 'Overview', path: '/dashboard', key: 'overview' },
  { label: 'Clients', path: '/dashboard/clients', key: 'clients' },
  { label: 'Projects', path: '/dashboard/projects', key: 'projects' },
  { label: 'Teams', path: '/dashboard/teams', key: 'teams' },
  { label: 'Invoices', path: '/dashboard/invoices', key: 'invoices' },
  { label: 'Services', path: '/dashboard/services', key: 'services' },
  { label: 'Settings', path: '/dashboard/settings', key: 'settings' },
  { label: 'Support Info', path: '/dashboard/support-info', key: 'support-info' },
];
