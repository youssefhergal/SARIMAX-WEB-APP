// SARIMAX Model JavaScript - Integration of your real implementation
import { ALL_BVH_ANGLES, prepareForSARIMAX } from './bvhParser.js';

// Import your real SARIMAX classes and functions
import { SARIMAX } from './classes/SARIMAX.js';
import { StandardScaler } from './classes/StandardScaler.js';
import { MSE, MAE, UTheil, calculateCorrelation, createModelSummary } from './utils/metrics.js';
import { staticForecasting } from './forecasting/staticForecasting.js';

// Main SARIMAX Analyzer class
export class SARIMAXAnalyzer {
  constructor() {
    this.trainData = null;
    this.testData = null;
    this.model = null;
    this.scaler = null;
    this.results = null;
  }

  setData(trainData, testData) {
    this.trainData = trainData;
    this.testData = testData;
    console.log('📊 Data set in analyzer:', {
      trainFrames: trainData?.frameCount,
      testFrames: testData?.frameCount,
      trainChannels: trainData?.channels?.length,
      testChannels: testData?.channels?.length
    });
  }

  async analyze(config, progressCallback = null) {
    try {
      console.log('🚀 SARIMAX Analysis starting...');
      console.log('⚙️ Config:', config);

      // Step 1: Initialize
      if (progressCallback) progressCallback(10, 'Initializing SARIMAX model...');
      
      // Step 2: Prepare data from BVH
      if (progressCallback) progressCallback(20, 'Preparing BVH data...');
      
      const targetAngle = `${config.targetJoint}_${config.targetAxis}`;
      const exogAngles = ALL_BVH_ANGLES.filter(angle => angle !== targetAngle);
      
      console.log(`🎯 Target angle: ${targetAngle}`);
      console.log(`📊 Exogenous angles count: ${exogAngles.length}`);
      console.log(`📋 First 5 exogenous: [${exogAngles.slice(0, 5).join(', ')}]`);
      
      // Validate data before processing
      if (!this.trainData?.channels || !this.testData?.channels) {
        throw new Error('Invalid BVH data: missing channels information');
      }
      
      if (!this.trainData?.motionData || !this.testData?.motionData) {
        throw new Error('Invalid BVH data: missing motion data');
      }
      
      console.log('✅ Data validation passed');
      
      // Use the utility function instead of method on instance
      console.log('🔄 Preparing training data for SARIMAX...');
      const trainBvhData = prepareForSARIMAX(this.trainData, targetAngle, exogAngles);
      
      console.log('🔄 Preparing test data for SARIMAX...');
      const testBvhData = prepareForSARIMAX(this.testData, targetAngle, exogAngles);
      
      console.log('✅ SARIMAX data preparation completed');
      
      // Validate extracted data
      if (!trainBvhData || !trainBvhData.endog || !trainBvhData.exog) {
        throw new Error('Invalid training data structure after SARIMAX preparation');
      }
      
      if (!testBvhData || !testBvhData.endog || !testBvhData.exog) {
        throw new Error('Invalid test data structure after SARIMAX preparation');
      }
      
      if (!Array.isArray(trainBvhData.endog) || trainBvhData.endog.length === 0) {
        throw new Error(`Invalid training endogenous data: ${typeof trainBvhData.endog}, length: ${trainBvhData.endog?.length}`);
      }
      
      if (!Array.isArray(trainBvhData.exog) || trainBvhData.exog.length === 0) {
        throw new Error(`Invalid training exogenous data: ${typeof trainBvhData.exog}, length: ${trainBvhData.exog?.length}`);
      }
      
      if (!Array.isArray(trainBvhData.exog[0]) || trainBvhData.exog[0].length === 0) {
        throw new Error(`Invalid training exogenous data structure: first row type ${typeof trainBvhData.exog[0]}, length: ${trainBvhData.exog[0]?.length}`);
      }
      
      console.log(`📊 Validated data: Train endog=${trainBvhData.endog.length}, exog=${trainBvhData.exog.length}x${trainBvhData.exog[0].length}`);
      
      // Step 3: Normalize data
      if (progressCallback) progressCallback(30, 'Normalizing data...');
      
      // Convert to multi-channel format like in your main.js
      console.log('🔄 Converting to multi-channel format...');
      const trainMultiChannel = trainBvhData.endog.map((endogValue, i) => {
        if (typeof endogValue !== 'number' || !isFinite(endogValue)) {
          throw new Error(`Invalid endogenous value at index ${i}: ${endogValue}`);
        }
        if (!Array.isArray(trainBvhData.exog[i])) {
          throw new Error(`Invalid exogenous data at index ${i}: ${typeof trainBvhData.exog[i]}`);
        }
        return [endogValue, ...trainBvhData.exog[i]];
      });
      
      const testMultiChannel = testBvhData.endog.map((endogValue, i) => {
        if (typeof endogValue !== 'number' || !isFinite(endogValue)) {
          throw new Error(`Invalid test endogenous value at index ${i}: ${endogValue}`);
        }
        if (!Array.isArray(testBvhData.exog[i])) {
          throw new Error(`Invalid test exogenous data at index ${i}: ${typeof testBvhData.exog[i]}`);
        }
        return [endogValue, ...testBvhData.exog[i]];
      });
      
      if (trainMultiChannel.length === 0 || testMultiChannel.length === 0) {
        throw new Error(`Empty multi-channel data: train=${trainMultiChannel.length}, test=${testMultiChannel.length}`);
      }
      
      if (trainMultiChannel[0].length === 0 || testMultiChannel[0].length === 0) {
        throw new Error(`Invalid multi-channel structure: train cols=${trainMultiChannel[0]?.length}, test cols=${testMultiChannel[0]?.length}`);
      }
      
      console.log(`📊 Multi-channel data: Train ${trainMultiChannel.length}x${trainMultiChannel[0].length}, Test ${testMultiChannel.length}x${testMultiChannel[0].length}`);
      
      // Normalize using SEPARATE StandardScalers like the working version
      console.log('🔄 Creating SEPARATE StandardScalers for train and test (like working version)...');
      const scalerTrain = new StandardScaler();
      const scalerTest = new StandardScaler();
      
      console.log('🔄 Fitting and transforming training data with its own scaler...');
      const normalizedTrainData = scalerTrain.fitTransform(trainMultiChannel);
      
      console.log('🔄 Fitting and transforming test data with its own scaler...');
      const normalizedTestData = scalerTest.fitTransform(testMultiChannel);
      
      // Store the test scaler for denormalization (not the train scaler!)
      this.scaler = scalerTest;
      
      // Validate normalized data
      if (!Array.isArray(normalizedTrainData) || normalizedTrainData.length === 0) {
        throw new Error(`Invalid normalized training data: ${typeof normalizedTrainData}, length: ${normalizedTrainData?.length}`);
      }
      
      if (!Array.isArray(normalizedTestData) || normalizedTestData.length === 0) {
        throw new Error(`Invalid normalized test data: ${typeof normalizedTestData}, length: ${normalizedTestData?.length}`);
      }
      
      console.log('✅ Data normalization completed');
      
      // Step 4: Prepare SARIMAX data (like in your main.js)
      if (progressCallback) progressCallback(40, 'Preparing SARIMAX input...');
      
      const targetIndex = 0; // Target is at index 0
      const exogIndices = Array.from({length: exogAngles.length}, (_, i) => i + 1);
      
      const endogTrain = normalizedTrainData.map(row => {
        if (!Array.isArray(row) || row.length <= targetIndex) {
          throw new Error(`Invalid normalized training row: ${typeof row}, length: ${row?.length}`);
        }
        return row[targetIndex];
      });
      
      const exogTrain = normalizedTrainData.map(row => {
        if (!Array.isArray(row)) {
          throw new Error(`Invalid normalized training row for exog: ${typeof row}`);
        }
        return exogIndices.map(idx => {
          if (idx >= row.length) {
            throw new Error(`Exog index ${idx} out of bounds for row length ${row.length}`);
          }
          return row[idx];
        });
      });
      
      if (endogTrain.length === 0 || exogTrain.length === 0) {
        throw new Error(`Empty SARIMAX input data: endog=${endogTrain.length}, exog=${exogTrain.length}`);
      }
      
      if (exogTrain[0].length === 0) {
        throw new Error(`No exogenous variables for SARIMAX: ${exogTrain[0].length}`);
      }
      
      console.log(`📈 Training data prepared: ${endogTrain.length} frames, ${exogTrain[0].length} exogenous variables`);
      console.log(`📋 Sample endogenous (first 5): [${endogTrain.slice(0, 5).map(x => x.toFixed(3)).join(', ')}]`);
      
      // Step 5: Train model using your real SARIMAX class
      if (progressCallback) progressCallback(60, 'Training SARIMAX model...');
      
      console.log('🔄 Creating SARIMAX model...');
      this.model = new SARIMAX(endogTrain, exogTrain, config.lags || 2);
      
      console.log('🔄 Fitting SARIMAX model...');
      this.model.fit();
      
      console.log('✅ Model training completed');
      
      // Step 6: Create model summary using your function
      console.log('🔄 Creating model summary...');
      const bvhAngles = [targetAngle, ...exogAngles];
      const modelSummaryData = createModelSummary(this.model, bvhAngles, targetAngle, exogIndices);
      
      console.log('✅ Model summary created');
      
            // Step 7: Generate predictions using static forecasting
      if (progressCallback) progressCallback(80, 'Generating forecasts...');
      
      console.log('🔄 Running static forecasting...');
      const staticResults = staticForecasting(
        this.model, 
        normalizedTestData, 
        targetIndex, 
        exogIndices, 
        this.scaler, 
        targetIndex,
        config.steps || 1  // Add steps parameter (default = 1 for static)
      );
      
      if (!staticResults || !staticResults.predStatic || !staticResults.origValues) {
        throw new Error('Invalid static forecasting results');
      }
      
      if (!Array.isArray(staticResults.predStatic) || staticResults.predStatic.length === 0) {
        throw new Error(`Invalid static predictions: ${typeof staticResults.predStatic}, length: ${staticResults.predStatic?.length}`);
      }
      
      const mainResults = {
        predicted: staticResults.predStatic,
        origValues: staticResults.origValues,
        frameIndices: staticResults.frameIndices,
        method: staticResults.method,
        steps: staticResults.steps
      };
      
      console.log(`✅ ${staticResults.method.toUpperCase()} forecasting completed: ${staticResults.predStatic.length} predictions (steps=${staticResults.steps})`);
      
      // Step 8: Calculate metrics using your functions
      if (progressCallback) progressCallback(95, 'Calculating metrics...');
      
      console.log('🔄 Calculating forecasting metrics...');
      const staticMetrics = {
        mse: MSE(mainResults.origValues, mainResults.predicted),
        mae: MAE(mainResults.origValues, mainResults.predicted),
        uTheil: UTheil(mainResults.origValues, mainResults.predicted),
        correlation: calculateCorrelation(mainResults.origValues, mainResults.predicted)
      };
      
      console.log(`📊 ${staticResults.method.toUpperCase()} metrics: MSE=${staticMetrics.mse.toFixed(6)}, MAE=${staticMetrics.mae.toFixed(6)}`);
      
      // Step 9: Compile results with confidence intervals
      if (progressCallback) progressCallback(100, 'Analysis complete!');
      
      // Calculate confidence intervals based on MSE
      const confidenceMultiplier = 1.96; // 95% confidence
      const confidenceInterval = Math.sqrt(staticMetrics.mse) * confidenceMultiplier;
      
      console.log('🔄 Compiling final results...');
      
      // Use the actual frame indices from forecasting
      const framesArray = mainResults.frameIndices;
      
      console.log(`🎯 ${staticResults.method.toUpperCase()} FORECASTING RESULTS:`);
      console.log(`   Method: ${staticResults.method} (steps=${staticResults.steps})`);
      console.log(`   X-axis will show: [${framesArray[0]}, ${framesArray[1]}, ${framesArray[2]}, ..., ${framesArray[framesArray.length-1]}]`);
      console.log(`   Starting from frame ${framesArray[0]} (model.order=${this.model.order})`);
      console.log(`   Both predictions and originals: ${mainResults.predicted.length} = ${mainResults.origValues.length} values`);
      
      console.log(`   First 3 predicted: [${mainResults.predicted.slice(0, 3).map(x => x.toFixed(2)).join(', ')}]`);
      console.log(`   First 3 original: [${mainResults.origValues.slice(0, 3).map(x => x.toFixed(2)).join(', ')}]`)
      
      this.results = {
        targetJoint: config.targetJoint,
        targetAxis: config.targetAxis,
        frames: framesArray,
        original: mainResults.origValues,
        predicted: mainResults.predicted,
        confidence_upper: mainResults.predicted.map(val => val + confidenceInterval),
        confidence_lower: mainResults.predicted.map(val => val - confidenceInterval),
        metrics: staticMetrics,
        modelSummary: this.formatModelSummary(modelSummaryData, bvhAngles, exogIndices),
        method: mainResults.method,
        steps: mainResults.steps
      };

      console.log('🔍 FINAL RESULTS STRUCTURE DEBUG:');
      console.log(`   Target: ${this.results.targetJoint}_${this.results.targetAxis}`);
      console.log(`   Frames: [${this.results.frames.slice(0, 3).join(', ')}...${this.results.frames.slice(-3).join(', ')}] (${this.results.frames.length} total)`);
      console.log(`   Original: [${this.results.original.slice(0, 3).map(x => x.toFixed(2)).join(', ')}...${this.results.original.slice(-3).map(x => x.toFixed(2)).join(', ')}] (${this.results.original.length} total)`);
      console.log(`   Predicted: [${this.results.predicted.slice(0, 3).map(x => x.toFixed(2)).join(', ')}...${this.results.predicted.slice(-3).map(x => x.toFixed(2)).join(', ')}] (${this.results.predicted.length} total)`);
      console.log(`   Original range: [${Math.min(...this.results.original).toFixed(2)}, ${Math.max(...this.results.original).toFixed(2)}]`);
      console.log(`   Predicted range: [${Math.min(...this.results.predicted).toFixed(2)}, ${Math.max(...this.results.predicted).toFixed(2)}]`);
      console.log(`   Confidence interval: ±${confidenceInterval.toFixed(3)}`);

      console.log('🎉 Analysis completed successfully!');
      console.log('📊 Forecasting method: Static (using real exogenous data)');
      console.log(`📊 Final metrics: MSE=${staticMetrics.mse.toFixed(6)}, MAE=${staticMetrics.mae.toFixed(6)}, U-Theil=${staticMetrics.uTheil.toFixed(6)}, Correlation=${staticMetrics.correlation.toFixed(4)}`);

      return { success: true, data: this.results };

    } catch (error) {
      console.error('❌ Analysis failed at step:', error.message);
      console.error('❌ Full error:', error);
      console.error('❌ Stack trace:', error.stack);
      return { success: false, error: `Analysis failed: ${error.message}` };
    }
  }

