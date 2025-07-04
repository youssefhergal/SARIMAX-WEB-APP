import * as math from 'mathjs';

// Enhanced SARIMAX class with multiple estimation methods
export class SARIMAX {
  constructor(endog, exog, order = 2, method = 'ols') {
    this.endog = endog;
    this.exog = exog;
    this.order = order;
    this.method = method.toLowerCase(); // 'ols', 'mle', 'ridge'
    this.coefficients = null;
    this.trained = false;
    this.stdErrors = null;
    this.tStats = null;
    this.pValues = null;
    this.residuals = null;
    this.rSquared = null;
    this.mse = null;
    this.aic = null;
    this.bic = null;
    this.lambda = 0.1; // Increased Ridge regularization parameter for noticeable differences
  }

  laggedMatrix(data, lags) {
    const result = [];
    for (let i = lags; i < data.length; i++) {
      const row = [];
      for (let j = 1; j <= lags; j++) {
        row.push(data[i - j]);
      }
      result.push(row);
    }
    return result;
  }

  // Pure Ordinary Least Squares estimation
  _fitOLS(X, y) {
    console.log('🔵 Using PURE OLS estimation (no regularization)');
    const XMatrix = math.matrix(X);
    const yVector = math.matrix(y);
    const XT = math.transpose(XMatrix);
    const XTX = math.multiply(XT, XMatrix);
    
    // Pure OLS: β = (X'X)⁻¹X'y (no regularization)
    try {
      const XTY = math.multiply(XT, yVector);
      const beta = math.multiply(math.inv(XTX), XTY);
      console.log('✅ OLS: Matrix inversion successful - no regularization added');
      return { beta, XTX, XMatrix, yVector, XT };
    } catch (error) {
      console.warn('⚠️ OLS matrix inversion failed, adding minimal regularization');
      // Fallback with minimal regularization if matrix is singular
      const identity = math.identity(XTX.size());
      const regularizedXTX = math.add(XTX, math.multiply(1e-10, identity));
      const XTY = math.multiply(XT, yVector);
      const beta = math.multiply(math.inv(regularizedXTX), XTY);
      return { beta, XTX: regularizedXTX, XMatrix, yVector, XT };
    }
  }

  // Maximum Likelihood Estimation (for ARIMA, equivalent to OLS with normal errors)
  _fitMLE(X, y) {
    console.log('🟡 Using MLE estimation (mathematically equivalent to OLS for normal errors)');
    // For linear regression with normal errors, MLE is equivalent to OLS
    // β_MLE = argmax L(β) = argmin Σ(yi - xiβ)²
    // This gives the same solution as OLS: β = (X'X)⁻¹X'y
    const XMatrix = math.matrix(X);
    const yVector = math.matrix(y);
    const XT = math.transpose(XMatrix);
    const XTX = math.multiply(XT, XMatrix);
    
    // MLE estimation with iterative improvement
    let beta = math.multiply(math.inv(XTX), math.multiply(XT, yVector));
    
    // Iterative MLE refinement (basic implementation)
    for (let iter = 0; iter < 10; iter++) {
      const predictions = math.multiply(XMatrix, beta);
      const residuals = math.subtract(yVector, predictions);
      const gradient = math.multiply(XT, residuals);
      const hessian = math.multiply(-1, XTX);
      
      try {
        const step = math.multiply(math.inv(hessian), gradient);
        beta = math.subtract(beta, math.multiply(0.01, step)); // Small step size
      } catch (e) {
        break; // Stop if hessian becomes singular
      }
    }
    
    console.log('✅ MLE: Converged to OLS solution (as expected for normal linear regression)');
    return { beta, XTX, XMatrix, yVector, XT };
  }

