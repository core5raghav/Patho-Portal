import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, Eye } from 'lucide-react';
import LayoutShell from "../components/layout/LayoutShell";

// Sample test reports data matching the reference image structure
const testReportsData = [
  {
    id: 'RPT-001',
    testName: 'Complete Blood Count',
    lastUpdated: '2024-01-15',
    imageCount: 3,
    status: 'Pending'
  },
  {
    id: 'RPT-002',
    testName: 'Lipid Panel',
    lastUpdated: '2024-01-14',
    imageCount: 5,
    status: 'Approved'
  },
  {
    id: 'RPT-003',
    testName: 'Liver Function Tests',
    lastUpdated: '2024-01-13',
    imageCount: 2,
    status: 'Pending'
  },
  {
    id: 'RPT-004',
    testName: 'Thyroid Function',
    lastUpdated: '2024-01-12',
    imageCount: 4,
    status: 'Rejected'
  },
  {
    id: 'RPT-005',
    testName: 'Blood Glucose',
    lastUpdated: '2024-01-11',
    imageCount: 1,
    status: 'Pending'
  },
  {
    id: 'RPT-006',
    testName: 'Urinalysis',
    lastUpdated: '2024-01-10',
    imageCount: 6,
    status: 'Approved'
  },
  {
    id: 'RPT-007',
    testName: 'Chest X-Ray',
    lastUpdated: '2024-01-09',
    imageCount: 2,
    status: 'Pending'
  },
  {
    id: 'RPT-008',
    testName: 'ECG',
    lastUpdated: '2024-01-08',
    imageCount: 1,
    status: 'Approved'
  }
];

// Status badge colors
const getStatusColor = (status) => {
  const colors = {
    'Pending': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'Approved': 'bg-green-100 text-green-800 border border-green-200',
    'Rejected': 'bg-red-100 text-red-800 border border-red-200'
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
};

const MicroscopeTestManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [testTypeFilter, setTestTypeFilter] = useState('All Test Types');

  const reportsPerPage = 10; // Matching the reference image

  // Get unique test types for filter
  const uniqueTestTypes = [...new Set(testReportsData.map(report => report.testName))];

  // Filtering logic
  const filteredReports = useMemo(() => {
    return testReportsData.filter(report => {
      const matchesSearch =
        report.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All Status' || report.status === statusFilter;
      const matchesTestType = testTypeFilter === 'All Test Types' || report.testName === testTypeFilter;

      return matchesSearch && matchesStatus && matchesTestType;
    });
  }, [searchTerm, statusFilter, testTypeFilter]);

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * reportsPerPage,
    currentPage * reportsPerPage
  );

  // Handle View Report - Navigate to microscopy report page
  const handleViewReport = (report) => {
    // Navigate to MicroscopyReport page with report ID
    navigate(`/microscopy-report/${report.id}`, { state: { reportData: report } });
  };

  return (
    <LayoutShell pageTitle="Test Management">
      {/* Main Content */}
      <div className="p-6">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
              >
                <option>All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
              <Filter className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>

            {/* Test Type Filter */}
            <div className="relative">
              <select
                value={testTypeFilter}
                onChange={(e) => setTestTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
              >
                <option>All Test Types</option>
                {uniqueTestTypes.map(testType => (
                  <option key={testType} value={testType}>{testType}</option>
                ))}
              </select>
              <Filter className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>

            {/* Empty space for layout balance */}
            <div></div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last updated on
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No of images
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.testName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(report.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.imageCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleViewReport(report)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">No reports found matching your criteria.</div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredReports.length > 0 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * reportsPerPage) + 1} to {Math.min(currentPage * reportsPerPage, filteredReports.length)} of {filteredReports.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </LayoutShell>
  );
};

export default MicroscopeTestManagement;