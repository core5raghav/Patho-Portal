export const getStatusColor = (status) => {
  switch (status) {
    case 'Approved':
      return 'bg-green-100 text-green-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Inactive':
      return 'bg-gray-100 text-gray-800';
    case 'Planned':
      return 'bg-blue-100 text-blue-800';
    case 'Completed':
      return 'bg-gray-100 text-gray-800';
    case 'Passed':
      return 'bg-green-100 text-green-800';
    case 'Failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

  export const getConditionColor = (condition) => {
    switch (condition) {
      case 'Normal':
        return 'bg-green-100 text-green-800';
      case 'Under Observation':
        return 'bg-yellow-100 text-yellow-800';
      case 'Abnormal':
        return 'bg-red-100 text-red-800';
      case 'Under Treatment':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

