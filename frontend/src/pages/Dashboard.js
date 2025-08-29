import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  ChartBarIcon,
  CreditCardIcon,
  UserGroupIcon,
  GlobeAltIcon,
  TrendingUpIcon,
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
        const [statsResponse, creditsResponse] = await Promise.all([
          axios.get('/api/credits/statistics'),
          axios.get('/api/credits/my-credits?limit=5')
        ]);

        setStats(statsResponse.data.statistics);
        setRecentCredits(creditsResponse.data.credits);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
              स्वागत है, {user?.profile?.firstName || user?.username}!
            </h1>
            <p className="mt-2 text-gray-600">
              आपका Green Hydrogen Credit Dashboard
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
            title="कुल क्रेडिट्स"
            value={stats.totalCredits?.toLocaleString() || '0'}
            icon={CreditCardIcon}
            color="bg-green-500"
            change={12}
          />
          <StatCard
            title="एक्टिव क्रेडिट्स"
            value={stats.activeCredits?.toLocaleString() || '0'}
            icon={CheckCircleIcon}
            color="bg-blue-500"
            change={8}
          />
          <StatCard
            title="कुल हाइड्रोजन (kg)"
            value={stats.totalHydrogen?.toLocaleString() || '0'}
            icon={GlobeAltIcon}
            color="bg-purple-500"
            change={15}
          />
          <StatCard
            title="रिटायर्ड क्रेडिट्स"
            value={stats.retiredCredits?.toLocaleString() || '0'}
            icon={TrendingUpIcon}
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
              title="नए क्रेडिट्स रिक्वेस्ट करें"
              description="अपने हाइड्रोजन प्रोडक्शन के लिए क्रेडिट्स जारी करने का अनुरोध करें"
              icon={ChartBarIcon}
              color="bg-green-500"
              onClick={() => window.location.href = '/producer'}
            />
            <QuickActionCard
              title="प्रोडक्शन रिपोर्ट्स"
              description="अपने प्रोडक्शन डेटा और क्रेडिट्स का विश्लेषण देखें"
              icon={TrendingUpIcon}
              color="bg-blue-500"
              onClick={() => window.location.href = '/credits'}
            />
          </>
        )}

        {user?.role === 'CERTIFIER' && (
          <>
            <QuickActionCard
              title="क्रेडिट्स जारी करें"
              description="प्रोड्यूसर्स के लिए नए हाइड्रोजन क्रेडिट्स जारी करें"
              icon={CreditCardIcon}
              color="bg-blue-500"
              onClick={() => window.location.href = '/credits'}
            />
            <QuickActionCard
              title="वेरिफिकेशन"
              description="क्रेडिट्स की वैधता और मेटाडेटा की जांच करें"
              icon={CheckCircleIcon}
              color="bg-green-500"
              onClick={() => window.location.href = '/auditor'}
            />
          </>
        )}

        {user?.role === 'CONSUMER' && (
          <>
            <QuickActionCard
              title="क्रेडिट्स खरीदें"
              description="उपलब्ध हाइड्रोजन क्रेडिट्स को खरीदें और ट्रांसफर करें"
              icon={CreditCardIcon}
              color="bg-purple-500"
              onClick={() => window.location.href = '/consumer'}
            />
            <QuickActionCard
              title="क्रेडिट्स रिटायर करें"
              description="अपने क्रेडिट्स को रिटायर करें और कार्बन फुटप्रिंट कम करें"
              icon={CheckCircleIcon}
              color="bg-green-500"
              onClick={() => window.location.href = '/consumer'}
            />
          </>
        )}

        {user?.role === 'REGULATOR' && (
          <>
            <QuickActionCard
              title="सिस्टम ऑडिट"
              description="पूरे सिस्टम का ऑडिट और क्रेडिट्स की ट्रैकिंग करें"
              icon={InformationCircleIcon}
              color="bg-red-500"
              onClick={() => window.location.href = '/auditor'}
            />
            <QuickActionCard
              title="यूजर मैनेजमेंट"
              description="सभी यूजर्स और उनकी भूमिकाओं का प्रबंधन करें"
              icon={UserGroupIcon}
              color="bg-blue-500"
              onClick={() => window.location.href = '/profile'}
            />
          </>
        )}

        {/* Common Actions */}
        <QuickActionCard
          title="प्रोफाइल अपडेट करें"
          description="अपनी प्रोफाइल जानकारी और सेटिंग्स अपडेट करें"
          icon={UserGroupIcon}
          color="bg-gray-500"
          onClick={() => window.location.href = '/profile'}
        />
      </div>

      {/* Recent Credits */}
      {recentCredits.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">हाल के क्रेडिट्स</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    क्रेडिट ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    प्रोड्यूसर
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    स्रोत
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    मात्रा
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    स्थिति
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    तिथि
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
                        {credit.isRetired ? 'रिटायर्ड' : 'एक्टिव'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(credit.createdAt).toLocaleDateString('hi-IN')}
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">सिस्टम स्थिति</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">ब्लॉकचेन नेटवर्क</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">API सर्वर</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">डेटाबेस</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
