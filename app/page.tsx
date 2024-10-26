import ProductOverview from '@/components/ProductOverview';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Favorite Products</h1>
        </div>
        <p className="text-muted-foreground">
          Discover and share your favorite products with our community. Easily browse, upvote, and discuss the latest and greatest items across various categories.
        </p>
      </div>
      <ProductOverview />
    </main>
  );
}
