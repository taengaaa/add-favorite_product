import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Product } from './ProductOverview';
import { ThumbsUp } from 'lucide-react';
import Link from 'next/link';

type ProductListProps = {
  products: Product[];
  onUpvote: (productId: string) => void;
};

export default function ProductList({ products, onUpvote }: ProductListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Image</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Link</TableHead>
          <TableHead>Upvotes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              <Link href={`/product/${product.id}`} passHref>
                <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-md cursor-pointer" />
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/product/${product.id}`} passHref>
                <span className="cursor-pointer hover:underline">{product.name}</span>
              </Link>
            </TableCell>
            <TableCell>{product.category}</TableCell>
            <TableCell>{product.description}</TableCell>
            <TableCell>
              <a 
                href={product.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-500 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                View
              </a>
            </TableCell>
            <TableCell>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpvote(product.id);
                }}
                className={product.upvoted ? 'bg-primary text-primary-foreground' : ''}
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
}