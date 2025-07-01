# 🧠 SARIMAX Model: Mathematical Foundation & Implementation

## 📋 Overview

**SARIMAX** stands for **Seasonal AutoRegressive Integrated Moving Average with eXogenous variables**. In our implementation, we focus on the **ARX** (AutoRegressive with eXogenous variables) component for motion capture analysis.

## 🎯 Model Structure Diagram

```mermaid
graph TD
    A[📊 Input Data] --> B[Endogenous y(t)<br/>Target Angle Time Series]
    A --> C[Exogenous X(t)<br/>Other Angles Matrix]
    
    B --> D[🔄 Create Lagged Variables]
    D --> E[y(t-1), y(t-2), ..., y(t-p)]
    
    C --> F[📋 Current Exogenous]
    F --> G[x1(t), x2(t), ..., xk(t)]
    
    E --> H[🔗 Combine Features]
    G --> H
    H --> I[Design Matrix X<br/>[x1(t), x2(t), ..., y(t-1), y(t-2)]]
    
    I --> J[📈 Linear Regression]
    J --> K[β = (X'X)^(-1)X'y]
    
    K --> L[🎯 Model Coefficients]
    L --> M[β_exog: Exogenous coefficients<br/>β_ar: Autoregressive coefficients]
    
    M --> N[📊 Statistical Tests]
    N --> O[Standard Errors<br/>T-Statistics<br/>P-Values]
    
    O --> P[🔮 Prediction]
    P --> Q[ŷ(t+1) = Σβ_exog×X(t) + Σβ_ar×y(t-i)]
    
    subgraph "🧮 Mathematical Setup"
        B
        C
        D
        E
        F
        G
    end
    
    subgraph "🤖 Model Training"
        H
        I
        J
        K
        L
    end
    
    subgraph "📈 Statistical Analysis"
        M
        N
        O
    end
    
    subgraph "🔮 Forecasting"
        P
        Q
    end
```

---

## 📐 **Mathematical Formulation**

### **Core SARIMAX Equation**
```
y(t) = β₀ + Σᵢ₌₁ᵏ βᵢ·xᵢ(t) + Σⱼ₌₁ᵖ φⱼ·y(t-j) + ε(t)
```

Where:
- **y(t)**: Target variable at time t (e.g., "Hips_Yrotation")
- **xᵢ(t)**: Exogenous variables at time t (other joint angles)
- **y(t-j)**: Lagged endogenous variables (past values of target)
- **βᵢ**: Exogenous coefficients (how other angles affect target)
- **φⱼ**: Autoregressive coefficients (how past values affect current)
- **ε(t)**: Error term
- **p**: AR order (number of lags)
- **k**: Number of exogenous variables

### **In Motion Capture Context**
```
Hip_Yrotation(t) = β₁·LeftArm_Xrot(t) + β₂·RightArm_Zrot(t) + ... 
                 + φ₁·Hip_Yrotation(t-1) + φ₂·Hip_Yrotation(t-2) + ε(t)
```

---

## 🔧 **Implementation Details**

### **1. Data Preparation**
```javascript
// SARIMAX.js - fit() method

// Create lagged endogenous matrix
laggedMatrix(data, lags) {
  const result = [];
  for (let i = lags; i < data.length; i++) {
    const row = [];
    for (let j = 1; j <= lags; j++) {
      row.push(data[i - j]);  // y(t-1), y(t-2), ..., y(t-p)
    }
    result.push(row);
  }
  return result;
}
```

**Example for order=2:**
```
Time:     1    2    3    4    5    6
y(t):   1.0  1.2  1.5  1.8  2.0  2.2

Lagged Matrix:
Row 0: [1.2, 1.0]  // y(t-1)=1.2, y(t-2)=1.0 → predicts y(3)=1.5
Row 1: [1.5, 1.2]  // y(t-1)=1.5, y(t-2)=1.2 → predicts y(4)=1.8
Row 2: [1.8, 1.5]  // y(t-1)=1.8, y(t-2)=1.5 → predicts y(5)=2.0
```

### **2. Design Matrix Construction**
```javascript
// Combine exogenous and lagged endogenous data
for (let i = 0; i < laggedEndog.length; i++) {
  X.push([...laggedExog[i], ...laggedEndog[i]]);
  y.push(this.endog[i + this.order]);
}
```

**Design Matrix X:**
```
X = [exog₁(t), exog₂(t), ..., exogₖ(t), y(t-1), y(t-2), ..., y(t-p)]
```

**Example with 3 exogenous variables and order=2:**
```
X = [[x1(3), x2(3), x3(3), y(2), y(1)],    → predicts y(3)
     [x1(4), x2(4), x3(4), y(3), y(2)],    → predicts y(4)
     [x1(5), x2(5), x3(5), y(4), y(3)]]    → predicts y(5)
```

---

## 📊 **Linear Regression Solution**

### **Normal Equation**
```javascript
// Matrix operations using mathjs
const XT = math.transpose(XMatrix);           // X'
const XTX = math.multiply(XT, XMatrix);       // X'X
const XTY = math.multiply(XT, yVector);       // X'y
const beta = math.multiply(math.inv(XTX), XTY); // β = (X'X)⁻¹X'y
```

### **With Regularization**
```javascript
// Add small regularization for numerical stability
const lambda = 1e-6;
const identity = math.identity(XTX.size());
const regularizedXTX = math.add(XTX, math.multiply(lambda, identity));
```

