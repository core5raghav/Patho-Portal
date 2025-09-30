import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Eye, 
  X,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';

const ReportViewer = ({ 
  viewingReport, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject,
  getStatusColor,
  onSaveTestComment
}) => {
  const [activeTab, setActiveTab] = useState('testResults');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejectedTests, setRejectedTests] = useState([]);
  
  // Comment states
  const [isTestCommentDialogOpen, setIsTestCommentDialogOpen] = useState(false);
  const [currentTestForComment, setCurrentTestForComment] = useState(null);
  const [currentTestComment, setCurrentTestComment] = useState('');
  const [generalComment, setGeneralComment] = useState('');

  // Initialize comments when viewingReport changes
  useEffect(() => {
    if (viewingReport) {
      // Set general comment from reports table
      setGeneralComment(viewingReport.comments || '');
    }
  }, [viewingReport]);

  // Function to get available tests for a specific report - now uses real data
  const getAvailableTestsForReport = () => {
    if (!viewingReport || !viewingReport.testResults) return [];
    return viewingReport.testResults.map(test => ({
      id: test.id,
      name: test.testName || test.parameter
    }));
  };

  // Function to get test results - now uses real data from backend
  const getTestResults = () => {
    if (!viewingReport || !viewingReport.testResults) return [];
    
    return viewingReport.testResults.map(result => {
      const value = parseFloat(result.value);
      const gender = viewingReport.gender?.toLowerCase();
      const age = parseInt(viewingReport.age);
      
      let upperRange, lowerRange;
      if (age < 18) {
        upperRange = parseFloat(result.child_upper_range);
        lowerRange = parseFloat(result.child_lower_range);
      } else if (gender === 'male') {
        upperRange = parseFloat(result.male_upper_range);
        lowerRange = parseFloat(result.male_lower_range);
      } else {
        upperRange = parseFloat(result.female_upper_range);
        lowerRange = parseFloat(result.female_lower_range);
      }
      
      const isNormal = value >= lowerRange && value <= upperRange;
      
      return {
        id: result.id,
        testResultId: result.testResultId || result.id,
        parameter: result.testName || result.parameter,
        value: result.value,
        unit: result.unit || '',
        referenceRange: `${lowerRange} - ${upperRange}`,
        isAbnormal: !isNormal,
        pathologistComment: result.pathologistComment
      };
    });
  };

  // Open test comment dialog
  const openTestCommentDialog = (testResultId, testName, existingComment = '') => {
    setCurrentTestForComment({ 
      id: testResultId, 
      name: testName,
      reportId: viewingReport.id 
    });
    setCurrentTestComment(existingComment || '');
    setIsTestCommentDialogOpen(true);
  };

  // Close test comment dialog
  const closeTestCommentDialog = () => {
    setIsTestCommentDialogOpen(false);
    setCurrentTestForComment(null);
    setCurrentTestComment('');
  };

  // Save test comment
  const saveTestComment = async () => {
    if (currentTestForComment && onSaveTestComment) {
      try {
        await onSaveTestComment(
          currentTestForComment.id, 
          currentTestComment,
          currentTestForComment.reportId
        );
        
        closeTestCommentDialog();
        
      } catch (error) {
        console.error('Error saving test comment:', error);
        alert('Failed to save comment. Please try again.');
      }
    } else {
      closeTestCommentDialog();
    }
  };

  // Handle general comment change
  const handleGeneralCommentChange = (comment) => {
    setGeneralComment(comment);
  };

  // Handle test selection for rejection - updated to use test IDs
  const handleTestSelection = (testId, isSelected) => {
    if (isSelected) {
      setRejectedTests(prev => [...prev, testId]);
    } else {
      setRejectedTests(prev => prev.filter(id => id !== testId));
    }
  };

  const openRejectDialog = () => {
    setIsRejectDialogOpen(true);
  };

  const closeRejectDialog = () => {
    setIsRejectDialogOpen(false);
    setRejectRemarks('');
    setRejectedTests([]);
  };

  const confirmReject = () => {
    if (rejectRemarks.trim()) {
      // Convert test IDs to test names for the rejection
      const rejectedTestNames = rejectedTests.length > 0 
        ? getAvailableTestsForReport()
            .filter(test => rejectedTests.includes(test.id))
            .map(test => test.name)
        : [];
      
      // Only include general comment for rejection (test comments are saved separately)
      onReject(viewingReport.id, rejectRemarks, rejectedTestNames, generalComment);
      closeRejectDialog();
    }
  };

  const handleApprove = () => {
    // Only save general comment when approving (test comments are saved separately)
    onApprove(viewingReport.id, generalComment);
    onClose();
  };

  if (!isOpen || !viewingReport) return null;

  return (
    <>
      {/* Report Viewer Modal */}
      <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-[600px] max-w-full h-[800px] max-h-[90vh] shadow-2xl flex flex-col">
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Report Viewer - {viewingReport.id}</h2>
                <p className="text-sm text-gray-600">Detailed view and analysis of laboratory report</p>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            {/* Patient Information Section */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 mr-2 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900">Patient Information</h3>
              </div>
              <div className="grid grid-cols-4 gap-6 mb-4">
                <div>
                  <label className="text-sm text-gray-600">Name</label>
                  <p className="font-medium text-gray-900">{viewingReport.patientName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Patient ID</label>
                  <p className="font-medium text-gray-900">PAT-{viewingReport.id.split('-')[1]}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Gender</label>
                  <p className="font-medium text-gray-900">{viewingReport.gender || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Age</label>
                  <p className="font-medium text-gray-900">{viewingReport.age ? `${viewingReport.age} years` : 'Not specified'}</p>
                </div>
              </div>
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-600">Test Name</label>
                    <p className="font-medium text-gray-900">{viewingReport.testName || 'Various Tests'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Organization</label>
                    <p className="font-medium text-gray-900">{viewingReport.organizationName || viewingReport.organization}</p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div>
                  <label className="text-sm text-gray-600">Camp</label>
                  <p className="font-medium text-gray-900">{viewingReport.campName || viewingReport.camp}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-sm text-gray-600">Report Date: {viewingReport.date}</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(viewingReport.status)}`}>
                  {viewingReport.status}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button 
                  onClick={() => setActiveTab('testResults')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'testResults' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Test Results
                </button>
                <button 
                  onClick={() => setActiveTab('attachments')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'attachments' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Attachments
                </button>
                <button 
                  onClick={() => setActiveTab('auditTrail')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'auditTrail' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Audit Trail
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mb-6">
              {activeTab === 'testResults' && (
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-4">Test Results</h4>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Parameter</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Value</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Unit</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Reference Range</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Comment</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getTestResults().map((test, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{test.parameter}</td>
                            <td className={`px-4 py-3 text-sm font-medium ${test.isAbnormal ? 'text-red-600' : 'text-gray-900'}`}>
                              {test.value}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{test.unit}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{test.referenceRange}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => openTestCommentDialog(
                                  test.testResultId || test.id, 
                                  test.parameter,
                                  test.pathologistComment || ''
                                )}
                                className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                                  test.pathologistComment 
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                {test.pathologistComment ? 'Edit Comment' : 'Add Comment'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* General Comment Section */}
                  <div className="mt-6">
                    <div className="flex items-center mb-3">
                      <MessageSquare className="w-5 h-5 mr-2 text-gray-600" />
                      <h4 className="text-base font-medium text-gray-900">General Comments</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {/* General Comment Textarea */}
                      <textarea
                        value={generalComment}
                        onChange={(e) => handleGeneralCommentChange(e.target.value)}
                        placeholder="Add your general observations and overall assessment here..."
                        rows={4}
                        maxLength={1000}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {generalComment.length}/1000 characters
                        </span>
                        <span className="text-xs text-blue-600">
                          Comments will be saved when you approve/reject the report
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'attachments' && (
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-4">Attachments</h4>
                  <div className="bg-gray-50 rounded-lg p-8">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No attachments found</p>
                      <p className="text-sm text-gray-500">Supporting documents and images would appear here</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'auditTrail' && (
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-4">Audit Trail</h4>
                  <div className="space-y-3">
                    {viewingReport.auditTrail && viewingReport.auditTrail.length > 0 ? (
                      viewingReport.auditTrail
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .map((entry, index) => {
                          const getActionIcon = (action) => {
                            if (action.includes('Approved')) return <CheckCircle className="w-5 h-5 text-green-500" />;
                            if (action.includes('Rejected')) return <XCircle className="w-5 h-5 text-red-500" />;
                            if (action.includes('Viewed')) return <Eye className="w-5 h-5 text-blue-500" />;
                            return <FileText className="w-5 h-5 text-gray-500" />;
                          };

                          const getActionColor = (action) => {
                            if (action.includes('Approved')) return 'bg-green-50 border-green-200';
                            if (action.includes('Rejected')) return 'bg-red-50 border-red-200';
                            if (action.includes('Viewed')) return 'bg-blue-50 border-blue-200';
                            return 'bg-gray-50 border-gray-200';
                          };

                          const formatTimestamp = (timestamp) => {
                            return new Date(timestamp).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            });
                          };

                          return (
                            <div key={entry.id || index} className={`flex items-start space-x-3 p-3 rounded-lg border ${getActionColor(entry.action)}`}>
                              {getActionIcon(entry.action)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900">
                                    {entry.action}
                                  </p>
                                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                    {formatTimestamp(entry.timestamp)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">by {entry.user}</p>
                                {entry.details && (
                                  <p className="text-sm text-gray-600 mt-1">{entry.details}</p>
                                )}
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No audit trail entries found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Activities will appear here as actions are performed on this report
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 flex-shrink-0">
            <button
              onClick={openRejectDialog}
              className="px-6 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              className="px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
          </div>
        </div>
      </div>

      {/* Test Comment Dialog */}
      {isTestCommentDialogOpen && currentTestForComment && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Comment on {currentTestForComment.name}
              </h3>
              <p className="text-gray-600 mb-4">
                Add your professional comment for this specific test parameter.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Comment
                </label>
                <textarea
                  placeholder="Enter your comment for this test..."
                  value={currentTestComment}
                  onChange={(e) => setCurrentTestComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="mt-2 text-xs text-gray-500">
                  {currentTestComment.length}/500 characters
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeTestCommentDialog}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveTestComment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {isRejectDialogOpen && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Report</h3>
              <p className="text-gray-600 mb-4">Please provide a reason for rejecting this report and optionally select specific tests to reject.</p>
              
              {/* Test Selection - now uses real test data */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Tests to Reject (Optional)
                </label>
                <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                  {getAvailableTestsForReport().map((test, index) => (
                    <label key={index} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                      <input
                        type="checkbox"
                        checked={rejectedTests.includes(test.id)}
                        onChange={(e) => handleTestSelection(test.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">{test.name}</span>
                    </label>
                  ))}
                </div>
                {rejectedTests.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    Selected: {getAvailableTestsForReport()
                      .filter(test => rejectedTests.includes(test.id))
                      .map(test => test.name)
                      .join(', ')}
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Remarks
                </label>
                <textarea
                  placeholder="Enter rejection remarks..."
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeRejectDialog}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectRemarks.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Reject Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportViewer;