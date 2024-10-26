"use client"

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid2X2, List, Loader2 } from 'lucide-react';
import AddProductModal from './AddProductModal';
import ProductList from './ProductList';
import ProductGrid from './ProductGrid';
import { categories } from '@/src/utils/categories';
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

export interface Product {
  id: string; // Change this to string to accommodate UUID
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
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const { toast } = useToast();
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProducts();
    fetchUserUpvotes();
    // Generate or retrieve the user's unique identifier
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = uuidv4();
      localStorage.setItem('userId', userId);
    }
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*')
      .order('upvotes', { ascending: false });

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

  const fetchUserUpvotes = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const { data, error } = await supabase
      .from('upvotes')
      .select('product_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user upvotes:', error);
      toast({
        title: "Error",
        description: `Failed to fetch user upvotes: ${error.message}`,
        variant: "destructive",
      });
    } else {
      setUserUpvotes(new Set(data.map(item => item.product_id)));
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'upvotes' | 'created_at'>) => {
    setIsAddingProduct(true);
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
      setProducts(prevProducts => [data, ...prevProducts]);
      toast({
        title: "Success",
        description: "Product added successfully",
      })
    }
    setIsAddingProduct(false);
  };

  const handleUpvote = async (productId: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('User ID not found');
      return;
    }

    const { data, error } = await supabase
      .rpc('toggle_upvote', { 
        product_id: productId,
        user_id: userId 
      });

    if (error) {
      console.error('Error toggling upvote:', error);
      // Remove the toast notification here
    } else {
      const newUpvoteState = data as boolean;
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === productId 
            ? { ...p, upvotes: newUpvoteState ? p.upvotes + 1 : p.upvotes - 1 }
            : p
        )
      );
      setUserUpvotes(prevUpvotes => {
        const newUpvotes = new Set(prevUpvotes);
        if (newUpvoteState) {
          newUpvotes.add(productId);
        } else {
          newUpvotes.delete(productId);
        }
        return newUpvotes;
      });
      // Remove the toast notification here as well
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
            className={cn(
              isGridView && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            )}
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsGridView(false)}
            className={cn(
              !isGridView && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>Add Product</Button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : isGridView ? (
        <ProductGrid products={filteredProducts} onUpvote={handleUpvote} userUpvotes={userUpvotes} />
      ) : (
        <ProductList products={filteredProducts} onUpvote={handleUpvote} userUpvotes={userUpvotes} />
      )}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddProduct={addProduct}
        isLoading={isAddingProduct}
      />
      {isAddingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded-md shadow-lg flex items-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Adding product...</span>
          </div>
        </div>
      )}
    </div>
  );
}
