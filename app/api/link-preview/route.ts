import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

// Common selectors for product images across various e-commerce platforms
const IMAGE_SELECTORS = [
  // Specific selectors based on the screenshot structure
  '.pictureWithSource_StyledPicture img',
  'picture.pictureWithSource_StyledPicture img',
  'img[class*="e-0c12002-0"]', // Matches the specific class pattern
  // Product image selectors
  'img[data-zoom-image]',
  'mo-product-image-universal img',
  'img[data-magnify-src]',
  'img.product-image-photo',
  'img.product-image',
  'img.gallery-image',
  // Alt text selectors (German and English)
  'img[alt="Produktbild"]',
  'img[alt="Produktfoto"]',
  'img[alt="Hauptbild"]',
  'img[alt="product image"]',
  'img[alt="main product image"]',
  'img[alt*="Produkt"][alt*="bild"]',
  'img[alt*="product"][alt*="image"]',
  // Main product image containers
  '.product-image-container img',
  '.product-media-gallery img',
  '.product-gallery__image',
  // Specific marketplace selectors
  '[data-testid="product-image"] img',
  '[data-component-type="product-image"] img',
  // Fallback selectors
  'meta[property="og:image"]',
  'meta[name="twitter:image"]',
  // Generic but likely product image selectors
  '.main-image img',
  '#main-image img',
  '.primary-image img',
  '[role="main"] img'
];

function extractProductIdFromUrl(url: string): string | null {
  // Galaxus/Digitec URLs haben folgende Formate:
  // https://www.galaxus.ch/de/s1/product/123456
  // https://www.digitec.ch/de/s1/product/123456
  //coool
  const match = url.match(/(?:galaxus|digitec)\.ch\/.*?\/product[\/|-](\d+)/);
  return match ? match[1] : null;
}

// Funktion zur Erkennung von Migros URLs
function isMigrosProductUrl(url: string): boolean {
  return /^https?:\/\/(?:www\.)?migros\.ch\/.*?\/product\/\d+/.test(url);
}

