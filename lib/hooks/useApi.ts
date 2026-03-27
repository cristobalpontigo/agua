import { useState, useCallback, useEffect, useRef } from 'react';
import { clientsApi, salesApi, paymentsApi, ApiResponse } from '@/lib/api-client';

// Generic hook for API interactions
function useApi<T>(
  fetchFn: () => Promise<ApiResponse<T>>,
  immediate = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFnRef.current();
      if (response.error) {
        setError(response.error);
      } else {
        setData(response.data || null);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      refetch();
    }
  }, [immediate, refetch]);

  return { data, loading, error, refetch };
}

// Clients hooks
export function useClients() {
  return useApi(() => clientsApi.getAll());
}

export function useClient(id: string) {
  return useApi(() => clientsApi.getById(id), !!id);
}

export function useCreateClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    create: async (data: any) => {
      setLoading(true);
      setError(null);
      try {
        const response = await clientsApi.create(data);
        if (response.error) {
          setError(response.error);
          return null;
        }
        return response.data;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    loading,
    error,
  };
}

// Sales hooks
export function useSales(params?: { clientId?: string; status?: string }) {
  return useApi(() => salesApi.getAll(params), true);
}

export function useSale(id: string) {
  return useApi(() => salesApi.getById(id), !!id);
}

export function useCreateSale() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    create: async (data: any) => {
      setLoading(true);
      setError(null);
      try {
        const response = await salesApi.create(data);
        if (response.error) {
          setError(response.error);
          return null;
        }
        return response.data;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    loading,
    error,
  };
}

// Payments hooks
export function usePayments(params?: { clientId?: string; status?: string }) {
  return useApi(() => paymentsApi.getAll(params), true);
}

export function usePayment(id: string) {
  return useApi(() => paymentsApi.getById(id), !!id);
}

export function useCreatePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    create: async (data: any) => {
      setLoading(true);
      setError(null);
      try {
        const response = await paymentsApi.create(data);
        if (response.error) {
          setError(response.error);
          return null;
        }
        return response.data;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    loading,
    error,
  };
}
