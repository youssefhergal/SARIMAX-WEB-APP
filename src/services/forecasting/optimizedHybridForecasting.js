/**
 * 🚀 OPTIMIZED HYBRID FORECASTING ALGORITHM
 * Based on user's sliding window approach with periodic real data reset
 * 
 * CONCEPT:
 * - Use real data for 'steps' predictions, then slide window
 * - This prevents noise accumulation better than continuous dynamic forecasting
 * - Each cycle starts fresh with real data
 */

/**
 * Optimized Hybrid Forecasting with periodic real data reset
 * @param {Object} model - Trained SARIMAX model 
 * @param {Array} testData - Test data (normalized, multi-channel format)
 * @param {number} indEnd - Index of endogenous variable (usually 0)
 * @param {Array} indExo - Indices of exogenous variables [1, 2, 3, ...]
 * @param {Object} scaler - StandardScaler for denormalization
 * @param {number} targetAngleIndex - Index for scaler (usually 0)
 * @param {number} steps - Hybrid steps parameter (h in your algorithm)
 * @returns {Object} {predHybrid, origValues} - Denormalized predictions and originals
 */
export function optimizedHybridForecasting(model, testData, indEnd, indExo, scaler, targetAngleIndex, steps) {
  // ========================================
  // 📊 EXTRACT DATA FROM TEST SET
  // ========================================
  const totalFrames = testData.length;
  const lags = model.order;  // Number of past values needed (lag in your algorithm)
  
  // Extract endogenous (target) and exogenous data
  const endoData = testData.map(row => row[indEnd]);        // Target values: [y₀, y₁, y₂, ...]
  const exogData = testData.map(row => indExo.map(idx => row[idx])); // Exog matrix: [[x₀], [x₁], ...]
  
  console.log(`🔄 Optimized Hybrid Forecasting:`);
  console.log(`   Algorithm: Sliding window with ${steps}-step cycles`);
  console.log(`   Data: ${totalFrames} frames, Lags: ${lags}, Steps: ${steps}`);
  
  // ========================================
  // 📈 ALGORITHM PARAMETERS 
  // ========================================
  const predictions = [];
  const originals = [];
  
  // Calculate how many prediction cycles we can make
  // max_steps = total_data - lags_needed - steps_ahead + 1
  const maxCycles = totalFrames - lags - steps + 1;
  
  console.log(`   Max cycles: ${maxCycles} (each cycle makes ${steps} prediction${steps > 1 ? 's' : ''})`);
  
  // ========================================
  // 🔄 MAIN FORECASTING LOOP
  // ========================================
  for (let cycle = 0; cycle < maxCycles; cycle += steps) {
    console.log(`\n--- Cycle ${Math.floor(cycle/steps)}, starting at frame ${cycle + lags} ---`);
    
    // STEP 1: Initialize context with REAL DATA (this prevents noise accumulation)
    let context = endoData.slice(cycle, cycle + lags);
    console.log(`   Initial context (REAL): [${context.map(x => x.toFixed(3)).join(', ')}]`);
    
    const cyclePredictions = [];  // Store predictions for this cycle
    const cycleOriginals = [];    // Store corresponding real values
    
    // STEP 2: Make 'steps' predictions using sliding window
    for (let step = 0; step < steps; step++) {
      const currentFrame = cycle + lags + step;
      
      // Check if we have enough data
      if (currentFrame >= totalFrames) {
        console.log(`   ⚠️ Step ${step}: Not enough data (frame ${currentFrame} >= ${totalFrames})`);
        break;
      }
      
      // Get exogenous data window for current prediction (same length as context)
      const exogWindow = [];
      for (let j = 0; j < lags; j++) {
        const exogIndex = currentFrame - lags + j;
        if (exogIndex >= 0 && exogIndex < exogData.length) {
          exogWindow.push(exogData[exogIndex]);
        } else {
          exogWindow.push(exogData[0]); // Fallback to first frame
        }
      }
      
      // STEP 3: Make prediction using current context + exog window
      try {
        const forecast = model.apply(context, exogWindow);
        const prediction = forecast.getPrediction().predicted_mean[0];
        
        // Get the real value for comparison
        const realValue = endoData[currentFrame];
        
        // Store results
        cyclePredictions.push(prediction);
        cycleOriginals.push(realValue);
        
        console.log(`   Step ${step}: Context [${context.map(x => x.toFixed(3)).join(', ')}] → Pred: ${prediction.toFixed(3)}, Real: ${realValue.toFixed(3)}`);
        
        // STEP 4: Slide the context window (remove oldest, add prediction)
        context = context.slice(1).concat(prediction);
        
      } catch (error) {
        console.warn(`   ⚠️ Error at step ${step}: ${error.message}`);
        break;
      }
    }
    
    // Add cycle results to main arrays
    predictions.push(...cyclePredictions);
    originals.push(...cycleOriginals);
    
    console.log(`   Cycle complete: ${cyclePredictions.length} predictions made`);
  }
  
  // ========================================
  // 📊 FINALIZE RESULTS
  // ========================================
  console.log(`\n📊 Hybrid forecasting complete:`);
  console.log(`   Total predictions: ${predictions.length}`);
  console.log(`   Algorithm advantage: Periodic reset prevents error accumulation`);
  console.log(`   First 5 predictions: [${predictions.slice(0, 5).map(x => x.toFixed(3)).join(', ')}]`);
  console.log(`   Last 5 predictions: [${predictions.slice(-5).map(x => x.toFixed(3)).join(', ')}]`);
  
  // Denormalize the data (StandardScaler inverse transform)
  const denormalizedPred = predictions.map(val => val * scaler.std[targetAngleIndex] + scaler.mean[targetAngleIndex]);
  const denormalizedOrig = originals.map(val => val * scaler.std[targetAngleIndex] + scaler.mean[targetAngleIndex]);

  return { 
    predHybrid: denormalizedPred, 
    origValues: denormalizedOrig 
  };
}

