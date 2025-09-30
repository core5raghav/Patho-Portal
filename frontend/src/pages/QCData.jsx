import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Target,
  Activity,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { qcTests } from '../data/qcData';
import LayoutShell from "../components/layout/LayoutShell";

const QCData = () => {
  const [timeFilter, setTimeFilter] = useState('Today');
  const [testTypeFilter, setTestTypeFilter] = useState('All Tests');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const qcMetrics = [
    {
      title: 'QC Tests Today',
      value: 12,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+8.3%',
      trend: 'up'
    },
    {
      title: 'Tests Passed',
      value: 10,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+5.2%',
      trend: 'up'
    },
    {
      title: 'Tests Failed',
      value: 2,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: '-2.1%',
      trend: 'down'
    },
    {
      title: 'Success Rate',
      value: '83.3%',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+1.5%',
      trend: 'up'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Passed':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeviationColor = (deviation) => {
    const value = parseFloat(deviation.replace('%', '').replace('+', ''));
    if (Math.abs(value) <= 2) return 'text-green-600';
    if (Math.abs(value) <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredTests = qcTests.filter(test => {
    if (statusFilter !== 'All Status' && test.status !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <LayoutShell pageTitle="QC Data">
      {/* QC Data Body */}
      <main className="p-6 space-y-6 overflow-auto flex-1">
        
        {/* QC Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {qcMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className={`flex items-center text-sm ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`w-4 h-4 mr-1 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                  {metric.change}
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{metric.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Time Filter */}
            <div className="relative">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option>Today</option>
                <option>Yesterday</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
              <Calendar className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>

            {/* Test Type Filter */}
            <div className="relative">
              <select
                value={testTypeFilter}
                onChange={(e) => setTestTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option>All Tests</option>
                <option>Hematology</option>
                <option>Chemistry</option>
                <option>Immunology</option>
                <option>Microbiology</option>
              </select>
              <Filter className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option>All Status</option>
                <option>Passed</option>
                <option>Failed</option>
                <option>Pending</option>
              </select>
              <Filter className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
            <div className="flex space-x-3 justify-end">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
          </div>
        </div>

        {/* QC Tests Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent QC Tests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    L1
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    L2
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    C1
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    C2
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    C3
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deviation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device Id
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time / Operator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.testName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.expectedValue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.observedValue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.observedValue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.observedValue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {test.observedValue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getDeviationColor(test.deviation)}`}>
                        {test.deviation}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {test.deviceid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>
                        <div className="font-medium">{test.timestamp}</div>
                        <div className="text-xs text-gray-500">{test.operator}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Edit Test"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete Test"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTests.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">No QC tests found matching your criteria.</div>
              </div>
            )}
          </div>
        </div>

        {/* QC Alerts & Notifications */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">QC Alerts & Notifications</h2>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="p-6 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">High Deviation Alert</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Glucose Control (GLU-2024-001) showed +5.0% deviation. Immediate review required.
                </p>
                <p className="text-xs text-gray-500 mt-2">2 minutes ago</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 flex items-start space-x-3">
              <Activity className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">QC Schedule Reminder</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Next QC run for Hematology controls scheduled at 2:00 PM today.
                </p>
                <p className="text-xs text-gray-500 mt-2">30 minutes ago</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">QC Batch Completed</h3>
                <p className="text-sm text-gray-600 mt-1">
                  All morning QC tests completed successfully. Overall success rate: 83.3%
                </p>
                <p className="text-xs text-gray-500 mt-2">1 hour ago</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 flex items-start space-x-3">
              <Target className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">Control Lot Expiry Warning</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Hemoglobin control lot HB-2024-001 will expire in 5 days. Order replacement.
                </p>
                <p className="text-xs text-gray-500 mt-2">3 hours ago</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* QC Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Average Deviation</h3>
            <p className="text-2xl font-bold text-gray-900">±2.1%</p>
            <p className="text-xs text-green-600 mt-1">Within acceptable range</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Control Lots Active</h3>
            <p className="text-2xl font-bold text-gray-900">8</p>
            <p className="text-xs text-gray-600 mt-1">Across all departments</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Next QC Run</h3>
            <p className="text-2xl font-bold text-gray-900">2:00 PM</p>
            <p className="text-xs text-blue-600 mt-1">Hematology department</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Monthly Success Rate</h3>
            <p className="text-2xl font-bold text-green-600">94.7%</p>
            <p className="text-xs text-green-600 mt-1">+2.3% from last month</p>
          </div>
        </div>
      </main>
    </LayoutShell>
  );
};

export default QCData;