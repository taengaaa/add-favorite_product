"use client"

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid2X2, List } from 'lucide-react';
import AddProductModal from './AddProductModal';
import ProductList from './ProductList';
import ProductGrid from './ProductGrid';
import { categories } from '@/src/utils/categories';
import { useToast } from "@/hooks/use-toast"

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  image: string;
  link: string;
  upvotes: number;
  created_at: string;
}

export default function ProductOverview() {
  const [isGridView, setIsGridView] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minVotes, setMinVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory, minVotes]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*')
      .order('upvotes', { ascending: false });

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    if (selectedCategory !== 'All') {
      query = query.eq('category', selectedCategory);
    }

    if (minVotes > 0) {
      query = query.gte('upvotes', minVotes);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: `Failed to fetch products: ${error.message}`,
        variant: "destructive",
      })
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const addProduct = async (product: Omit<Product, 'id' | 'upvotes' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert([{ ...product, upvotes: 0 }])
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: `Failed to add product: ${error.message}`,
        variant: "destructive",
      })
    } else if (data) {
      fetchProducts();
      toast({
        title: "Success",
        description: "Product added successfully",
      })
    }
  };

  const handleUpvote = async (productId: number) => {
    const { data, error } = await supabase
      .from('products')
      .update({ upvotes: products.find(p => p.id === productId)!.upvotes + 1 })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error upvoting:', error);
      toast({
        title: "Error",
        description: `Failed to upvote: ${error.message}`,
        variant: "destructive",
      })
    } else if (data) {
      fetchProducts();
    }
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
            <SelectItem value="All">All Categories</SelectItem>
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
      {loading ? (
        <div>Loading products...</div>
      ) : isGridView ? (
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
