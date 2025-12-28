'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, Loader2, AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { ApiPlaygroundPage, ApiParameter } from '@/types';

const STORAGE_KEYS = {
  BASE_URL: 'api_playground_base_url',
  TOKEN: 'api_playground_token',
};

interface ApiPlaygroundContextType {
  page: ApiPlaygroundPage;
  baseUrl: string;
  token: string;
  parameterValues: Record<string, any>;
  requestBody: string;
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    error?: string;
  } | null;
  loading: boolean;
  error: string | null;
  generateCurlCommand: () => string;
  handleCopyCurl: () => Promise<void>;
  handleParameterChange: (name: string, value: any) => void;
  setBaseUrl: (value: string) => void;
  setToken: (value: string) => void;
  setRequestBody: (value: string) => void;
  handleExecute: () => Promise<void>;
  copied: boolean;
}

const ApiPlaygroundContext = createContext<ApiPlaygroundContextType | null>(null);

export function useApiPlayground() {
  const context = useContext(ApiPlaygroundContext);
  if (!context) {
    throw new Error('useApiPlayground must be used within ApiPlaygroundProvider');
  }
  return context;
}

interface ApiPlaygroundProps {
  page: ApiPlaygroundPage;
  renderCurlInSidebar?: boolean;
}

// Provider component that wraps the playground state
export function ApiPlaygroundProvider({ 
  page, 
  children 
}: { 
  page: ApiPlaygroundPage; 
  children: React.ReactNode;
}) {
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [parameterValues, setParameterValues] = useState<Record<string, any>>({});
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedBaseUrl = localStorage.getItem(STORAGE_KEYS.BASE_URL) || '';
    const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN) || '';
    setBaseUrl(savedBaseUrl);
    setToken(savedToken);

    // Initialize parameter values with defaults
    const params = (page.api_parameters as ApiParameter[]) || [];
    const initialValues: Record<string, any> = {};
    params.forEach((param) => {
      if (param.default !== undefined) {
        initialValues[param.name] = param.default;
      } else if (!param.required) {
        initialValues[param.name] = '';
      }
    });
    setParameterValues(initialValues);

    // Initialize request body if there's a schema
    if (page.api_request_body_schema) {
      try {
        setRequestBody(JSON.stringify(page.api_request_body_schema, null, 2));
      } catch {
        setRequestBody('');
      }
    }
  }, [page]);

  // Save to localStorage when values change
  useEffect(() => {
    if (baseUrl) {
      localStorage.setItem(STORAGE_KEYS.BASE_URL, baseUrl);
    }
  }, [baseUrl]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
  }, [token]);

  const handleParameterChange = (name: string, value: any) => {
    setParameterValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildUrl = () => {
    if (!page.api_endpoint) return '';
    
    let url = baseUrl.replace(/\/$/, '') + page.api_endpoint;
    const params = (page.api_parameters as ApiParameter[]) || [];
    
    // Replace path parameters
    params
      .filter((p) => p.location === 'path')
      .forEach((param) => {
        const value = parameterValues[param.name] || '';
        url = url.replace(`{${param.name}}`, encodeURIComponent(value));
      });

    // Add query parameters
    const queryParams = params
      .filter((p) => p.location === 'query' && parameterValues[p.name] !== undefined && parameterValues[p.name] !== '')
      .map((param) => {
        const value = parameterValues[param.name];
        return `${encodeURIComponent(param.name)}=${encodeURIComponent(value)}`;
      });

    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&');
    }

    return url;
  };

  const generateCurlCommand = () => {
    if (!baseUrl || !page.api_endpoint || !page.api_method) {
      return '';
    }

    const url = buildUrl();
    const params = (page.api_parameters as ApiParameter[]) || [];
    
    // Build headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Add token if provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add header parameters
    params
      .filter((p) => p.location === 'header' && parameterValues[p.name])
      .forEach((param) => {
        headers[param.name] = String(parameterValues[param.name]);
      });

    // Build curl command
    let curlCommand = `curl -X ${page.api_method} "${url}"`;

    // Add headers
    Object.entries(headers).forEach(([key, value]) => {
      curlCommand += ` \\\n  -H "${key}: ${value}"`;
    });

    // Build request body
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(page.api_method)) {
      if (requestBody.trim()) {
        try {
          // Validate JSON
          JSON.parse(requestBody);
          body = requestBody;
        } catch {
          // If invalid JSON, try to build from body parameters
          const bodyParams = params.filter((p) => p.location === 'body');
          if (bodyParams.length > 0) {
            const bodyObj: Record<string, any> = {};
            bodyParams.forEach((param) => {
              if (parameterValues[param.name] !== undefined && parameterValues[param.name] !== '') {
                bodyObj[param.name] = parameterValues[param.name];
              }
            });
            body = JSON.stringify(bodyObj);
          }
        }
      } else {
        // Build body from body parameters
        const bodyParams = params.filter((p) => p.location === 'body');
        if (bodyParams.length > 0) {
          const bodyObj: Record<string, any> = {};
          bodyParams.forEach((param) => {
            if (parameterValues[param.name] !== undefined && parameterValues[param.name] !== '') {
              bodyObj[param.name] = parameterValues[param.name];
            }
          });
          if (Object.keys(bodyObj).length > 0) {
            body = JSON.stringify(bodyObj);
          }
        }
      }

      if (body) {
        // Escape single quotes in JSON for curl command
        const escapedBody = body.replace(/'/g, "'\\''");
        curlCommand += ` \\\n  -d '${escapedBody}'`;
      }
    }

    return curlCommand;
  };

  const handleCopyCurl = async () => {
    const curlCommand = generateCurlCommand();
    if (!curlCommand) {
      toast.error('Please configure Base URL and API endpoint first');
      return;
    }

    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      toast.success('Curl command copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy curl command');
      console.error('Failed to copy:', err);
    }
  };

  const handleExecute = async () => {
    if (!baseUrl || !page.api_endpoint || !page.api_method) {
      setError('Base URL, endpoint, and method are required');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const url = buildUrl();
      const params = (page.api_parameters as ApiParameter[]) || [];
      
      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add token if provided
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Add header parameters
      params
        .filter((p) => p.location === 'header' && parameterValues[p.name])
        .forEach((param) => {
          headers[param.name] = String(parameterValues[param.name]);
        });

      // Build request body
      let body: string | undefined;
      if (['POST', 'PUT', 'PATCH'].includes(page.api_method)) {
        if (requestBody.trim()) {
          try {
            // Validate JSON
            JSON.parse(requestBody);
            body = requestBody;
          } catch {
            setError('Invalid JSON in request body');
            setLoading(false);
            return;
          }
        } else {
          // Build body from body parameters
          const bodyParams = params.filter((p) => p.location === 'body');
          if (bodyParams.length > 0) {
            const bodyObj: Record<string, any> = {};
            bodyParams.forEach((param) => {
              if (parameterValues[param.name] !== undefined && parameterValues[param.name] !== '') {
                bodyObj[param.name] = parameterValues[param.name];
              }
            });
            body = JSON.stringify(bodyObj);
          }
        }
      }

      const response = await fetch('/api/playground', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          method: page.api_method,
          headers,
          body,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setResponse({
          status: response.status,
          statusText: response.statusText,
          headers: responseData.headers || {},
          data: responseData.data || responseData,
          error: responseData.error || 'Request failed',
        });
      } else {
        setResponse({
          status: responseData.status || response.status,
          statusText: responseData.statusText || response.statusText,
          headers: responseData.headers || {},
          data: responseData.data || responseData,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute request');
      setResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        data: null,
        error: err.message || 'Failed to execute request',
      });
    } finally {
      setLoading(false);
    }
  };

  const params = (page.api_parameters as ApiParameter[]) || [];
  const queryParams = params.filter((p) => p.location === 'query');
  const pathParams = params.filter((p) => p.location === 'path');
  const headerParams = params.filter((p) => p.location === 'header');
  const bodyParams = params.filter((p) => p.location === 'body');

  const contextValue: ApiPlaygroundContextType = {
    page,
    baseUrl,
    token,
    parameterValues,
    requestBody,
    response,
    loading,
    error,
    generateCurlCommand,
    handleCopyCurl,
    handleParameterChange,
    setBaseUrl,
    setToken,
    setRequestBody,
    handleExecute,
    copied,
  };

  return (
    <ApiPlaygroundContext.Provider value={contextValue}>
      {children}
    </ApiPlaygroundContext.Provider>
  );
}

