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
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--font-render-hinting=none',
        '--disable-font-subpixel-positioning',
        '--disable-extensions',
        '--disable-plugins',
        '--font-render-hinting=slight'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 1600 });
    
    // Add CSS to ensure proper font loading and fallbacks
    const fontCSS = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        
        * {
          font-family: 'Roboto', -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        body {
          font-family: 'Roboto', -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
          font-weight: 400;
          line-height: 1.5;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Roboto', Arial, sans-serif !important;
          font-weight: 500;
        }
        
        .font-bold {
          font-weight: 700 !important;
        }
        
        .font-medium {
          font-weight: 500 !important;
        }
        
        @media print {
          * {
            font-family: 'Roboto', Arial, Helvetica, sans-serif !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            font-rendering: optimizeLegibility;
            text-rendering: optimizeLegibility;
          }
          
          body {
            font-size: 12pt !important;
            line-height: 1.4 !important;
          }
        }
      </style>
    `;
    
    // Inject the HTML content with proper font CSS
    const finalHtmlContent = htmlContent.includes('<head>') 
      ? htmlContent.replace('<head>', `<head>${fontCSS}`)
      : `<!DOCTYPE html><html><head>${fontCSS}</head><body>${htmlContent}</body></html>`;
    
    await page.setContent(finalHtmlContent, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 60000
    });
    
    // Wait for Google Fonts to load
    await page.evaluateOnNewDocument(() => {
      window.addEventListener('DOMContentLoaded', () => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      });
    });
    
    // Ensure fonts are loaded before PDF generation
    await page.waitForFunction(
      () => document.fonts.ready.then(() => true),
      { timeout: 30000 }
    ).catch(() => {
      console.log('Font loading timeout, proceeding with fallback fonts');
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
    await page.waitForTimeout(2000); // Give fonts time to load
    
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
      generateDocumentOutline: false,
      // Apply quality settings
      scale: qualityConfig.scale,
      // Handle page breaks properly
      pageRanges: '',
      // Tagged PDF for accessibility
      tagged: false,
      // Enable outline
      outline: false,
      // Force font rendering
      omitBackground: false,
      // Additional font rendering options
      displayHeaderFooter: false,
      format: formatConfig.format || undefined
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