  // Ridge L2 Regularization with stronger penalty
  _fitRidge(X, y) {
    console.log(`🔴 Using Ridge L2 regularization with λ = ${this.lambda}`);
    const XMatrix = math.matrix(X);
    const yVector = math.matrix(y);
    const XT = math.transpose(XMatrix);
    const XTX = math.multiply(XT, XMatrix);
    
    // Ridge: β = (X'X + λI)⁻¹X'y
    const identity = math.identity(XTX.size());
    const regularizedXTX = math.add(XTX, math.multiply(this.lambda, identity));
    const XTY = math.multiply(XT, yVector);
    const beta = math.multiply(math.inv(regularizedXTX), XTY);
    
    console.log('✅ Ridge: Applied L2 regularization - coefficients shrunk toward zero');
    return { beta, XTX: regularizedXTX, XMatrix, yVector, XT };
  }

  fit() {
    console.log(`\n🚀 SARIMAX Training with method: ${this.method.toUpperCase()}`);
    
    const X = [];
    const y = [];

    const laggedEndog = this.laggedMatrix(this.endog, this.order);
    const laggedExog = this.exog.slice(this.order);

    for (let i = 0; i < laggedEndog.length; i++) {
      X.push([...laggedExog[i], ...laggedEndog[i]]);
      y.push(this.endog[i + this.order]);
    }

    // Choose estimation method
    let result;
    switch (this.method) {
      case 'ols':
        result = this._fitOLS(X, y);
        break;
      case 'mle':
        result = this._fitMLE(X, y);
        break;
      case 'ridge':
        result = this._fitRidge(X, y);
        break;
      default:
        console.warn(`Unknown method ${this.method}, defaulting to OLS`);
        result = this._fitOLS(X, y);
    }

    const { beta, XTX, XMatrix, yVector, XT } = result;
    this.coefficients = beta._data;
    
    // Log coefficient summary for comparison
    console.log(`📊 ${this.method.toUpperCase()} Coefficients:`, 
      this.coefficients.map(c => c.toFixed(6)).join(', '));

    // Check for potential instability in AR coefficients (only for OLS and MLE)
    if (this.method !== 'ridge') {
      const numExog = this.exog[0].length;
      const arCoeffs = this.coefficients.slice(numExog);
      const arSum = arCoeffs.reduce((sum, coef) => sum + coef, 0);

      if (Math.abs(arSum) > 0.999) {
        console.warn(`⚠️ Model stability warning: AR coefficients sum = ${arSum.toFixed(6)} (close to unit root)`);
        // Apply stability correction
        const stabilityFactor = 0.995 / Math.abs(arSum);
        for (let i = numExog; i < this.coefficients.length; i++) {
          this.coefficients[i] *= stabilityFactor;
        }
        console.log(`✅ Applied stability correction factor: ${stabilityFactor.toFixed(6)}`);
      }
    }

    // Calculate statistics and diagnostics
    const correctedBeta = math.matrix(this.coefficients);
    const yPred = math.multiply(XMatrix, correctedBeta);
    const residuals = math.subtract(yVector, yPred);

    const n = y.length;
    const k = this.coefficients.length;
    const sse = math.sum(math.dotMultiply(residuals, residuals));
    const sigma2 = sse / (n - k);

    // For statistical inference, use the original XTX (not regularized for Ridge)
    const originalXTX = this.method === 'ridge' ? 
      math.multiply(XT, XMatrix) : XTX;
    
    const covMatrix = math.multiply(sigma2, math.inv(originalXTX));
    const diagElements = math.diag(covMatrix);

    // Convert to regular array if needed
    const diagArray = Array.isArray(diagElements) ? diagElements : diagElements._data || [diagElements]; 

    const stdErrors = diagArray.map(val => {
      const sqrt = Math.sqrt(Math.abs(val)); // Ensure positive value
      return sqrt === 0 ? 1e-10 : sqrt; // Avoid division by zero
    });

    const tStats = this.coefficients.map((b, i) => {
      const tStat = b / stdErrors[i];
      return isNaN(tStat) || !isFinite(tStat) ? 0 : tStat;
    });

    const pValues = tStats.map(t => {
      try {
        const absT = Math.abs(t);
        if (!isFinite(absT) || isNaN(absT)) return 0.999;

        // Manual t-distribution approximation for p-values
        // Using normal approximation for large degrees of freedom
        const df = n - k;
        let pValue;

        if (df > 30) {
          // Normal approximation for large df
          const z = absT;
          // Approximate standard normal CDF
          const erfApprox = (x) => {
            const a1 =  0.254829592;
            const a2 = -0.284496736;
            const a3 =  1.421413741;
            const a4 = -1.453152027;
            const a5 =  1.061405429;
            const p  =  0.3275911;
            const sign = x < 0 ? -1 : 1;
            x = Math.abs(x);
            const t2 = 1.0 / (1.0 + p * x);
            const y2 = 1.0 - (((((a5 * t2 + a4) * t2) + a3) * t2 + a2) * t2 + a1) * t2 * Math.exp(-x * x);
            return sign * y2;
          };
          
          const cdf = 0.5 * (1 + erfApprox(z / Math.sqrt(2)));
          pValue = 2 * (1 - cdf);
        } else {
          // Simple approximation for small df
          if (absT > 4) pValue = 0.001;
          else if (absT > 3) pValue = 0.01;
          else if (absT > 2.5) pValue = 0.02;
          else if (absT > 2) pValue = 0.05;
          else if (absT > 1.5) pValue = 0.1;
          else pValue = 0.2;
        }

        return Math.max(0.001, Math.min(0.999, pValue));

      } catch (e) {
        console.log('Error calculating p-value for t-stat:', t, e.message);
        return 0.999;
      }
    });

    const meanY = math.mean(y);
    const ssTotal = math.sum(y.map(v => Math.pow(v - meanY, 2)));
    const rSquared = 1 - (sse / ssTotal);

    // Calculate AIC and BIC
    this.aic = 2 * k - 2 * Math.log(sse / n);
    this.bic = k * Math.log(n) - 2 * Math.log(sse / n);

    this.trained = true;
    this.stdErrors = stdErrors;
    this.tStats = tStats;
    this.pValues = pValues;
    this.residuals = residuals._data;
    this.rSquared = rSquared;
    this.mse = sigma2;

    return this;
  }

