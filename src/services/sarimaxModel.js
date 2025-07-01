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
      // Step 1: Initialize
      if (progressCallback) progressCallback(10, 'Initializing SARIMAX model...');
      
      // Step 2: Prepare data from BVH
      if (progressCallback) progressCallback(20, 'Preparing BVH data...');
      
      const targetAngle = `${config.targetJoint}_${config.targetAxis}`;
      const exogAngles = ALL_BVH_ANGLES.filter(angle => angle !== targetAngle);
      
      // Validate data before processing
      if (!this.trainData?.channels || !this.testData?.channels) {
        throw new Error('Invalid BVH data: missing channels information');
      }
      
      if (!this.trainData?.motionData || !this.testData?.motionData) {
        throw new Error('Invalid BVH data: missing motion data');
      }
      
      // Use the utility function to prepare SARIMAX data
      const trainBvhData = prepareForSARIMAX(this.trainData, targetAngle, exogAngles);
      const testBvhData = prepareForSARIMAX(this.testData, targetAngle, exogAngles);
      
      // Validate extracted data
      if (!trainBvhData || !trainBvhData.endog || !trainBvhData.exog) {
        throw new Error('Invalid training data structure after SARIMAX preparation');
      }
      
      if (!testBvhData || !testBvhData.endog || !testBvhData.exog) {
        throw new Error('Invalid test data structure after SARIMAX preparation');
      }
      
      // Step 3: Normalize data
      if (progressCallback) progressCallback(40, 'Normalizing data...');
      
      // Create separate scalers for endogenous and exogenous data
      const endogScaler = new StandardScaler();
      const exogScaler = new StandardScaler();
      
      // Prepare data for scaling (convert to 2D arrays as expected by StandardScaler)
      const allEndogData = [...trainBvhData.endog, ...testBvhData.endog];
      const allExogData = [...trainBvhData.exog, ...testBvhData.exog];
      
      // Fit scalers
      const endogDataFor2D = allEndogData.map(val => [val]); // Convert to 2D for scaler
      const exogDataFor2D = allExogData; // Already 2D
      
      endogScaler.fit(endogDataFor2D);
      exogScaler.fit(exogDataFor2D);
      
      // Normalize training data
      const endogTrain = trainBvhData.endog.map(val => endogScaler.transform([[val]])[0][0]);
      const exogTrain = trainBvhData.exog.map(row => exogScaler.transform([row])[0]);
      
      // Normalize test data
      const normalizedTestData = [];
      for (let i = 0; i < testBvhData.frameCount; i++) {
        const normalizedEndog = endogScaler.transform([[testBvhData.endog[i]]])[0][0];
        const normalizedExog = exogScaler.transform([testBvhData.exog[i]])[0];
        normalizedTestData.push([normalizedEndog, ...normalizedExog]);
      }
      
      // Store scalers for denormalization
      this.endogScaler = endogScaler;
      this.exogScaler = exogScaler;
      
      // Find indices for target and exogenous variables
      const targetIndex = 0; // First column is always the target (endogenous)
      const exogIndices = Array.from({length: exogTrain[0].length}, (_, i) => i + 1);
      
      // Step 5: Train model
      if (progressCallback) progressCallback(60, 'Training SARIMAX model...');
      
      this.model = new SARIMAX(endogTrain, exogTrain, config.lags || 2);
      this.model.fit();
      
      // Step 6: Create model summary
      const bvhAngles = [targetAngle, ...exogAngles];
      const modelSummaryData = createModelSummary(this.model, bvhAngles, targetAngle, exogIndices);
      
      // Step 7: Generate predictions using static forecasting
      if (progressCallback) progressCallback(80, 'Generating forecasts...');
      
      const staticResults = staticForecasting(
        this.model, 
        normalizedTestData, 
        targetIndex, 
        exogIndices, 
        this.endogScaler,
        targetIndex,
        config.steps || 1
      );
      
      if (!staticResults || !staticResults.predStatic || !staticResults.origValues) {
        throw new Error('Invalid static forecasting results');
      }
      
      if (!Array.isArray(staticResults.predStatic) || staticResults.predStatic.length === 0) {
        throw new Error(`Invalid static predictions: ${typeof staticResults.predStatic}, length: ${staticResults.predStatic?.length}`);
      }
      
      if (!Array.isArray(staticResults.origValues) || staticResults.origValues.length === 0) {
        throw new Error(`Invalid original values: ${typeof staticResults.origValues}, length: ${staticResults.origValues?.length}`);
      }
      
      // Step 8: Calculate metrics
      if (progressCallback) progressCallback(90, 'Calculating metrics...');
      
      const staticMetrics = {
        mse: MSE(staticResults.origValues, staticResults.predStatic),
        mae: MAE(staticResults.origValues, staticResults.predStatic),
        uTheil: UTheil(staticResults.origValues, staticResults.predStatic),
        correlation: calculateCorrelation(staticResults.origValues, staticResults.predStatic)
      };
      
      // Step 9: Prepare final results
      const mainResults = {
        predicted: staticResults.predStatic,
        origValues: staticResults.origValues,
        method: config.steps <= 1 ? 'static' : 'dynamic',
        steps: config.steps || 1
      };
      
      // Generate frame indices 
      const framesArray = Array.from(
        {length: mainResults.predicted.length}, 
        (_, i) => i + this.model.order
      );
      
      // Calculate confidence intervals (simplified)
      const residuals = mainResults.predicted.map((pred, i) => Math.abs(pred - mainResults.origValues[i]));
      const avgResidual = residuals.reduce((sum, res) => sum + res, 0) / residuals.length;
      const confidenceInterval = 1.96 * avgResidual; // 95% confidence
      
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

      if (progressCallback) progressCallback(100, 'Analysis complete!');
      
      return {
        success: true,
        results: this.results
      };
      
    } catch (error) {
      console.error('SARIMAX Analysis Error:', error);
      return {
        success: false,
        error: error.message,
        results: null
      };
    }
  }

  formatModelSummary(modelSummaryData, bvhAngles, exogIndices) {
    try {
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
      
      return summary;
      
    } catch (error) {
      console.error('Error formatting model summary:', error);
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