  formatModelSummary(modelSummaryData, bvhAngles, exogIndices) {
    try {
      console.log('🔄 Formatting model summary...');
      console.log('📊 Model summary data:', modelSummaryData);
      
      // Format model summary for the table component
      const variables = [];
      
      // Add exogenous variables (start from index 0, no constant term)
      for (let i = 0; i < exogIndices.length && i < modelSummaryData.coefficients.length; i++) {
        const exogIndex = exogIndices[i];
        const variableName = bvhAngles[exogIndex] || `exog_${i}`;
        variables.push({
          variable: variableName,
          coefficient: modelSummaryData.coefficients[i],
          pValue: modelSummaryData.pValues[i],
          significance: this.getSignificanceCode(modelSummaryData.pValues[i])
        });
      }
      
      // Add lagged endogenous variables
      const numExog = exogIndices.length;
      for (let lag = 1; lag <= this.model.order; lag++) {
        const coeffIndex = numExog + lag - 1; // -1 because we start from lag 1, but array index starts from 0
        if (coeffIndex < modelSummaryData.coefficients.length) {
          variables.push({
            variable: `${bvhAngles[0]}_T-${lag}`,
            coefficient: modelSummaryData.coefficients[coeffIndex],
            pValue: modelSummaryData.pValues[coeffIndex],
            significance: this.getSignificanceCode(modelSummaryData.pValues[coeffIndex])
          });
        }
      }

      const summary = {
        variables,
        statistics: {
          rSquared: modelSummaryData.rSquared || 0,
          mse: modelSummaryData.mse || 0,
          aic: modelSummaryData.aic || 0,
          bic: modelSummaryData.bic || 0
        }
      };
      
      console.log(`✅ Model summary formatted: ${variables.length} variables`);
      return summary;
      
    } catch (error) {
      console.error('❌ Error formatting model summary:', error);
      return {
        variables: [],
        statistics: { rSquared: 0, mse: 0, aic: 0, bic: 0 }
      };
    }
  }

  getSignificanceCode(pValue) {
    if (pValue < 0.001) return '***';
    if (pValue < 0.01) return '**';
    if (pValue < 0.05) return '*';
    if (pValue < 0.1) return '.';
    return '';
  }

  getResults() {
    return this.results;
  }
}

// Export the metrics functions as well
export { MSE, MAE, UTheil, calculateCorrelation }; 