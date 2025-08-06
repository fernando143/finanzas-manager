import React from 'react'
import { Edit2, Trash2, Globe, DollarSign, TrendingDown, FolderOpen, Pencil, Trash } from 'lucide-react'
import { categoryService } from '../services/category.service'
import type { CategoryWithRelations } from '../types/category.types'

interface CategoryCardProps {
  category: CategoryWithRelations
  onEdit: () => void
  onDelete: () => void
  onSelect?: () => void
  variant?: 'default' | 'compact'
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
  onSelect,
  variant = 'default'
}) => {
  const isGlobal = categoryService.isGlobalCategory(category)
  const canEdit = categoryService.canEdit(category)
  const canDelete = categoryService.canDelete(category)
  
  // Calculate usage
  const transactionCount = (category._count?.incomes || 0) + (category._count?.expenses || 0)
  const hasTransactions = transactionCount > 0
  const hasChildren = (category.children?.length || 0) > 0
  const hasBudgets = (category._count?.budgetAllocations || 0) > 0

  if (variant === 'compact') {
    return (
      <div 
        className="category-card-compact bg-white border rounded-lg p-3 hover:shadow-md transition-shadow"
        data-testid="category-card"
        role="article"
        aria-label={`Categoría ${category.name}`}
      >
        <div className="flex items-start justify-between">
          <div 
            className="flex items-start space-x-2 flex-1 cursor-pointer"
            onClick={onSelect}
          >
            <div
              className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: category.color || '#6B7280' }}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{category.name}</h4>
              {category.parent && (
                <p className="text-xs text-gray-500 truncate">
                  {category.parent.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {isGlobal && (
              <span className="text-xs text-gray-500">
                <Globe className="h-3 w-3" />
              </span>
            )}
            <TypeBadgeCompact type={category.type} />
            
            {/* Action Buttons for Compact View */}
            <div className="flex items-center ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                title={!canEdit && isGlobal ? 'No se puede editar una categoría global' : 'Editar'}
                disabled={!canEdit}
                className={`p-1 rounded transition-all duration-150 ${
                  !canEdit 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
                data-testid="edit-button-compact"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                title={
                  !canDelete
                    ? isGlobal
                      ? 'No se puede eliminar una categoría global'
                      : hasTransactions
                      ? 'Tiene transacciones asociadas'
                      : hasChildren
                      ? 'Tiene subcategorías'
                      : hasBudgets
                      ? 'Tiene presupuestos asociados'
                      : 'Eliminar'
                    : 'Eliminar'
                }
                disabled={!canDelete}
                className={`p-1 rounded transition-all duration-150 ${
                  !canDelete 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                }`}
                data-testid="delete-button-compact"
              >
                <Trash className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {hasTransactions && (
          <div className="mt-2 text-xs text-gray-600">
            {transactionCount} transacciones
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      className="category-card bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
      data-testid="category-card"
      role="article"
      aria-label={`Categoría ${category.name}`}
    >
      <div className="flex items-center justify-between">
        {/* Main Info */}
        <div className="flex items-center space-x-3 flex-1">
          <div
            className="w-5 h-5 rounded-full flex-shrink-0"
            style={{ backgroundColor: category.color || '#6B7280' }}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {category.name}
            </h3>
            {category.parent && (
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <FolderOpen className="h-3 w-3 mr-1" />
                {category.parent.name}
              </p>
            )}
          </div>
        </div>

        {/* Badges and Actions */}
        <div className="flex items-center space-x-3">
          {/* Status Badges */}
          <div className="flex items-center space-x-2">
            {isGlobal && (
              <Badge variant="secondary" icon={<Globe className="h-3 w-3" />}>
                Global
              </Badge>
            )}
            <TypeBadge type={category.type} />
            {hasTransactions && (
              <Badge variant="info">
                {transactionCount} transacciones
              </Badge>
            )}
            {hasChildren && (
              <Badge variant="warning">
                {category.children?.length} subcategorías
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <IconButton
              icon={<Edit2 className="h-4 w-4" />}
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              title={!canEdit && isGlobal ? 'No se puede editar una categoría global' : 'Editar categoría'}
              disabled={!canEdit}
              data-testid="edit-button"
            />
            <IconButton
              icon={<Trash2 className="h-4 w-4" />}
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              title={
                !canDelete
                  ? isGlobal
                    ? 'No se puede eliminar una categoría global'
                    : hasTransactions
                    ? 'Tiene transacciones asociadas'
                    : hasChildren
                    ? 'Tiene subcategorías'
                    : hasBudgets
                    ? 'Tiene presupuestos asociados'
                    : 'Eliminar categoría'
                  : 'Eliminar categoría'
              }
              disabled={!canDelete}
              variant="danger"
              data-testid="delete-button"
            />
          </div>
        </div>
      </div>

      {/* Optional Select Action */}
      {onSelect && (
        <button
          onClick={onSelect}
          className="mt-3 w-full text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          Seleccionar
        </button>
      )}
    </div>
  )
}

// Badge Component
interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  icon?: React.ReactNode
  children: React.ReactNode
}

const Badge: React.FC<BadgeProps> = ({ variant = 'primary', icon, children }) => {
  const variants = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-cyan-100 text-cyan-800'
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  )
}

// Type Badge Component
const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const isIncome = type === 'INCOME'
  return (
    <Badge variant={isIncome ? 'success' : 'warning'}>
      {isIncome ? (
        <>
          <DollarSign className="h-3 w-3 mr-1" />
          Ingreso
        </>
      ) : (
        <>
          <TrendingDown className="h-3 w-3 mr-1" />
          Egreso
        </>
      )}
    </Badge>
  )
}

// Compact Type Badge
const TypeBadgeCompact: React.FC<{ type: string }> = ({ type }) => {
  const isIncome = type === 'INCOME'
  return (
    <span className={`text-xs font-medium ${isIncome ? 'text-green-600' : 'text-amber-600'}`}>
      {isIncome ? 'ING' : 'EGR'}
    </span>
  )
}

// Icon Button Component
interface IconButtonProps {
  icon: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  title: string
  disabled?: boolean
  variant?: 'default' | 'danger'
  'data-testid'?: string
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  title,
  disabled = false,
  variant = 'default',
  'data-testid': dataTestId
}) => {
  const variants = {
    default: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200',
    danger: 'text-red-500 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200'
  }

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
        disabled 
          ? 'text-gray-300 cursor-not-allowed opacity-50' 
          : variants[variant]
      }`}
      aria-label={title}
      data-testid={dataTestId}
    >
      {icon}
    </button>
  )
}