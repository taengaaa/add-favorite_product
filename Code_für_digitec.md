import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    // Launch browser with additional options
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,800'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Set a more realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
      
      // Set additional headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      });

      // First try to get meta image without loading the full page
      try {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 5000 
        });

        let image = await page.evaluate(() => {
          const metaImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                           document.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
          return metaImage || null;
        });

        if (image) {
          await browser.close();
          return NextResponse.json({ image });
        }
      } catch (quickLoadError) {
        console.log('Quick load failed, trying full page load');
      }

      // If meta image not found, try full page load
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });

      let image = await page.evaluate(() => {
        const selectors = [
          // Digitec specific selectors
          'img[alt*="Produkt"]',
          'img[class*="ProductImage"]',
          // General product image selectors
          'img[id*="product"][src*="product"]',
          'img[class*="product"]',
          'img[id*="main"][src*="product"]',
          'img[class*="main"][src*="product"]',
          'img[class*="gallery-image"]',
          // Meta tags
          'meta[property="og:image"]',
          'meta[name="twitter:image"]',
          'link[rel="image_src"]',
          // Fallbacks
          'img[src*="product"]',
          'img[width="480"]',
          'img[width="500"]',
          'img[width="600"]',
          'img[width="800"]',
          'img'
        ];

        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            if (element.tagName.toLowerCase() === 'img') {
              return element.getAttribute('src');
            } else {
              return element.getAttribute('content') || element.getAttribute('href');
            }
          }
        }
        return null;
      });

      // Ensure image URL is absolute
      if (image && !image.startsWith('http')) {
        const baseUrl = new URL(url).origin;
        image = new URL(image, baseUrl).href;
      }

      return NextResponse.json({ image });

    } finally {
      await browser.close();
    }

  } catch (error) {
    console.error('Error fetching link preview:', error);
    // Return a more graceful error response
    return NextResponse.json(
      { error: 'Failed to fetch link preview', details: error.message }, 
      { status: 500 }
    );
  }
}