**Mathematical Form:**
```
β = (X'X + λI)⁻¹X'y
```

### **Stability Check**
```javascript
// Check AR coefficients for unit root
const arCoeffs = this.coefficients.slice(numExog);
const arSum = arCoeffs.reduce((sum, coef) => sum + coef, 0);

if (Math.abs(arSum) > 0.999) {
  // Apply stability correction
  const stabilityFactor = 0.995 / Math.abs(arSum);
  for (let i = numExog; i < this.coefficients.length; i++) {
    this.coefficients[i] *= stabilityFactor;
  }
}
```

---

## 📈 **Statistical Analysis**

### **1. Standard Errors**
```javascript
// Calculate covariance matrix
const sigma2 = sse / (n - k);  // Residual variance
const covMatrix = math.multiply(sigma2, math.inv(XTX));
const diagElements = math.diag(covMatrix);
const stdErrors = diagElements.map(val => Math.sqrt(Math.abs(val)));
```

**Formula:**
```
Var(β̂) = σ²(X'X)⁻¹
SE(β̂ᵢ) = √Var(β̂ᵢ)
```

### **2. T-Statistics**
```javascript
const tStats = this.coefficients.map((b, i) => b / stdErrors[i]);
```

**Formula:**
```
t = β̂ᵢ / SE(β̂ᵢ)
```

### **3. P-Values**
```javascript
// Approximate p-values using normal distribution for large samples
const pValues = tStats.map(t => {
  const absT = Math.abs(t);
  if (df > 30) {
    // Normal approximation
    const z = absT;
    pValue = 2 * (1 - normalCdf(z));
  } else {
    // Simple thresholds for small samples
    if (absT > 4) pValue = 0.001;
    else if (absT > 2) pValue = 0.05;
    // ... etc
  }
});
```

### **4. Model Quality Metrics**
```javascript
// R-squared
const meanY = math.mean(y);
const ssTotal = math.sum(y.map(v => Math.pow(v - meanY, 2)));
const rSquared = 1 - (sse / ssTotal);

// Information Criteria
this.aic = 2 * k - 2 * Math.log(sse / n);
this.bic = k * Math.log(n) - 2 * Math.log(sse / n);
```

---

## 🔮 **Prediction Process**

### **Single Prediction**
```javascript
predict(endoContext, exogContext) {
  // Combine features in same order as training
  const input = [...exogContext, ...endoContext];
  // [x1(t), x2(t), ..., xk(t), y(t-1), y(t-2), ..., y(t-p)]
  
  const prediction = math.dot(input, this.coefficients);
  return prediction;
}
```

**Mathematical Form:**
```
ŷ(t+1) = β₁x₁(t) + β₂x₂(t) + ... + βₖxₖ(t) + φ₁y(t) + φ₂y(t-1) + ... + φₚy(t-p+1)
```

### **Example Prediction**
Given:
- **Coefficients**: `β = [0.5, -0.3, 0.8, 0.6, -0.2]`
- **Current exogenous**: `[1.2, 0.8, -0.5]`
- **Past endogenous**: `[2.1, 1.9]`

```
ŷ = 0.5×1.2 + (-0.3)×0.8 + 0.8×(-0.5) + 0.6×2.1 + (-0.2)×1.9
  = 0.6 - 0.24 - 0.4 + 1.26 - 0.38
  = 0.84
```

---

## 🎯 **Key Characteristics**

### **Model Advantages**
- **Linear relationship**: Easy to interpret coefficients
- **Statistical significance**: P-values show variable importance  
- **Autoregressive**: Captures temporal dependencies
- **Exogenous support**: Uses other variables for prediction
- **Fast training**: Matrix operations are efficient

### **Implementation Features**
- **Regularization**: Prevents overfitting and numerical issues
- **Stability correction**: Ensures stationary AR process
- **Comprehensive statistics**: Full regression diagnostics
- **Flexible prediction**: Static and dynamic forecasting

### **Motion Capture Application**
- **Target variable**: Any joint angle (e.g., Hip rotation)
- **Exogenous variables**: All other joint angles in same frame
- **Temporal structure**: Past values of target angle
- **Real-time capable**: Fast prediction for interactive use

---

## 🔬 **Mathematical Properties**

### **Stationarity Condition**
For AR(p) process to be stationary:
```
|φ₁ + φ₂ + ... + φₚ| < 1
```

If violated, apply correction:
```
φᵢ_corrected = φᵢ × (0.995 / |sum(φ)|)
```

### **Prediction Variance**
```
Var(ŷ(t+1)) = σ² × x'(X'X)⁻¹x
```
Where x is the prediction input vector.

### **Residual Analysis**
```
εᵢ = y(tᵢ) - ŷ(tᵢ)
MSE = Σεᵢ² / (n-k)
```

---

## 🚀 **Performance Optimization**

### **Matrix Operations**
- Uses `mathjs` for efficient linear algebra
- Regularization prevents singular matrices
- Cached computations for repeated predictions

### **Memory Efficiency**
- Lagged data created on-demand
- Coefficients stored as simple arrays
- Minimal intermediate storage

### **Numerical Stability**
- Ridge regularization (λ = 1e-6)
- Stability factor for AR coefficients
- Robust p-value computation

This mathematical foundation enables accurate time series forecasting for motion capture analysis while maintaining computational efficiency and statistical rigor! 🎯 