import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle,
  XCircle,
  Minus,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import ReportViewer from './ReportViewer';
import { DatePicker, DateRangePicker } from '../components/ui/date-picker';
import LayoutShell from "../components/layout/LayoutShell";

// Mock function for status colors
const getStatusColor = (status) => {
  const colors = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Draft': 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const Reports = () => {
  // State management
  const [reports, setReports] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    camps: [],
    organizations: [],
    testTypes: [],
    statuses: []
  });
  const [selectedReports, setSelectedReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingReport, setViewingReport] = useState(null);
  const [isReportViewerOpen, setIsReportViewerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReports: 0,
    hasNext: false,
    hasPrev: false
  });
  
  // Add viewed reports state
  const [viewedReports, setViewedReports] = useState(new Set());

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [testTypeFilter, setTestTypeFilter] = useState('All Test Types');
  const [campFilter, setCampFilter] = useState('All Camps');
  const [organizationFilter, setOrganizationFilter] = useState('All Organizations');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const reportsPerPage = 10;

  // Function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Function to handle authentication errors
  const handleAuthError = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Function to get current user info
  const getCurrentUser = () => {
    try {
      const userInfo = localStorage.getItem('user');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        return user.id || user.userId || 1; // Return user ID, not name
      }
      return 1; // Default fallback
    } catch (error) {
      console.error('Error getting current user:', error);
      return 1;
    }
  };

  // Function to get current user name for audit trail
  const getCurrentUserName = () => {
    try {
      const userInfo = localStorage.getItem('user');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        return user.name || user.username || 'Unknown User';
      }
      return 'Unknown User';
    } catch (error) {
      console.error('Error getting current user:', error);
      return 'Unknown User';
    }
  };

  // Function to add audit trail entry to backend
  const addAuditTrailEntry = async (reportId, action, details = '') => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');

      const currentUser = getCurrentUserName();
      
      // Extract numeric ID from report ID (RPT-001 -> 1)
      const numericId = parseInt(reportId.replace('RPT-', ''));

      const response = await fetch(`http://localhost:3001/api/reports/${numericId}/audit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          user: currentUser,
          details,
          timestamp: new Date().toISOString()
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to add audit trail entry:', data.message);
      }
      
      return data.success;
    } catch (error) {
      console.error('Error adding audit trail entry:', error);
      return false;
    }
  };

  // NEW: Save test-specific comment function
  const handleSaveTestComment = async (testResultId, comment, reportId) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');

      // Extract numeric report ID if it's in RPT-XXX format
      const numericReportId = typeof reportId === 'string' && reportId.startsWith('RPT-') 
        ? parseInt(reportId.replace('RPT-', '')) 
        : reportId;

      const response = await fetch(`http://localhost:3001/api/test-results/${testResultId}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          comment: comment,
          pathologist_id: getCurrentUser(),
          report_id: numericReportId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh the report data to show updated comments
        const updatedReport = await fetchReportDetails(reportId);
        if (updatedReport) {
          setViewingReport(updatedReport);
        }
        
        return data;
      } else {
        throw new Error(data.message || 'Failed to save comment');
      }
      
    } catch (error) {
      console.error('Error saving test comment:', error);
      throw error; // Re-throw to handle in ReportViewer
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch('http://localhost:3001/api/reports/filters', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setFilterOptions(data.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Fetch reports with filters
  const fetchReports = async (page = 1) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: reportsPerPage.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'All Status') params.append('status', statusFilter);
      if (campFilter && campFilter !== 'All Camps') params.append('camp', campFilter);
      if (organizationFilter && organizationFilter !== 'All Organizations') params.append('organization', organizationFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`http://localhost:3001/api/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setReports(data.data.reports);
        setPagination(data.data.pagination);
        setCurrentPage(data.data.pagination.currentPage);
      } else {
        throw new Error(data.message || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error.message);
      
      if (error.message.includes('token') || error.message.includes('authentication')) {
        handleAuthError();
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch report details with audit trail
  const fetchReportDetails = async (reportId) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');

      // Extract numeric ID from report ID (RPT-001 -> 1)
      const numericId = parseInt(reportId.replace('RPT-', ''));

      const response = await fetch(`http://localhost:3001/api/reports/${numericId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch report details');
      }
    } catch (error) {
      console.error('Error fetching report details:', error);
      return null;
    }
  };

  // Update report status
  const updateReportStatus = async (reportId, status, comments = '', rejectionReason = '') => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');

      // Extract numeric ID from report ID (RPT-001 -> 1)
      const numericId = parseInt(reportId.replace('RPT-', ''));

      const response = await fetch(`http://localhost:3001/api/reports/${numericId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status.toLowerCase(),
          comments,
          rejectionReason
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh reports after update
        fetchReports(currentPage);
        return true;
      } else {
        throw new Error(data.message || 'Failed to update report');
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      setError(error.message);
      return false;
    }
  };

  // Bulk update report status
  const bulkUpdateReportStatus = async (reportIds, status, comments = '', rejectionReason = '') => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');

      // Extract numeric IDs from report IDs
      const numericIds = reportIds.map(id => parseInt(id.replace('RPT-', '')));

      const response = await fetch('http://localhost:3001/api/reports/bulk-status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportIds: numericIds,
          status: status.toLowerCase(),
          comments,
          rejectionReason
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh reports after update
        fetchReports(currentPage);
        return true;
      } else {
        throw new Error(data.message || 'Failed to bulk update reports');
      }
    } catch (error) {
      console.error('Error bulk updating reports:', error);
      setError(error.message);
      return false;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchFilterOptions();
    fetchReports(1);
  }, []);

  // Fetch reports when filters change
  useEffect(() => {
    const delayedFetch = setTimeout(() => {
      setCurrentPage(1);
      fetchReports(1);
    }, 500); // Debounce API calls

    return () => clearTimeout(delayedFetch);
  }, [searchTerm, statusFilter, testTypeFilter, campFilter, organizationFilter, dateFrom, dateTo]);

  // Selection handlers
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedReports(reports.map(r => r.id));
    } else {
      setSelectedReports([]);
    }
  };

  const handleSelectReport = (reportId, checked) => {
    if (checked) {
      setSelectedReports([...selectedReports, reportId]);
    } else {
      setSelectedReports(selectedReports.filter(id => id !== reportId));
    }
  };

  // Action handlers
  const handleViewReport = async (reportId) => {
    const reportDetails = await fetchReportDetails(reportId);
    if (reportDetails) {
      setViewingReport(reportDetails);
      setIsReportViewerOpen(true);
      
      // Add audit trail entry for viewing
      if (!viewedReports.has(reportId)) {
        await addAuditTrailEntry(reportId, 'Report Viewed', 'Report opened for review');
        setViewedReports(prev => new Set([...prev, reportId]));
      }
    }
  };

  // Updated approve function - only handles general comments
  const handleApproveReport = async (reportId, generalComment) => {
    const success = await updateReportStatus(reportId, 'approved', generalComment);
    if (success) {
      setSelectedReports(prev => prev.filter(id => id !== reportId));
      setIsReportViewerOpen(false);
      setViewingReport(null);
    }
  };

  // Updated reject function - only handles general comments
  const handleRejectReport = async (reportId, remarks = 'Report rejected', rejectedTestsList = [], generalComment = '') => {
    const rejectionDetails = rejectedTestsList.length > 0 
      ? `${remarks} - Rejected tests: ${rejectedTestsList.join(', ')}`
      : remarks;
    
    const success = await updateReportStatus(reportId, 'rejected', generalComment || remarks, rejectionDetails);
    if (success) {
      setSelectedReports(prev => prev.filter(id => id !== reportId));
      setIsReportViewerOpen(false);
      setViewingReport(null);
    }
  };

  const handleBulkApprove = async () => {
    const success = await bulkUpdateReportStatus(selectedReports, 'approved', 'Bulk approved');
    if (success) {
      setSelectedReports([]);
    }
  };

  const handleBulkReject = async () => {
    const success = await bulkUpdateReportStatus(selectedReports, 'rejected', 'Bulk rejected', 'Bulk rejection - requires review');
    if (success) {
      setSelectedReports([]);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchReports(page);
  };

  // Clear date filters
  const clearDateFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

  // Selection state
  const isAllSelected = reports.length > 0 && selectedReports.length === reports.length;
  const isIndeterminate = selectedReports.length > 0 && selectedReports.length < reports.length;

  // IndeterminateCheckbox component
  const IndeterminateCheckbox = ({ checked, indeterminate, onCheckedChange }) => {
    if (indeterminate) {
      return (
        <button
          type="button"
          className="w-4 h-4 border border-gray-300 rounded bg-blue-600 text-white flex items-center justify-center"
          onClick={() => onCheckedChange(true)}
        >
          <Minus className="w-3 h-3" />
        </button>
      );
    }

    return (
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300"
      />
    );
  };

  if (loading && reports.length === 0) {
    return (
      <LayoutShell pageTitle="Reports">
        <main className="p-6 space-y-6 overflow-auto flex-1">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </LayoutShell>
    );
  }

  if (error && reports.length === 0) {
    return (
      <LayoutShell pageTitle="Reports">
        <main className="p-6 space-y-6 overflow-auto flex-1">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">Error loading reports: {error}</p>
            </div>
            <button 
              onClick={() => fetchReports(currentPage)}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        </main>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell pageTitle="Reports">
      {/* Reports Body */}
      <main className="p-6 space-y-6 overflow-auto flex-1">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option>All Status</option>
                {filterOptions.statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <Filter className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>

            {/* Test Type Filter */}
            <div className="relative">
              <select
                value={testTypeFilter}
                onChange={(e) => setTestTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option>All Test Types</option>
                {filterOptions.testTypes.map(testType => (
                  <option key={testType} value={testType}>{testType}</option>
                ))}
              </select>
              <Filter className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>

            {/* Camp Filter */}
            <div className="relative">
              <select
                value={campFilter}
                onChange={(e) => setCampFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option>All Camps</option>
                {filterOptions.camps.map(camp => (
                  <option key={camp} value={camp}>{camp}</option>
                ))}
              </select>
              <Filter className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>

            {/* Organization Filter */}
            <div className="relative">
              <select
                value={organizationFilter}
                onChange={(e) => setOrganizationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option>All Organizations</option>
                {filterOptions.organizations.map(org => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
              <Filter className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>

            {/* Date From */}
            <div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="From Date"
              />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date To - Second Row */}
          <div className="mt-4">
            <div className="w-full md:w-1/6">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="To Date"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(dateFrom || dateTo) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Date filter active:</span>
              {dateFrom && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  From: {dateFrom}
                </span>
              )}
              {dateTo && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  To: {dateTo}
                </span>
              )}
              <button
                onClick={clearDateFilters}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {pagination.totalReports} report{pagination.totalReports !== 1 ? 's' : ''} 
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
            {loading && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedReports.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedReports.length} report{selectedReports.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkApprove}
                  disabled={loading}
                  className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors flex items-center space-x-1 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Bulk Approve</span>
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={loading}
                  className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors flex items-center space-x-1 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Bulk Reject</span>
                </button>
                <button
                  onClick={() => setSelectedReports([])}
                  className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <IndeterminateCheckbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Camp / Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
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
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={(e) => handleSelectReport(report.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {report.patientName}
                        </div>
                        <div className="text-gray-600 text-xs">
                          Age: {report.age} • {report.gender}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={report.testName}>
                        {report.testName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900 truncate max-w-xs" title={report.camp}>
                          {report.camp}
                        </div>
                        <div className="text-gray-600 text-xs truncate max-w-xs" title={report.organization}>
                          {report.organization}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleViewReport(report.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {reports.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-gray-500">No reports found matching your criteria.</div>
                {(searchTerm || statusFilter !== 'All Status' || campFilter !== 'All Camps') && (
                  <div className="mt-2">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('All Status');
                        setCampFilter('All Camps');
                        setOrganizationFilter('All Organizations');
                        setDateFrom('');
                        setDateTo('');
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalReports > 0 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.currentPage - 1) * reportsPerPage) + 1} to {Math.min(pagination.currentPage * reportsPerPage, pagination.totalReports)} of {pagination.totalReports} results
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev || loading}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    let page;
                    if (pagination.totalPages <= 5) {
                      page = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      page = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      page = pagination.totalPages - 4 + i;
                    } else {
                      page = pagination.currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={loading}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          pagination.currentPage === page
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        } disabled:opacity-50`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button 
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext || loading}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ReportViewer Component */}
        <ReportViewer 
          viewingReport={viewingReport}
          isOpen={isReportViewerOpen}
          onClose={() => setIsReportViewerOpen(false)}
          onApprove={handleApproveReport}
          onReject={handleRejectReport}
          getStatusColor={getStatusColor}
          onSaveTestComment={handleSaveTestComment}
        />
      </main>
    </LayoutShell>
  );
};

export default Reports;