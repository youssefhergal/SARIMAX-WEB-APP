// Hybrid forecasting function - Gradual transition from real to predicted data
export function hybridForecasting(model, testData, indEnd, indExo, scaler, targetAngleIndex, steps) {
  const nob = testData.length;
  const endoData = testData.map(row => row[indEnd]);
  const exogData = testData.map(row => indExo.map(idx => row[idx]));
  
  console.log(`🔄 Hybrid forecasting with steps=${steps}, lags=${model.order}:`);
  console.log(`   Total frames: ${nob}, Steps to forecast: ${nob - model.order}`);
  
  const predHybrid = [];
  const origValues = [];
  const allPredictions = []; // Store all predictions for building history
  
  // Initialize with real data for the first model.order values
  for (let i = 0; i < model.order; i++) {
    allPredictions.push(endoData[i]);
  }
  
  // Start forecasting from model.order
  for (let i = model.order; i < nob; i++) {
    const currentStep = i - model.order; // 0-based step counter
    
    // Build history window based on steps parameter
    let historyWindow = [];
    
    if (steps === 0) {
      // Pure static: always use real data
      historyWindow = endoData.slice(i - model.order, i);
    } else {
      // Hybrid approach: repeating cycle to prevent noise accumulation
      const cyclePosition = currentStep % steps; // Position within the current cycle (0 to steps-1)
      
      if (cyclePosition === 0) {
        // At cycle start: use all real data to reset and prevent noise accumulation
        historyWindow = endoData.slice(i - model.order, i);
      } else {
        // Within cycle: use real data for recent positions, predicted for older ones
        for (let lag = 0; lag < model.order; lag++) {
          const historyIndex = i - model.order + lag; // Absolute index in data
          
          // For cyclePosition steps into the cycle:
          // Use real data for the first (model.order - cyclePosition) positions  
          // Use predicted data for the last cyclePosition positions
          if (lag < model.order - cyclePosition) {
            // Use real data for earlier positions in history window
            historyWindow.push(endoData[historyIndex]);
          } else {
            // Use predicted data for later positions in history window
            historyWindow.push(allPredictions[historyIndex]);
          }
        }
      }
    }
    
    // Get exogenous data for this prediction
    const exogForPrediction = exogData.slice(i - model.order, i);
    
    // Make prediction
    try {
      const forecast = model.apply(historyWindow, exogForPrediction);
      let predMean = forecast.getPrediction().predicted_mean[0];
      
      // Stability check
      if (!isFinite(predMean)) {
        console.warn(`⚠️ Non-finite prediction at step ${currentStep}, using fallback`);
        predMean = historyWindow[historyWindow.length - 1]; // Use last history value
      }
      
      // Store prediction
      predHybrid.push(predMean);
      origValues.push(endoData[i]);
      allPredictions.push(predMean);
      
      // Debug logging for first few predictions
      if (currentStep < 5) {
        const cyclePos = currentStep % steps;
        let realCount = 0;
        let predCount = 0;
        
        if (cyclePos === 0) {
          realCount = model.order;
          predCount = 0;
        } else {
          realCount = model.order - cyclePos;
          predCount = cyclePos;
        }
        
        console.log(`   Step ${currentStep} (cycle pos ${cyclePos}): History [${historyWindow.map(x => x.toFixed(3)).join(', ')}] (${realCount} real, ${predCount} pred) → ${predMean.toFixed(3)}`);
      }
      
    } catch (error) {
      console.warn(`⚠️ Error at step ${currentStep}: ${error.message}`);
      const fallbackValue = historyWindow[historyWindow.length - 1];
      predHybrid.push(fallbackValue);
      origValues.push(endoData[i]);
      allPredictions.push(fallbackValue);
    }
  }
  
  console.log(`📊 Hybrid forecasting complete: Generated ${predHybrid.length} predictions`);
  console.log(`   Steps parameter: ${steps} (${steps === 0 ? 'pure static' : `reset with real data every ${steps} step${steps > 1 ? 's' : ''}`})`);
  console.log(`   Cycle approach prevents noise accumulation by periodic reset`);
  console.log(`   First 5 predictions: [${predHybrid.slice(0, 5).map(x => x.toFixed(3)).join(', ')}]`);
  console.log(`   Last 5 predictions: [${predHybrid.slice(-5).map(x => x.toFixed(3)).join(', ')}]`);
  
  // Denormalize the data (StandardScaler inverse transform)
  const denormalizedPred = predHybrid.map(val => val * scaler.std[targetAngleIndex] + scaler.mean[targetAngleIndex]);
  const denormalizedOrig = origValues.map(val => val * scaler.std[targetAngleIndex] + scaler.mean[targetAngleIndex]);

  return { 
    predHybrid: denormalizedPred, 
    origValues: denormalizedOrig 
  };
} 