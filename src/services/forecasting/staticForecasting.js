// Flexible forecasting function - Static OR Dynamic based on steps parameter
export function staticForecasting(model, testData, indEnd, indExo, scaler, targetAngleIndex, steps = 1) {
  const nob = testData.length;
  const endoData = testData.map(row => row[indEnd]);
  const exogData = testData.map(row => indExo.map(idx => row[idx]));
  
  const predictions = [];
  const originals = [];
  const frameIndices = [];
  
  console.log(`🔄 FORECASTING METHOD: ${steps <= 1 ? 'STATIC' : 'DYNAMIC'} (steps=${steps})`);
  console.log(`   Model order: ${model.order}, Test data length: ${nob}`);
  
  if (steps <= 1) {
    // ===== STATIC FORECASTING (steps = 0 or 1) =====
    console.log(`📊 Using STATIC forecasting (real data for all predictions)`);
    
    for (let i = model.order; i < nob; i++) {
      const forecast = model.apply(
        endoData.slice(i - model.order, i),  // Real endogenous data
        exogData.slice(i - model.order, i)   // Real exogenous data
      );
      predictions.push(forecast.getPrediction().predicted_mean[0]);
      originals.push(endoData[i]);
      frameIndices.push(i);
    }
    
  } else {
    // ===== DYNAMIC FORECASTING (steps >= 2) =====
    console.log(`🔄 Using DYNAMIC forecasting (predicted data for multi-step)`);
    
    const maxCycles = Math.floor((nob - model.order) / steps);
    console.log(`   Max cycles: ${maxCycles}, Steps per cycle: ${steps}`);
    
    for (let cycle = 0; cycle < maxCycles; cycle++) {
      const startFrame = cycle * steps;
      const contextStart = startFrame;
      
      // Start with REAL DATA context
      let endoContext = endoData.slice(contextStart, contextStart + model.order);
      let exogContext = exogData.slice(contextStart, contextStart + model.order);
      
      console.log(`\n--- CYCLE ${cycle} (frames ${startFrame + model.order} to ${startFrame + model.order + steps - 1}) ---`);
      console.log(`   Initial context (REAL): endo[${endoContext.map(x => x.toFixed(3)).join(', ')}]`);
      
      // Make 'steps' predictions using sliding window
      for (let step = 0; step < steps; step++) {
        const targetFrame = startFrame + model.order + step;
        
        if (targetFrame >= nob) {
          console.log(`   ⚠️ Step ${step}: Beyond data (frame ${targetFrame} >= ${nob})`);
          break;
        }
        
        // Use current context for prediction
        const forecast = model.apply(endoContext, exogContext);
        const prediction = forecast.getPrediction().predicted_mean[0];
        
        predictions.push(prediction);
        originals.push(endoData[targetFrame]);
        frameIndices.push(targetFrame);
        
        console.log(`   Step ${step}: context[${endoContext.map(x => x.toFixed(3)).join(', ')}] → pred=${prediction.toFixed(3)} (real=${endoData[targetFrame].toFixed(3)})`);
        
        // Slide the window: remove oldest, add prediction for endogenous
        endoContext = [...endoContext.slice(1), prediction];
        
        // For exogenous: use real future data (this is known in static forecasting)
        if (targetFrame + 1 < nob) {
          exogContext = [...exogContext.slice(1), exogData[targetFrame + 1]];
        }
        
        console.log(`   Updated context: endo[${endoContext.map(x => x.toFixed(3)).join(', ')}]`);
      }
    }
    
    // Handle remaining frames if any
    const remainingStart = maxCycles * steps + model.order;
    if (remainingStart < nob) {
      console.log(`\n--- REMAINING FRAMES (${remainingStart} to ${nob-1}) ---`);
      for (let i = remainingStart; i < nob; i++) {
        const forecast = model.apply(
          endoData.slice(i - model.order, i),
          exogData.slice(i - model.order, i)
        );
        predictions.push(forecast.getPrediction().predicted_mean[0]);
        originals.push(endoData[i]);
        frameIndices.push(i);
      }
    }
  }
  
  // Denormalize
  const denormalizedPred = predictions.map(val => val * scaler.std[targetAngleIndex] + scaler.mean[targetAngleIndex]);
  const denormalizedOrig = originals.map(val => val * scaler.std[targetAngleIndex] + scaler.mean[targetAngleIndex]);
  
  console.log(`\n📊 ${steps <= 1 ? 'STATIC' : 'DYNAMIC'} FORECASTING RESULTS:`);
  console.log(`   Predictions: ${denormalizedPred.length} values`);
  console.log(`   Originals: ${denormalizedOrig.length} values`);
  console.log(`   Frame indices: [${frameIndices[0]}, ${frameIndices[1]}, ..., ${frameIndices[frameIndices.length-1]}]`);
  console.log(`   Method: ${steps <= 1 ? 'Real data for all predictions' : 'Predicted data for multi-step ahead'}`);
  
  return { 
    predStatic: denormalizedPred, 
    origValues: denormalizedOrig,
    frameIndices: frameIndices,
    method: steps <= 1 ? 'static' : 'dynamic',
    steps: steps
  };
} 