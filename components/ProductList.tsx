"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { categories } from '@/src/utils/categories';
import { Product } from './ProductOverview';
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ProductListProps {
  products: Product[];
  onUpvote: (productId: string) => void;
  userUpvotes: Set<string>;
}

const ProductList = ({ products, onUpvote, userUpvotes }: ProductListProps) => {
  const getCategoryEmoji = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.icon : '🌐';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Image</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="w-[400px]">Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right w-[100px]">Upvotes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id} className="h-20">
            <TableCell className="p-2">
              <div className="w-16 h-16 relative">
                <Link href={`/product/${product.id}`} passHref>
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover rounded-md"
                  />
                </Link>
              </div>
            </TableCell>
            <TableCell className="align-middle">
              <Link 
                href={`/product/${product.id}`} 
                className="hover:underline font-medium line-clamp-1"
              >
                {product.name}
              </Link>
            </TableCell>
            <TableCell className="align-middle">
              <div className="line-clamp-2 text-sm text-muted-foreground">
                {product.description}
              </div>
            </TableCell>
            <TableCell className="align-middle">
              <Badge variant="outline" className="text-sm whitespace-nowrap">
                {getCategoryEmoji(product.category)} {product.category}
              </Badge>
            </TableCell>
            <TableCell className="text-right align-middle">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpvote(product.id)}
                className={cn(
                  "whitespace-nowrap",
                  userUpvotes.has(product.id) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                {product.upvotes}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProductList;
