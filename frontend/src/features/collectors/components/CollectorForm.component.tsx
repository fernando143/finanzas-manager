import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CollectorFormData } from '../types'

const collectorSchema = z.object({
  collectorId: z.string().min(1, 'ID de collector requerido'),
  name: z.string().min(1, 'Nombre requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
})

interface CollectorFormProps {
  onSubmit: (data: CollectorFormData) => void
  onCancel: () => void
  initialData?: Partial<CollectorFormData>
  isEditing?: boolean
  isSubmitting?: boolean
}

export const CollectorForm: React.FC<CollectorFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CollectorFormData>({
    resolver: zodResolver(collectorSchema),
    defaultValues: initialData || {
      collectorId: '',
      name: '',
    },
  })
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label 
          htmlFor="collectorId" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          ID de MercadoPago
        </label>
        <input
          type="text"
          id="collectorId"
          {...register('collectorId')}
          disabled={isEditing}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Ej: 123456789"
        />
        {errors.collectorId && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.collectorId.message}
          </p>
        )}
      </div>
      
      <div>
        <label 
          htmlFor="name" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Nombre personalizado
        </label>
        <input
          type="text"
          id="name"
          {...register('name')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Ej: Supermercado, Farmacia, etc."
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.name.message}
          </p>
        )}
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}