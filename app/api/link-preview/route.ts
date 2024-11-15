import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

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

    try {
      browser = await puppeteer.launch({
        args: [
          '--disable-web-security',
          '--disable-features=IsolateOrigins',
          '--disable-site-isolation-trials',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ],
        defaultViewport: {
          width: 1280,
          height: 800,
          deviceScaleFactor: 1,
        },
        headless: "new",
      });
    } catch (error) {
      console.error('Browser launch error:', error);
      return NextResponse.json({ 
        error: 'Fehler beim Starten des Browsers',
        details: error instanceof Error ? error.message : 'Unbekannter Browser-Fehler',
        type: 'browser_launch_error'
      }, { status: 500 });
    }

    let page;
    try {
      page = await browser.newPage();
      
      // Timeout erhöhen und Error Handling verbessern
      page.setDefaultTimeout(60000);
      page.setDefaultNavigationTimeout(60000);

      // Error Event Handler mit detailliertem Logging
      page.on('error', err => {
        console.error('Page error:', err);
      });

      page.on('pageerror', err => {
        console.error('Page error:', err);
      });

      page.on('console', msg => {
        console.log('Browser console:', msg.text());
      });

      // Set user agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
      
      // Set extra headers
      await page.setExtraHTTPHeaders({
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
      });

    } catch (error) {
      console.error('Page creation error:', error);
      if (browser) await browser.close();
      return NextResponse.json({ 
        error: 'Fehler beim Erstellen der Browser-Seite',
        details: error instanceof Error ? error.message : 'Unbekannter Seiten-Fehler',
        type: 'page_creation_error'
      }, { status: 500 });
    }

    // Verbesserte Request Interception mit Logging
    try {
      await page.setRequestInterception(true);
      page.on('request', request => {
        try {
          if (isMigros) {
            request.continue();
          } else {
            const resourceType = request.resourceType();
            if (['document', 'script', 'xhr', 'fetch'].includes(resourceType)) {
              request.continue();
            } else {
              request.abort();
            }
          }
        } catch (error) {
          console.error('Request interception error:', error);
          request.continue();
        }
      });
    } catch (error) {
      console.error('Request interception setup error:', error);
      if (browser) await browser.close();
      return NextResponse.json({ 
        error: 'Fehler bei der Request-Interception',
        details: error instanceof Error ? error.message : 'Unbekannter Interception-Fehler',
        type: 'request_interception_error'
      }, { status: 500 });
    }

    // Navigate to page with better error handling
    try {
      const response = await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 60000
      });

      if (!response) {
        throw new Error('Keine Antwort von der Seite erhalten');
      }

      const status = response.status();
      if (status >= 400) {
        throw new Error(`Seite antwortet mit Status ${status} (${response.statusText()})`);
      }

      // Prüfe ob die Seite überhaupt geladen wurde
      const content = await page.content();
      if (!content || content.length < 100) {
        throw new Error('Seite konnte nicht vollständig geladen werden');
      }

    } catch (error) {
      console.error('Navigation error:', error);
      if (browser) await browser.close();
      return NextResponse.json({ 
        error: 'Fehler beim Laden der Seite',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
        type: 'navigation_error'
      }, { status: 500 });
    }

    // Define image selectors based on site type
    const migrosSelectors = [
      'mo-product-image-universal img[src*="image.migros.ch"]',
      'img[src*="image.migros.ch"][src*="/mo-boxed/"]',
      'img[src*="image.migros.ch"]:not([src*="logo"]):not([src*="icon"])'
    ];

    const filteredImageSelectors = isMigros ? migrosSelectors : IMAGE_SELECTORS;

    // Special handling for Migros
    if (isMigros) {
      try {
        const imageUrl = await page.evaluate(() => {
          const universalImg = document.querySelector('mo-product-image-universal img[src*="image.migros.ch"]') as HTMLImageElement;
          if (universalImg) {
            return universalImg.getAttribute('src');
          }

          const allImages = Array.from(document.querySelectorAll('img[src*="image.migros.ch"]')) as HTMLImageElement[];
          const productImage = allImages.find(img => 
            img.src.includes('/mo-boxed/') && 
            !img.src.includes('logo') && 
            !img.src.includes('icon')
          );
          
          return productImage ? productImage.src : null;
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
          (selector: string) => !prioritySelectors.includes(selector)
        );

    const failedSelectors: Array<{ selector: string; reason: string }> = [];
    
    // Modified checkSelector function for Puppeteer with better error handling
    const checkSelector = async (selector: string) => {
      try {
        if (selector.startsWith('meta')) {
          try {
            const metaContent = await page.$eval(selector, (el: Element) => el.getAttribute('content'));
            if (metaContent) {
              return { 
                imageUrl: metaContent, 
                usedSelector: selector 
              };
            }
            return { selector, reason: 'Meta tag content not found' };
          } catch (error) {
            return { selector, reason: `Meta tag error: ${error instanceof Error ? error.message : 'Unknown error'}` };
          }
        } else {
          try {
            const element = await page.$(selector);
            if (!element) {
              return { selector, reason: 'Element not found' };
            }

            // Prüfe zuerst das src Attribut
            try {
              const src = await element.evaluate((el: Element) => el.getAttribute('src'));
              if (src && !src.includes('data:image')) {
                return { 
                  imageUrl: src, 
                  usedSelector: selector 
                };
              }
            } catch (error) {
              console.log(`Error getting src for selector ${selector}:`, error);
            }

            // Prüfe weitere Attribute
            for (const attr of ['data-src', 'data-zoom-image', 'data-magnify-src']) {
              try {
                const attrValue = await element.evaluate((el: Element, attr) => el.getAttribute(attr), attr);
                if (attrValue && !attrValue.includes('data:image')) {
                  return { 
                    imageUrl: attrValue, 
                    usedSelector: `${selector}[${attr}]` 
                  };
                }
              } catch (error) {
                console.log(`Error getting ${attr} for selector ${selector}:`, error);
              }
            }

            // Versuche es mit innerHTML als Fallback
            try {
              const innerHTML = await element.evaluate((el: Element) => el.innerHTML);
              const srcMatch = innerHTML.match(/src=["'](https?:\/\/[^"']+)["']/);
              if (srcMatch && srcMatch[1]) {
                return {
                  imageUrl: srcMatch[1],
                  usedSelector: `${selector} (innerHTML)`
                };
              }
            } catch (error) {
              console.log(`Error getting innerHTML for selector ${selector}:`, error);
            }

            return { selector, reason: 'No valid image source found in any attribute' };
          } catch (error) {
            return { selector, reason: `Selector evaluation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
          }
        }
      } catch (error) {
        console.error(`Fatal error in checkSelector for ${selector}:`, error);
        return { selector, reason: `Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    };

    // Prüfe priorisierte Selektoren zuerst
    for (const selector of prioritySelectors) {
      try {
        console.log(`Checking priority selector: ${selector}`);
        const result = await checkSelector(selector);
        if ('imageUrl' in result && result.imageUrl) {
          console.log(`Found image with selector: ${selector}`);
          await browser.close();
          const { imageUrl, usedSelector } = result;
          
          // Ensure the image URL is absolute and valid
          try {
            const absoluteImageUrl = imageUrl.startsWith('//') 
              ? `https:${imageUrl}`
              : imageUrl.startsWith('/') 
                ? new URL(imageUrl, url).toString()
                : imageUrl;

            // Validate the URL
            new URL(absoluteImageUrl);

            return NextResponse.json({ 
              image: absoluteImageUrl,
              usedSelector 
            });
          } catch (error) {
            console.error('URL processing error:', error);
            failedSelectors.push({ 
              selector, 
              reason: `Invalid image URL: ${error instanceof Error ? error.message : 'Unknown error'}` 
            });
          }
        } else {
          failedSelectors.push(result as { selector: string; reason: string });
        }
      } catch (error) {
        console.error(`Error processing selector ${selector}:`, error);
        failedSelectors.push({ 
          selector, 
          reason: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
      }
    }

    // Prüfe restliche Selektoren parallel mit verbessertem Error Handling
    const results = await Promise.all(
      remainingSelectors.map(async (selector: string) => {
        try {
          return await checkSelector(selector);
        } catch (error) {
          console.error(`Error in parallel selector check for ${selector}:`, error);
          return { 
            selector, 
            reason: `Parallel processing error: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      })
    );

    // Verbesserte Typisierung und Filterung der Ergebnisse
    type SelectorResult = 
      | { imageUrl: string; usedSelector: string }
      | { selector: string; reason: string };

    const validResults = results.filter((result): result is { imageUrl: string; usedSelector: string } => 
      'imageUrl' in result && typeof result.imageUrl === 'string'
    );

    const invalidResults = results.filter((result): result is { selector: string; reason: string } => 
      'selector' in result && 'reason' in result
    );

    failedSelectors.push(...invalidResults);

    const validResult = validResults[0];

    await browser.close();

    if (!validResult) {
      return NextResponse.json({ 
        error: 'Kein passendes Bild gefunden',
        failedSelectors,
        details: 'Alle Selektoren wurden geprüft, aber kein gültiges Bild gefunden'
      }, { status: 404 });
    }

    try {
      const { imageUrl, usedSelector } = validResult;
      const absoluteImageUrl = imageUrl.startsWith('//') 
        ? `https:${imageUrl}`
        : imageUrl.startsWith('/') 
          ? new URL(imageUrl, url).toString()
          : imageUrl;

      // Validate final URL
      new URL(absoluteImageUrl);

      return NextResponse.json({ 
        image: absoluteImageUrl,
        usedSelector 
      });
    } catch (error) {
      console.error('Final URL processing error:', error);
      return NextResponse.json({ 
        error: 'Ungültige Bild-URL',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'url_processing_error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Global error:', error);
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    return NextResponse.json({ 
      error: 'Fehler bei der Verarbeitung',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler',
      type: 'processing_error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

