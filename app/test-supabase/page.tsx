'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SupabaseTest() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runTests = async () => {
    setLoading(true)
    setTestResults([])
    
    addResult('Starting Supabase connection tests...')
    
    // Test 1: Check environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    addResult(`Environment URL: ${url ? '✅ Set' : '❌ Missing'}`)
    addResult(`Environment Key: ${key ? '✅ Set' : '❌ Missing'}`)
    
    if (!url || !key) {
      addResult('❌ Environment variables not properly configured')
      setLoading(false)
      return
    }
    
    // Test 2: Test basic connection
    try {
      addResult('Testing basic connection...')
      const { data, error } = await supabase.from('users').select('count')
      
      if (error) {
        addResult(`❌ Connection failed: ${error.message}`)
      } else {
        addResult('✅ Basic connection successful')
      }
    } catch (err: any) {
      addResult(`❌ Connection error: ${err.message}`)
    }
    
    // Test 3: Test auth
    try {
      addResult('Testing auth service...')
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        addResult(`❌ Auth test failed: ${error.message}`)
      } else {
        addResult('✅ Auth service working')
      }
    } catch (err: any) {
      addResult(`❌ Auth error: ${err.message}`)
    }
    
    setLoading(false)
    addResult('Tests completed!')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2">
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_URL:</strong> 
              <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> 
              <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <button
            onClick={runTests}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Running Tests...' : 'Run Connection Tests'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-1">
            {testResults.length === 0 ? (
              <p className="text-gray-500">Click "Run Connection Tests" to see results</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="font-mono text-sm">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Common Issues:</h3>
          <ul className="list-disc list-inside text-yellow-700 space-y-1">
            <li>Make sure your .env.local file is in the project root</li>
            <li>Restart your development server after adding environment variables</li>
            <li>Check that your Supabase project URL and key are correct</li>
            <li>Ensure your Supabase project is active and not paused</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
