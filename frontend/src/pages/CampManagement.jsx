import React, { useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Activity, 
  Plus, 
  Edit, 
  Eye, 
  Trash2,
  Search,
  Filter
} from 'lucide-react';
import { camps } from '../data/camps';
import { useSearch } from '../hooks/useSearch';
import LayoutShell from "../components/layout/LayoutShell";

const CampManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const { filteredData: searchResults } = useSearch(camps, searchTerm, ['name', 'location', 'coordinator']);
  
  const filteredCamps = searchResults.filter(camp => {
    return statusFilter === 'All Status' || camp.status === statusFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Planned':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <LayoutShell pageTitle="Camp Management">
      {/* Camp Management Body */}
      <main className="p-6 space-y-6 overflow-auto flex-1">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Camps</p>
                <p className="text-2xl font-bold text-gray-900">4</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Camps</p>
                <p className="text-2xl font-bold text-green-600">2</p>
              </div>
              <MapPin className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">514</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600">1</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search camps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Planned</option>
                <option>Completed</option>
              </select>
              <Filter className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Select date range"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Camps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCamps.map((camp) => (
            <div key={camp.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{camp.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(camp.status)}`}>
                      {camp.status}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-green-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {camp.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {camp.date}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    {camp.patients} patients
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Coordinator:</span> {camp.coordinator}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {filteredCamps.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500">No camps found matching your criteria.</div>
            </div>
          )}
        </div>

        {/* Recent Camp Activity */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Camp Activity</h2>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Delhi Health Camp</h3>
                  <p className="text-sm text-gray-600">50 new patients registered today</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Rural Outreach Program</h3>
                  <p className="text-sm text-gray-600">Medical supplies restocked</p>
                </div>
                <span className="text-sm text-gray-500">5 hours ago</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">School Health Screening</h3>
                  <p className="text-sm text-gray-600">Camp scheduled and coordinators assigned</p>
                </div>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </LayoutShell>
  );
};

export default CampManagement;