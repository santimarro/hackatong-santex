import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { getReviewStatusText } from '@/lib/note-utils';

interface ReviewStatusBadgeProps {
  status: string | null;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tooltipText?: string;
  reviewDate?: string | null;
  reviewerName?: string | null;
}

/**
 * A badge component to display the review status of a summary
 */
const ReviewStatusBadge: React.FC<ReviewStatusBadgeProps> = ({
  status,
  className = '',
  showText = true,
  size = 'md',
  tooltipText,
  reviewDate,
  reviewerName,
}) => {
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs';
  const paddingSize = size === 'sm' ? 'px-1.5 py-0.5' : size === 'lg' ? 'px-3 py-1' : 'px-2 py-0.5';
  
  let icon = null;
  let text = '';
  let colorClasses = '';
  
  switch (status) {
    case 'reviewed':
      icon = <CheckCircle2 className={`${iconSize} mr-1`} />;
      text = 'Verified';
      colorClasses = 'bg-green-100 text-green-800 border-green-300';
      break;
      
    case 'rejected':
      icon = <XCircle className={`${iconSize} mr-1`} />;
      text = 'Rejected';
      colorClasses = 'bg-red-100 text-red-800 border-red-300';
      break;
      
    case 'pending_review':
    default:
      icon = <Clock className={`${iconSize} mr-1`} />;
      text = 'Pending';
      colorClasses = 'bg-amber-100 text-amber-800 border-amber-300';
      break;
  }
  
  if (!status) {
    return null;
  }
  
  // Generate tooltip content if tooltipText or reviewDate or reviewerName is provided
  const hasTooltip = tooltipText || reviewDate || reviewerName;
  const statusText = getReviewStatusText(status);
  
  const badge = (
    <span className={`inline-flex items-center border rounded-full ${paddingSize} ${colorClasses} ${className}`}>
      {icon}
      {showText && <span className={`${textSize} font-medium`}>{text}</span>}
    </span>
  );
  
  if (hasTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="text-sm">
              <p className="font-medium">{statusText}</p>
              {tooltipText && <p>{tooltipText}</p>}
              {reviewerName && <p className="text-xs">Reviewed by: {reviewerName}</p>}
              {reviewDate && <p className="text-xs">on {reviewDate}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return badge;
};

export default ReviewStatusBadge; 