import puppeteer from 'puppeteer';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { htmlContent, format = 'A4' } = await request.json();

    if (!htmlContent) {
      return NextResponse.json({ error: 'HTML content is missing' }, { status: 400 });
    }

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: format,
      printBackground: true,
      // ✅ ADD THIS MARGIN OBJECT
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    await browser.close();

    // Send the generated PDF back to the client
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="document.pdf"`,
      },
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}