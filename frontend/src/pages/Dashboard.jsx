import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, User, AlertCircle, FileText, Users, Activity, MapPin, Calendar } from 'lucide-react';
import LayoutShell from "../components/layout/LayoutShell";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    camps: { total: 0, active: 0, upcoming: 0 },
    patients: { total: 0 },
    reports: { total: 0, approved: 0, pending: 0, rejected: 0 },
    tests: { normal_tests: 0, abnormal_tests: 0 },
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Function to fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:3001/api/dashboard/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError(error.message);
      
      // If token is invalid, redirect to login
      if (error.message.includes('token') || error.message.includes('authentication')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Format date for recent activity
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <LayoutShell>
        <main className="p-6 space-y-6 overflow-auto flex-1">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </LayoutShell>
    );
  }

  if (error) {
    return (
      <LayoutShell>
        <main className="p-6 space-y-6 overflow-auto flex-1">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">Error loading dashboard: {error}</p>
            </div>
            <button 
              onClick={fetchDashboardStats}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </main>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      {/* Dashboard Body */}
      <main className="p-6 space-y-6 overflow-auto flex-1">

        {/* Camp Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Camps</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.camps.total}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Camps</p>
                <p className="text-2xl font-bold text-green-600">{dashboardData.camps.active}</p>
              </div>
              <MapPin className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.patients.total}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600">{dashboardData.camps.upcoming}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved Reports</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.reports.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Reports</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.reports.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected Reports</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.reports.rejected}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">No of Normal Tests</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.tests.normal_tests}</p>
              </div>
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">No of Abnormal Tests</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.tests.abnormal_tests}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Recent Camp Activity */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Camp Activity</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{activity.camp_name}</h3>
                      <p className="text-sm text-gray-600">
                        {activity.location && `${activity.location} - `}{activity.description}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(activity.updated_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No recent activity found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </LayoutShell>
  );
};

export default Dashboard;