import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    let image = $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') ||
                $('link[rel="image_src"]').attr('href') ||
                $('img').first().attr('src');

    if (image && !image.startsWith('http')) {
      const baseUrl = new URL(url).origin;
      image = new URL(image, baseUrl).href;
    }

    return NextResponse.json({ image });
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return NextResponse.json({ error: 'Failed to fetch link preview' }, { status: 500 });
  }
}
