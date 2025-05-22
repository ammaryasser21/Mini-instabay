import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-xl shadow-md animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  </div>
);

export const TransactionSkeleton: React.FC = () => (
  <div className="py-4 flex justify-between items-center animate-pulse">
    <div className="flex items-center">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="ml-3 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <div className="text-right space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <Skeleton className="h-4 w-32" />
    <div className="h-[300px] bg-gray-200 rounded-lg" />
  </div>
);