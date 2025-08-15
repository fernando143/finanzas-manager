import React from 'react'
import { Collector } from '../types'
import { PencilIcon, TrashIcon, CreditCardIcon } from '@heroicons/react/24/outline'

interface CollectorCardProps {
  collector: Collector
  onEdit: (collector: Collector) => void
  onDelete: (collector: Collector) => void
}

export const CollectorCard: React.FC<CollectorCardProps> = ({
  collector,
  onEdit,
  onDelete,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <CreditCardIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {collector.name}
            </h3>
          </div>
          
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ID: <span className="font-mono">{collector.collectorId}</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gastos asociados: <span className="font-semibold">{collector._count?.expenses || 0}</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Creado: {formatDate(collector.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => onEdit(collector)}
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(collector)}
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Eliminar"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}