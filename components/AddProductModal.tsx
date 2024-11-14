"use client"

import { useState, useEffect } from 'react';
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
import Image from 'next/image';

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
  const [isLinkValid, setIsLinkValid] = useState(false);
  const [isLinkLoading, setIsLinkLoading] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchLinkPreview = async (url: string) => {
      try {
        const response = await fetch('/api/link-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await response.json();
        if (data.image) {
          setImage(data.image);
          setUploadStatus('success');
          setIsLinkValid(true);
          toast({
            title: "Bild erfolgreich gefunden",
            description: (
              <div>
                <p>Verwendeter Selektor: {data.usedSelector}</p>
                {data.failedSelectors?.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      Nicht funktionierende Selektoren ({data.failedSelectors.length})
                    </summary>
                    <ul className="mt-1 text-sm text-muted-foreground">
                      {data.failedSelectors.map((selector: string, index: number) => (
                        <li key={index} className="ml-4">• {selector}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ),
            variant: "default",
          });
        } else {
          setUploadStatus('error');
          setIsLinkValid(false);
          toast({
            title: "Fehler beim Laden des Bildes",
            description: (
              <div>
                <p>{data.error}</p>
                {data.failedSelectors?.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm">
                      Fehlgeschlagene Selektoren ({data.failedSelectors.length})
                    </summary>
                    <ul className="mt-1 text-sm space-y-1">
                      {data.failedSelectors.map((item: { selector: string; reason: string }, index: number) => (
                        <li key={index} className="ml-4">
                          <span className="font-mono text-xs">{item.selector}</span>
                          <br />
                          <span className="text-muted-foreground text-xs">→ {item.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ),
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching link preview:', error);
        setUploadStatus('error');
        setIsLinkValid(false);
        toast({
          title: "Fehler",
          description: "Fehler beim Laden der Vorschau",
          variant: "destructive",
        });
      } finally {
        setIsLinkLoading(false);
      }
    };

    if (link) {
      setIsLinkLoading(true);
      timeoutId = setTimeout(() => {
        fetchLinkPreview(link);
      }, 500);
    }
    return () => clearTimeout(timeoutId);
  }, [link, toast]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !description || !category || !isLinkValid || !link) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields and provide a valid link before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newProduct = {
        name,
        description,
        category,
        image,
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

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('');
    setImage('');
    setLink('');
    setUploadStatus('idle');
    setIsLinkValid(false);
    setIsLinkLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
            <Label htmlFor="link">Link</Label>
            <Input 
              id="link" 
              type="url" 
              value={link} 
              onChange={(e) => setLink(e.target.value)} 
              required 
            />
            {isLinkLoading && <Loader2 className="mt-2 h-4 w-4 animate-spin" />}
            {!isLinkLoading && uploadStatus === 'success' && (
              <CheckCircle className="mt-2 text-green-500" />
            )}
            {!isLinkLoading && uploadStatus === 'error' && (
              <XCircle className="mt-2 text-red-500" />
            )}
          </div>
          {image && (
            <div className="mt-4">
              <Label>Image Preview</Label>
              <div className="mt-2 relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                <Image 
                  src={image} 
                  alt="Preview" 
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={isSubmitting || isLoading || !isLinkValid}>
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
