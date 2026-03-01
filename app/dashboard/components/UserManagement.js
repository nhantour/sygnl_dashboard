'use client'

import { useState } from 'react'
import { 
  Users, 
  UserPlus, 
  Shield, 
  Key, 
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Mail,
  Phone,
  Globe
} from 'lucide-react'

const usersData = [
  {
    id: 1,
    name: 'Alex Johnson',
    email: 'alex@sygnl.ai',
    role: 'Admin',
    status: 'active',
    lastActive: '2 minutes ago',
    permissions: ['Full Access', 'API Keys', 'User Management'],
    plan: 'Enterprise',
    joinDate: '2024-01-15',
    avatarColor: 'bg-gradient-to-br from-accent-primary/20 to-pink-600/20 text-accent-primary'
  },
  {
    id: 2,
    name: 'Sarah Chen',
    email: 'sarah@tradingfirm.com',
    role: 'Trader',
    status: 'active',
    lastActive: '15 minutes ago',
    permissions: ['Trading', 'Portfolio View', 'Signal Access'],
    plan: 'Pro',
    joinDate: '2024-02-01',
    avatarColor: 'bg-gradient-to-br from-accent-secondary/20 to-teal-600/20 text-accent-secondary'
  },
  {
    id: 3,
    name: 'Marcus Rodriguez',
    email: 'marcus@quantfund.io',
    role: 'Analyst',
    status: 'active',
    lastActive: '1 hour ago',
    permissions: ['Analytics', 'Reports', 'Data Export'],
    plan: 'Enterprise',
    joinDate: '2024-01-20',
    avatarColor: 'bg-gradient-to-br from-accent-tertiary/20 to-blue-600/20 text-accent-tertiary'
  },
  {
    id: 4,
    name: 'Jamie Wilson',
    email: 'jamie@investments.com',
    role: 'Viewer',
    status: 'inactive',
    lastActive: '3 days ago',
    permissions: ['Read Only', 'Dashboard View'],
    plan: 'Basic',
    joinDate: '2024-02-10',
    avatarColor: 'bg-gradient-to-br from-warning/20 to-amber-600/20 text-warning'
  },
  {
    id: 5,
    name: 'Taylor Kim',
    email: 'taylor@hedgefund.ai',
    role: 'Developer',
    status: 'active',
    lastActive: 'Just now',
    permissions: ['API Access', 'Webhooks', 'Integration'],
    plan: 'Enterprise',
    joinDate: '2024-01-25',
    avatarColor: 'bg-gradient-to-br from-success/20 to-emerald-600/20 text-success'
  },
  {
    id: 6,
    name: 'Jordan Lee',
    email: 'jordan@startup.co',
    role: 'Trader',
    status: 'pending',
    lastActive: 'Never',
    permissions: ['Pending Approval'],
    plan: 'Trial',
    joinDate: '2024-02-16',
    avatarColor: 'bg-gradient-to-br from-zinc-500/20 to-gray-600/20 text-zinc-400'
  }
]

