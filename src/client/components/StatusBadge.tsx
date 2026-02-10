import React from 'react';

interface StatusBadgeProps {
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped';
}

export function StatusBadge({ status, conclusion }: StatusBadgeProps) {
  // Determine color based on status/conclusion
  let colorClass = 'bg-gray-500'; // default
  let text: string = status;
  
  if (status === 'completed' && conclusion) {
    text = conclusion;
    switch (conclusion) {
      case 'success':
        colorClass = 'bg-green-500';
        break;
      case 'failure':
        colorClass = 'bg-red-500';
        break;
      case 'cancelled':
        colorClass = 'bg-gray-500';
        break;
      case 'skipped':
        colorClass = 'bg-yellow-500';
        break;
    }
  } else if (status === 'in_progress') {
    colorClass = 'bg-blue-500 animate-pulse';
    text = 'running';
  } else if (status === 'queued') {
    colorClass = 'bg-yellow-500';
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${colorClass}`}>
      {text}
    </span>
  );
}
