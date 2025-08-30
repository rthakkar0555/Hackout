import React, { useState, useEffect } from 'react';
import { 
  ShoppingCartIcon, 
  CreditCardIcon, 
  ChartBarIcon,
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ConsumerPortal = () => {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    purchasedCredits: 0,
    retiredCredits: 0,
    totalSpent: 0
  });

  useEffect(() => {
    fetchConsumerData();
  }, []);

  const fetchConsumerData = async () => {
    try {
      setLoading(true);
      // Mock data for now
      setCredits([
        {
          id: 1,
          amount: 500,
          source: 'Solar',
          date: '2024-01-15',
          status: 'Active',
          value: 2500
        },
        {
          id: 2,
          amount: 300,
          source: 'Wind',
          date: '2024-01-10',
          status: 'Retired',
          value: 1500
        }
      ]);
      
      setStats({
        purchasedCredits: 800,
        retiredCredits: 300,
        totalSpent: 4000
      });
    } catch (error) {
      toast.error('Failed to fetch consumer data');
    } finally {
      setLoading(false);
    }
  };

  const purchaseCredits = async () => {
    try {
      toast.success('Credit purchase initiated');
    } catch (error) {
      toast.error('Failed to purchase credits');
    }
  };

  const retireCredits = async (creditId) => {
    try {
      toast.success('Credits retired successfully');
    } catch (error) {
      toast.error('Failed to retire credits');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">Consumer Portal</h1>
        <p className="text-gray-600 mt-2">Purchase and manage hydrogen credits</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Purchased Credits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.purchasedCredits} kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CreditCardIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Retired Credits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.retiredCredits} kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalSpent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="space-y-4">
          <button
            onClick={purchaseCredits}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ShoppingCartIcon className="h-5 w-5 mr-2" />
            Purchase Credits
          </button>
        </div>
      </div>

      {/* Credits List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Credits</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount (kg)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {credits.map((credit) => (
                <tr key={credit.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{credit.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {credit.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {credit.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {credit.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      credit.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {credit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${credit.value}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {credit.status === 'Active' && (
                      <button
                        onClick={() => retireCredits(credit.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Retire
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConsumerPortal;