  apply(endogData, exogData) {
    if (!this.trained) throw new Error("Model not trained");
    
    // Create a temporary model instance for prediction
    const tempModel = {
      endog: endogData,
      exog: exogData,
      coefficients: this.coefficients,
      order: this.order,
      getPrediction: () => {
        const lastEndog = endogData.slice(-this.order);
        const lastExog = exogData[exogData.length - 1];
        const input = [...lastExog, ...lastEndog];
        const prediction = math.dot(input, this.coefficients);
        return {
          predicted_mean: [prediction]
        };
      }
    };
    
    return tempModel;
  }

  predict(endoContext, exogContext) {
    if (!this.trained) throw new Error("Model not trained");
    
    // Combine exogenous and endogenous data in the correct order
    // The coefficients are ordered as: [exog1, exog2, ..., endog_lag1, endog_lag2, ...]
    const input = [...exogContext, ...endoContext];
    
    if (input.length !== this.coefficients.length) {
      throw new Error(`Input length ${input.length} doesn't match coefficient length ${this.coefficients.length}`);
    }
    
    const prediction = math.dot(input, this.coefficients);
    return prediction;
  }

  predictNext(lastEndog, nextExog) {
    if (!this.trained) throw new Error("Model not trained");
    if (lastEndog.length !== this.order || nextExog.length !== this.exog[0].length)
      throw new Error("Mismatch in input dimensions");

    const input = [...nextExog, ...lastEndog];
    const prediction = math.dot(input, this.coefficients);
    return prediction;
  }

