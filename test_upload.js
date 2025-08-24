const { chromium } = require('playwright');

async function testUpload() {
  console.log('🚀 Starting upload test...');
  
  const browser = await chromium.launch({ 
    headless: true,  // Changed to headless mode
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('📱 Opening admin page...');
    await page.goto('http://localhost:3000/admin');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    console.log('🔍 Checking page elements...');
    
    // Check if file input exists
    const fileInput = await page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      console.log('✅ File input found');
    } else {
      console.log('❌ File input not found');
      return;
    }
    
    // Check for upload button
    const uploadButton = await page.locator('button:has-text("Upload")');
    if (await uploadButton.count() > 0) {
      console.log('✅ Upload button found');
    } else {
      console.log('❌ Upload button not found');
      return;
    }
    
    console.log('📁 Preparing test file...');
    
    // Create a test file
    const testContent = 'This is a test document for RAG system testing.\n\nIt contains multiple lines of text to test the ingestion process.';
    await page.evaluate((content) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], 'test_document.txt', { type: 'text/plain' });
      
      // Create a DataTransfer object
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      // Set the file input value
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.files = dataTransfer.files;
      }
    }, testContent);
    
    console.log('📤 Attempting file upload...');
    
    // Click upload button
    await uploadButton.click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check for success message or error
    const successMessage = await page.locator('text=success').count();
    const errorMessage = await page.locator('text=error').count();
    
    if (successMessage > 0) {
      console.log('✅ Upload successful!');
    } else if (errorMessage > 0) {
      console.log('❌ Upload failed with error message');
    } else {
      console.log('⚠️ No clear success/error message found');
    }
    
    // Check console for errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    console.log('📊 Console errors:', consoleErrors);
    
    // Check network requests
    console.log('🌐 Checking network requests...');
    const response = await page.waitForResponse('**/api/ingest', { timeout: 10000 });
    console.log('📡 Response status:', response.status());
    console.log('📡 Response headers:', response.headers());
    
    try {
      const responseText = await response.text();
      console.log('📡 Response body:', responseText);
    } catch (e) {
      console.log('📡 Could not read response body:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('🔍 Test completed');
    await browser.close();
  }
}

// Run the test
testUpload().catch(console.error);
