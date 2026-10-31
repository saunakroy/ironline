export type Role = 'owner' | 'driver'

export interface Profile {
  role: Role
  name: string
  subtitle: string
  stat: string
  statLabel: string
}

export const profiles: Record<Role, Profile> = {
  owner: {
    role: 'owner',
    name: 'Mike Torres',
    subtitle: 'Owner — Torres Freight',
    stat: '$2,689',
    statLabel: 'flagged tonight',
  },
  driver: {
    role: 'driver',
    name: 'Jake Ramirez',
    subtitle: 'Driver — Truck 114',
    stat: '2',
    statLabel: 'docs to upload',
  },
}
