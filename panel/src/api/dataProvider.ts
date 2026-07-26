import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axiosInstance from './axiosInstance';
import axios from 'axios';

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages?: number;
}

export interface ProviderResponse<T = any> {
  data?: T;
  status: number;
  errorCode?: string;
  errorMessage?: string;
  errorDetails?: any;
  success: boolean;
}

export interface RequestOptions extends AxiosRequestConfig {
  /**
   * Optional resource path override for this specific request.
   * If provided, it will be used instead of the default resource path 
   * defined in the constructor.
   */
  resourceOverride?: string;
  /**
   * Optional abort controller signal for request cancellation
   */
  signal?: AbortSignal;
}

/**
 * A highly customizable Data Provider for REST APIs.
 */
class DataProvider {
  private defaultResource: string;
  private api: AxiosInstance;

  /**
   * Creates an instance of DataProvider.
   * @param defaultResource The base resource name (e.g., 'users', 'posts').
   * @param customAxiosInstance Optional custom Axios instance.
   */
  constructor(defaultResource: string, customAxiosInstance?: AxiosInstance) {
    this.defaultResource = defaultResource;
    this.api = customAxiosInstance || axiosInstance;
  }

  /**
   * Resolves the endpoint path, prioritizing an override if provided.
   */
  private getEndpoint(options?: RequestOptions): string {
    const resource = options?.resourceOverride || this.defaultResource;
    // Ensure we don't end up with double slashes if resource starts with one
    return resource.startsWith('/') ? resource : `/${resource}`;
  }

  /**
   * Centralized error handling.
   */
  private handleError(action: string, endpoint: string, error: any): never {
    if (axios.isCancel(error)) {
      console.warn(`Request canceled: ${action} on ${endpoint}`);
    } else {
      console.error(`Error ${action} on ${endpoint}:`, error?.response?.data || error.message);
    }
    throw error;
  }

  /**
   * Fetch a paginated, sorted, and filtered list of resources.
   */
  async getList<T = any>(
    params: PaginationParams = {},
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const endpoint = this.getEndpoint(options);
    
    // Default values if not provided
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 10;
    
    // Construct query parameters, handling potentially complex filters
    const queryParams: Record<string, any> = {
      page,
      limit: perPage,
      ...(params.sortField && { 
          sort: params.sortField, 
          order: params.sortOrder || 'asc' 
      }),
    };

    // Handle filters: You might need to adjust how your backend expects filters.
    // Some expect individual query params (?status=active), others expect JSON stringified.
    if (params.filter && Object.keys(params.filter).length > 0) {
       // Option A: JSON stringified (Current approach)
       queryParams.filter = JSON.stringify(params.filter);
       
       // Option B: Spread them flat (Uncomment if needed)
       // Object.assign(queryParams, params.filter);
    }

    try {
      const response = await this.api.get(endpoint, {
        ...options, // Pass through any standard axios options (headers, etc)
        params: queryParams,
      });

      const result = response.data;

      // Robustly extract pagination data, handling various common backend formats
      return {
        data: result.data || result.items || result || [],
        total: result.total || result.totalCount || (Array.isArray(result) ? result.length : 0),
        page: result.page || page,
        perPage: result.perPage || result.limit || perPage,
        totalPages: result.totalPages || (result.total ? Math.ceil(result.total / perPage) : undefined),
      };
    } catch (error) {
      this.handleError('fetching list', endpoint, error);
    }
  }

  /**
   * Fetch a single resource by ID.
   */
  async getOne<T = any>(id: string | number, options?: RequestOptions): Promise<T> {
    const baseEndpoint = this.getEndpoint(options);
    const endpoint = `${baseEndpoint}/${id}`;
    
    try {
      const response = await this.api.get(endpoint, options);
      return response.data.data || response.data;
    } catch (error) {
      this.handleError(`fetching item ${id}`, endpoint, error);
    }
  }

  /**
   * Create a new resource.
   */
  async create<T = any, P = Partial<T>>(payload: P, options?: RequestOptions): Promise<ProviderResponse<T>> {
    const endpoint = this.getEndpoint(options);
    try {
      const response = await this.api.post(endpoint, payload, options);
      return {
        success: true,
        status: 200,
        data: response.data.data || response.data
      }

    } catch (error: any) {
      
      return {
        success: false,
        status: error?.response?.status,
        errorCode: error?.response?.data?.code,
        errorMessage: error?.response?.data?.message,
        errorDetails: error?.response?.data?.details
      }
    } 
  }

  /**
   * Update an existing resource.
   */
  async update<T = any, P = Partial<T>>(
    id: string | number, 
    payload: P, 
    options?: RequestOptions
  ): Promise<T> {
    const baseEndpoint = this.getEndpoint(options);
    const endpoint = `${baseEndpoint}/${id}`;
    
    try {
      const response = await this.api.put(endpoint, payload, options);
      return response.data.data || response.data;
    } catch (error) {
      this.handleError(`updating item ${id}`, endpoint, error);
    }
  }

  /**
   * Delete a resource by ID.
   */
  async delete(id: string | number, options?: RequestOptions): Promise<{ id: string | number }> {
    const baseEndpoint = this.getEndpoint(options);
    const endpoint = `${baseEndpoint}/${id}`;
    
    try {
      await this.api.delete(endpoint, options);
      return { id };
    } catch (error) {
       this.handleError(`deleting item ${id}`, endpoint, error);
    }
  }

  /**
   * Execute a custom GET request relative to the resource.
   */
  async customGet<T = any>(
      subPath: string, 
      options?: RequestOptions
  ): Promise<T> {
    const baseEndpoint = this.getEndpoint(options);
    // Ensure smooth joining of paths
    const cleanSubPath = subPath.startsWith('/') ? subPath : `/${subPath}`;
    const endpoint = `${baseEndpoint}${cleanSubPath}`;
    
    try {
      const response = await this.api.get(endpoint, options);
      return response.data;
    } catch (error) {
      this.handleError(`executing custom GET on`, endpoint, error);
    }
  }
  
  /**
   * Execute a custom POST request relative to the resource.
   */
  async customPost<T = any, P = any>(
      subPath: string, 
      payload: P,
      options?: RequestOptions
  ): Promise<ProviderResponse<T>> {
    const baseEndpoint = this.getEndpoint(options);
    const cleanSubPath = subPath.startsWith('/') ? subPath : `/${subPath}`;
    const endpoint = `${baseEndpoint}${cleanSubPath}`;
    
    try {
      const response = await this.api.post(endpoint, payload, options);
      return {
        success: true,
        status: 200,
        data: response.data.data || response.data
      }

    } catch (error: any) {
      
      return {
        success: false,
        status: error?.response?.status,
        errorCode: error?.response?.data?.code,
        errorMessage: error?.response?.data?.message,
        errorDetails: error?.response?.data?.details
      }
    } 
  }
}

/**
 * Factory function to create provider per resource.
 * Optionally allows passing a custom Axios instance.
 */
export const createDataProvider = (resource: string, api?: AxiosInstance) => 
    new DataProvider(resource, api);
