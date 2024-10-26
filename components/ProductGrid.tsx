"use client";

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { categories } from '@/src/utils/categories';
import { Product } from './ProductOverview';
import Image from 'next/image';
import { cn } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  onUpvote: (productId: string) => void;
  userUpvotes: Set<string>;
}

export default function ProductGrid({ products, onUpvote, userUpvotes }: ProductGridProps) {
  const getCategoryEmoji = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.icon : '🌐'; // Default to globe emoji if category not found
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Card key={product.id}>
          <Link href={`/product/${product.id}`} passHref className="block">
            <CardContent className="p-0">
              <div className="relative w-full h-48">
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-4">
                <Badge variant="outline" className="text-sm mb-2 inline-block">
                  {getCategoryEmoji(product.category)} {product.category}
                </Badge>
                <h3 className="text-lg font-semibold">{product.name}</h3>
              </div>
            </CardContent>
          </Link>
          <CardFooter className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                onUpvote(product.id);
              }}
              className={cn(
                userUpvotes.has(product.id) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              {product.upvotes}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
