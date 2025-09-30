import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Save, Eye, X } from 'lucide-react';
import LayoutShell from '../components/layout/LayoutShell';

const MicroscopyReport = () => {
  const { reportId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get report data from location state or use default structure
  const initialReportData = location.state?.reportData || {
    id: reportId,
    testName: 'Unknown Test',
    lastUpdated: 'N/A',
    imageCount: 0,
    status: 'Pending'
  };

  // Form data state
  const [reportData, setReportData] = useState({
    testName: initialReportData.testName || 'PAP Smear Cytology NORMAL MODE',
    investigations: [
      { test: 'Squamous Epithelial Cells', result: '', unit: 'cells/hpf', bioRefInterval: '5-15' },
      { test: 'Columnar Epithelial Cells', result: '', unit: 'cells/hpf', bioRefInterval: '2-8' },
      { test: 'Metaplastic Cells', result: '', unit: 'cells/hpf', bioRefInterval: '0-3' },
      { test: 'Inflammatory Cells', result: '', unit: 'cells/hpf', bioRefInterval: '0-5' },
      { test: 'RBC Count', result: '', unit: 'cells/hpf', bioRefInterval: '0-2' },
      { test: 'Microorganisms', result: '', unit: 'present/absent', bioRefInterval: 'Absent' },
      { test: 'Nuclear Changes', result: '', unit: 'grade', bioRefInterval: 'Grade 0-1' }
    ],
    comments: ''
  });

  // Image viewer state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);

  // Sample microscopy images
  const microscopyImages = [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=600',
      title: 'Blood Smear - 40x Magnification'
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600',
      title: 'Tissue Sample - 100x Magnification'
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=600',
      title: 'Cell Culture - 200x Magnification'
    },
    {
      id: 4,
      url: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=800&h=600',
      title: 'Histology Section - 400x Magnification'
    }
  ];

  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle investigation result changes
  const handleInvestigationChange = (index, value) => {
    setReportData(prev => ({
      ...prev,
      investigations: prev.investigations.map((inv, i) => 
        i === index ? { ...inv, result: value } : inv
      )
    }));
  };

  // Image navigation
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % microscopyImages.length);
    resetImageView();
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + microscopyImages.length) % microscopyImages.length);
    resetImageView();
  };

  const selectImage = (index) => {
    setCurrentImageIndex(index);
    resetImageView();
  };

  // Zoom controls
  const zoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  };

  const resetImageView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1 && zoom > 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1 && zoom > 1) {
      e.preventDefault();
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  };

  // Save report handler
  const handleSaveReport = () => {
    console.log('Saving report:', reportData);
    alert('Report saved successfully!');
  };

  // Back handler using React Router
  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  // Preview modal component
  const PreviewModal = () => (
    <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Report Preview</h3>
          <button
            onClick={() => setShowPreview(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <strong className="text-gray-700">Test Name:</strong>
            <p className="text-gray-900">{reportData.testName}</p>
          </div>
          
          <div>
            <strong className="text-gray-700">Investigation Results:</strong>
            <div className="mt-2 overflow-hidden border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-gray-200">Investigation</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-gray-200">Result</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-gray-200">Unit</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Bio. Ref. Interval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.investigations.map((inv, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 border-r border-gray-200">{inv.test}</td>
                      <td className="px-3 py-2 border-r border-gray-200 font-medium">{inv.result || '-'}</td>
                      <td className="px-3 py-2 border-r border-gray-200">{inv.unit}</td>
                      <td className="px-3 py-2">{inv.bioRefInterval}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div>
            <strong className="text-gray-700">Comments:</strong>
            <p className="text-gray-900">{reportData.comments || 'No comments'}</p>
          </div>
        </div>
        
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={() => setShowPreview(false)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close Preview
          </button>
          <button
            onClick={() => {
              handleSaveReport();
              setShowPreview(false);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save & Submit
          </button>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, position]);

  return (
    <LayoutShell pageTitle={`Microscopy Report - ${reportId}`}>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Report Form */}
          <div className="bg-white rounded-lg shadow-sm border">            
            <div className="p-6">
              {/* Test Name Header */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Name
                </label>
                <input
                  type="text"
                  value={reportData.testName}
                  onChange={(e) => handleInputChange('testName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Investigation Table */}
              <div className="mb-6">
                <div className="overflow-hidden border border-gray-300 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-300">
                          Investigation
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-300">
                          Result
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-300">
                          Unit
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Bio. Ref. Interval
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.investigations.map((investigation, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                            {investigation.test}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200">
                            <input
                              type="text"
                              value={investigation.result}
                              onChange={(e) => handleInvestigationChange(index, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
                            {investigation.unit}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {investigation.bioRefInterval}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment :
                </label>
                <textarea
                  value={reportData.comments}
                  onChange={(e) => handleInputChange('comments', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Type your comment"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveReport}
                  className="px-6 py-2 bg-orange-400 text-white rounded hover:bg-orange-500 transition-colors flex items-center gap-2"
                >
                  Edit Report
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Image Viewer */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Microscopy Images</h2>
                <span className="text-sm text-gray-500">
                  {currentImageIndex + 1} of {microscopyImages.length}
                </span>
              </div>
            </div>

            {/* Main Image Viewer */}
            <div className="relative">
              <div 
                ref={containerRef}
                className="h-80 bg-gray-100 overflow-hidden relative cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <img
                  ref={imageRef}
                  src={microscopyImages[currentImageIndex]?.url}
                  alt={microscopyImages[currentImageIndex]?.title}
                  className="w-full h-full object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                    transformOrigin: 'center center'
                  }}
                  draggable={false}
                />
              </div>

              {/* Image Controls */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={zoomOut}
                  className="bg-black bg-opacity-50 text-white p-2 rounded-md hover:bg-opacity-75 transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={zoomIn}
                  className="bg-black bg-opacity-50 text-white p-2 rounded-md hover:bg-opacity-75 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={resetImageView}
                  className="bg-black bg-opacity-50 text-white p-2 rounded-md hover:bg-opacity-75 transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Zoom Level Indicator */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-md text-sm">
                {Math.round(zoom * 100)}%
              </div>
            </div>

            {/* Image Title */}
            <div className="px-6 py-3 border-t bg-gray-50">
              <p className="text-sm font-medium text-gray-900">
                {microscopyImages[currentImageIndex]?.title}
              </p>
            </div>

            {/* Thumbnail Grid */}
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">All Images</h3>
              <div className="grid grid-cols-4 gap-3">
                {microscopyImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => selectImage(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex
                        ? 'border-blue-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    {index === currentImageIndex && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-20" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && <PreviewModal />}
      </div>
    </LayoutShell>
  );
};

export default MicroscopyReport;