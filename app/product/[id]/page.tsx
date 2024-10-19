import { notFound } from 'next/navigation';
import ProductDetail from '@/components/ProductDetail';
import { supabase } from '@/lib/supabase';

async function getProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    throw new Error(`Failed to fetch product: ${error.message}`);
  }

  return data;
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  try {
    const product = await getProduct(params.id);

    if (!product) {
      notFound();
    }

    return (
      <div className="container mx-auto p-4">
        <ProductDetail product={product} />
      </div>
    );
  } catch (error) {
    console.error('Error in ProductDetailPage:', error);
    throw error; // This will trigger the closest error boundary
  }
}
