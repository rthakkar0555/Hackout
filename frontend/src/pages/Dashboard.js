import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  ChartBarIcon,
  CreditCardIcon,
  UserGroupIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentCredits, setRecentCredits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching dashboard data...');
        console.log('Current token:', localStorage.getItem('token')?.substring(0, 20) + '...');
        
        const [statsResponse, creditsResponse] = await Promise.all([
          axios.get('/api/credits/statistics'),
          axios.get('/api/credits/my-credits?limit=5')
        ]);

        console.log('Dashboard data fetched successfully');
        setStats(statsResponse.data.statistics);
        setRecentCredits(creditsResponse.data.credits);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Set default values instead of leaving them null
        setStats({
          totalCredits: 0,
          totalHydrogen: 0,
          activeCredits: 0,
          retiredCredits: 0
        });
        setRecentCredits([]);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if user is authenticated
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getRoleColor = (role) => {
    switch (role) {
      case 'PRODUCER':
        return 'bg-green-100 text-green-800';
      case 'CERTIFIER':
        return 'bg-blue-100 text-blue-800';
      case 'CONSUMER':
        return 'bg-purple-100 text-purple-800';
      case 'REGULATOR':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'PRODUCER':
        return '🌱';
      case 'CERTIFIER':
        return '🔍';
      case 'CONSUMER':
        return '🏭';
      case 'REGULATOR':
        return '⚖️';
      default:
        return '👤';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'bg-blue-500', change }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, onClick, color = 'bg-blue-500' }) => (
    <div 
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className={`p-3 rounded-full ${color} bg-opacity-10 w-fit`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
                         <h1 className="text-3xl font-bold text-gray-900">
               Welcome, {user?.profile?.firstName || user?.username}!
             </h1>
             <p className="mt-2 text-gray-600">
               Your Green Hydrogen Credit Dashboard
             </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user?.role)}`}>
              {getRoleIcon(user?.role)} {user?.role}
            </span>
            <div className="text-right">
              <p className="text-sm text-gray-600">Wallet Address</p>
              <p className="text-sm font-mono text-gray-900">
                {user?.walletAddress?.slice(0, 6)}...{user?.walletAddress?.slice(-4)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <StatCard
             title="Total Credits"
             value={stats.totalCredits?.toLocaleString() || '0'}
             icon={CreditCardIcon}
             color="bg-green-500"
             change={12}
           />
           <StatCard
             title="Active Credits"
             value={stats.activeCredits?.toLocaleString() || '0'}
             icon={CheckCircleIcon}
             color="bg-blue-500"
             change={8}
           />
           <StatCard
             title="Total Hydrogen (kg)"
             value={stats.totalHydrogen?.toLocaleString() || '0'}
             icon={GlobeAltIcon}
             color="bg-purple-500"
             change={15}
           />
           <StatCard
             title="Retired Credits"
             value={stats.retiredCredits?.toLocaleString() || '0'}
             icon={ArrowTrendingUpIcon}
             color="bg-orange-500"
             change={-5}
           />
        </div>
      )}

      {/* Role-based Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {user?.role === 'PRODUCER' && (
          <>
                         <QuickActionCard
               title="Request New Credits"
               description="Request credit issuance for your hydrogen production"
               icon={ChartBarIcon}
               color="bg-green-500"
               onClick={() => window.location.href = '/producer'}
             />
             <QuickActionCard
               title="Production Reports"
               description="View analysis of your production data and credits"
               icon={ArrowTrendingUpIcon}
               color="bg-blue-500"
               onClick={() => window.location.href = '/credits'}
             />
          </>
        )}

        {user?.role === 'CERTIFIER' && (
          <>
                         <QuickActionCard
               title="Issue Credits"
               description="Issue new hydrogen credits for producers"
               icon={CreditCardIcon}
               color="bg-blue-500"
               onClick={() => window.location.href = '/credits'}
             />
             <QuickActionCard
               title="Verification"
               description="Check credit validity and metadata"
               icon={CheckCircleIcon}
               color="bg-green-500"
               onClick={() => window.location.href = '/auditor'}
             />
          </>
        )}

        {user?.role === 'CONSUMER' && (
          <>
                         <QuickActionCard
               title="Purchase Credits"
               description="Buy and transfer available hydrogen credits"
               icon={CreditCardIcon}
               color="bg-purple-500"
               onClick={() => window.location.href = '/consumer'}
             />
             <QuickActionCard
               title="Retire Credits"
               description="Retire your credits and reduce carbon footprint"
               icon={CheckCircleIcon}
               color="bg-green-500"
               onClick={() => window.location.href = '/consumer'}
             />
          </>
        )}

        {user?.role === 'REGULATOR' && (
          <>
                         <QuickActionCard
               title="System Audit"
               description="Audit the entire system and track credits"
               icon={InformationCircleIcon}
               color="bg-red-500"
               onClick={() => window.location.href = '/auditor'}
             />
             <QuickActionCard
               title="User Management"
               description="Manage all users and their roles"
               icon={UserGroupIcon}
               color="bg-blue-500"
               onClick={() => window.location.href = '/profile'}
             />
          </>
        )}

        {/* Common Actions */}
                 <QuickActionCard
           title="Update Profile"
           description="Update your profile information and settings"
           icon={UserGroupIcon}
           color="bg-gray-500"
           onClick={() => window.location.href = '/profile'}
         />
      </div>

      {/* Recent Credits */}
      {recentCredits.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
                         <h3 className="text-lg font-medium text-gray-900">Recent Credits</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Credit ID
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Producer
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Source
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Amount
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Status
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Date
                   </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentCredits.map((credit) => (
                  <tr key={credit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{credit.creditId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {credit.producer?.username || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {credit.renewableSourceType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {credit.creditAmount?.toLocaleString()} credits
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        credit.isRetired 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                                                 {credit.isRetired ? 'Retired' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                             {new Date(credit.createdAt).toLocaleDateString('en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
                 <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="flex items-center space-x-3">
             <div className="w-3 h-3 bg-green-500 rounded-full"></div>
             <span className="text-sm text-gray-600">Blockchain Network</span>
           </div>
           <div className="flex items-center space-x-3">
             <div className="w-3 h-3 bg-green-500 rounded-full"></div>
             <span className="text-sm text-gray-600">API Server</span>
           </div>
           <div className="flex items-center space-x-3">
             <div className="w-3 h-3 bg-green-500 rounded-full"></div>
             <span className="text-sm text-gray-600">Database</span>
           </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
