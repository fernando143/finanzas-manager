import React, { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface CollectorDeleteDialogProps {
  isOpen: boolean
  collectorName: string
  expenseCount: number
  onConfirm: () => void
  onCancel: () => void
  isDeleting?: boolean
}

export const CollectorDeleteDialog: React.FC<CollectorDeleteDialogProps> = ({
  isOpen,
  collectorName,
  expenseCount,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>
        
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon 
                        className="h-6 w-6 text-red-600 dark:text-red-400" 
                        aria-hidden="true" 
                      />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title 
                        as="h3" 
                        className="text-base font-semibold leading-6 text-gray-900 dark:text-white"
                      >
                        Eliminar Collector
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ¿Estás seguro de que deseas eliminar el collector <span className="font-semibold">{collectorName}</span>?
                        </p>
                        {expenseCount > 0 && (
                          <div className="mt-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              <ExclamationTriangleIcon className="inline h-4 w-4 mr-1" />
                              Este collector tiene <span className="font-semibold">{expenseCount}</span> gasto{expenseCount !== 1 ? 's' : ''} asociado{expenseCount !== 1 ? 's' : ''}.
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                              Al eliminarlo, los gastos quedarán sin collector asignado.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={onConfirm}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-600 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 sm:mt-0 sm:w-auto"
                    onClick={onCancel}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}