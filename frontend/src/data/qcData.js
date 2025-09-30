export const qcTests = [
  {
    id: 'QC-001',
    testName: 'Hemoglobin Control',
    expectedValue: '12.5 g/dL',
    observedValue: '12.4 g/dL',
    deviation: '-0.8%',
    deviceid: 'LAB0123AN1234',
    status: 'Passed',
    timestamp: '09:30 AM',
    operator: 'Tech A'
  },
  {
    id: 'QC-002',
    testName: 'Glucose Control',
    expectedValue: '100 mg/dL',
    observedValue: '105 mg/dL',
    deviation: '+5.0%',
    deviceid: 'LAB0123AN1234',
    status: 'Failed',
    timestamp: '10:15 AM',
    operator: 'Tech B'
  },
  {
    id: 'QC-003',
    testName: 'Creatinine Control',
    expectedValue: '1.2 mg/dL',
    observedValue: '1.18 mg/dL',
    deviation: '-1.7%',
    deviceid: 'LAB0123AN1234',
    status: 'Passed',
    timestamp: '11:00 AM',
    operator: 'Tech A'
  },
  {
    id: 'QC-004',
    testName: 'Total Cholesterol',
    expectedValue: '200 mg/dL',
    observedValue: '198 mg/dL',
    deviation: '-1.0%',
    deviceid: 'LAB0123AN1234',
    status: 'Passed',
    timestamp: '11:45 AM',
    operator: 'Tech C'
  },
  {
    id: 'QC-005',
    testName: 'Platelet Count',
    expectedValue: '250 k/μL',
    observedValue: '265 k/μL',
    deviation: '+6.0%',
    deviceid: 'LAB0123AN1234',
    status: 'Failed',
    timestamp: '12:30 PM',
    operator: 'Tech B'
  }
];