export type LoadStatus = 'all set' | 'needs doc'

export interface DriverLoad {
  id: string
  loadId: string
  route: string
  status: LoadStatus
  missing?: string
}

export const driverLoads: DriverLoad[] = [
  { id: 'l1', loadId: 'P9', route: 'Dallas, TX → Memphis, TN', status: 'needs doc', missing: 'BOL photo' },
  { id: 'l2', loadId: 'P10', route: 'Joplin, MO → Amarillo, TX', status: 'all set' },
  { id: 'l3', loadId: 'P11', route: 'Bentonville, AR → Tulsa, OK', status: 'needs doc', missing: 'Rate confirmation' },
]
