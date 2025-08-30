import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  DocumentCheckIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AuditorPortal = () => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAudits: 0,
    verifiedCredits: 0,
    pendingAudits: 0
  });

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      // Mock data for now
      setAudits([
        {
          id: 1,
          creditId: 'CR001',
          producer: 'ABC Solar Farm',
          amount: 1000,
          source: 'Solar',
          date: '2024-01-15',
          status: 'Verified',
          auditor: 'John Doe'
        },
        {
          id: 2,
          creditId: 'CR002',
          producer: 'XYZ Wind Farm',
          amount: 500,
          source: 'Wind',
          date: '2024-01-10',
          status: 'Pending',
          auditor: 'Jane Smith'
        }
      ]);
      
      setStats({
        totalAudits: 50,
        verifiedCredits: 45,
        pendingAudits: 5
      });
    } catch (error) {
      toast.error('Failed to fetch audit data');
    } finally {
      setLoading(false);
    }
  };

  const verifyCredit = async (auditId) => {
    try {
      toast.success('Credit verified successfully');
    } catch (error) {
      toast.error('Failed to verify credit');
    }
  };

  const rejectCredit = async (auditId) => {
    try {
      toast.success('Credit rejected');
    } catch (error) {
      toast.error('Failed to reject credit');
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
        <h1 className="text-2xl font-bold text-gray-900">Auditor Portal</h1>
        <p className="text-gray-600 mt-2">Verify and audit hydrogen credits</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DocumentCheckIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Audits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAudits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verified Credits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.verifiedCredits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Audits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingAudits}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Audit Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Audit ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producer
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
                  Auditor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {audits.map((audit) => (
                <tr key={audit.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{audit.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {audit.creditId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {audit.producer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {audit.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {audit.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {audit.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      audit.status === 'Verified' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {audit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {audit.auditor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {audit.status === 'Pending' && (
                      <div className="space-x-2">
                        <button
                          onClick={() => verifyCredit(audit.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => rejectCredit(audit.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </div>
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

export default AuditorPortal;
