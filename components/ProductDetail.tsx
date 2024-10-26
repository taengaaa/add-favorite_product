"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ExternalLink, ThumbsUp, Edit, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import Image from "next/image"
import { Product } from './ProductOverview';
import { useRouter } from 'next/navigation';
import { categories } from '@/src/utils/categories';
import dynamic from 'next/dynamic';
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

const MDPreview = dynamic(
  () => import("@uiw/react-markdown-preview").then((mod) => mod.default),
  { ssr: false }
);

type ProductDetailProps = {
  product: Product;
};

export default function ProductDetail({ product: initialProduct }: ProductDetailProps) {
  const [product, setProduct] = useState(initialProduct);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const router = useRouter();
  const { toast } = useToast()

  useEffect(() => {
    fetchProduct();
    checkUserUpvote();
  }, [initialProduct.id]);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', initialProduct.id)
      .single();
    if (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: `Failed to fetch product: ${error.message}`,
        variant: "destructive",
      })
    } else if (data) {
      setProduct(data);
    }
  };

  const checkUserUpvote = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      return;
    }

    const { data, error } = await supabase
      .from('upvotes')
      .select('*')
      .eq('product_id', initialProduct.id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error checking user upvote:', error);
    } else {
      setHasUpvoted(!!data);
    }
  };

  const getCategoryEmoji = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.icon : '🌐'; // Default to globe emoji if category not found
  };

  const handleUpvote = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('User ID not found');
      return;
    }

    const { data, error } = await supabase
      .rpc('toggle_upvote', { 
        product_id: product.id,
        user_id: userId 
      });

    if (error) {
      console.error('Error toggling upvote:', error);
    } else {
      const newUpvoteState = data as boolean;
      setHasUpvoted(newUpvoteState);
      setProduct(prevProduct => ({
        ...prevProduct,
        upvotes: newUpvoteState ? prevProduct.upvotes + 1 : prevProduct.upvotes - 1
      }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-4" asChild>
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>
      </Button>

      {/* Product details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="md:w-1/2">
          <div className="relative h-[300px] w-full">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
        <div className="p-6 md:w-1/2">
          <Badge variant="outline" className="text-sm mb-2 inline-block">
            {getCategoryEmoji(product.category)} {product.category}
          </Badge>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <Link 
            href={product.link}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center mb-6"
          >
            Visit Product Page
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
          <p className="text-lg mb-6">{product.description}</p>
          <Button 
            variant="outline"
            size="sm"
            onClick={handleUpvote}
            className={cn(
              hasUpvoted && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            )}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            {product.upvotes}
          </Button>
        </div>
      </div>
    </div>
  );
}
