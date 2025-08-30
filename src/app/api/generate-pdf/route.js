// api/generate-pdf/route.js

import puppeteer from 'puppeteer';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { htmlContent, format = 'A4', orientation = 'portrait', quality = 'high' } = await request.json();

    if (!htmlContent) {
      return NextResponse.json({ error: 'HTML content is missing' }, { status: 400 });
    }

    // Enhanced browser launch with better options for PDF generation
    const browser = await puppeteer.launch({ 
      headless: true, 
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 1600 });
    
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Enhanced format mapping with orientation support
    const formatMapping = {
      'A4': { 
        format: 'A4',
        width: orientation === 'landscape' ? '297mm' : '210mm',
        height: orientation === 'landscape' ? '210mm' : '297mm'
      },
      'A3': { 
        format: 'A3',
        width: orientation === 'landscape' ? '420mm' : '297mm',
        height: orientation === 'landscape' ? '297mm' : '420mm'
      },
      'A5': { 
        format: 'A5',
        width: orientation === 'landscape' ? '210mm' : '148mm',
        height: orientation === 'landscape' ? '148mm' : '210mm'
      },
      'Letter': { 
        format: 'Letter',
        width: orientation === 'landscape' ? '11in' : '8.5in',
        height: orientation === 'landscape' ? '8.5in' : '11in'
      },
      'Legal': { 
        format: 'Legal',
        width: orientation === 'landscape' ? '14in' : '8.5in',
        height: orientation === 'landscape' ? '8.5in' : '14in'
      },
      'Tabloid': { 
        format: 'Tabloid',
        width: orientation === 'landscape' ? '17in' : '11in',
        height: orientation === 'landscape' ? '11in' : '17in'
      },
      'B4': { 
        width: orientation === 'landscape' ? '353mm' : '250mm', 
        height: orientation === 'landscape' ? '250mm' : '353mm'
      },
      'B5': { 
        width: orientation === 'landscape' ? '250mm' : '176mm', 
        height: orientation === 'landscape' ? '176mm' : '250mm'
      },
      'Executive': { 
        width: orientation === 'landscape' ? '10.5in' : '7.25in', 
        height: orientation === 'landscape' ? '7.25in' : '10.5in'
      },
      'Folio': { 
        width: orientation === 'landscape' ? '13in' : '8.5in', 
        height: orientation === 'landscape' ? '8.5in' : '13in'
      }
    };

    const formatConfig = formatMapping[format] || formatMapping['A4'];
    
    // Quality-based DPI settings
    const qualitySettings = {
      'high': { scale: 2, quality: 100 },
      'medium': { scale: 1.5, quality: 80 },
      'low': { scale: 1, quality: 60 }
    };
    
    const qualityConfig = qualitySettings[quality] || qualitySettings['high'];
    
    // Enhanced PDF configuration for better layout and sizing
    const pdfBuffer = await page.pdf({
      ...formatConfig,
      printBackground: true,
      // Reduced margins for more content space
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
      // Ensure consistent rendering across different devices
      preferCSSPageSize: true,
      // Generate PDF with embedded fonts
      generateDocumentOutline: true,
      // Apply quality settings
      scale: qualityConfig.scale,
      // Handle page breaks properly
      pageRanges: '',
      // Tagged PDF for accessibility
      tagged: true,
      // Enable outline
      outline: true
    });

    await browser.close();

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

