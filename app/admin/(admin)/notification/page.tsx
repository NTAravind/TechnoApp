// app/admin/notifications/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Bell, 
  Send, 
  Users, 
  UserCheck, 
  Target, 
  Calendar,
  TestTube,
  MessageSquare,
  ExternalLink,
  CheckCircle,
  Loader2,
  X,
  Plus
} from 'lucide-react'

import { 
  getCustomerStats,
  getCustomersForTargeting,
  sendAdminNotification,
  sendTestNotification,
  type AdminNotificationData
} from '../../actions/notification'

interface CustomerStats {
  totalCustomers: number
  distributors: number
  regularCustomers: number
  subscribedCustomers: number
  recentOrderCustomers: number
}

interface Customer {
  id: number
  name: string
  phone: string
  email: string | null
  isDistributor: boolean
  hasNotifications: boolean
  lastOrderDate: Date | null
}

export default function AdminNotificationsPage() {
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [sendResult, setSendResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [notification, setNotification] = useState<AdminNotificationData>({
    title: '',
    message: '',
    targetType: 'all',
    specificPhones: [],
    icon: '/icons/admin-notification.png',
    actionUrl: '',
    actionText: '',
    daysBack: 30
  })

  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())
  const [phoneInput, setPhoneInput] = useState('')

  // Load data on component mount
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      const [statsResult, customersResult] = await Promise.all([
        getCustomerStats(),
        getCustomersForTargeting()
      ])

      if (statsResult.success) {
        setStats(statsResult.stats)
      }

      if (customersResult.success) {
        setCustomers(customersResult.customers)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load customer data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendNotification = async () => {
    if (!notification.title || !notification.message) {
      setError('Please fill in title and message')
      return
    }

    if (notification.targetType === 'specific' && selectedCustomers.size === 0) {
      setError('Please select at least one customer for specific targeting')
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const notificationData: AdminNotificationData = {
        ...notification,
        specificPhones: notification.targetType === 'specific' ? Array.from(selectedCustomers) : undefined
      }

      const result = await sendAdminNotification(notificationData)

      if (result.success) {
        setSendResult(result.result)
        setShowSuccess(true)
        
        // Reset form
        setNotification({
          title: '',
          message: '',
          targetType: 'all',
          specificPhones: [],
          icon: '/icons/admin-notification.png',
          actionUrl: '',
          actionText: '',
          daysBack: 30
        })
        setSelectedCustomers(new Set())
        
        setTimeout(() => setShowSuccess(false), 5000)
      } else {
        setError(result.error || 'Failed to send notification')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsSending(false)
    }
  }

  const handleTestNotification = async () => {
    const adminPhone = '1234567890' // Replace with actual admin phone from auth context
    
    try {
      const result = await sendTestNotification(adminPhone, notification)
      if (result.success) {
        alert('Test notification sent! Check your device.')
      } else {
        alert('Failed to send test notification: ' + result.error)
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      alert('Failed to send test notification')
    }
  }

  const addPhoneNumber = () => {
    if (phoneInput && phoneInput.length === 10 && /^\d{10}$/.test(phoneInput)) {
      setSelectedCustomers(prev => new Set([...prev, phoneInput]))
      setPhoneInput('')
    } else {
      setError('Please enter a valid 10-digit phone number')
    }
  }

  const removePhoneNumber = (phone: string) => {
    setSelectedCustomers(prev => {
      const newSet = new Set(prev)
      newSet.delete(phone)
      return newSet
    })
  }

  const getTargetCount = () => {
    if (!stats) return 0
    
    switch (notification.targetType) {
      case 'all': return stats.subscribedCustomers
      case 'distributors': return stats.distributors
      case 'regular': return stats.regularCustomers
      case 'specific': return selectedCustomers.size
      case 'recent_orders': return stats.recentOrderCustomers
      default: return 0
    }
  }

  const targetTypes = [
    { value: 'all' as const, label: 'All Customers', icon: Users, count: stats?.subscribedCustomers || 0 },
    { value: 'distributors' as const, label: 'Distributors Only', icon: UserCheck, count: stats?.distributors || 0 },
    { value: 'regular' as const, label: 'Regular Customers', icon: Users, count: stats?.regularCustomers || 0 },
    { value: 'recent_orders' as const, label: 'Recent Orders', icon: Calendar, count: stats?.recentOrderCustomers || 0 },
    { value: 'specific' as const, label: 'Specific Customers', icon: Target, count: selectedCustomers.size }
  ]

  const templates = [
    {
      title: 'New Product Launch',
      message: 'Discover our latest organic products now available!',
      actionText: 'Shop Now',
      actionUrl: '/products'
    },
    {
      title: 'Special Discount',
      message: 'Get 20% off on your next order. Limited time offer!',
      actionText: 'Claim Discount',
      actionUrl: '/offers'
    },
    {
      title: 'Order Reminder',
      message: 'Don\'t forget to place your weekly order.',
      actionText: 'Order Now',
      actionUrl: '/cart'
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading notification dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
              <p className="text-gray-600">Send notifications to your customers</p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                    <p className="text-sm text-gray-600">Total Customers</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Bell className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.subscribedCustomers}</p>
                    <p className="text-sm text-gray-600">App Devices</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.distributors}</p>
                    <p className="text-sm text-gray-600">Distributors</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.recentOrderCustomers}</p>
                    <p className="text-sm text-gray-600">Recent Orders</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <X className="h-6 w-6 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && sendResult && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">Notification Sent Successfully!</h3>
                <p className="text-green-700 mt-1">
                  "{sendResult.title}" was sent to {sendResult.targetDescription}
                </p>
                <div className="text-sm text-green-600 mt-2">
                  Delivered: {sendResult.sent}/{sendResult.total} recipients
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notification Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Create Notification
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification Title *
                  </label>
                  <input
                    type="text"
                    value={notification.title}
                    onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter notification title..."
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500 mt-1">{notification.title.length}/50 characters</p>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={notification.message}
                    onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Enter your message..."
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">{notification.message.length}/200 characters</p>
                </div>

                {/* Action Button (Optional) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action Button Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={notification.actionText}
                      onChange={(e) => setNotification(prev => ({ ...prev, actionText: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="View Offers"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={notification.actionUrl}
                      onChange={(e) => setNotification(prev => ({ ...prev, actionUrl: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/offers"
                    />
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {targetTypes.map(({ value, label, icon: Icon, count }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setNotification(prev => ({ ...prev, targetType: value }))}
                        className={`p-4 border rounded-lg text-left transition-all ${
                          notification.targetType === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <div>
                            <p className="font-medium">{label}</p>
                            <p className="text-sm opacity-75">{count} recipients</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Customer Selection */}
                {notification.targetType === 'specific' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Customers by Phone Number
                    </label>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter 10-digit phone number"
                          maxLength={10}
                        />
                        <button
                          type="button"
                          onClick={addPhoneNumber}
                          disabled={!phoneInput || phoneInput.length !== 10}
                          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </button>
                      </div>
                      
                      {selectedCustomers.size > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Selected Numbers:</p>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(selectedCustomers).map((phone) => (
                              <span
                                key={phone}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                {phone}
                                <button
                                  type="button"
                                  onClick={() => removePhoneNumber(phone)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Orders Days Filter */}
                {notification.targetType === 'recent_orders' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orders within last (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={notification.daysBack}
                      onChange={(e) => setNotification(prev => ({ ...prev, daysBack: parseInt(e.target.value) || 30 }))}
                      className="w-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">Customers who placed orders in the last {notification.daysBack} days</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    disabled={!notification.title || !notification.message}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <TestTube className="h-4 w-4" />
                    Send Test
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSendNotification}
                    disabled={isSending || !notification.title || !notification.message}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send to {getTargetCount()} Recipients
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview & Info Panel */}
          <div className="space-y-6">
            {/* Preview */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Preview</h3>
              </div>
              <div className="p-4">
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">
                        {notification.title || 'Notification Title'}
                      </p>
                      <p className="text-gray-700 text-sm mt-1">
                        {notification.message || 'Your message will appear here...'}
                      </p>
                      {notification.actionText && notification.actionUrl && (
                        <button className="mt-2 text-blue-600 text-xs font-medium flex items-center gap-1">
                          {notification.actionText}
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Quick Templates</h3>
              </div>
              <div className="p-4 space-y-3">
                {templates.map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setNotification(prev => ({
                      ...prev,
                      title: template.title,
                      message: template.message,
                      actionText: template.actionText,
                      actionUrl: template.actionUrl
                    }))}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-gray-900 text-sm">{template.title}</p>
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">{template.message}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">💡 Tips</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                    <p>Keep titles under 50 characters for better visibility</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                    <p>Messages should be clear and actionable</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                    <p>Test notifications before sending to all customers</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                    <p>Best times: 10-11 AM and 7-8 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Recent Notifications</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="text-center text-gray-500 py-8">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent notifications</p>
                    <p className="text-xs mt-1">Your notification history will appear here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}