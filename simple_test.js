const fs = require('fs');

async function testUpload() {
  console.log('🚀 Testing upload endpoint directly...');
  
  try {
    // Create a test file
    const testContent = 'This is a test document for RAG system testing.\n\nIt contains multiple lines of text to test the ingestion process.';
    fs.writeFileSync('test_upload.txt', testContent);
    console.log('✅ Test file created');
    
    // Test direct API call to RAG API
    console.log('\n🔍 Testing direct RAG API call...');
    const response1 = await fetch('http://localhost:9000/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=----test'
      },
      body: '------test\r\nContent-Disposition: form-data; name="files"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\n' + testContent + '\r\n------test--'
    });
    
    console.log('📡 Direct RAG API Response Status:', response1.status);
    console.log('📡 Direct RAG API Response Headers:', Object.fromEntries(response1.headers.entries()));
    
    try {
      const responseText1 = await response1.text();
      console.log('📡 Direct RAG API Response Body:', responseText1);
    } catch (e) {
      console.log('📡 Could not read direct RAG API response body:', e.message);
    }
    
    // Test through UI proxy
    console.log('\n🔍 Testing through UI proxy...');
    const response2 = await fetch('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=----test'
      },
      body: '------test\r\nContent-Disposition: form-data; name="files"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\n' + testContent + '\r\n------test--'
    });
    
    console.log('📡 UI Proxy Response Status:', response2.status);
    console.log('📡 UI Proxy Response Headers:', Object.fromEntries(response2.headers.entries()));
    
    try {
      const responseText2 = await response2.text();
      console.log('📡 UI Proxy Response Body:', responseText2);
    } catch (e) {
      console.log('📡 Could not read UI proxy response body:', e.message);
    }
    
    // Check container logs
    console.log('\n🔍 Checking container status...');
    const { exec } = require('child_process');
    
    exec('sudo docker ps', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Docker ps error:', error.message);
        return;
      }
      console.log('📊 Container Status:\n', stdout);
    });
    
    // Check UI container logs
    exec('sudo docker logs gpt-oss-ui --tail 10', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ UI logs error:', error.message);
        return;
      }
      console.log('📋 UI Container Logs:\n', stdout);
    });
    
    // Check RAG API container logs
    exec('sudo docker logs rag-api --tail 10', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ RAG API logs error:', error.message);
        return;
      }
      console.log('📋 RAG API Container Logs:\n', stdout);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUpload().catch(console.error);
