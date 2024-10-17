import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from './ProductOverview';
import { ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { categories } from '@/src/utils/categories';

type ProductGridProps = {
  products: Product[];
  onUpvote: (productId: string) => void;
};

export default function ProductGrid({ products, onUpvote }: ProductGridProps) {
  const getCategoryEmoji = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.icon : '🌐'; // Default to globe emoji if category not found
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Card key={product.id}>
          <Link href={`/product/${product.id}`} passHref className="block">
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <img src={product.image} alt={product.name} className="w-full h-48 object-cover mb-2" />
              <p className="text-sm text-gray-500 mb-2">
                {getCategoryEmoji(product.category)} {product.category}
              </p>
              <p className="text-sm">{product.description}</p>
            </CardContent>
          </Link>
          <CardFooter className="flex justify-between">
            <a 
              href={product.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              View Product
            </a>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                onUpvote(product.id);
              }}
              className={product.upvoted ? 'bg-primary text-primary-foreground' : ''}
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
