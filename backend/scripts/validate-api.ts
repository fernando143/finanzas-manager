import axios from 'axios'

const API_BASE = 'http://localhost:3000/api'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

async function validateAPI() {
  console.log('🔍 Starting API Validation...\n')

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...')
    const healthResponse = await axios.get<ApiResponse>(`${API_BASE}/health`)
    console.log('   ✅ Health check passed:', healthResponse.data.data?.status)

    // Test 2: Status Check
    console.log('2. Testing Status Check...')
    const statusResponse = await axios.get<ApiResponse>(`${API_BASE}/status`)
    console.log('   ✅ Status check passed:', statusResponse.data.message)

    // Test 3: User Registration
    console.log('3. Testing User Registration...')
    const userEmail = `test-${Date.now()}@example.com`
    const registerResponse = await axios.post<ApiResponse>(`${API_BASE}/auth/register`, {
      email: userEmail,
      name: 'Test User',
      password: 'password123'
    })
    
    if (registerResponse.data.success) {
      console.log('   ✅ User registration passed')
      const token = registerResponse.data.data.token
      const userId = registerResponse.data.data.user.id
      
      // Test 4: User Login
      console.log('4. Testing User Login...')
      const loginResponse = await axios.post<ApiResponse>(`${API_BASE}/auth/login`, {
        email: userEmail,
        password: 'password123'
      })
      
      if (loginResponse.data.success) {
        console.log('   ✅ User login passed')
        
        // Test 5: Get User Profile
        console.log('5. Testing Get User Profile...')
        const profileResponse = await axios.get<ApiResponse>(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (profileResponse.data.success) {
          console.log('   ✅ Get user profile passed')
          
          // Test 6: Get Categories
          console.log('6. Testing Get Categories...')
          const categoriesResponse = await axios.get<ApiResponse>(`${API_BASE}/categories`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (categoriesResponse.data.success && categoriesResponse.data.data.categories.length > 0) {
            console.log(`   ✅ Get categories passed (${categoriesResponse.data.data.categories.length} categories found)`)
            
            // Create a test category for income (since global categories don't have valid CUIDs)
            console.log('7. Creating Test Category...')
            const categoryResponse = await axios.post<ApiResponse>(`${API_BASE}/categories`, {
              name: 'Test Income Category',
              type: 'INCOME',
              color: '#00FF00'
            }, {
              headers: { Authorization: `Bearer ${token}` }
            })
            
            if (categoryResponse.data.success) {
              console.log('   ✅ Create test category passed')
              const incomeCategory = categoryResponse.data.data.category
              // Test 8: Create Income
              console.log('8. Testing Create Income...')
              const incomeResponse = await axios.post<ApiResponse>(`${API_BASE}/incomes`, {
                description: 'Test Salary',
                amount: 5000,
                categoryId: incomeCategory.id,
                frequency: 'MONTHLY',
                incomeDate: new Date().toISOString(),
                isActive: true
              }, {
                headers: { Authorization: `Bearer ${token}` }
              })
              
              if (incomeResponse.data.success) {
                console.log('   ✅ Create income passed')
                const incomeId = incomeResponse.data.data.income.id
                
                // Test 9: Get Incomes
                console.log('9. Testing Get Incomes...')
                const incomesResponse = await axios.get<ApiResponse>(`${API_BASE}/incomes`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
                
                if (incomesResponse.data.success && incomesResponse.data.data.incomes.length > 0) {
                  console.log(`   ✅ Get incomes passed (${incomesResponse.data.data.incomes.length} incomes found)`)
                  
                  // Test 10: Update Income
                  console.log('10. Testing Update Income...')
                  const updateResponse = await axios.put<ApiResponse>(`${API_BASE}/incomes/${incomeId}`, {
                    description: 'Updated Test Salary',
                    amount: 5500
                  }, {
                    headers: { Authorization: `Bearer ${token}` }
                  })
                  
                  if (updateResponse.data.success) {
                    console.log('   ✅ Update income passed')
                    
                    // Test 11: Search Incomes
                    console.log('11. Testing Search Incomes...')
                    const searchResponse = await axios.get<ApiResponse>(`${API_BASE}/incomes/search?q=Updated`, {
                      headers: { Authorization: `Bearer ${token}` }
                    })
                    
                    if (searchResponse.data.success) {
                      console.log('   ✅ Search incomes passed')
                      
                      // Test 12: Delete Income
                      console.log('12. Testing Delete Income...')
                      const deleteResponse = await axios.delete<ApiResponse>(`${API_BASE}/incomes/${incomeId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                      })
                      
                      if (deleteResponse.data.success) {
                        console.log('   ✅ Delete income passed')
                      } else {
                        console.log('   ❌ Delete income failed:', deleteResponse.data.error)
                      }
                    } else {
                      console.log('   ❌ Search incomes failed:', searchResponse.data.error)
                    }
                  } else {
                    console.log('   ❌ Update income failed:', updateResponse.data.error)
                  }
                } else {
                  console.log('   ❌ Get incomes failed:', incomesResponse.data.error)
                }
              } else {
                console.log('   ❌ Create income failed:', incomeResponse.data.error)
              }
            } else {
              console.log('   ⚠️  No income category found for testing')
            }
          } else {
            console.log('   ❌ Get categories failed:', categoriesResponse.data.error)
          }
        } else {
          console.log('   ❌ Get user profile failed:', profileResponse.data.error)
        }
      } else {
        console.log('   ❌ User login failed:', loginResponse.data.error)
      }
    } else {
      console.log('   ❌ User registration failed:', registerResponse.data.error)
    }

    console.log('\n🎉 API Validation completed!')

  } catch (error: any) {
    console.error('❌ API Validation failed:', error.response?.data || error.message)
    process.exit(1)
  }
}

// Execute validation
validateAPI()