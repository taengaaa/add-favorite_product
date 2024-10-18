"use client"

import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, ThumbsUp, Edit, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import Image from "next/image"
import { Product } from './ProductOverview';
import { useRouter } from 'next/navigation';
import { categories } from '@/src/utils/categories';
import dynamic from 'next/dynamic';

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
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const router = useRouter();

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const actualProduct = storedProducts.find((p: Product) => p.id === initialProduct.id);
    if (actualProduct) {
      setProduct(actualProduct);
    }
  }, [initialProduct.id]);

  const getCategoryEmoji = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.icon : '🌐'; // Default to globe emoji if category not found
  };

  const handleUpvote = () => {
    const updatedProduct = {
      ...product,
      upvotes: product.upvoted ? product.upvotes - 1 : product.upvotes + 1,
      upvoted: !product.upvoted
    };
    setProduct(updatedProduct);

    const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = storedProducts.map((p: Product) => 
      p.id === updatedProduct.id ? updatedProduct : p
    );
    localStorage.setItem('products', JSON.stringify(updatedProducts));
  };

  const handleCommentSubmit = () => {
    // Here you would typically send the comment to your backend
    console.log("Submitted comment:", comment);
    // Clear the comment field after submission
    setComment("");
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