export function ApiPlayground({ page, renderCurlInSidebar = false }: ApiPlaygroundProps) {
  const {
    page: contextPage,
    baseUrl,
    token,
    parameterValues,
    requestBody,
    response,
    loading,
    error,
    handleParameterChange,
    setBaseUrl,
    setToken,
    setRequestBody,
    handleExecute,
    generateCurlCommand,
    handleCopyCurl,
    copied,
  } = useApiPlayground();

  const params = (contextPage.api_parameters as ApiParameter[]) || [];
  const queryParams = params.filter((p) => p.location === 'query');
  const pathParams = params.filter((p) => p.location === 'path');
  const headerParams = params.filter((p) => p.location === 'header');
  const bodyParams = params.filter((p) => p.location === 'body');

  return (
    <div className="space-y-6">
      {/* API Information */}
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">{page.title}</h1>
          {page.description && (
            <p className="text-xl text-muted-foreground">{page.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono">
            {page.api_method || 'GET'}
          </Badge>
          <code className="text-sm bg-muted px-2 py-1 rounded">
            {page.api_endpoint || '/endpoint'}
          </code>
        </div>
      </div>

      <Separator />

      {/* Global Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            These settings are saved and will be used for all API requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="base-url">Base URL</Label>
            <Input
              id="base-url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com"
            />
          </div>
          <div>
            <Label htmlFor="token">Token</Label>
            <Input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Your API token"
            />
          </div>
        </CardContent>
      </Card>

      {/* Parameters */}
      {(queryParams.length > 0 || pathParams.length > 0 || headerParams.length > 0 || bodyParams.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Parameters</CardTitle>
            <CardDescription>Configure request parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Path Parameters */}
            {pathParams.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Path Parameters</h3>
                <div className="space-y-3">
                  {pathParams.map((param) => (
                    <ParameterInput
                      key={param.name}
                      parameter={param}
                      value={parameterValues[param.name] || ''}
                      onChange={(value) => handleParameterChange(param.name, value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Query Parameters */}
            {queryParams.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Query Parameters</h3>
                <div className="space-y-3">
                  {queryParams.map((param) => (
                    <ParameterInput
                      key={param.name}
                      parameter={param}
                      value={parameterValues[param.name] || ''}
                      onChange={(value) => handleParameterChange(param.name, value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Header Parameters */}
            {headerParams.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Headers</h3>
                <div className="space-y-3">
                  {headerParams.map((param) => (
                    <ParameterInput
                      key={param.name}
                      parameter={param}
                      value={parameterValues[param.name] || ''}
                      onChange={(value) => handleParameterChange(param.name, value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Body Parameters */}
            {bodyParams.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Body Parameters</h3>
                <div className="space-y-3">
                  {bodyParams.map((param) => (
                    <ParameterInput
                      key={param.name}
                      parameter={param}
                      value={parameterValues[param.name] || ''}
                      onChange={(value) => handleParameterChange(param.name, value)}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Request Body */}
      {['POST', 'PUT', 'PATCH'].includes(page.api_method || '') && (
        <Card>
          <CardHeader>
            <CardTitle>Request Body</CardTitle>
            <CardDescription>JSON request body (optional if body parameters are defined)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              placeholder='{"key": "value"}'
              className="font-mono min-h-[200px]"
            />
          </CardContent>
        </Card>
      )}

      {/* Request - Curl Command - Only render in main content if not in sidebar */}
      {!renderCurlInSidebar && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Request</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCurl}
                disabled={!baseUrl || !page.api_endpoint}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {baseUrl && page.api_endpoint ? (
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                <code>{generateCurlCommand() || 'Configure parameters to generate curl command'}</code>
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                Configure Base URL and API endpoint to generate curl command
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Execute Button */}
      <div className="flex justify-end">
        <Button onClick={handleExecute} disabled={loading || !baseUrl || !page.api_endpoint}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Try It
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Response Display */}
      {response && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Response</CardTitle>
              <div className="flex items-center gap-2">
                {response.status >= 200 && response.status < 300 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <Badge variant={response.status >= 200 && response.status < 300 ? 'default' : 'destructive'}>
                  {response.status} {response.statusText}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {response.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{response.error}</AlertDescription>
              </Alert>
            )}
            <div>
              <h4 className="text-sm font-semibold mb-2">Response Body</h4>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
            {Object.keys(response.headers).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Response Headers</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(response.headers, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Separate component for rendering curl command in sidebar
export function CurlCommandSidebar() {
  const { page, baseUrl, generateCurlCommand, handleCopyCurl, copied } = useApiPlayground();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Request</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCurl}
            disabled={!baseUrl || !page.api_endpoint}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {baseUrl && page.api_endpoint ? (
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
            <code>{generateCurlCommand() || 'Configure parameters to generate curl command'}</code>
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">
            Configure Base URL and API endpoint to generate curl command
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface ParameterInputProps {
  parameter: ApiParameter;
  value: any;
  onChange: (value: any) => void;
}

function ParameterInput({ parameter, value, onChange }: ParameterInputProps) {
  const renderInput = () => {
    if (parameter.enum && parameter.enum.length > 0) {
      return (
        <Select value={String(value || '')} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Select ${parameter.name}`} />
          </SelectTrigger>
          <SelectContent>
            {parameter.enum.map((option) => (
              <SelectItem key={String(option)} value={String(option)}>
                {String(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    switch (parameter.type) {
      case 'boolean':
        return (
          <Select value={String(value || 'false')} onValueChange={(v) => onChange(v === 'true')}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">true</SelectItem>
              <SelectItem value="false">false</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'integer':
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parameter.type === 'integer' ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0)}
            placeholder={parameter.default !== undefined ? String(parameter.default) : ''}
          />
        );
      case 'array':
      case 'object':
        return (
          <Textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            }}
            placeholder={parameter.default !== undefined ? JSON.stringify(parameter.default) : ''}
            className="font-mono"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={parameter.default !== undefined ? String(parameter.default) : ''}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={parameter.name} className="font-mono text-sm">
          {parameter.name}
        </Label>
        {parameter.required && (
          <Badge variant="outline" className="text-xs">
            Required
          </Badge>
        )}
        {parameter.type && (
          <Badge variant="secondary" className="text-xs">
            {parameter.type}
          </Badge>
        )}
      </div>
      {parameter.description && (
        <p className="text-sm text-muted-foreground">{parameter.description}</p>
      )}
      {renderInput()}
    </div>
  );
}

