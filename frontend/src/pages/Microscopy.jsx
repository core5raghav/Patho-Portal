import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Calendar, Search, Eye } from 'lucide-react';
import { DatePicker, DateRangePicker } from '../components/ui/date-picker';
import LayoutShell from "../components/layout/LayoutShell";

// Sample reports data - Updated with age and gender
const reportsData = [
  {
    id: 'RPT-001',
    patientName: 'John Smith',
    age: 45,
    gender: 'Male',
    testName: 'Complete Blood Count',
    camp: 'Summer Health Camp 2024',
    organization: 'City Medical Center',
    date: '2024-01-15',
    status: 'Pending'
  },
  {
    id: 'RPT-002',
    patientName: 'Sarah Johnson',
    age: 32,
    gender: 'Female',
    testName: 'Lipid Panel',
    camp: 'Winter Wellness Camp 2024',
    organization: 'Regional Health Network',
    date: '2024-01-14',
    status: 'Approved'
  },
  {
    id: 'RPT-003',
    patientName: 'Michael Brown',
    age: 28,
    gender: 'Male',
    testName: 'Liver Function Tests',
    camp: 'Sports Medicine Camp 2024',
    organization: 'University Medical Center',
    date: '2024-01-13',
    status: 'Pending'
  },
  {
    id: 'RPT-004',
    patientName: 'Emily Davis',
    age: 8,
    gender: 'Female',
    testName: 'Thyroid Function',
    camp: 'Pediatric Health Camp 2024',
    organization: "Children's Hospital",
    date: '2024-01-12',
    status: 'Rejected'
  },
  {
    id: 'RPT-005',
    patientName: 'David Wilson',
    age: 52,
    gender: 'Male',
    testName: 'Blood Glucose',
    camp: 'Diabetes Screening Camp 2024',
    organization: 'Community Health Center',
    date: '2024-01-11',
    status: 'Pending'
  }
];

// Status badge colors
const getStatusColor = (status) => {
  const colors = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const Microscopy = () => {
  const navigate = useNavigate();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [testTypeFilter, setTestTypeFilter] = useState('All Test Types');
  const [campFilter, setCampFilter] = useState('All Camps');
  const [organizationFilter, setOrganizationFilter] = useState('All Organizations');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState(null);

  const reportsPerPage = 10;

  // Filtering logic - Updated to include age and gender in search
  const filteredReports = useMemo(() => {
    return reportsData.filter(report => {
      const matchesSearch =
        report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.camp.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.age.toString().includes(searchTerm) ||
        report.gender.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All Status' || report.status === statusFilter;
      const matchesTestType = testTypeFilter === 'All Test Types' || report.testName === testTypeFilter;
      const matchesCamp = campFilter === 'All Camps' || report.camp === campFilter;
      const matchesOrganization = organizationFilter === 'All Organizations' || report.organization === organizationFilter;

      // Date filtering
      let matchesDate = true;
      const reportDate = new Date(report.date);
      
      if (selectedDate) {
        const filterDate = new Date(selectedDate);
        matchesDate = reportDate.toDateString() === filterDate.toDateString();
      } else if (selectedDateRange?.from) {
        const fromDate = new Date(selectedDateRange.from);
        const toDate = selectedDateRange.to ? new Date(selectedDateRange.to) : fromDate;
        matchesDate = reportDate >= fromDate && reportDate <= toDate;
      }

      return matchesSearch && matchesStatus && matchesTestType && matchesCamp && matchesOrganization && matchesDate;
    });
  }, [searchTerm, statusFilter, testTypeFilter, campFilter, organizationFilter, selectedDate, selectedDateRange]);

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * reportsPerPage,
    currentPage * reportsPerPage
  );

  // Handle View Report - Navigate to test management page
  const handleViewReport = (report) => {
    // Navigate to MicroscopeTestManagement page with report ID
    navigate(`/microscope-test/${report.id}`, { state: { reportData: report } });
  };

  // Clear date filters
  const clearDateFilters = () => {
    setSelectedDate(null);
    setSelectedDateRange(null);
  };

  return (
    <LayoutShell pageTitle="Microscopy Report">
      {/* Reports Body */}
      <main className="p-6 space-y-6 overflow-auto flex-1">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option>All Test Types</option>
                <option>Complete Blood Count</option>
                <option>Lipid Panel</option>
                <option>Liver Function Tests</option>
                <option>Thyroid Function</option>
                <option>Blood Glucose</option>
                <option>Urinalysis</option>
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
                <option>Summer Health Camp 2024</option>
                <option>Winter Wellness Camp 2024</option>
                <option>Sports Medicine Camp 2024</option>
                <option>Pediatric Health Camp 2024</option>
                <option>Diabetes Screening Camp 2024</option>
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
                <option>City Medical Center</option>
                <option>Regional Health Network</option>
                <option>University Medical Center</option>
                <option>Children's Hospital</option>
                <option>Community Health Center</option>
              </select>
              <Filter className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>

            {/* Date Range Picker */}
            <div>
              <DateRangePicker
                value={selectedDateRange}
                onChange={(range) => {
                  setSelectedDateRange(range);
                  setSelectedDate(null);
                }}
                placeholder="Pick date range"
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

          {/* Clear Filters */}
          {(selectedDate || selectedDateRange?.from) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Date filter active:</span>
              {selectedDate && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {selectedDate.toLocaleDateString()}
                </span>
              )}
              {selectedDateRange?.from && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {selectedDateRange.from.toLocaleDateString()} - {selectedDateRange.to?.toLocaleDateString() || '...'}
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

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camp / Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.testName}
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
                        onClick={() => handleViewReport(report)}
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
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
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
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </LayoutShell>
  );
};

export default Microscopy;