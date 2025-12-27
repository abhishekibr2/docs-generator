'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Edit } from 'lucide-react';
import type { Category } from '@/types';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  order_index: z.number().min(0),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export function CategoryManager({ category }: { category?: Category }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isEdit = !!category;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description || '',
          order_index: category.order_index,
        }
      : {
          name: '',
          slug: '',
          description: '',
          order_index: 0,
        },
  });

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const url = isEdit
        ? `/api/categories/${category.id}`
        : '/api/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save category');
      }

      toast.success(
        isEdit ? 'Category updated successfully' : 'Category created successfully',
      );
      setOpen(false);
      reset();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEdit ? 'ghost' : 'default'} size={isEdit ? 'icon' : 'default'}>
          {isEdit ? <Edit className="h-4 w-4" /> : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Category' : 'Create Category'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the category details'
              : 'Create a new documentation category'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Getting Started"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              {...register('slug')}
              placeholder="getting-started"
            />
            {errors.slug && (
              <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Essential guides to get you up and running"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="order_index">Order Index</Label>
            <Input
              id="order_index"
              type="number"
              {...register('order_index', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.order_index && (
              <p className="text-sm text-red-500 mt-1">
                {errors.order_index.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


