import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../../types/api'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔐 Initializing authentication...')
      
      // Check if user is already logged in (stored in localStorage)
      const storedUser = localStorage.getItem('user')
      const storedToken = localStorage.getItem('auth_token')
      
      if (storedUser && storedToken) {
        console.log('👤 Found stored user, restoring session...')
        
        console.log('🔗 Setting auth token for API client...')
        const { apiClient } = await import('../services/api/client.service')
        apiClient.setAuthToken(storedToken)
        
        // Verify token is still valid by calling /auth/me endpoint
        try {
          const verifyResponse = await apiClient.get<User>('/auth/me')
          
          if (verifyResponse.success && verifyResponse.data) {
            console.log('✅ Token verified successfully for user:', verifyResponse.data.email)
            setUser(verifyResponse.data)
            // Update stored user data in case it changed
            localStorage.setItem('user', JSON.stringify(verifyResponse.data))
          } else {
            console.log('❌ Token verification failed:', verifyResponse.error)
            // Clear invalid session
            localStorage.removeItem('user')
            localStorage.removeItem('auth_token')
            apiClient.clearAuthToken()
          }
        } catch (error) {
          console.error('💥 Token verification failed:', error)
          // Clear invalid session
          localStorage.removeItem('user')
          localStorage.removeItem('auth_token')
          apiClient.clearAuthToken()
        }
      } else {
        console.log('🚫 No stored user or token found')
      }
      setIsLoading(false)
    }
    
    initializeAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      console.log('🔐 Attempting login for:', email)
      
      // Import API client for authentication
      const { apiClient } = await import('../services/api/client.service')
      
      // Call real backend login endpoint
      const response = await apiClient.post<{ user: User; token: string }>('/auth/login', {
        email,
        password
      })
      
      if (response.success && response.data) {
        const { user, token } = response.data
        
        console.log('🔑 Login successful, received token for user:', user.email)
        
        // Set authentication token in API client
        apiClient.setAuthToken(token)
        
        // Store user data and token in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('auth_token', token)
        
        setUser(user)
        console.log('✅ Login successful for:', user.email)
        return true
      } else {
        console.log('❌ Login failed:', response.error)
        return false
      }
    } catch (error) {
      console.error('💥 Login failed with exception:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      console.log('🔐 Attempting registration for:', email)
      
      // Import API client for authentication
      const { apiClient } = await import('../services/api/client.service')
      
      // Call real backend register endpoint
      const response = await apiClient.post<{ user: User; token: string }>('/auth/register', {
        email,
        password,
        name
      })
      
      if (response.success && response.data) {
        const { user, token } = response.data
        
        console.log('🔑 Registration successful, received token for user:', user.email)
        
        // Set authentication token in API client
        apiClient.setAuthToken(token)
        
        // Store user data and token in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('auth_token', token)
        
        setUser(user)
        console.log('✅ Registration successful for:', user.email)
        return true
      } else {
        console.log('❌ Registration failed:', response.error)
        return false
      }
    } catch (error) {
      console.error('💥 Registration failed with exception:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    console.log('🚪 Logging out user...')
    
    // Clear authentication token from client.service.ts
    import('../services/api/client.service').then(({ apiClient }) => {
      // Call logout endpoint if user is authenticated
      if (user) {
        apiClient.post('/auth/logout', {}).catch(error => {
          console.warn('⚠️ Logout API call failed:', error)
        })
      }
      
      apiClient.clearAuthToken()
      console.log('🔑 Auth token cleared from API client')
    })
    
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('auth_token')
    console.log('🧹 User data and auth token removed from localStorage')
  }

  const value = {
    user,
    login,
    register,
    logout,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}