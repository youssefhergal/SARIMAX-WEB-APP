// Flexible forecasting function - Static OR Dynamic based on steps parameter
export function staticForecasting(model, nobs, targetIndex, exogIndices, scaler, targetColumn, steps = 1) {
  const nob = nobs.length;
  
  if (steps <= 1) {
    // Static forecasting: Always use real data for prediction
    const staticPreds = [];
    const staticOriginals = [];
    const frameIndices = [];
    
    for (let i = model.order; i < nob; i++) {
      const endoContext = [];
      const exogContext = [];
      
      // Get lagged endogenous values (real data)
      for (let lag = model.order; lag >= 1; lag--) {
        const lagIndex = i - lag;
        endoContext.push(nobs[lagIndex][targetIndex]);
      }
      
      // Get current exogenous values (real data)
      for (let exogIdx of exogIndices) {
        exogContext.push(nobs[i][exogIdx]);
      }
      
      // Make prediction using model
      const prediction = model.predict(endoContext, exogContext);
      
      staticPreds.push(prediction);
      staticOriginals.push(nobs[i][targetIndex]);
      frameIndices.push(i);
    }
    
    // Denormalize predictions and originals
    const denormalizedPred = staticPreds.map(val => scaler.inverseTransform([[val]])[0][0]);
    const denormalizedOrig = staticOriginals.map(val => scaler.inverseTransform([[val]])[0][0]);
    
    return {
      predStatic: denormalizedPred,
      origValues: denormalizedOrig,
      frameIndices: frameIndices,
      method: 'static',
      steps: 1
    };
  } else {
    // Dynamic forecasting: Use predicted data for multi-step ahead
    const dynamicPreds = [];
    const dynamicOriginals = [];
    const frameIndices = [];
    
    const maxCycles = Math.floor((nob - model.order) / steps);
    
    for (let cycle = 0; cycle < maxCycles; cycle++) {
      const startFrame = cycle * steps;
      
      // Initial context from real data
      let endoContext = [];
      for (let lag = model.order; lag >= 1; lag--) {
        const lagIndex = startFrame + model.order - lag;
        endoContext.push(nobs[lagIndex][targetIndex]);
      }
      
      // Multi-step prediction within this cycle
      for (let step = 0; step < steps; step++) {
        const targetFrame = startFrame + model.order + step;
        
        if (targetFrame >= nob) {
          break;
        }
        
        // Get current exogenous values (real data)
        const exogContext = [];
        for (let exogIdx of exogIndices) {
          exogContext.push(nobs[targetFrame][exogIdx]);
        }
        
        // Make prediction
        const prediction = model.predict(endoContext, exogContext);
        
        // Get real value for comparison
        const realValue = nobs[targetFrame][targetIndex];
        
        dynamicPreds.push(prediction);
        dynamicOriginals.push(realValue);
        frameIndices.push(targetFrame);
        
        // Update context with predicted value for next step
        endoContext = endoContext.slice(1).concat([prediction]);
      }
    }
    
    // Handle remaining frames with static method
    const remainingStart = maxCycles * steps + model.order;
    for (let i = remainingStart; i < nob; i++) {
      const endoContext = [];
      const exogContext = [];
      
      for (let lag = model.order; lag >= 1; lag--) {
        const lagIndex = i - lag;
        endoContext.push(nobs[lagIndex][targetIndex]);
      }
      
      for (let exogIdx of exogIndices) {
        exogContext.push(nobs[i][exogIdx]);
      }
      
      const prediction = model.predict(endoContext, exogContext);
      
      dynamicPreds.push(prediction);
      dynamicOriginals.push(nobs[i][targetIndex]);
      frameIndices.push(i);
    }
    
    // Denormalize predictions and originals
    const denormalizedPred = dynamicPreds.map(val => scaler.inverseTransform([[val]])[0][0]);
    const denormalizedOrig = dynamicOriginals.map(val => scaler.inverseTransform([[val]])[0][0]);
    
    return {
      predStatic: denormalizedPred,
      origValues: denormalizedOrig,
      frameIndices: frameIndices,
      method: 'dynamic',
      steps: steps
    };
  }
} 