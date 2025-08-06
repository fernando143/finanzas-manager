import { apiClient } from '../../../shared/services/api/client.service'
import type {
  Category,
  CategoryWithRelations,
  CategoryHierarchy,
  CategoryCreateDTO,
  CategoryUpdateDTO,
  CategoryResponse,
  CategoryQueryParams,
  CategoryStats,
  CategoryDependencies,
  CategoryType
} from '../types/category.types'

class CategoryService {
  private baseURL = '/categories'

  /**
   * Fetch categories with optional filters and pagination
   */
  async fetchCategories(params?: CategoryQueryParams): Promise<CategoryResponse> {
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.limit) queryParams.append('limit', String(params.limit))
    if (params?.type) queryParams.append('type', params.type)
    if (params?.includeGlobal !== undefined) {
      queryParams.append('includeGlobal', String(params.includeGlobal))
    }
    if (params?.parentId) queryParams.append('parentId', params.parentId)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.order) queryParams.append('order', params.order)
    if (params?.search) queryParams.append('search', params.search)

    const url = queryParams.toString() 
      ? `${this.baseURL}?${queryParams.toString()}`
      : this.baseURL

    return apiClient.get<CategoryResponse>(url)
  }

  /**
   * Get a single category by ID
   */
  async getCategory(id: string, includeGlobal = true): Promise<CategoryWithRelations | null> {
    const response = await apiClient.get<CategoryResponse>(
      `${this.baseURL}/${id}?includeGlobal=${includeGlobal}`
    )

    if (!response.success || !response.data?.category) {
      throw new Error(response.error || 'Error al obtener categoría')
    }

    return response.data.category
  }

  /**
   * Create a new category
   */
  async create(data: CategoryCreateDTO): Promise<CategoryWithRelations> {
    // Clean up data before sending - remove empty parentId
    const cleanData = this.sanitizeCategoryData(data)
    const response = await apiClient.post<CategoryResponse>(this.baseURL, cleanData)

    if (!response.success || !response.data?.category) {
      throw new Error(response.error || 'Error al crear categoría')
    }

    return response.data.category
  }

  /**
   * Update an existing category
   */
  async update(id: string, data: CategoryUpdateDTO): Promise<CategoryWithRelations> {
    // Clean up data before sending - remove empty parentId
    const cleanData = this.sanitizeCategoryData(data)
    const response = await apiClient.put<CategoryResponse>(`${this.baseURL}/${id}`, cleanData)

    if (!response.success || !response.data?.category) {
      throw new Error(response.error || 'Error al actualizar categoría')
    }

    return response.data.category
  }

  /**
   * Delete a category
   */
  async delete(id: string): Promise<void> {
    const response = await apiClient.delete<CategoryResponse>(`${this.baseURL}/${id}`)

    if (!response.success) {
      throw new Error(response.error || 'Error al eliminar categoría')
    }
  }

  /**
   * Search categories by name
   */
  async search(query: string, includeGlobal = true): Promise<CategoryWithRelations[]> {
    const response = await apiClient.get<CategoryResponse>(
      `${this.baseURL}/search?q=${encodeURIComponent(query)}&includeGlobal=${includeGlobal}`
    )

    if (!response.success || !response.data?.categories) {
      throw new Error(response.error || 'Error al buscar categorías')
    }

    return response.data.categories
  }

  /**
   * Get category hierarchy
   */
  async getHierarchy(type?: CategoryType, includeGlobal = true): Promise<CategoryHierarchy[]> {
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    params.append('includeGlobal', String(includeGlobal))

    const response = await apiClient.get<CategoryResponse>(
      `${this.baseURL}/hierarchy?${params.toString()}`
    )

    if (!response.success || !response.data?.categories) {
      throw new Error(response.error || 'Error al obtener jerarquía')
    }

    return response.data.categories as CategoryHierarchy[]
  }

  /**
   * Get category usage statistics
   */
  async getUsageStats(categoryId: string): Promise<CategoryStats> {
    const response = await apiClient.get<{ success: boolean; data?: CategoryStats; error?: string }>(
      `${this.baseURL}/${categoryId}/stats`
    )

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al obtener estadísticas')
    }

    return response.data
  }

  /**
   * Check category dependencies
   */
  async checkDependencies(categoryId: string): Promise<CategoryDependencies> {
    const response = await apiClient.get<{ success: boolean; data?: CategoryDependencies; error?: string }>(
      `${this.baseURL}/${categoryId}/dependencies`
    )

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Error al verificar dependencias')
    }

    return response.data
  }

  /**
   * Build tree structure from flat category list
   */
  buildTreeStructure(categories: CategoryWithRelations[]): CategoryHierarchy[] {
    const categoryMap = new Map<string, CategoryHierarchy>()
    const rootCategories: CategoryHierarchy[] = []

    // First pass: create map with all categories
    categories.forEach(cat => {
      categoryMap.set(cat.id, {
        ...cat,
        children: [],
        level: 0,
        path: []
      })
    })

    // Second pass: build tree structure
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!
      
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(category)
          category.level = (parent.level || 0) + 1
          category.path = [...(parent.path || []), parent.id]
        } else {
          rootCategories.push(category)
        }
      } else {
        rootCategories.push(category)
      }
    })

    return this.sortTreeNodes(rootCategories)
  }

  /**
   * Sort tree nodes recursively
   */
  private sortTreeNodes(nodes: CategoryHierarchy[]): CategoryHierarchy[] {
    return nodes
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(node => ({
        ...node,
        children: this.sortTreeNodes(node.children || [])
      }))
  }

  /**
   * Flatten tree structure to list
   */
  flattenTree(nodes: CategoryHierarchy[], result: CategoryHierarchy[] = []): CategoryHierarchy[] {
    nodes.forEach(node => {
      result.push(node)
      if (node.children && node.children.length > 0) {
        this.flattenTree(node.children, result)
      }
    })
    return result
  }

  /**
   * Filter categories by search term
   */
  filterBySearchTerm(categories: CategoryWithRelations[], searchTerm: string): CategoryWithRelations[] {
    if (!searchTerm) return categories
    
    const lowerSearch = searchTerm.toLowerCase()
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(lowerSearch)
    )
  }

  /**
   * Check if category is global (system-provided)
   */
  isGlobalCategory(category: Category): boolean {
    return !category.userId
  }

  /**
   * Check if category can be edited
   */
  canEdit(category: Category): boolean {
    return !this.isGlobalCategory(category)
  }

  /**
   * Check if category can be deleted
   */
  canDelete(category: CategoryWithRelations): boolean {
    if (this.isGlobalCategory(category)) return false
    
    const hasTransactions = (category._count?.incomes || 0) + (category._count?.expenses || 0) > 0
    const hasChildren = (category.children?.length || 0) > 0
    const hasBudgets = (category._count?.budgetAllocations || 0) > 0
    
    return !hasTransactions && !hasChildren && !hasBudgets
  }

  /**
   * Validate category name
   */
  validateName(name: string): string | null {
    if (!name || name.trim().length === 0) {
      return 'El nombre es requerido'
    }
    if (name.length > 100) {
      return 'El nombre no puede exceder 100 caracteres'
    }
    return null
  }

  /**
   * Validate hex color
   */
  validateColor(color?: string): string | null {
    if (!color) return null
    
    const hexRegex = /^#[0-9A-F]{6}$/i
    if (!hexRegex.test(color)) {
      return 'Color debe ser formato hexadecimal (#RRGGBB)'
    }
    return null
  }

  /**
   * Sanitize category data before sending to backend
   * Removes empty strings and null values for parentId
   */
  private sanitizeCategoryData<T extends Partial<CategoryCreateDTO | CategoryUpdateDTO>>(data: T): T {
    const cleaned = { ...data }
    
    // Clean up parentId - remove if empty string or null
    if ('parentId' in cleaned && (cleaned.parentId === '' || cleaned.parentId === null)) {
      delete (cleaned as Record<string, unknown>).parentId
    }
    
    // Clean up color - remove if empty string
    if ('color' in cleaned && cleaned.color === '') {
      delete (cleaned as Record<string, unknown>).color
    }
    
    return cleaned
  }
}

export const categoryService = new CategoryService()