/**
 * 📚 EXAMPLE USAGE AND EXPLANATION
 * 
 * Given:
 * - Real data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * - lags = 2 (need 2 past values)
 * - steps = 2 (make 2 predictions per cycle)
 * 
 * EXECUTION:
 * 
 * Cycle 0 (starts at frame 2):
 *   Context: [1, 2] (real data)
 *   Step 0: Predict frame 2 using [1, 2] → pred_2
 *   Step 1: Predict frame 3 using [2, pred_2] → pred_3
 *   Results: [pred_2, pred_3]
 * 
 * Cycle 1 (starts at frame 4):
 *   Context: [3, 4] (fresh real data - NO accumulated error!)
 *   Step 0: Predict frame 4 using [3, 4] → pred_4  
 *   Step 1: Predict frame 5 using [4, pred_4] → pred_5
 *   Results: [pred_4, pred_5]
 * 
 * Benefits:
 * ✅ Each cycle starts with fresh real data
 * ✅ Prevents long-term error accumulation  
 * ✅ Better than pure dynamic forecasting
 * ✅ Maintains some dynamic prediction capability
 */

/**
 * 🔧 ALGORITHM PARAMETERS GUIDE
 * 
 * steps = 1: 
 *   - Every prediction uses real data context
 *   - Equivalent to static forecasting
 *   - Most stable but least dynamic
 * 
 * steps = 2:
 *   - Make 2 predictions, then reset with real data
 *   - Good balance of stability and dynamics
 *   - Recommended for most cases
 * 
 * steps = 5:
 *   - Make 5 predictions before reset
 *   - More dynamic but potential error accumulation
 *   - Use with caution for volatile data
 * 
 * steps = large:
 *   - Approaches pure dynamic forecasting  
 *   - Maximum error accumulation risk
 *   - Not recommended for long sequences
 */ 