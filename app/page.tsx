import ProductOverview from '@/components/ProductOverview';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Product Management</h1>
      <ProductOverview />
    </main>
  );
}