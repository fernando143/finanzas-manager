import type { CategoryHierarchy } from '../types/category.types'

// Utility function to count all nodes in tree
export const countTreeNodes = (nodes: CategoryHierarchy[]): number => {
  let count = nodes.length
  nodes.forEach(node => {
    if (node.children && node.children.length > 0) {
      count += countTreeNodes(node.children)
    }
  })
  return count
}

// Utility function to find node in tree
export const findNodeInTree = (
  nodes: CategoryHierarchy[],
  id: string
): CategoryHierarchy | null => {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeInTree(node.children, id)
      if (found) return found
    }
  }
  return null
}

// Utility function to get all parent IDs of a node
export const getNodeParents = (
  nodes: CategoryHierarchy[],
  id: string,
  parents: string[] = []
): string[] => {
  for (const node of nodes) {
    if (node.id === id) return parents
    if (node.children) {
      const childParents = getNodeParents(node.children, id, [...parents, node.id])
      if (childParents.length > parents.length) return childParents
    }
  }
  return parents
}