const apiKeysData = [
  {
    id: 1,
    name: 'Production API',
    key: 'sk_live_...8f9g0h1i2j',
    permissions: ['read', 'write', 'execute'],
    created: '2024-01-15',
    lastUsed: '2 minutes ago',
    status: 'active'
  },
  {
    id: 2,
    name: 'Development',
    key: 'sk_test_...3k4l5m6n7o',
    permissions: ['read', 'write'],
    created: '2024-02-01',
    lastUsed: '1 hour ago',
    status: 'active'
  },
  {
    id: 3,
    name: 'Webhook Integration',
    key: 'sk_wh_...8p9q0r1s2t',
    permissions: ['read'],
    created: '2024-01-20',
    lastUsed: '3 days ago',
    status: 'revoked'
  }
]

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('users')
  const [showAddUser, setShowAddUser] = useState(false)
  const [showAddApiKey, setShowAddApiKey] = useState(false)

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-success'
      case 'inactive': return 'text-error'
      case 'pending': return 'text-warning'
      default: return 'text-zinc-500'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'inactive': return <XCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return null
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-accent-primary/20 text-accent-primary border-accent-primary/30'
      case 'Trader': return 'bg-accent-secondary/20 text-accent-secondary border-accent-secondary/30'
      case 'Analyst': return 'bg-accent-tertiary/20 text-accent-tertiary border-accent-tertiary/30'
      case 'Developer': return 'bg-success/20 text-success border-success/30'
      default: return 'bg-white/10 text-zinc-400 border-white/20'
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-surface/50 backdrop-blur-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h3 className="font-semibold">User Management</h3>
            <div className="text-sm text-zinc-500">
              Manage users, roles, and API access
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {['users', 'api', 'roles', 'audit'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  activeTab === tab
                    ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <button 
            onClick={() => activeTab === 'users' ? setShowAddUser(true) : setShowAddApiKey(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg gradient-accent text-white text-sm hover:shadow-lg hover:shadow-accent-primary/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add {activeTab === 'users' ? 'User' : 'API Key'}
          </button>
        </div>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border border-white/5 bg-black/30 p-4">
              <div className="text-sm text-zinc-500 mb-1">Total Users</div>
              <div className="text-2xl font-bold">{usersData.length}</div>
              <div className="text-xs text-zinc-600 mt-1">6 active • 1 pending</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/30 p-4">
              <div className="text-sm text-zinc-500 mb-1">Active Sessions</div>
              <div className="text-2xl font-bold">4</div>
              <div className="text-xs text-zinc-600 mt-1">Now online</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/30 p-4">
              <div className="text-sm text-zinc-500 mb-1">Plans</div>
              <div className="text-2xl font-bold">3</div>
              <div className="text-xs text-zinc-600 mt-1">Enterprise: 3 • Pro: 1 • Basic: 1</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/30 p-4">
              <div className="text-sm text-zinc-500 mb-1">Avg. Activity</div>
              <div className="text-2xl font-bold">8.2h</div>
              <div className="text-xs text-zinc-600 mt-1">Daily per user</div>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-xl border border-white/5 bg-black/30 overflow-hidden">
            <div className="border-b border-white/5 p-4">
              <h4 className="font-medium">All Users</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-3 text-sm font-medium text-zinc-500">User</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-500">Role</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-500">Status</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-500">Plan</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-500">Last Active</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${user.avatarColor}`}>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-zinc-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className={`flex items-center gap-2 ${getStatusColor(user.status)}`}>
                          {getStatusIcon(user.status)}
                          <span className="capitalize">{user.status}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.plan === 'Enterprise' ? 'bg-accent-primary/20 text-accent-primary' :
                          user.plan === 'Pro' ? 'bg-accent-secondary/20 text-accent-secondary' :
                          'bg-white/10 text-zinc-400'
                        }`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-zinc-400">{user.lastActive}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 hover:bg-white/10 rounded" title="Edit">
                            <Edit className="w-4 h-4 text-zinc-400" />
                          </button>
                          <button className="p-1.5 hover:bg-error/10 rounded" title="Delete">
                            <Trash2 className="w-4 h-4 text-error" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Permissions Summary */}
          <div className="mt-6 p-4 rounded-xl gradient-accent/10 border border-accent-primary/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-accent-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-accent-primary mb-1">Permissions Overview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {['Full Access', 'Trading', 'Analytics', 'API Access'].map((perm) => (
                    <div key={perm} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent-primary" />
                      <span className="text-sm">{perm}</span>
                      <span className="text-xs text-zinc-600">
                        ({usersData.filter(u => u.permissions.includes(perm)).length})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api' && (
        <>
          <div className="rounded-xl border border-white/5 bg-black/30 overflow-hidden mb-6">
            <div className="border-b border-white/5 p-4 flex items-center justify-between">
              <h4 className="font-medium">API Keys</h4>
              <div className="text-sm text-zinc-500">
                <Shield className="w-4 h-4 inline mr-1" />
                Keep your keys secure
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-3 text-sm font-medium text-zinc-500">Name</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-500">Key</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-500">Permissions</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-500">Created</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-500">Last Used</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-500">Status</th>
                    <th className="text-left p-3 text-sm font-medium text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeysData.map((key) => (
                    <tr key={key.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-medium">{key.name}</td>
                      <td className="p-3">
                        <code className="text-sm font-mono bg-black/50 px-2 py-1 rounded">
                          {key.key}
                        </code>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {key.permissions.map((perm, idx) => (
                            <span key={idx} className="px-2 py-1 rounded text-xs bg-white/10 text-zinc-400">
                              {perm}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-zinc-400">{key.created}</td>
                      <td className="p-3 text-sm text-zinc-400">{key.lastUsed}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          key.status === 'active' ? 'bg-success/20 text-success' :
                          key.status === 'revoked' ? 'bg-error/20 text-error' :
                          'bg-warning/20 text-warning'
                        }`}>
                          {key.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 hover:bg-white/10 rounded" title="Copy">
                            <Key className="w-4 h-4 text-zinc-400" />
                          </button>
                          <button className="p-1.5 hover:bg-error/10 rounded" title="Revoke">
                            <XCircle className="w-4 h-4 text-error" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* API Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/5 bg-black/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-zinc-500">API Calls Today</div>
                <Globe className="w-4 h-4 text-accent-primary" />
              </div>
              <div className="text-2xl font-bold">12,847</div>
              <div className="text-xs text-zinc-600 mt-1">+24% from yesterday</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-zinc-500">Success Rate</div>
                <CheckCircle className="w-4 h-4 text-success" />
              </div>
              <div className="text-2xl font-bold text-success">99.8%</div>
              <div className="text-xs text-zinc-600 mt-1">42 errors in 24h</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-zinc-500">Avg Response Time</div>
                <Clock className="w-4 h-4 text-accent-secondary" />
              </div>
              <div className="text-2xl font-bold">68ms</div>
              <div className="text-xs text-zinc-600 mt-1">P95: 142ms</div>
            </div>
          </div>

          {/* API Security Tips */}
          <div className="mt-6 p-4 rounded-xl bg-error/10 border border-error/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-error mt-0.5" />
              <div>
                <h4 className="font-medium text-error mb-1">API Security Reminder</h4>
                <p className="text-sm text-zinc-300">
                  Never share API keys in client-side code. Use environment variables and rotate keys regularly. 
                  Monitor usage patterns for suspicious activity. Revoke unused keys immediately.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-500 mb-1">Full Name</label>
                <input type="text" className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3" />
              </div>
              <div>
                <label className="block text-sm text-zinc-500 mb-1">Email</label>
                <input type="email" className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3" />
              </div>
              <div>
                <label className="block text-sm text-zinc-500 mb-1">Role</label>
                <select className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3">
                  <option>Admin</option>
                  <option>Trader</option>
                  <option>Analyst</option>
                  <option>Viewer</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 py-2 rounded-lg gradient-accent text-white hover:shadow-lg hover:shadow-accent-primary/20 transition-all">
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}