import React, { useState } from 'react'
import { useCollectors } from '../hooks'
import { CollectorCard } from './CollectorCard.component'
import { CollectorForm } from './CollectorForm.component'
import { CollectorDeleteDialog } from './CollectorDeleteDialog.component'
import { Collector } from '../types'
import { PlusIcon } from '@heroicons/react/24/outline'

export const CollectorList: React.FC = () => {
  const { 
    collectors, 
    isLoading, 
    createCollector, 
    updateCollector, 
    deleteCollector,
    isCreating,
    isUpdating,
    isDeleting
  } = useCollectors()
  
  const [showForm, setShowForm] = useState(false)
  const [editingCollector, setEditingCollector] = useState<Collector | null>(null)
  const [deletingCollector, setDeletingCollector] = useState<Collector | null>(null)
  
  const handleCreate = () => {
    setEditingCollector(null)
    setShowForm(true)
  }
  
  const handleEdit = (collector: Collector) => {
    setEditingCollector(collector)
    setShowForm(true)
  }
  
  const handleDelete = (collector: Collector) => {
    setDeletingCollector(collector)
  }
  
  const handleFormSubmit = (data: { collectorId: string; name: string }) => {
    if (editingCollector) {
      updateCollector({ id: editingCollector.id, data: { name: data.name } })
    } else {
      createCollector(data)
    }
    setShowForm(false)
    setEditingCollector(null)
  }
  
  const handleFormCancel = () => {
    setShowForm(false)
    setEditingCollector(null)
  }
  
  const handleConfirmDelete = () => {
    if (deletingCollector) {
      deleteCollector(deletingCollector.id)
      setDeletingCollector(null)
    }
  }
  
  const handleCancelDelete = () => {
    setDeletingCollector(null)
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Collectors
        </h1>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Collector
        </button>
      </div>
      
      {showForm && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {editingCollector ? 'Editar Collector' : 'Nuevo Collector'}
          </h2>
          <CollectorForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            initialData={editingCollector ? {
              collectorId: editingCollector.collectorId,
              name: editingCollector.name
            } : undefined}
            isEditing={!!editingCollector}
            isSubmitting={isCreating || isUpdating}
          />
        </div>
      )}
      
      {collectors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No hay collectors registrados
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Los collectors se crearán automáticamente al sincronizar con MercadoPago
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collectors.map(collector => (
            <CollectorCard
              key={collector.id}
              collector={collector}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
      
      {deletingCollector && (
        <CollectorDeleteDialog
          isOpen={!!deletingCollector}
          collectorName={deletingCollector.name}
          expenseCount={deletingCollector._count?.expenses || 0}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}