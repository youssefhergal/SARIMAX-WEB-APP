function StatusIndicator(props) {
  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Ready';
      case 'error':
        return 'Error';
      case 'inactive':
      default:
        return 'Pending';
    }
  };

  return (
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <i class={`${props.icon} text-gray-600`}></i>
        <span class="text-sm font-medium text-gray-700">{props.label}</span>
      </div>
      
      <div class="flex items-center space-x-2">
        <div 
          class={`status-indicator ${props.status}`}
          title={getStatusText(props.status)}
        ></div>
        <span class="text-xs text-gray-500 capitalize">{getStatusText(props.status)}</span>
      </div>
    </div>
  );
}

export default StatusIndicator; 