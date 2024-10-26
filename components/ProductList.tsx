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
    return category ? category.icon : '🌐'; // Default to globe emoji if category not found
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Image</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Upvotes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              <Link href={`/product/${product.id}`} passHref>
                <Image
                  src={product.image}
                  alt={product.name}
                  width={80}
                  height={80}
                  className="object-cover rounded-md"
                />
              </Link>
            </TableCell>
            <TableCell className="font-medium">
              <Link href={`/product/${product.id}`} passHref className="hover:underline">
                {product.name}
              </Link>
            </TableCell>
            <TableCell>{product.description}</TableCell>
            <TableCell>
              <Badge variant="outline" className="text-sm">
                {getCategoryEmoji(product.category)} {product.category}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpvote(product.id)}
                className={cn(
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
