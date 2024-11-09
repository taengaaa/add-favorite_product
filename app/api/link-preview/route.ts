import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chrome from '@sparticuz/chromium';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    // Spezifische Prüfung für Migros Produkt-URLs
    const isMigrosProductUrl = url.match(/migros\.ch\/[a-z]{2}\/product\/\d+/);

    const executablePath = await chrome.executablePath;

    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath,
      headless: chrome.headless,
    });

    try {
      const page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
      
      // Migros-spezifische Headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'de-CH,de;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      });

      if (isMigrosProductUrl) {
        await page.goto(url, { 
          waitUntil: 'networkidle0',
          timeout: 15000 
        });

        const image = await page.evaluate(() => {
          // Migros-spezifische Meta-Tags und Selektoren
          const selectors = [
            // Primäre Migros Selektoren
            'meta[property="og:image:secure_url"]',
            'meta[property="og:image"]',
            // Spezifische Migros Produkt-Bild Selektoren
            'img[data-testid="product-detail-image"]',
            'img[class*="ProductImage"]',
            'img[class*="product-image"]',
            // Fallback für Migros
            'img[src*="media.migros.ch"]'
          ];

          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
              if (selector.startsWith('meta')) {
                const content = element.getAttribute('content');
                if (content?.includes('media.migros.ch')) return content;
              } else if (element instanceof HTMLImageElement) {
                if (element.src.includes('media.migros.ch')) return element.src;
              }
            }
          }
          return null;
        });

        if (image) {
          return NextResponse.json({ image });
        }
      }

      // Standard-Logik für andere Shops
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });

      const image = await page.evaluate(() => {
        const selectors = [
          'meta[property="og:image"]',
          'meta[name="twitter:image"]',
          'img[class*="ProductImage"]',
          'img[id*="product"][src*="product"]',
          'img[class*="product"]',
          'img[class*="gallery-image"]',
          'img[src*="product"]',
          'img[width="480"]',
          'img[width="500"]',
          'img[width="600"]'
        ];

        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            if (element.tagName.toLowerCase() === 'img') {
              return (element as HTMLImageElement).src;
            } else {
              return element.getAttribute('content');
            }
          }
        }
        return null;
      });

      if (image && !image.startsWith('http')) {
        const baseUrl = new URL(url).origin;
        return NextResponse.json({ image: new URL(image, baseUrl).href });
      }

      return NextResponse.json({ image });

    } finally {
      await browser.close();
    }

  } catch (error) {
    console.error('Error fetching link preview:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to fetch link preview' }, 
      { status: 500 }
    );
  }
}
