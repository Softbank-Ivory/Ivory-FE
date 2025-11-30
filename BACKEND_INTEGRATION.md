# Backend Integration Guide

This document outlines the steps required to transition the Ivory-FE application from using mock data to integrating with a real backend API.

## 1. Environment Setup

Configure the API base URL in your environment variables.

1.  Create or update `.env` (or `.env.local` for local development):
    ```properties
    VITE_API_BASE_URL=http://localhost:8080/api
    ```

## 2. API Client Configuration

Update `src/api/client.ts` to handle authentication and global error handling.

-   **Authentication**: Uncomment and implement the logic to attach the JWT token (or other auth mechanism) to the request headers.
-   **Error Handling**: Implement global error handling in the response interceptor (e.g., redirect to login on 401).

```typescript
// src/api/client.ts
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken'); // Or use a store
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 3. Implement API Endpoints

The files in `src/api/endpoints/` currently contain placeholder methods throwing "Not implemented" errors. You need to implement the actual API calls using `apiClient`.

**Files to update:**
-   `src/api/endpoints/functions.ts`
-   `src/api/endpoints/executions.ts`
-   `src/api/endpoints/runners.ts`
-   `src/api/endpoints/dashboard.ts`

**Example (`src/api/endpoints/functions.ts`):**
```typescript
// Before
list: async (): Promise<FunctionDef[]> => {
  throw new Error('Not implemented');
},

// After
list: async (): Promise<FunctionDef[]> => {
  const response = await apiClient.get('/functions');
  return response.data;
},
```

## 4. Update Service Layer

Update the service modules in `src/services/` to use the API endpoints instead of returning mock data.

**Files to update:**
-   `src/services/functionService.ts`
-   `src/services/executionService.ts`
-   `src/services/runnerService.ts`
-   `src/services/dashboardService.ts`

**Example (`src/services/functionService.ts`):**
```typescript
// Before
import { MOCK_FUNCTIONS } from './mock/functions';
// ...
getFunctions: async () => {
  return MOCK_FUNCTIONS;
}

// After
import { functionsApi } from '@/api/endpoints/functions';
// ...
getFunctions: async () => {
  // You can also transform data here if the backend response differs from the UI model
  return await functionsApi.list();
}
```

## 5. Type Synchronization

Ensure that the TypeScript interfaces in `src/types/api.ts` match the actual JSON response format from the backend.

-   If the backend returns fields in `snake_case`, you may need to map them to `camelCase` in the Service Layer or update the types to match.

## 6. Cleanup

Once the integration is verified and working:

1.  Delete the `src/services/mock/` directory.
2.  Remove any unused mock data imports.
