'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Check,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { authService } from '@/lib/services/auth.service'

interface RegisterForm {
  displayName: string
  email: string
  password: string
}

interface ValidationErrors {
  displayName?: string
  email?: string
  password?: string
}

export default function Register() {
  const [formData, setFormData] = useState<RegisterForm>({
    displayName: '',
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

    // Display name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required'
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters'
    } else if (formData.displayName.trim().length > 50) {
      newErrors.displayName = 'Display name cannot exceed 50 characters'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }

    return newErrors
  }, [formData])

  // Handle input changes
  const handleInputChange = useCallback(
    (field: keyof RegisterForm, value: string) => {
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
        await authService.register({
          displayName: formData.displayName,
          email: formData.email,
          password: formData.password
        })

        setShowToast({
          type: 'success',
          message:
            'Account created successfully! Please check your email to verify your account before signing in.'
        })

        // Redirect to login after successful registration
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Registration failed. Please try again.'
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

  // Get password strength indicator
  const getPasswordStrength = () => {
    const password = formData.password
    if (!password) return { strength: 0, label: '' }

    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
    const colors = [
      '',
      'text-red-400',
      'text-orange-400',
      'text-yellow-400',
      'text-green-400',
      'text-green-300'
    ]

    return { strength, label: labels[strength], color: colors[strength] }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-gray-400">Join our creator community</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name Input */}
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Display name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={20} className="text-gray-400" />
              </div>
              <input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) =>
                  handleInputChange('displayName', e.target.value)
                }
                className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                  errors.displayName
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                placeholder="Your display name"
                disabled={isLoading}
                maxLength={50}
              />
            </div>
            {errors.displayName && (
              <p className="mt-2 text-sm text-red-400 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.displayName}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              This is how your name will appear to other users
            </p>
          </div>

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
                placeholder="Create a strong password"
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

            {/* Password strength indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        passwordStrength.strength <= 1
                          ? 'bg-red-500'
                          : passwordStrength.strength <= 2
                          ? 'bg-orange-500'
                          : passwordStrength.strength <= 3
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${(passwordStrength.strength / 5) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className={`text-xs ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
              </div>
            )}

            {errors.password && (
              <p className="mt-2 text-sm text-red-400 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.password}
              </p>
            )}

            <div className="mt-2 text-xs text-gray-400">
              <p>Password must contain:</p>
              <ul className="mt-1 space-y-1">
                <li
                  className={`flex items-center ${
                    formData.password.length >= 8 ? 'text-green-400' : ''
                  }`}
                >
                  <span className="mr-1">
                    {formData.password.length >= 8 ? '✓' : '•'}
                  </span>
                  At least 8 characters
                </li>
                <li
                  className={`flex items-center ${
                    /[A-Z]/.test(formData.password) ? 'text-green-400' : ''
                  }`}
                >
                  <span className="mr-1">
                    {/[A-Z]/.test(formData.password) ? '✓' : '•'}
                  </span>
                  One uppercase letter
                </li>
                <li
                  className={`flex items-center ${
                    /[a-z]/.test(formData.password) ? 'text-green-400' : ''
                  }`}
                >
                  <span className="mr-1">
                    {/[a-z]/.test(formData.password) ? '✓' : '•'}
                  </span>
                  One lowercase letter
                </li>
                <li
                  className={`flex items-center ${
                    /\d/.test(formData.password) ? 'text-green-400' : ''
                  }`}
                >
                  <span className="mr-1">
                    {/\d/.test(formData.password) ? '✓' : '•'}
                  </span>
                  One number
                </li>
              </ul>
            </div>
          </div>

          {/* Terms and Privacy */}
          <div className="text-sm text-gray-400">
            By creating an account, you agree to our{' '}
            <Link
              href="/terms"
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              Privacy Policy
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
                Create account
                <ArrowRight size={18} className="ml-2" />
              </>
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-green-400 hover:text-green-300 transition-colors font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Registration Information */}
        <div className="mt-8 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
            <Info size={14} className="mr-2 text-green-400" />
            Registration Information
          </h3>
          <div className="text-xs text-gray-400 space-y-1">
            <p>
              <strong>Email Verification:</strong> Check your email after
              registration to verify your account.
            </p>
            <p>
              <strong>Password Requirements:</strong> Must be at least 8
              characters with uppercase, lowercase, and numbers.
            </p>
            <p>
              <strong>Display Name:</strong> This will be visible to other users
              on the platform.
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
