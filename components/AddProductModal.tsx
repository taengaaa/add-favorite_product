"use client"

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, CheckCircle, XCircle, X } from 'lucide-react';
import { Product } from './ProductOverview';
import { categories } from '@/src/utils/categories';

type AddProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Product) => void;
};

export default function AddProductModal({ isOpen, onClose, onAddProduct }: AddProductModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProduct({ id: '', name, description, category, image, link, upvotes: 0, upvoted: false });
    onClose();
    setName('');
    setDescription('');
    setCategory('');
    setImage('');
    setLink('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadStatus('uploading');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setUploadStatus('success');
      };
      reader.onerror = () => {
        setUploadStatus('error');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage('');
    setUploadStatus('idle');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
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
          <Button type="submit">Add Product</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}