import https from 'https';
import fs from 'fs';

// This script verifies if we can reach and download the model files from Hugging Face.
const url = 'https://huggingface.co/Xenova/nli-deberta-v3-small/resolve/main/onnx/model_quantized.onnx';

console.log("--- Connectivity Test Start ---");
console.log(`Target: ${url}`);

const request = https.get(url, (response) => {
  console.log("Response Status:", response.statusCode);
  
  if (response.statusCode === 302 || response.statusCode === 301) {
    console.log("Redirecting to:", response.headers.location);
    // Follow redirect
    https.get(response.headers.location, (res2) => {
        handleResponse(res2);
    }).on('error', handleError);
    return;
  }

  handleResponse(response);
});

function handleResponse(response) {
    if (response.statusCode !== 200) {
        console.error("Failed to connect. Status:", response.statusCode);
        process.exit(1);
    }

    console.log("Connected! Checking download stream...");
    let downloaded = 0;
    const targetMB = 1;
    
    response.on('data', (chunk) => {
      downloaded += chunk.length;
      if (downloaded >= targetMB * 1024 * 1024) {
        console.log(`✅ SUCCESS: Downloaded ${targetMB}MB successfully. Connection to model server is healthy.`);
        response.destroy();
        process.exit(0);
      }
    });

    response.on('end', () => {
        console.log(`Finished stream abruptly after ${downloaded} bytes.`);
        process.exit(0);
    });
}

function handleError(e) {
  console.error("❌ Connection error:", e.message);
  process.exit(1);
}

request.on('error', handleError);

// Timeout after 30 seconds
setTimeout(() => {
    console.error("❌ Timeout: Could not connect to Hugging Face within 30 seconds.");
    process.exit(1);
}, 30000);
