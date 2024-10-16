import { notFound } from 'next/navigation';
import ProductDetail from '@/components/ProductDetail';
import { Product } from '@/components/ProductOverview';

// This function now returns a dummy product for dynamic rendering
function getProduct(id: string): Product | null {
  // In a real application, you would fetch the product from an API or database
  // For now, we'll return a dummy product for any ID
  return {
    id,
    name: `Product ${id}`,
    description: 'This is a dynamically generated product description.',
    category: 'Dynamic Category',
    image: 'https://via.placeholder.com/400',
    link: 'https://example.com',
    upvotes: 0,
    upvoted: false
  };
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = getProduct(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4">
      <ProductDetail product={product} />
    </div>
  );
}