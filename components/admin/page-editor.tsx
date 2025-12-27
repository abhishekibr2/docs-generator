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
import { Save, Image as ImageIcon, Bold, Italic, Code, Link as LinkIcon } from 'lucide-react';
import { MDXPreview } from './mdx-preview';
import type { DocPageWithRelations, Category, DocPage } from '@/types';

const pageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-/]+$/, 'Slug must be lowercase alphanumeric with hyphens and slashes'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  status: z.enum(['draft', 'published']),
  category_id: z.string().optional(),
  parent_id: z.string().optional(),
  order_index: z.number().min(0),
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

  const onSubmit = async (data: PageFormData) => {
    setIsSaving(true);
    try {
      const url = isEdit ? `/api/pages/${page.id}` : '/api/pages';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          category_id: data.category_id || null,
          parent_id: data.parent_id || null,
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
    </form>
  );
}


