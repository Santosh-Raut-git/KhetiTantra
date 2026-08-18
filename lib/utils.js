const STATUS_COLORS = {
  active: 'text-leaf',
  harvested: 'text-harvest-dark',
  failed: 'text-clay',
};

export const getStatusColor = (status) =>
  STATUS_COLORS[status] || 'text-soil-muted';

const STATUS_BG = {
  active: 'bg-leaf/10',
  harvested: 'bg-harvest/10',
  failed: 'bg-clay/10',
};

export const getStatusBg = (status) => STATUS_BG[status] || 'bg-soil/5';
