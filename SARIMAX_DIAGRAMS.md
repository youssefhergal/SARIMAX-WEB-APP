# 🧠 SARIMAX Model Diagrams & Visualizations

This document contains visual representations of the SARIMAX model structure, workflow, and prediction process used in the motion capture analysis application.

---

## 📊 **Diagram 1: Complete SARIMAX Model Structure**

This diagram shows the full mathematical workflow from input data through training to prediction.

```mermaid
graph TD
    A["📊 Input Data"] --> B["Endogenous y(t)<br/>Target Angle Time Series"]
    A --> C["Exogenous X(t)<br/>Other Angles Matrix"]
    
    B --> D["🔄 Create Lagged Variables"]
    D --> E["y(t-1), y(t-2), ..., y(t-p)"]
    
    C --> F["📋 Current Exogenous"]
    F --> G["x1(t), x2(t), ..., xk(t)"]
    
    E --> H["🔗 Combine Features"]
    G --> H
    H --> I["Design Matrix X<br/>[x1(t), x2(t), ..., y(t-1), y(t-2)]"]
    
    I --> J["📈 Linear Regression"]
    J --> K["β = (X'X + λI)^(-1)X'y"]
    
    K --> L["🎯 Model Coefficients"]
    L --> M["β_exog: Exogenous coefficients<br/>β_ar: Autoregressive coefficients"]
    
    M --> N["📊 Statistical Tests"]
    N --> O["Standard Errors<br/>T-Statistics<br/>P-Values"]
    
    O --> P["🔮 Prediction"]
    P --> Q["ŷ(t+1) = Σβ_exog×X(t) + Σβ_ar×y(t-i)"]
    
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

**Key Features:**
- **Mathematical Setup**: Data preparation and feature engineering
- **Model Training**: Linear regression with regularization
- **Statistical Analysis**: Coefficient significance testing
- **Forecasting**: Prediction generation

---

## 📈 **Diagram 2: Time Series Lagged Matrix Example**

This demonstrates how lagged variables are created from a concrete time series.

```mermaid
graph LR
    A["📈 Time Series Data<br/>Hip_Yrotation"] --> B["Data Structure"]
    
    B --> C["Frame 1: 1.2°"]
    B --> D["Frame 2: 1.5°"] 
    B --> E["Frame 3: 1.8°"]
    B --> F["Frame 4: 2.1°"]
    B --> G["Frame 5: 2.4°"]
    
    C --> H["🔄 Lagged Matrix Creation"]
    D --> H
    E --> H
    F --> H
    G --> H
    
    H --> I["Training Examples:<br/>Row 1: [1.5, 1.2] → predicts 1.8<br/>Row 2: [1.8, 1.5] → predicts 2.1<br/>Row 3: [2.1, 1.8] → predicts 2.4"]
    
    I --> J["📊 Model Learning"]
    J --> K["Coefficients: φ₁=0.6, φ₂=0.3"]
    
    K --> L["🔮 New Prediction"]
    L --> M["Given: [2.4, 2.1]<br/>Predict: 0.6×2.4 + 0.3×2.1 = 2.07°"]
```

**Example Process:**
- **Input**: Time series of Hip Y-rotation angles
- **Lagged Matrix**: Create training pairs using sliding window
- **Learning**: Find optimal coefficients for past values
- **Prediction**: Apply learned pattern to new data

---

## 🎯 **Diagram 3: Motion Capture Context**

This shows how SARIMAX applies specifically to motion capture data.

```mermaid
graph TD
    A["🎯 Motion Capture Example"] --> B["Target: Hip_Yrotation(t)"]
    A --> C["Exogenous Variables"]
    
    C --> D["LeftArm_Xrotation(t)"]
    C --> E["RightArm_Zrotation(t)"] 
    C --> F["Spine_Yrotation(t)"]
    C --> G["... (all other angles)"]
    
    B --> H["Lagged Endogenous"]
    H --> I["Hip_Yrotation(t-1)"]
    H --> J["Hip_Yrotation(t-2)"]
    
    D --> K["🔗 Design Matrix X"]
    E --> K
    F --> K
    G --> K
    I --> K
    J --> K
    
    K --> L["X = [LeftArm_X, RightArm_Z, Spine_Y, ..., Hip(t-1), Hip(t-2)]"]
    
    L --> M["📈 Linear Model"]
    M --> N["Hip_Y(t) = β₁×LeftArm_X + β₂×RightArm_Z + ... + φ₁×Hip_Y(t-1) + φ₂×Hip_Y(t-2)"]
    
    N --> O["🎯 Learned Coefficients"]
    O --> P["β₁ = 0.3 (LeftArm influence)<br/>β₂ = -0.1 (RightArm influence)<br/>φ₁ = 0.6 (recent history)<br/>φ₂ = 0.2 (older history)"]
