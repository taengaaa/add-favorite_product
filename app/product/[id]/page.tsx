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
    return null;
  }

  return data;
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4">
      <ProductDetail product={product} />
    </div>
  );
}
