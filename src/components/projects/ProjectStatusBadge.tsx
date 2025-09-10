'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
  showTooltip?: boolean;
}

const statusConfig = {
  ACTIVE: {
    label: 'Active',
    color: 'bg-green-100 text-green-800 hover:bg-green-200',
    description: 'Project is currently in progress'
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    description: 'Project has been completed successfully'
  },
  PAUSED: {
    label: 'Paused',
    color: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    description: 'Project is temporarily on hold'
  }
};

export function ProjectStatusBadge({ status, className, showTooltip = true }: ProjectStatusBadgeProps) {
  const config = statusConfig[status];
  
  const badge = (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <Badge 
        className={cn(config.color, 'font-medium', className)}
        variant="outline"
      >
        {config.label}
      </Badge>
    </motion.div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}