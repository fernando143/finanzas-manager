export interface Collector {
  id: string
  collectorId: string
  name: string
  userId: string
  createdAt: string
  updatedAt: string
  _count?: {
    expenses: number
  }
}

export interface CollectorFormData {
  collectorId: string
  name: string
}

export interface CollectorUpdateData {
  name: string
}