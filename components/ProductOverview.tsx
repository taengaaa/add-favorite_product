"use client"

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid2X2, List } from 'lucide-react';
import AddProductModal from './AddProductModal';
import ProductList from './ProductList';
import ProductGrid from './ProductGrid';

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  link: string;
  upvotes: number;
  upvoted: boolean;
};

const categories = [
  { name: 'All', icon: '🌐' },
  { name: 'Electronics', icon: '💻' },
  { name: 'Clothing', icon: '👕' },
  { name: 'Books', icon: '📚' },
  { name: 'Home', icon: '🏠' },
  { name: 'Sports', icon: '⚽' },
];

export default function ProductOverview() {
  const [isGridView, setIsGridView] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minVotes, setMinVotes] = useState(0);

  useEffect(() => {
    // Load products from localStorage when the component mounts
    const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    setProducts(storedProducts);
  }, []);

  const addProduct = (product: Product) => {
    const newProduct = { ...product, id: Date.now().toString(), upvotes: 0, upvoted: false };
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    // Save updated products to localStorage
    localStorage.setItem('products', JSON.stringify(updatedProducts));
  };

  const handleUpvote = (productId: string) => {
    const updatedProducts = products.map(product => {
      if (product.id === productId) {
        const upvoted = !product.upvoted;
        return {
          ...product,
          upvotes: upvoted ? product.upvotes + 1 : product.upvotes - 1,
          upvoted: upvoted
        };
      }
      return product;
    });
    setProducts(updatedProducts);
    // Save updated products to localStorage
    localStorage.setItem('products', JSON.stringify(updatedProducts));
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === 'All' || product.category === selectedCategory) &&
      product.upvotes >= minVotes
    );
  }, [products, searchTerm, selectedCategory, minVotes]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0 md:space-x-2">
        <Input 
          placeholder="Search products..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:w-1/3"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="md:w-1/4">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.name} value={cat.name}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={minVotes.toString()} onValueChange={(value) => setMinVotes(Number(value))}>
          <SelectTrigger className="md:w-1/4">
            <SelectValue placeholder="Min votes" />
          </SelectTrigger>
          <SelectContent>
            {[0, 5, 10, 20, 50].map((value) => (
              <SelectItem key={value} value={value.toString()}>
                {value}+ votes
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsGridView(true)}
            className={isGridView ? 'bg-primary text-primary-foreground' : ''}
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsGridView(false)}
            className={!isGridView ? 'bg-primary text-primary-foreground' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>Add Product</Button>
        </div>
      </div>
      {isGridView ? (
        <ProductGrid products={filteredProducts} onUpvote={handleUpvote} />
      ) : (
        <ProductList products={filteredProducts} onUpvote={handleUpvote} />
      )}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddProduct={addProduct}
      />
    </div>
  );
}
