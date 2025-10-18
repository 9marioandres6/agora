// Centralized color logic for project status
export type ProjectStatus = 'building' | 'implementing' | 'done';

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  building: 'primary', // Blue (typical project blue)
  implementing: 'warning', // Yellow-orange (was used for constructing)
  done: 'success', // Green
};

export function getProjectStatusColor(status: string): string {
  return PROJECT_STATUS_COLORS[status as ProjectStatus] || 'medium';
}
