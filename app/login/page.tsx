'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Check,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { authService } from '@/lib/services/auth.service'

interface LoginForm {
  email: string
  password: string
}

interface ValidationErrors {
  email?: string
  password?: string
}

export default function Login() {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [showToast, setShowToast] = useState<{
    type: 'info' | 'warning' | 'error' | 'success'
    message: string
  } | null>(null)

  const router = useRouter()

  // Form validation
  const validateForm = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    return newErrors
  }, [formData])

  // Handle input changes
  const handleInputChange = useCallback(
    (field: keyof LoginForm, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value
      }))

      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined
        }))
      }
    },
    [errors]
  )

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const validationErrors = validateForm()
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }

      setIsLoading(true)
      setErrors({})

      try {
        // Call the real API service
        const response = await authService.login(
          formData.email,
          formData.password
        )

        if (response.access_token) {
          setShowToast({
            type: 'success',
            message: 'Login successful! Redirecting...'
          })

          // Redirect to dashboard after successful login
          setTimeout(() => {
            router.push('/')
          }, 1500)
        } else {
          throw new Error('No access token received')
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Login failed. Please try again.'
        setShowToast({
          type: 'error',
          message: errorMessage
        })
        setTimeout(() => setShowToast(null), 4000)
      } finally {
        setIsLoading(false)
      }
    },
    [formData, validateForm, router]
  )

  // Toggle password visibility
  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={20} className="text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-400 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={20} className="text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                  errors.password
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleTogglePassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-400 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 text-black font-semibold py-3 px-4 rounded-lg hover:bg-green-400 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight size={18} className="ml-2" />
              </>
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="text-green-400 hover:text-green-300 transition-colors font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* API Information */}
        <div className="mt-8 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
            <Info size={14} className="mr-2 text-green-400" />
            Login Information
          </h3>
          <div className="text-xs text-gray-400 space-y-1">
            <p>Use the email and password from your registered account.</p>
            <p>
              <strong>Note:</strong> You must verify your email before logging
              in.
            </p>
            <p>
              If you forgot your password, use the forgot password link above.
            </p>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md animate-fade-in z-50 ${
            showToast.type === 'success'
              ? 'bg-green-900/80 text-white border border-green-500/30'
              : showToast.type === 'info'
              ? 'bg-blue-900/80 text-white border border-blue-500/30'
              : showToast.type === 'warning'
              ? 'bg-yellow-900/80 text-white border border-yellow-500/30'
              : 'bg-red-900/80 text-white border border-red-500/30'
          }`}
          role="status"
          aria-live="polite"
        >
          {showToast.type === 'success' && (
            <Check size={20} className="text-green-400" />
          )}
          {showToast.type === 'info' && (
            <Info size={20} className="text-blue-400" />
          )}
          {showToast.type === 'warning' && (
            <AlertCircle size={20} className="text-yellow-400" />
          )}
          {showToast.type === 'error' && (
            <AlertCircle size={20} className="text-red-400" />
          )}
          <div className="flex-1">{showToast.message}</div>
        </div>
      )}
    </div>
  )
}
