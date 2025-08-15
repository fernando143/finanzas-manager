import { apiClient } from '../../../shared/services/api/client.service'
import { Collector, CollectorFormData, CollectorUpdateData } from '../types'

class CollectorService {
  private readonly baseUrl = '/collectors'
  
  async getAll(): Promise<Collector[]> {
    const response = await apiClient.get<Collector[]>(this.baseUrl)
    
    if (!response.success) {
      throw new Error(response.error || 'Error al obtener collectors')
    }
    
    return response.data || []
  }
  
  async getById(id: string): Promise<Collector> {
    const response = await apiClient.get<Collector>(`${this.baseUrl}/${id}`)
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Collector no encontrado')
    }
    
    return response.data
  }
  
  async create(data: CollectorFormData): Promise<Collector> {
    const response = await apiClient.post<Collector>(this.baseUrl, data as unknown as Record<string, unknown>)
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al crear collector')
    }
    
    return response.data
  }
  
  async update(id: string, data: CollectorUpdateData): Promise<Collector> {
    const response = await apiClient.put<Collector>(`${this.baseUrl}/${id}`, data as unknown as Record<string, unknown>)
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al actualizar collector')
    }
    
    return response.data
  }
  
  async delete(id: string): Promise<void> {
    const response = await apiClient.delete<void>(`${this.baseUrl}/${id}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Error al eliminar collector')
    }
  }
}

export const collectorService = new CollectorService()