```

**Motion Capture Insights:**
- **Target Joint**: Hip Y-rotation as the variable to predict
- **Body Coordination**: Arms and spine movements influence hip motion
- **Temporal Memory**: Recent hip positions predict future positions
- **Coefficient Interpretation**: Positive/negative influences quantified

---

## 🔮 **Diagram 4: Step-by-Step Prediction Process**

This walks through an actual numerical prediction calculation.

```mermaid
graph TB
    A["📊 SARIMAX Prediction Process"] --> B["Input Data at time t"]
    
    B --> C["Current Exogenous Values"]
    B --> D["Past Endogenous Values"]
    
    C --> E["LeftArm_X(t) = 1.2<br/>RightArm_Z(t) = 0.8<br/>Spine_Y(t) = -0.5"]
    
    D --> F["Hip_Y(t-1) = 2.1<br/>Hip_Y(t-2) = 1.9"]
    
    E --> G["🔗 Combine into Input Vector"]
    F --> G
    
    G --> H["input = [1.2, 0.8, -0.5, 2.1, 1.9]"]
    
    H --> I["🎯 Apply Learned Coefficients"]
    I --> J["coefficients = [0.5, -0.3, 0.8, 0.6, -0.2]"]
    
    H --> K["📈 Dot Product Calculation"]
    J --> K
    
    K --> L["ŷ = 0.5×1.2 + (-0.3)×0.8 + 0.8×(-0.5) + 0.6×2.1 + (-0.2)×1.9"]
    
    L --> M["ŷ = 0.6 - 0.24 - 0.4 + 1.26 - 0.38 = 0.84°"]
    
    M --> N["🔮 Predicted Hip_Yrotation(t+1) = 0.84°"]
```

**Calculation Breakdown:**
- **Exogenous Contribution**: 0.5×1.2 + (-0.3)×0.8 + 0.8×(-0.5) = -0.04°
- **Autoregressive Contribution**: 0.6×2.1 + (-0.2)×1.9 = 0.88°
- **Total Prediction**: -0.04° + 0.88° = 0.84°

---

## 🎯 **Summary of Model Components**

### **Data Structure:**
```
Input Vector = [Exogenous Variables, Lagged Endogenous Variables]
             = [x₁(t), x₂(t), ..., xₖ(t), y(t-1), y(t-2), ..., y(t-p)]
```

### **Model Equation:**
```
y(t) = β₁x₁(t) + β₂x₂(t) + ... + βₖxₖ(t) + φ₁y(t-1) + φ₂y(t-2) + ... + φₚy(t-p) + ε(t)
```

### **Implementation Flow:**
1. **Data Preparation** → Extract target and exogenous variables
2. **Feature Engineering** → Create lagged variables  
3. **Matrix Construction** → Build design matrix X and target vector y
4. **Model Training** → Solve β = (X'X + λI)⁻¹X'y
5. **Statistical Analysis** → Calculate standard errors and p-values
6. **Prediction** → Apply ŷ = X_new × β

### **Key Advantages:**
- **Interpretable**: Linear coefficients show direct relationships
- **Efficient**: Matrix operations enable fast computation
- **Statistical**: P-values indicate variable significance
- **Flexible**: Supports both static and dynamic forecasting
- **Real-time**: Suitable for interactive motion analysis

These diagrams provide a complete visual understanding of how SARIMAX modeling works in the context of motion capture analysis! 🚀 