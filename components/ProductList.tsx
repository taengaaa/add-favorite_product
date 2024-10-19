"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { categories } from '@/src/utils/categories';
import { Product } from './ProductOverview';

interface ProductListProps {
  products: Product[];
  onUpvote: (productId: number) => void;
}

const ProductList = ({ products, onUpvote }: ProductListProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Upvotes</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>{product.description}</TableCell>
            <TableCell>
              {product.category ? (
                <>
                  {categories.find(cat => cat.name === product.category)?.icon || '🌐'} {product.category}
                </>
              ) : (
                'N/A'
              )}
            </TableCell>
            <TableCell className="text-right">{product.upvotes}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                className="mr-2"
                onClick={() => onUpvote(product.id)}
              >
                <ThumbsUp className="mr-2 h-4 w-4" /> Like
              </Button>
              <Link href={`/product/${product.id}`} passHref>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProductList;
