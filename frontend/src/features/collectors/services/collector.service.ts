import { apiClient } from '../../../shared/services/api/client.service'
import { Collector, CollectorFormData, CollectorUpdateData } from '../types'
import { ApiResponse } from '../../../types'

class CollectorService {
  private readonly baseUrl = '/api/collectors'
  
  async getAll(): Promise<Collector[]> {
    const response = await apiClient.get<ApiResponse<Collector[]>>(this.baseUrl)
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al obtener collectors')
    }
    
    return response.data.data || []
  }
  
  async getById(id: string): Promise<Collector> {
    const response = await apiClient.get<ApiResponse<Collector>>(`${this.baseUrl}/${id}`)
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Collector no encontrado')
    }
    
    return response.data.data
  }
  
  async create(data: CollectorFormData): Promise<Collector> {
    const response = await apiClient.post<ApiResponse<Collector>>(this.baseUrl, data)
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al crear collector')
    }
    
    return response.data.data
  }
  
  async update(id: string, data: CollectorUpdateData): Promise<Collector> {
    const response = await apiClient.put<ApiResponse<Collector>>(`${this.baseUrl}/${id}`, data)
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al actualizar collector')
    }
    
    return response.data.data
  }
  
  async delete(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al eliminar collector')
    }
  }
}

export const collectorService = new CollectorService()