import { pipeline } from '@xenova/transformers';

async function verifyModel() {
  console.log('--- Model Verification Start ---');
  try {
    console.log('Initializing pipeline...');
    // We use the same model as in AIManager.js
    const classifier = await pipeline(
      'zero-shot-classification',
      'Xenova/nli-deberta-v3-small',
      {
        progress_callback: (info) => {
          if (info.status === 'downloading') {
            console.log(`Downloading: ${info.file || info.name} (${Math.round(info.loaded / info.total * 100)}%)`);
          }
          if (info.status === 'done') {
            console.log(`Loaded: ${info.file || info.name}`);
          }
        }
      }
    );
    console.log('Model initialized successfully.');

    const text = 'Finish coding the rewards system';
    const labels = [
        'health and medical',
        'productivity and work',
        'learning and education',
        'creative and artistic',
        'social and relationships',
        'fitness and exercise',
        'mindfulness and mental health',
        'finance and money',
        'general task'
    ];
    
    console.log(`Classifying: "${text}"`);
    const result = await classifier(text, labels);
    
    console.log('Classification result:', JSON.stringify(result, null, 2));
    
    const topLabel = result.labels[0];
    const topScore = result.scores[0];
    
    console.log(`Top Label: ${topLabel} (Score: ${topScore.toFixed(4)})`);
    
    if (topLabel === 'productivity and work') {
      console.log('✅ Model is working correctly and producing accurate results.');
    } else {
      console.log('⚠️ Model produced unexpected results, but it is running.');
    }
  } catch (error) {
    console.error('❌ Failed to load or run model:', error);
  }
  console.log('--- Model Verification End ---');
}

verifyModel();
