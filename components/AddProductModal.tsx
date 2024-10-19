"use client"

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, CheckCircle, XCircle, X, Loader2 } from 'lucide-react';
import { Product } from './ProductOverview';
import { categories } from '@/src/utils/categories';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast"
import { PostgrestError } from '@supabase/supabase-js';

type AddProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Omit<Product, 'id' | 'upvotes' | 'created_at'>) => Promise<void>;
  isLoading: boolean;
};

export default function AddProductModal({ isOpen, onClose, onAddProduct, isLoading }: AddProductModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !description || !category || !file || !link) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data: imageData, error: imageError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (imageError) throw new Error(`Error uploading image: ${imageError.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const newProduct = {
        name,
        description,
        category,
        image: publicUrl,
        link,
      };

      await onAddProduct(newProduct);
      resetForm();
      onClose();
      toast({
        title: "Success!",
        description: "Your product has been successfully added.",
      });
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error Adding Product",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setUploadStatus('uploading');
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setUploadStatus('success');
      };
      reader.onerror = () => {
        setUploadStatus('error');
        toast({
          title: "Image Upload Error",
          description: "Failed to upload the image. Please try again.",
          variant: "destructive",
        })
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleRemoveImage = () => {
    setImage('');
    setFile(null);
    setUploadStatus('idle');
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('');
    setImage('');
    setLink('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription className="sr-only">
            Form to add a new product
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.filter(cat => cat.name !== 'All').map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="image">Image</Label>
            <div className="flex flex-col items-center space-y-4">
              {uploadStatus !== 'success' ? (
                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                  </div>
                  <input id="image-upload" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" required />
                </label>
              ) : null}
              
              {uploadStatus !== 'idle' && (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {uploadStatus === 'uploading' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>}
                      {uploadStatus === 'success' && <CheckCircle className="text-green-500" />}
                      {uploadStatus === 'error' && <XCircle className="text-red-500" />}
                      <span className="text-sm">
                        {uploadStatus === 'uploading' && 'Uploading...'}
                        {uploadStatus === 'success' && 'Upload successful'}
                        {uploadStatus === 'error' && 'Upload failed'}
                      </span>
                    </div>
                    {uploadStatus === 'success' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {image && uploadStatus === 'success' && (
                    <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="link">Link</Label>
            <Input id="link" type="url" value={link} onChange={(e) => setLink(e.target.value)} required />
          </div>
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Product'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
