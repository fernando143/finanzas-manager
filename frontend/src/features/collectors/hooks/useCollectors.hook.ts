import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collectorService } from '../services'
import { CollectorFormData, CollectorUpdateData } from '../types'
import { toast } from 'sonner'

export const useCollectors = () => {
  const queryClient = useQueryClient()
  
  // Query para obtener collectors
  const { data: collectors = [], isLoading, error, refetch } = useQuery({
    queryKey: ['collectors'],
    queryFn: () => collectorService.getAll(),
  })
  
  // Mutation para crear collector
  const createCollectorMutation = useMutation({
    mutationFn: (data: CollectorFormData) => collectorService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectors'] })
      toast.success('Collector creado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear collector')
    },
  })
  
  // Mutation para actualizar collector
  const updateCollectorMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CollectorUpdateData }) => 
      collectorService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectors'] })
      toast.success('Collector actualizado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar collector')
    },
  })
  
  // Mutation para eliminar collector
  const deleteCollectorMutation = useMutation({
    mutationFn: (id: string) => collectorService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectors'] })
      toast.success('Collector eliminado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar collector')
    },
  })
  
  return {
    collectors,
    isLoading,
    error,
    createCollector: createCollectorMutation.mutate,
    updateCollector: updateCollectorMutation.mutate,
    deleteCollector: deleteCollectorMutation.mutate,
    isCreating: createCollectorMutation.isPending,
    isUpdating: updateCollectorMutation.isPending,
    isDeleting: deleteCollectorMutation.isPending,
    refetch,
  }
}