/**
 * Which role can do what, inside ONE organization.
 *
 * This is used only to hide or disable buttons so people aren't offered
 * actions they can't perform. The backend must enforce the same rules on
 * every request — never treat this file as security.
 */
import type { Role } from '../api/types';

export type Permission =
  | 'org.settings.write'
  | 'org.delete'
  | 'members.invite'
  | 'members.role.write'
  | 'members.remove'
  | 'apps.write'
  | 'apps.credentials.rotate'
  | 'audit.read'
  | 'org.resources.read';

export const PERMISSIONS: { group: string; items: { key: Permission; label: string }[] }[] = [
  {
    group: 'Organization',
    items: [
      { key: 'org.settings.write', label: 'Manage organization settings' },
      { key: 'org.delete', label: 'Transfer ownership / delete organization' },
    ],
  },
  {
    group: 'Members',
    items: [
      { key: 'members.invite', label: 'Invite members' },
      { key: 'members.role.write', label: 'Change member roles' },
      { key: 'members.remove', label: 'Suspend or remove members' },
    ],
  },
  {
    group: 'Applications',
    items: [
      { key: 'apps.write', label: 'Register and configure applications' },
      { key: 'apps.credentials.rotate', label: 'Rotate client credentials' },
    ],
  },
  {
    group: 'Security & access',
    items: [
      { key: 'audit.read', label: 'View audit logs' },
      { key: 'org.resources.read', label: 'Access organization resources' },
    ],
  },
];

const ALL = PERMISSIONS.flatMap((g) => g.items.map((i) => i.key));

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ALL,
  administrator: ALL.filter((p) => p !== 'org.delete'),
  manager: ['members.invite', 'audit.read', 'org.resources.read'],
  viewer: ['org.resources.read'],
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: 'Full control, including ownership transfer and deleting the organization.',
  administrator: 'Day-to-day identity administration: members, apps and settings.',
  manager: 'Invites people and reviews activity. Can’t change apps or settings.',
  viewer: 'Uses organization resources and apps they’re allowed into.',
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
