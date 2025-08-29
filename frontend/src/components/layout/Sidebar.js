import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  ChartBarIcon,
  CreditCardIcon,
  UserGroupIcon,
  CogIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    {
      name: 'डैशबोर्ड',
      href: '/dashboard',
      icon: HomeIcon,
      roles: ['PRODUCER', 'CERTIFIER', 'CONSUMER', 'REGULATOR']
    },
    {
      name: 'प्रोड्यूसर पोर्टल',
      href: '/producer',
      icon: ChartBarIcon,
      roles: ['PRODUCER']
    },
    {
      name: 'कंज्यूमर पोर्टल',
      href: '/consumer',
      icon: CreditCardIcon,
      roles: ['CONSUMER']
    },
    {
      name: 'ऑडिटर पोर्टल',
      href: '/auditor',
      icon: CheckCircleIcon,
      roles: ['REGULATOR', 'CERTIFIER']
    },
    {
      name: 'क्रेडिट्स',
      href: '/credits',
      icon: DocumentTextIcon,
      roles: ['PRODUCER', 'CERTIFIER', 'CONSUMER', 'REGULATOR']
    },
    {
      name: 'प्रोफाइल',
      href: '/profile',
      icon: UserGroupIcon,
      roles: ['PRODUCER', 'CERTIFIER', 'CONSUMER', 'REGULATOR']
    }
  ];

  const isActive = (href) => {
    return location.pathname === href;
  };

  const canAccess = (item) => {
    return item.roles.includes(user?.role);
  };

  const filteredNavigation = navigation.filter(canAccess);

  return (
    <div className={`bg-white shadow-sm border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Toggle button */}
        <div className="flex justify-end p-4 border-b border-gray-200">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'bg-green-100 text-green-700 border-r-2 border-green-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 ${
                    isActive(item.href)
                      ? 'text-green-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {!isCollapsed && item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-gray-200 p-4">
          {!isCollapsed && (
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">
                    {user?.profile?.firstName?.charAt(0) || user?.username?.charAt(0)}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.profile?.firstName || user?.username}
                  </p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
