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
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const router = useRouter();
  const { toast } = useToast()

  useEffect(() => {
    fetchProduct();
    fetchComments();
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

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('product_id', initialProduct.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: `Failed to fetch comments: ${error.message}`,
        variant: "destructive",
      })
    } else {
      setComments(data || []);
    }
  };

  const getCategoryEmoji = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.icon : '🌐'; // Default to globe emoji if category not found
  };

  const handleUpvote = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('User authentication error:', userError);
      toast({
        title: "Authentication Error",
        description: "Please sign in to upvote products.",
        variant: "destructive",
      })
      return;
    }
    if (!userData.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upvote products.",
        variant: "destructive",
      })
      return;
    }

    const { error } = await supabase
      .rpc('toggle_upvote', { product_id: product.id, user_id: userData.user.id });

    if (error) {
      console.error('Error upvoting:', error);
      toast({
        title: "Upvote Error",
        description: `Failed to upvote: ${error.message}`,
        variant: "destructive",
      })
    } else {
      fetchProduct();
      toast({
        title: "Success",
        description: "Your vote has been recorded.",
      })
    }
  };

  const handleCommentSubmit = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('User authentication error:', userError);
      toast({
        title: "Authentication Error",
        description: "Please sign in to comment.",
        variant: "destructive",
      })
      return;
    }
    if (!userData.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to comment.",
        variant: "destructive",
      })
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Comment Error",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      })
      return;
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([{ product_id: product.id, user_id: userData.user.id, content: comment }])
      .select()
      .single();

    if (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Comment Error",
        description: `Failed to submit comment: ${error.message}`,
        variant: "destructive",
      })
    } else if (data) {
      setComments([data, ...comments]);
      setComment("");
      toast({
        title: "Success",
        description: "Your comment has been posted.",
      })
    }
  };

  const customMDPreviewStyles = `
    .wmde-markdown ul {
      list-style-type: disc;
      padding-left: 2em;
    }
    .wmde-markdown ol {
      list-style-type: decimal;
      padding-left: 2em;
    }
  `;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-4" asChild>
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>
      </Button>
      
      <div className="bg-background shadow-sm rounded-lg overflow-hidden mb-8">
        <div className="md:flex">
          <div className="md:w-1/2">
            <Image
              src={product.image}
              alt={product.name}
              width={400}
              height={400}
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="p-6 md:w-1/2">
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-sm text-muted-foreground mb-4">
              Category: {getCategoryEmoji(product.category)} {product.category}
            </p>
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
              className="w-full sm:w-auto"
              onClick={handleUpvote}
              variant={product.upvoted ? "default" : "outline"}
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              Upvote ({product.upvotes})
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-background shadow-sm rounded-lg overflow-hidden p-6">
        <h2 className="text-2xl font-bold mb-4">Add a comment</h2>
        <Tabs defaultValue="write" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="write">
              <Edit className="mr-2 h-4 w-4" />
              Write
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
          <TabsContent value="write" className="mt-4">
            <MDEditor
              value={comment}
              onChange={(value?: string) => setComment(value || "")}
              preview="edit"
              height={200}
              className="min-h-[200px]"
              textareaProps={{
                placeholder: "Write your comment here...",
              }}
            />
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            <div className="border rounded-md p-4 min-h-[200px] bg-background">
              <style>{customMDPreviewStyles}</style>
              <MDPreview source={comment} />
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end mt-4">
          <Button onClick={handleCommentSubmit}>Submit Comment</Button>
        </div>
      </div>
    </div>
  );
}
