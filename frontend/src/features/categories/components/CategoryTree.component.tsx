import React, { useState, useMemo, useCallback } from 'react'
import { ChevronRight, ChevronDown, Edit2, Trash2, Globe, Folder, FolderOpen } from 'lucide-react'
import { categoryService } from '../services/category.service'
import type { CategoryWithRelations, CategoryHierarchy } from '../types/category.types'

interface CategoryTreeProps {
  categories: CategoryWithRelations[]
  onEdit?: (category: CategoryWithRelations) => void
  onDelete?: (category: CategoryWithRelations) => void
  onSelect?: (category: CategoryWithRelations) => void
  expandedNodes?: Set<string>
  selectedNode?: string
}

export const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  onEdit,
  onDelete,
  onSelect,
  expandedNodes: initialExpanded,
  selectedNode
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(initialExpanded || new Set())
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // Build tree structure from flat list
  const treeData = useMemo(() => {
    return categoryService.buildTreeStructure(categories)
  }, [categories])

  // Toggle node expansion
  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  // Expand all nodes
  const expandAll = useCallback(() => {
    const allIds = new Set<string>()
    const addIds = (nodes: CategoryHierarchy[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          allIds.add(node.id)
          addIds(node.children)
        }
      })
    }
    addIds(treeData)
    setExpandedNodes(allIds)
  }, [treeData])

  // Collapse all nodes
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set())
  }, [])

  return (
    <div className="category-tree bg-white rounded-lg">
      {/* Toolbar */}
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="font-medium text-gray-700">Vista de Árbol</h3>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Expandir todo
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Colapsar todo
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="p-2">
        {treeData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay categorías para mostrar
          </div>
        ) : (
          treeData.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              expanded={expandedNodes.has(node.id)}
              selected={selectedNode === node.id}
              hovered={hoveredNode === node.id}
              onToggleExpand={() => toggleExpanded(node.id)}
              onSelect={() => onSelect?.(node)}
              onEdit={() => onEdit?.(node)}
              onDelete={() => onDelete?.(node)}
              onHover={setHoveredNode}
              expandedNodes={expandedNodes}
              toggleExpanded={toggleExpanded}
              selectedNode={selectedNode}
              hoveredNode={hoveredNode}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Tree Node Component
interface TreeNodeProps {
  node: CategoryHierarchy
  level: number
  expanded: boolean
  selected: boolean
  hovered: boolean
  onToggleExpand: () => void
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onHover: (id: string | null) => void
  expandedNodes: Set<string>
  toggleExpanded: (id: string) => void
  selectedNode?: string
  hoveredNode: string | null
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  expanded,
  selected,
  hovered,
  onToggleExpand,
  onSelect,
  onEdit,
  onDelete,
  onHover,
  expandedNodes,
  toggleExpanded,
  selectedNode,
  hoveredNode
}) => {
  const hasChildren = node.children && node.children.length > 0
  const indent = level * 24
  const isGlobal = categoryService.isGlobalCategory(node)
  const canEdit = categoryService.canEdit(node)
  const canDelete = categoryService.canDelete(node)

  // Calculate usage
  const transactionCount = (node._count?.incomes || 0) + (node._count?.expenses || 0)

  return (
    <div>
      <div
        className={`tree-node flex items-center py-2 px-2 rounded-lg transition-colors cursor-pointer ${
          selected ? 'bg-blue-50 border-blue-200' : ''
        } ${hovered ? 'bg-gray-50' : ''}`}
        style={{ paddingLeft: `${indent + 8}px` }}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        onClick={onSelect}
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
        aria-selected={selected}
        aria-level={level + 1}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) onToggleExpand()
          }}
          className={`mr-1 p-0.5 rounded transition-transform ${
            hasChildren ? 'hover:bg-gray-200' : 'invisible'
          }`}
          disabled={!hasChildren}
        >
          {hasChildren && (
            expanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )
          )}
        </button>

        {/* Folder Icon */}
        <div className="mr-2 text-gray-500">
          {hasChildren ? (
            expanded ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )
          ) : (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: node.color || '#6B7280' }}
            />
          )}
        </div>

        {/* Node Name */}
        <span className="flex-1 text-sm font-medium text-gray-900">
          {node.name}
        </span>

        {/* Node Info */}
        <div className="flex items-center gap-2 text-xs">
          {isGlobal && (
            <span className="text-gray-500" title="Categoría global">
              <Globe className="h-3 w-3" />
            </span>
          )}
          
          <span className={`font-medium ${
            node.type === 'INCOME' ? 'text-green-600' : 'text-amber-600'
          }`}>
            {node.type === 'INCOME' ? 'ING' : 'EGR'}
          </span>

          {transactionCount > 0 && (
            <span className="text-gray-500">
              ({transactionCount})
            </span>
          )}

          {/* Action Buttons */}
          {hovered && !isGlobal && (
            <div className="flex items-center gap-1 ml-2">
              {canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Editar"
                >
                  <Edit2 className="h-3 w-3 text-gray-600" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="p-1 rounded hover:bg-red-100 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-3 w-3 text-red-600" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div role="group">
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expandedNodes.has(child.id)}
              selected={selectedNode === child.id}
              hovered={hoveredNode === child.id}
              onToggleExpand={() => toggleExpanded(child.id)}
              onSelect={() => onSelect?.(child)}
              onEdit={() => onEdit?.(child)}
              onDelete={() => onDelete?.(child)}
              onHover={onHover}
              expandedNodes={expandedNodes}
              toggleExpanded={toggleExpanded}
              selectedNode={selectedNode}
              hoveredNode={hoveredNode}
            />
          ))}
        </div>
      )}
    </div>
  )
}