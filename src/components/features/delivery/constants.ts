import type { ExecutionStatus } from '@/types/api';

export const MAP_DIMENSIONS = {
  width: 1212,
  height: 1325,
};

export const ROUTE_PATH = "M1050 1270 L520 1270 L520.304 397.084 C520.74 359.756 507.334 323.59 482.672 295.565 L468.259 279.187 L343.222 399.524 C320.88 421.026 292.46 435.128 261.824 439.915 L219.051 446.598 C202.378 449.204 186.26 454.585 171.367 462.519 L93.2125 504.152";

export const POI_COORDINATES = {
  START: { x: 1050, y: 1270 },
  STATION: { x: 520, y: 397 }, // Approximate station stop
  END: { x: 93.2125, y: 504.152 },
};

// Progress values along the path for different statuses
export const STAGE_PROGRESS: Record<ExecutionStatus, number> = {
  REQUEST_RECEIVED: 0.0,
  CODE_FETCHING: 0.05,     // Short move left
  SANDBOX_PREPARING: 0.23, // Stop at station (midway up)
  EXECUTING: 1.0,          // Move to end
  COMPLETED: 1.0,          // End
  FAILED: 0.0              // Start
};

export const BUBBLE_POSITIONS: Record<string, { x: number, y: number }> = {
    // Start Point
    REQUEST_RECEIVED: { x: 1050, y: 1270 }, 
    CODE_FETCHING: { x: 950, y: 1270 },
    
    // Stations along the way
    SANDBOX_PREPARING: { x: 580, y: 1270 }, 
    
    // Middle of the long route
    EXECUTING: { x: 580, y: 800 },
    
    // End Point
    COMPLETED: { x: 200, y: 400 },
    FAILED: { x: 1050, y: 1270 }
};
