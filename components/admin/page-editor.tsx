'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Save, Image as ImageIcon, Bold, Italic, Code, Link as LinkIcon, Plus, Trash2, Clipboard } from 'lucide-react';
import { MDXPreview } from './mdx-preview';
import { PasteCurlDialog } from './paste-curl-dialog';
import type { DocPageWithRelations, Category, DocPage, ApiParameter } from '@/types';
import type { ParsedCurl } from '@/lib/utils/curl-parser';

const pageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-/]+$/, 'Slug must be lowercase alphanumeric with hyphens and slashes'),
  description: z.string().optional(),
  content: z.string().optional(), // Optional - required only if not in API playground mode
  status: z.enum(['draft', 'published']),
  category_id: z.string().optional(),
  parent_id: z.string().optional(),
  order_index: z.number().min(0),
  api_endpoint: z.string().optional(),
  api_method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional(),
  api_parameters: z.array(z.any()).optional(),
  api_request_body_schema: z.any().optional(),
  api_response_example: z.any().optional(),
});

type PageFormData = z.infer<typeof pageSchema>;

interface PageEditorProps {
  page?: DocPageWithRelations;
  categories: Category[];
  pages: DocPage[];
}

export function PageEditor({ page, categories, pages }: PageEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(page?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isApiPlayground, setIsApiPlayground] = useState(
    !!(page?.api_endpoint && page?.api_method)
  );
  const [apiEndpoint, setApiEndpoint] = useState(page?.api_endpoint || '');
  const [apiMethod, setApiMethod] = useState<string>(page?.api_method || 'GET');
  const [apiParameters, setApiParameters] = useState<ApiParameter[]>(
    (page?.api_parameters as ApiParameter[]) || []
  );
  const [apiRequestBodySchema, setApiRequestBodySchema] = useState(
    page?.api_request_body_schema ? JSON.stringify(page.api_request_body_schema, null, 2) : ''
  );
  const [apiResponseExample, setApiResponseExample] = useState(
    page?.api_response_example ? JSON.stringify(page.api_response_example, null, 2) : ''
  );
  const [isCurlDialogOpen, setIsCurlDialogOpen] = useState(false);
  const isEdit = !!page;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PageFormData>({
    resolver: zodResolver(pageSchema),
    defaultValues: page
      ? {
          title: page.title,
          slug: page.slug,
          description: page.description || '',
          content: page.content,
          status: page.status,
          category_id: page.category_id || '',
          parent_id: page.parent_id || '',
          order_index: page.order_index,
        }
      : {
          title: '',
          slug: '',
          description: '',
          content: '',
          status: 'draft',
          category_id: '',
          parent_id: '',
          order_index: 0,
        },
  });

  // Update content when form content changes
  const subscription = watch((value, { name }) => {
    if (name === 'content') {
      setContent(value.content || '');
    }
  });

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = before + selectedText + after;
    const newContent =
      content.substring(0, start) + newText + content.substring(end);

    setContent(newContent);
    setValue('content', newContent);
    textarea.focus();
    setTimeout(() => {
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length,
      );
    }, 0);
  };

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const { url } = await response.json();
        const markdown = `![${file.name}](${url})`;
        insertMarkdown(markdown, '');
        toast.success('Image uploaded successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to upload image');
      }
    };
    input.click();
  };

  const addParameter = () => {
    setApiParameters([
      ...apiParameters,
      {
        name: '',
        type: 'string',
        description: '',
        location: 'query',
        required: false,
      },
    ]);
  };

  const removeParameter = (index: number) => {
    setApiParameters(apiParameters.filter((_, i) => i !== index));
  };

  const updateParameter = (index: number, field: keyof ApiParameter, value: any) => {
    const updated = [...apiParameters];
    updated[index] = { ...updated[index], [field]: value };
    setApiParameters(updated);
  };

  const handleCurlParsed = (parsed: ParsedCurl) => {
    try {
      // Enable API Playground mode
      setIsApiPlayground(true);

      // Set HTTP method
      setApiMethod(parsed.method as any);

      // Set endpoint (just the path, not the full URL)
      setApiEndpoint(parsed.endpoint);

      // Convert query parameters to ApiParameter format
      const queryParams: ApiParameter[] = parsed.queryParams.map((qp) => ({
        name: qp.name,
        type: 'string' as const,
        description: `Query parameter: ${qp.name}`,
        location: 'query' as const,
        required: false,
        default: qp.value,
      }));

      // Convert headers to ApiParameter format (excluding Authorization)
      const headerParams: ApiParameter[] = Object.entries(parsed.headers)
        .filter(([name]) => name.toLowerCase() !== 'authorization')
        .map(([name, value]) => ({
          name,
          type: 'string' as const,
          description: `Header: ${name}`,
          location: 'header' as const,
          required: false,
          default: value,
        }));

      // Handle request body
      let bodyParams: ApiParameter[] = [];
      let requestBodySchema: any = null;

      if (parsed.body) {
        try {
          // Try to parse as JSON
          const bodyJson = JSON.parse(parsed.body);
          requestBodySchema = bodyJson;

          // If it's an object, extract keys as body parameters
          if (typeof bodyJson === 'object' && bodyJson !== null && !Array.isArray(bodyJson)) {
            bodyParams = Object.entries(bodyJson).map(([key, value]) => {
              let paramType: ApiParameter['type'] = 'string';
              if (typeof value === 'number') {
                paramType = Number.isInteger(value) ? 'integer' : 'number';
              } else if (typeof value === 'boolean') {
                paramType = 'boolean';
              } else if (Array.isArray(value)) {
                paramType = 'array';
              } else if (typeof value === 'object' && value !== null) {
                paramType = 'object';
              }

              return {
                name: key,
                type: paramType,
                description: `Body parameter: ${key}`,
                location: 'body' as const,
                required: false,
                default: value,
              };
            });
          }
        } catch {
          // If not valid JSON, store as plain text in request body schema
          requestBodySchema = parsed.body;
        }
      }

      // Combine all parameters
      const allParameters = [...queryParams, ...headerParams, ...bodyParams];
      setApiParameters(allParameters);

      // Set request body schema if it exists
      if (requestBodySchema !== null) {
        setApiRequestBodySchema(
          typeof requestBodySchema === 'string'
            ? requestBodySchema
            : JSON.stringify(requestBodySchema, null, 2)
        );
      }

      toast.success('Curl command parsed successfully! Form fields have been populated.');
    } catch (error: any) {
      toast.error(`Failed to process parsed curl: ${error.message}`);
    }
  };

  const onSubmit = async (data: PageFormData) => {
    // Validate content if not in API playground mode
    if (!isApiPlayground && (!data.content || data.content.trim().length === 0)) {
      toast.error('Content is required when API Playground mode is disabled');
      return;
    }

    // Validate API playground data if enabled
    if (isApiPlayground) {
      if (!apiEndpoint || !apiMethod) {
        toast.error('API endpoint and method are required when API Playground mode is enabled');
        return;
      }
    }

    setIsSaving(true);
    try {
      const url = isEdit ? `/api/pages/${page.id}` : '/api/pages';
      const method = isEdit ? 'PUT' : 'POST';

      // Prepare API playground data
      let apiPlaygroundData: any = {};
      if (isApiPlayground) {
        apiPlaygroundData = {
          api_endpoint: apiEndpoint || null,
          api_method: apiMethod || null,
          api_parameters: apiParameters.length > 0 ? apiParameters : null,
          api_request_body_schema: apiRequestBodySchema
            ? (() => {
                try {
                  return JSON.parse(apiRequestBodySchema);
                } catch {
                  toast.error('Invalid JSON in request body schema');
                  setIsSaving(false);
                  return null;
                }
              })()
            : null,
          api_response_example: apiResponseExample
            ? (() => {
                try {
                  return JSON.parse(apiResponseExample);
                } catch {
                  toast.error('Invalid JSON in response example');
                  setIsSaving(false);
                  return null;
                }
              })()
            : null,
        };
      } else {
        // Clear API playground data if disabled
        apiPlaygroundData = {
          api_endpoint: null,
          api_method: null,
          api_parameters: null,
          api_request_body_schema: null,
          api_response_example: null,
        };
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          category_id: data.category_id || null,
          parent_id: data.parent_id || null,
          ...apiPlaygroundData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save page');
      }

      toast.success(isEdit ? 'Page updated successfully' : 'Page created successfully');
      router.push('/admin/pages');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save page');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Edit Page' : 'New Page'}
        </h1>
        <Button type="submit" disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register('title')} />
          {errors.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...register('slug')} placeholder="getting-started" />
          {errors.slug && (
            <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="A brief description of this page"
          rows={2}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="category_id">Category</Label>
          <Select
            value={watch('category_id') || '__none__'}
            onValueChange={(value) => setValue('category_id', value === '__none__' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="parent_id">Parent Page</Label>
          <Select
            value={watch('parent_id') || '__none__'}
            onValueChange={(value) => setValue('parent_id', value === '__none__' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select parent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {pages
                .filter((p) => p.id !== page?.id)
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="order_index">Order Index</Label>
          <Input
            id="order_index"
            type="number"
            {...register('order_index', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="status"
          checked={watch('status') === 'published'}
          onCheckedChange={(checked) =>
            setValue('status', checked ? 'published' : 'draft')
          }
        />
        <Label htmlFor="status">
          {watch('status') === 'published' ? 'Published' : 'Draft'}
        </Label>
      </div>

      {/* API Playground Toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id="api-playground"
          checked={isApiPlayground}
          onCheckedChange={(checked) => {
            setIsApiPlayground(checked);
            if (!checked) {
              // Clear API playground data when disabled
              setApiEndpoint('');
              setApiMethod('GET');
              setApiParameters([]);
              setApiRequestBodySchema('');
              setApiResponseExample('');
            }
          }}
        />
        <Label htmlFor="api-playground">API Playground Mode</Label>
      </div>

      {/* API Playground Fields */}
      {isApiPlayground && (
        <div className="space-y-6 border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold mb-4">API Playground Configuration</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCurlDialogOpen(true)}
            >
              <Clipboard className="h-4 w-4 mr-2" />
              Paste Curl
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="api-endpoint">API Endpoint</Label>
              <Input
                id="api-endpoint"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="/tasks"
              />
            </div>

            <div>
              <Label htmlFor="api-method">HTTP Method</Label>
              <Select value={apiMethod} onValueChange={setApiMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                  <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parameters */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Parameters</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addParameter}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Parameter
              </Button>
            </div>
            <div className="space-y-4">
              {apiParameters.map((param, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Parameter {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParameter(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={param.name}
                        onChange={(e) => updateParameter(index, 'name', e.target.value)}
                        placeholder="parameter-name"
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={param.type}
                        onValueChange={(value) => updateParameter(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">string</SelectItem>
                          <SelectItem value="integer">integer</SelectItem>
                          <SelectItem value="number">number</SelectItem>
                          <SelectItem value="boolean">boolean</SelectItem>
                          <SelectItem value="array">array</SelectItem>
                          <SelectItem value="object">object</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Select
                        value={param.location}
                        onValueChange={(value) => updateParameter(index, 'location', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="query">Query</SelectItem>
                          <SelectItem value="path">Path</SelectItem>
                          <SelectItem value="header">Header</SelectItem>
                          <SelectItem value="body">Body</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={param.required}
                        onCheckedChange={(checked) => updateParameter(index, 'required', checked)}
                      />
                      <Label>Required</Label>
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={param.description || ''}
                      onChange={(e) => updateParameter(index, 'description', e.target.value)}
                      placeholder="Parameter description"
                    />
                  </div>
                  <div>
                    <Label>Default Value (optional)</Label>
                    <Input
                      value={param.default !== undefined ? String(param.default) : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          const { default: _, ...rest } = param;
                          updateParameter(index, 'default' as any, undefined);
                        } else {
                          updateParameter(index, 'default' as any, value);
                        }
                      }}
                      placeholder="Default value"
                    />
                  </div>
                </div>
              ))}
              {apiParameters.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No parameters added. Click "Add Parameter" to add one.
                </p>
              )}
            </div>
          </div>

          {/* Request Body Schema */}
          {['POST', 'PUT', 'PATCH'].includes(apiMethod) && (
            <div>
              <Label htmlFor="api-request-body-schema">Request Body Schema (JSON)</Label>
              <Textarea
                id="api-request-body-schema"
                value={apiRequestBodySchema}
                onChange={(e) => setApiRequestBodySchema(e.target.value)}
                placeholder='{"type": "object", "properties": {...}}'
                className="font-mono min-h-[150px]"
              />
            </div>
          )}

          {/* Response Example */}
          <div>
            <Label htmlFor="api-response-example">Response Example (JSON)</Label>
            <Textarea
              id="api-response-example"
              value={apiResponseExample}
              onChange={(e) => setApiResponseExample(e.target.value)}
              placeholder='{"data": {...}}'
              className="font-mono min-h-[150px]"
            />
          </div>
        </div>
      )}

      {/* MDX Editor - only show if not in API playground mode */}
      {!isApiPlayground && (
        <Tabs defaultValue="edit" className="w-full">
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="space-y-2">
          <div className="flex gap-2 p-2 border-b">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('**', '**')}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('*', '*')}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('`', '`')}
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('[', '](url)')}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleImageUpload}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            {...register('content')}
            className="font-mono min-h-[600px]"
            placeholder="Write your MDX content here..."
          />
          {errors.content && (
            <p className="text-sm text-red-500">{errors.content.message}</p>
          )}
        </TabsContent>
        <TabsContent value="preview" className="border rounded-lg p-6">
          <MDXPreview content={content} />
        </TabsContent>
      </Tabs>
      )}

      {/* Show message if API playground mode is enabled */}
      {isApiPlayground && (
        <div className="border rounded-lg p-6 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            API Playground mode is enabled. MDX content editor is hidden. The page will display as an interactive API playground.
          </p>
        </div>
      )}

      {/* Paste Curl Dialog */}
      <PasteCurlDialog
        open={isCurlDialogOpen}
        onOpenChange={setIsCurlDialogOpen}
        onCurlParsed={handleCurlParsed}
      />
    </form>
  );
}


