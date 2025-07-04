// Flexible forecasting function - Static OR Dynamic based on steps parameter
export function staticForecasting(model, nobs, targetIndex, exogIndices, scaler, targetColumn, steps = 1, options = {}) {
  const nob = nobs.length;
  const { 
    includeConfidence = false, 
    confidenceLevel = 95 
  } = options;
  
  const alpha = (100 - confidenceLevel) / 100; // Convert percentage to alpha
  
  if (steps <= 1) {
    // Static forecasting: Always use real data for prediction
    const staticPreds = [];
    const staticOriginals = [];
    const frameIndices = [];
    const confidenceIntervals = includeConfidence ? { lower: [], upper: [], se: [] } : null;
    
    // Start from model.order to ensure we have enough lagged data
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
      
      // Make prediction using model with optional confidence intervals
      if (includeConfidence) {
        const result = model.predictWithConfidence(endoContext, exogContext, alpha);
        staticPreds.push(result.mean);
        confidenceIntervals.lower.push(result.mean_ci_lower);
        confidenceIntervals.upper.push(result.mean_ci_upper);
        confidenceIntervals.se.push(result.mean_se);
      } else {
        const prediction = model.predict(endoContext, exogContext);
        staticPreds.push(prediction);
      }
      
      // Store the original value for the current frame (this is what we're predicting)
      staticOriginals.push(nobs[i][targetIndex]);
      frameIndices.push(i);
      
      // Debug logging for first few frames
      if (i < model.order + 5) {
        console.log(`🔍 Frame ${i}:`);
        console.log(`  Input lags: [${endoContext.map((val, idx) => `t-${model.order-idx}=${val.toFixed(2)}`).join(', ')}]`);
        console.log(`  Input exog: [${exogContext.map(val => val.toFixed(2)).join(', ')}]`);
        console.log(`  Prediction: ${staticPreds[staticPreds.length-1].toFixed(2)}`);
        console.log(`  Original: ${staticOriginals[staticOriginals.length-1].toFixed(2)}`);
        console.log(`  Error: ${Math.abs(staticPreds[staticPreds.length-1] - staticOriginals[staticOriginals.length-1]).toFixed(2)}`);
        console.log('');
      }
    }
    
    // Denormalize predictions and originals
    const denormalizedPred = staticPreds.map(val => scaler.inverseTransform([[val]])[0][0]);
    const denormalizedOrig = staticOriginals.map(val => scaler.inverseTransform([[val]])[0][0]);
    
    const result = {
      predStatic: denormalizedPred,
      origValues: denormalizedOrig,
      frameIndices: frameIndices,
      method: 'static',
      steps: 1
    };
    
    // Add confidence intervals if requested
    if (includeConfidence) {
      result.confidence = {
        level: confidenceLevel,
        lower: confidenceIntervals.lower.map(val => scaler.inverseTransform([[val]])[0][0]),
        upper: confidenceIntervals.upper.map(val => scaler.inverseTransform([[val]])[0][0]),
        se: confidenceIntervals.se.map(val => val * Math.abs(scaler.scale_)) // Adjust SE for scaling
      };
    }
    
    return result;
  } else {
    // Dynamic forecasting: Use predicted data for multi-step ahead
    const dynamicPreds = [];
    const dynamicOriginals = [];
    const frameIndices = [];
    const confidenceIntervals = includeConfidence ? { lower: [], upper: [], se: [] } : null;
    
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
        
        // Make prediction with optional confidence intervals
        if (includeConfidence) {
          // Increase uncertainty with forecast horizon
          const horizonAlpha = alpha * (1 + step * 0.15);
          const result = model.predictWithConfidence(endoContext, exogContext, horizonAlpha);
          
          dynamicPreds.push(result.mean);
          confidenceIntervals.lower.push(result.mean_ci_lower);
          confidenceIntervals.upper.push(result.mean_ci_upper);
          confidenceIntervals.se.push(result.mean_se);
          
          // Update context with predicted value for next step
          endoContext = endoContext.slice(1).concat([result.mean]);
        } else {
          const prediction = model.predict(endoContext, exogContext);
          dynamicPreds.push(prediction);
          
          // Update context with predicted value for next step
          endoContext = endoContext.slice(1).concat([prediction]);
        }
        
        // Get real value for comparison (aligned with target frame)
        const realValue = nobs[targetFrame][targetIndex];
        dynamicOriginals.push(realValue);
        frameIndices.push(targetFrame);
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
      
      if (includeConfidence) {
        const result = model.predictWithConfidence(endoContext, exogContext, alpha);
        dynamicPreds.push(result.mean);
        confidenceIntervals.lower.push(result.mean_ci_lower);
        confidenceIntervals.upper.push(result.mean_ci_upper);
        confidenceIntervals.se.push(result.mean_se);
      } else {
        const prediction = model.predict(endoContext, exogContext);
        dynamicPreds.push(prediction);
      }
      
      dynamicOriginals.push(nobs[i][targetIndex]);
      frameIndices.push(i);
    }
    
    // Denormalize predictions and originals
    const denormalizedPred = dynamicPreds.map(val => scaler.inverseTransform([[val]])[0][0]);
    const denormalizedOrig = dynamicOriginals.map(val => scaler.inverseTransform([[val]])[0][0]);
    
    const result = {
      predStatic: denormalizedPred,
      origValues: denormalizedOrig,
      frameIndices: frameIndices,
      method: 'dynamic',
      steps: steps
    };
    
    // Add confidence intervals if requested
    if (includeConfidence) {
      result.confidence = {
        level: confidenceLevel,
        lower: confidenceIntervals.lower.map(val => scaler.inverseTransform([[val]])[0][0]),
        upper: confidenceIntervals.upper.map(val => scaler.inverseTransform([[val]])[0][0]),
        se: confidenceIntervals.se.map(val => val * Math.abs(scaler.scale_)) // Adjust SE for scaling
      };
    }
    
    return result;
  }
} 