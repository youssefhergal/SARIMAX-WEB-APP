# SARIMAX Motion Analysis Web Application

## 🚀 Client-Side SARIMAX Implementation

A modern web application built with **React + Vite + Tailwind CSS** that performs **complete SARIMAX analysis directly in the browser** - no backend server required!

## ✨ Features

- 📁 **BVH File Upload** - Drag & drop support for training and test files
- ⚙️ **SARIMAX Configuration** - Customizable lags and forecasting steps
- 📊 **Real-time Analysis** - Client-side processing with progress indicators
- 📈 **Interactive Visualizations** - ECharts integration for beautiful plots
- 📋 **Detailed Metrics** - MSE, MAE, U-Theil, correlation analysis
- 🎨 **Modern Interface** - Responsive design with smooth animations
- 🔄 **Static & Dynamic Forecasting** - Flexible forecasting methods

## 🏗️ Architecture

```
SARIMAX WEB app/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.jsx    # Main application layout
│   │   ├── AnglePlot.jsx    # ECharts visualization component
│   │   └── ModelSummaryTable.jsx # Model results display
│   ├── context/
│   │   └── AppContext.jsx   # Global state and SARIMAX logic
│   ├── services/
│   │   ├── bvhParser.js     # BVH file parsing
│   │   ├── sarimaxModel.js  # SARIMAX implementation
│   │   ├── classes/         # Core algorithm classes
│   │   ├── forecasting/     # Forecasting methods
│   │   └── utils/           # Metrics and utilities
│   └── index.jsx            # Application entry point
├── package.json             # Frontend dependencies only
├── vite.config.js          # Vite configuration
└── tailwind.config.js      # Tailwind CSS configuration
```

## 🔧 Core SARIMAX Modules

The application includes a complete SARIMAX implementation:

```javascript
import { SARIMAX } from './classes/SARIMAX.js';
import { StandardScaler } from './classes/StandardScaler.js';
import { prepareForSARIMAX } from './bvhParser.js';
import { staticForecasting } from './forecasting/staticForecasting.js';
import { MSE, MAE, UTheil, calculateCorrelation } from './utils/metrics.js';
```

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

The application will be available at http://localhost:5173

## 💡 Advantages of Client-Side Architecture

- ✅ **No server required** - Static deployment possible
- ✅ **Local processing** - BVH data stays on user's machine
- ✅ **High performance** - No network latency for calculations
- ✅ **Simple deployment** - Single application to maintain
- ✅ **Data security** - No sensitive data transfer required

## 🔄 Workflow

1. **Upload**: Drag & drop BVH training and test files
2. **Configure**: Select target joint, axis, and SARIMAX parameters
3. **Analyze**: Click "Start SARIMAX Analysis" - everything runs in browser
4. **Results**: View interactive plots and detailed metrics
5. **Compare**: Switch between static and dynamic forecasting methods

## 🎯 Technologies

- **Frontend**: React 18, Vite, Tailwind CSS
- **Visualization**: ECharts (echarts-for-react)
- **Mathematics**: MathJS for linear algebra operations
- **Algorithm**: Pure JavaScript SARIMAX implementation
- **Parsing**: Built-in BVH parser for motion capture data

## 📊 Calculated Metrics

- **MSE**: Mean Squared Error
- **MAE**: Mean Absolute Error  
- **U-Theil**: Theil's U statistic
- **Correlation**: Correlation coefficient
- **Model Summary**: Coefficients, p-values, significance levels

## 🎮 Forecasting Methods

### Static Forecasting (steps = 1)
- Uses real data for all predictions
- Most stable and reliable
- Best for validation and comparison

### Dynamic Forecasting (steps > 1)
- Uses predicted data for multi-step ahead forecasting
- More challenging but realistic for future predictions
- Periodic real data reset prevents error accumulation

## 🔮 Project Status

This is a clean, production-ready implementation with:
- ✅ Removed all debugging console statements
- ✅ Eliminated unused components and dependencies
- ✅ Consistent React architecture throughout
- ✅ Optimized bundle size and performance
- ✅ Clear separation of concerns 