export async function POST(request: Request) {
  let browser;
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const isMigros = isMigrosProductUrl(url);

    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
      hasTouch: false,
      locale: 'de-CH',
      geolocation: { longitude: 7.4474, latitude: 46.9480 }, // Schweizer Koordinaten
      permissions: ['geolocation'],
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'de-CH,de;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    const page = await context.newPage();

    // Erlaube alle Ressourcen für Migros
    if (isMigros) {
      await page.route('**/*', route => route.continue());
    } else {
      // Existing resource blocking for non-Migros sites
      await page.route('**/*', async (route) => {
        const request = route.request();
        if (['document', 'script'].includes(request.resourceType())) {
          route.continue();
        } else {
          route.abort();
        }
      });
    }

    // Navigiere zur Seite
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 // Erhöhtes Timeout für Migros
    });

    // Spezielle Behandlung für Migros
    if (isMigros) {
      try {
        // Warte auf die vollständige Initialisierung der Seite
        await page.waitForLoadState('networkidle');
        
        // Evaluiere die Seite direkt um das Produktbild zu finden
        const imageUrl = await page.evaluate(() => {
          // Suche zuerst nach dem Produktbild in der Universal-Komponente
          const universalImg = document.querySelector('mo-product-image-universal img[src*="image.migros.ch"]') as HTMLImageElement;
          if (universalImg) {
            return universalImg.getAttribute('src');
          }

          // Suche nach allen Bildern mit Migros-Domain
          const allImages = Array.from(document.querySelectorAll('img[src*="image.migros.ch"]')) as HTMLImageElement[];
          const productImage = allImages.find(img => 
            img.src.includes('/mo-boxed/') && 
            !img.src.includes('logo') && 
            !img.src.includes('icon')
          );
          
          if (productImage) {
            return productImage.src;
          }

          return null;
        });

        if (imageUrl) {
          await browser.close();
          return NextResponse.json({ 
            image: imageUrl,
            usedSelector: 'direct-evaluation'
          });
        }
      } catch (error) {
        console.log('Error processing Migros page:', error);
      }
    }

    // Fallback auf normale Selektoren wenn die direkte Evaluation fehlschlägt
    const filteredImageSelectors = isMigros 
      ? [
          'mo-product-image-universal img[src*="image.migros.ch"]',
          'img[src*="image.migros.ch"][src*="/mo-boxed/"]',
          'img[src*="image.migros.ch"]:not([src*="logo"]):not([src*="icon"])'
        ]
      : IMAGE_SELECTORS;

    // Angepasste Selektorprüfung für Migros
    const checkSelector = async (selector: string) => {
      try {
        if (selector.startsWith('meta')) {
          const metaContent = await page.getAttribute(selector, 'content');
          if (metaContent) {
            return { 
              imageUrl: metaContent, 
              usedSelector: selector 
            };
          }
          return { selector, reason: 'Meta tag content not found' };
        } else {
          const img = await page.locator(selector).first();
          
          // Prüfe zuerst die Existenz
          const exists = await img.count() > 0;
          if (!exists) {
            return { selector, reason: 'Element not found' };
          }

          // Hole das src Attribut
          const src = await img.getAttribute('src');
          if (src && src.includes('image.migros.ch')) {
            // Für Migros-Bilder prüfen wir nur das src Attribut
            return { 
              imageUrl: src, 
              usedSelector: selector 
            };
          }

          // Für andere Seiten prüfen wir weitere Attribute
          for (const attr of ['src', 'data-src', 'data-zoom-image', 'data-magnify-src']) {
            const attrValue = await img.getAttribute(attr);
            if (attrValue && !attrValue.includes('data:image')) {
              return { 
                imageUrl: attrValue, 
                usedSelector: `${selector}[${attr}]` 
              };
            }
          }
          return { selector, reason: 'No valid image source found' };
        }
      } catch (error) {
        return { selector, reason: error instanceof Error ? error.message : 'Unknown error' };
      }
    };

    // Optimierung 4: Priorisierte Selektoren
    const prioritySelectors = isMigros 
      ? filteredImageSelectors // Für Migros verwenden wir nur die Migros-spezifischen Selektoren
      : [
          'meta[property="og:image"]',
          'meta[name="twitter:image"]',
          '.product-image-container img',
          '[data-testid="product-image"] img'
        ];
    
    const remainingSelectors = isMigros 
      ? [] // Keine weiteren Selektoren für Migros
      : filteredImageSelectors.filter(
          selector => !prioritySelectors.includes(selector)
        );

    const failedSelectors = [];
    
    // Prüfe priorisierte Selektoren zuerst
    for (const selector of prioritySelectors) {
      const result = await checkSelector(selector);
      if ('imageUrl' in result && result.imageUrl) {
        await browser.close();
        const { imageUrl, usedSelector } = result;
        
        // Ensure the image URL is absolute
        const absoluteImageUrl = imageUrl.startsWith('//') 
          ? `https:${imageUrl}`
          : imageUrl.startsWith('/') 
            ? `${new URL(url).origin}${imageUrl}`
            : imageUrl;

        return NextResponse.json({ 
          image: absoluteImageUrl,
          usedSelector 
        });
      }
      failedSelectors.push(result);
    }

    // Prüfe restliche Selektoren parallel
    const results = await Promise.all(
      remainingSelectors.map(selector => checkSelector(selector))
    );

    const validResult = results.find(result => 'imageUrl' in result);
    failedSelectors.push(...results.filter(result => !('imageUrl' in result)));

    await browser.close();

    if (!validResult) {
      return NextResponse.json({ 
        error: 'Kein passendes Bild gefunden',
        failedSelectors
      }, { status: 404 });
    }

    const { imageUrl, usedSelector } = validResult as { imageUrl: string, usedSelector: string };
    
    // Ensure the image URL is absolute
    //
    const absoluteImageUrl = imageUrl.startsWith('//') 
      ? `https:${imageUrl}`
      : imageUrl.startsWith('/') 
        ? `${new URL(url).origin}${imageUrl}`
        : imageUrl;

    return NextResponse.json({ 
      image: absoluteImageUrl,
      usedSelector 
    });

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    return NextResponse.json({ 
      error: 'Failed to process URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