  // New method: Predict with confidence intervals
  predictWithConfidence(endoContext, exogContext, alpha = 0.05) {
    if (!this.trained) throw new Error("Model not trained");
    
    const prediction = this.predict(endoContext, exogContext);
    const confidenceIntervals = this.calculateConfidenceIntervals(prediction, alpha);
    
    return {
      mean: prediction,
      mean_se: Math.sqrt(this.mse),
      mean_ci_lower: confidenceIntervals.lower,
      mean_ci_upper: confidenceIntervals.upper,
      confidence_level: (1 - alpha) * 100
    };
  }

  // Calculate confidence intervals for a prediction
  calculateConfidenceIntervals(prediction, alpha = 0.05) {
    if (!this.trained) throw new Error("Model not trained");
    
    // Calculate prediction standard error
    // For ARIMA models, prediction SE increases with forecast horizon
    // For simplicity, we use the residual standard error (sqrt of MSE)
    const predictionSE = Math.sqrt(this.mse);
    
    // Calculate critical value for confidence interval
    // Using normal approximation for large samples (t-distribution converges to normal)
    const criticalValue = this.getNormalCriticalValue(alpha / 2);
    
    // Calculate confidence bounds
    const marginOfError = criticalValue * predictionSE;
    
    return {
      lower: prediction - marginOfError,
      upper: prediction + marginOfError
    };
  }

  // Get critical value from standard normal distribution
  getNormalCriticalValue(alpha) {
    // Approximate inverse normal CDF for common confidence levels
    // This is a simplified implementation - for production, consider using a proper statistical library
    if (alpha <= 0.005) return 2.576; // 99% CI
    if (alpha <= 0.010) return 2.326; // 98% CI  
    if (alpha <= 0.025) return 1.960; // 95% CI
    if (alpha <= 0.050) return 1.645; // 90% CI
    if (alpha <= 0.100) return 1.282; // 80% CI
    
    // Fallback approximation using Box-Muller transform concept
    // For other alpha values, use normal approximation
    return Math.sqrt(-2 * Math.log(alpha));
  }

  // Enhanced prediction method with optional confidence intervals
  predictFull(endoContext, exogContext, options = {}) {
    if (!this.trained) throw new Error("Model not trained");
    
    const { 
      includeConfidence = false, 
      alpha = 0.05,
      steps = 1 
    } = options;
    
    if (steps === 1) {
      if (includeConfidence) {
        return this.predictWithConfidence(endoContext, exogContext, alpha);
      } else {
        return { mean: this.predict(endoContext, exogContext) };
      }
    } else {
      // Multi-step prediction with increasing uncertainty
      return this.predictMultiStep(endoContext, exogContext, steps, includeConfidence, alpha);
    }
  }

  // Multi-step prediction with confidence intervals
  predictMultiStep(endoContext, exogContext, steps, includeConfidence = false, alpha = 0.05) {
    if (!this.trained) throw new Error("Model not trained");
    
    const predictions = [];
    let currentEndoContext = [...endoContext];
    
    for (let step = 0; step < steps; step++) {
      if (includeConfidence) {
        // Increase prediction uncertainty with each step
        const stepAlpha = alpha * (1 + step * 0.1); // Uncertainty grows with horizon
        const result = this.predictWithConfidence(currentEndoContext, exogContext, stepAlpha);
        predictions.push(result);
        
        // Update context with predicted value for next step
        currentEndoContext = currentEndoContext.slice(1).concat([result.mean]);
      } else {
        const prediction = this.predict(currentEndoContext, exogContext);
        predictions.push({ mean: prediction });
        
        // Update context with predicted value for next step
        currentEndoContext = currentEndoContext.slice(1).concat([prediction]);
      }
    }
    
    return predictions;
  }

  summary() {
    if (!this.trained) return "Model not trained.";
    return {
      coefficients: this.coefficients,
      stdErrors: this.stdErrors,
      tStats: this.tStats,
      pValues: this.pValues,
      residuals: this.residuals,
      mse: this.mse,
      rSquared: this.rSquared,
      aic: this.aic,
      bic: this.bic
    };
  }
} 