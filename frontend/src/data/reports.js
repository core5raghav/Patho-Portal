// src/data/reports.js

export const reports = [
  {
    id: 'RPT-001',
    patientName: 'John Smith',
    age: 45,
    gender: 'Male',
    testName: 'Complete Blood Count',
    date: '2024-01-15',
    status: 'Pending',
    camp: 'Summer Health Camp 2024',
    organization: 'City Medical Center',
    auditTrail: [
      {
        action: 'Report Created',
        user: 'Lab Technician',
        timestamp: '2024-01-15T08:30:00Z',
        details: 'Initial report generation'
      },
      {
        action: 'Viewed',
        user: 'Dr. Sarah Johnson',
        timestamp: '2024-01-15T10:30:00Z',
        details: 'Report viewed for review'
      },
      {
        action: 'Viewed',
        user: 'Dr. Sarah Johnson',
        timestamp: '2025-09-06T16:46:00Z',
        details: 'Report viewed for review'
      },
      {
        action: 'Viewed',
        user: 'Dr. Sarah Johnson',
        timestamp: '2025-09-06T17:49:00Z',
        details: 'Report viewed for review'
      }
    ]
  },
  {
    id: 'RPT-002',
    patientName: 'Sarah Johnson',
    age: 32,
    gender: 'Female',
    testName: 'Lipid Panel',
    date: '2024-01-14',
    status: 'Approved',
    camp: 'Winter Wellness Camp 2024',
    organization: 'Regional Health Network',
    auditTrail: [
      {
        action: 'Report Created',
        user: 'Lab Technician',
        timestamp: '2024-01-14T09:15:00Z',
        details: 'Initial report generation'
      },
      {
        action: 'Approved',
        user: 'Dr. Sarah Johnson',
        timestamp: '2024-01-14T14:20:00Z',
        details: 'Report approved after review'
      }
    ]
  },
  {
    id: 'RPT-003',
    patientName: 'Michael Brown',
    age: 28,
    gender: 'Male',
    testName: 'Liver Function Tests',
    date: '2024-01-13',
    status: 'Pending',
    camp: 'Sports Medicine Camp 2024',
    organization: 'University Medical Center',
    auditTrail: [
      {
        action: 'Report Created',
        user: 'Lab Technician',
        timestamp: '2024-01-13T11:45:00Z',
        details: 'Initial report generation'
      }
    ]
  },
  {
    id: 'RPT-004',
    patientName: 'Emily Davis',
    age: 8,
    gender: 'Female',
    testName: 'Thyroid Function',
    date: '2024-01-12',
    status: 'Rejected',
    camp: 'Pediatric Health Camp 2024',
    organization: 'Children\'s Hospital',
    auditTrail: [
      {
        action: 'Report Created',
        user: 'Lab Technician',
        timestamp: '2024-01-12T13:30:00Z',
        details: 'Initial report generation'
      },
      {
        action: 'Rejected',
        user: 'Dr. Michael Chen',
        timestamp: '2024-01-12T16:15:00Z',
        details: 'Report rejected - Insufficient sample quality'
      }
    ]
  },
  {
    id: 'RPT-005',
    patientName: 'David Wilson',
    age: 52,
    gender: 'Male',
    testName: 'Blood Glucose',
    date: '2024-01-11',
    status: 'Pending',
    camp: 'Diabetes Screening Camp 2024',
    organization: 'Community Health Center',
    auditTrail: [
      {
        action: 'Report Created',
        user: 'Lab Technician',
        timestamp: '2024-01-11T07:20:00Z',
        details: 'Initial report generation'
      }
    ]
  }
];

// Test results data organized by test type
export const testResultsData = {
  'Complete Blood Count': [
    { parameter: 'Hemoglobin', value: '8.5', unit: 'g/dL', referenceRange: '12.0-15.5', isAbnormal: true },
    { parameter: 'White Blood Cells', value: '12.5', unit: '×10³/μL', referenceRange: '4.0-11.0', isAbnormal: true },
    { parameter: 'Platelets', value: '350', unit: '×10³/μL', referenceRange: '150-450', isAbnormal: false },
    { parameter: 'Red Blood Cells', value: '3.8', unit: '×10⁶/μL', referenceRange: '4.2-5.4', isAbnormal: true },
    { parameter: 'Hematocrit', value: '28.5', unit: '%', referenceRange: '37.0-47.0', isAbnormal: true },
    { parameter: 'MCV', value: '82', unit: 'fL', referenceRange: '80-100', isAbnormal: false }
  ],
  'Lipid Panel': [
    { parameter: 'Total Cholesterol', value: '245', unit: 'mg/dL', referenceRange: '<200', isAbnormal: true },
    { parameter: 'LDL Cholesterol', value: '165', unit: 'mg/dL', referenceRange: '<100', isAbnormal: true },
    { parameter: 'HDL Cholesterol', value: '38', unit: 'mg/dL', referenceRange: '>40', isAbnormal: true },
    { parameter: 'Triglycerides', value: '210', unit: 'mg/dL', referenceRange: '<150', isAbnormal: true }
  ],
  'Liver Function Tests': [
    { parameter: 'ALT', value: '65', unit: 'U/L', referenceRange: '7-45', isAbnormal: true },
    { parameter: 'AST', value: '58', unit: 'U/L', referenceRange: '8-40', isAbnormal: true },
    { parameter: 'Bilirubin Total', value: '1.8', unit: 'mg/dL', referenceRange: '0.3-1.2', isAbnormal: true },
    { parameter: 'Alkaline Phosphatase', value: '125', unit: 'U/L', referenceRange: '44-147', isAbnormal: false }
  ],
  'Thyroid Function': [
    { parameter: 'TSH', value: '8.2', unit: 'mIU/L', referenceRange: '0.4-4.0', isAbnormal: true },
    { parameter: 'Free T4', value: '0.8', unit: 'ng/dL', referenceRange: '0.9-1.7', isAbnormal: true },
    { parameter: 'Free T3', value: '2.1', unit: 'pg/mL', referenceRange: '2.3-4.2', isAbnormal: true }
  ],
  'Blood Glucose': [
    { parameter: 'Fasting Glucose', value: '145', unit: 'mg/dL', referenceRange: '70-99', isAbnormal: true },
    { parameter: 'HbA1c', value: '8.5', unit: '%', referenceRange: '4.0-5.6', isAbnormal: true }
  ],
  'Urinalysis': [
    { parameter: 'Specific Gravity', value: '1.025', unit: '', referenceRange: '1.003-1.030', isAbnormal: false },
    { parameter: 'Protein', value: '2+', unit: '', referenceRange: 'Negative', isAbnormal: true },
    { parameter: 'Glucose', value: 'Negative', unit: '', referenceRange: 'Negative', isAbnormal: false },
    { parameter: 'RBC', value: '5-10', unit: '/hpf', referenceRange: '0-2', isAbnormal: true },
    { parameter: 'WBC', value: '8-12', unit: '/hpf', referenceRange: '0-5', isAbnormal: true }
  ]
};

// Default test results for unknown test types
export const defaultTestResults = [
  { parameter: 'Sample Parameter', value: 'Normal', unit: '', referenceRange: 'Normal Range', isAbnormal: false }
];


// Helper function to get test results
export const getTestResults = (testName) => {
  return testResultsData[testName] || defaultTestResults;
};