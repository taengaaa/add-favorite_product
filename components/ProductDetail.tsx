"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Product } from './ProductOverview';
import { ThumbsUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ProductDetailProps = {
  product: Product;
};

export default function ProductDetail({ product: initialProduct }: ProductDetailProps) {
  const [product, setProduct] = useState(initialProduct);
  const router = useRouter();

  useEffect(() => {
    // Fetch the actual product data from localStorage
    const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const actualProduct = storedProducts.find((p: Product) => p.id === initialProduct.id);
    if (actualProduct) {
      setProduct(actualProduct);
    }
  }, [initialProduct.id]);

  const handleUpvote = () => {
    const updatedProduct = {
      ...product,
      upvotes: product.upvoted ? product.upvotes - 1 : product.upvotes + 1,
      upvoted: !product.upvoted
    };
    setProduct(updatedProduct);

    // Update the product in localStorage
    const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedProducts = storedProducts.map((p: Product) => 
      p.id === updatedProduct.id ? updatedProduct : p
    );
    localStorage.setItem('products', JSON.stringify(updatedProducts));
  };

  return (
    <div>
      <Button onClick={() => router.push('/')} className="mb-4">Back to Products</Button>
      <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img src={product.image} alt={product.name} className="w-full h-auto object-cover rounded-lg" />
        </div>
        <div>
          <p className="text-lg mb-2">{product.category}</p>
          <p className="text-gray-700 mb-4">{product.description}</p>
          <div className="flex justify-between items-center mb-4">
            <a href={product.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              View Product
            </a>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleUpvote}
              className={product.upvoted ? 'bg-primary text-primary-foreground' : ''}
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              {product.upvotes}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
