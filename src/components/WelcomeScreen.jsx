function WelcomeScreen() {
  return (
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="text-center max-w-2xl mx-auto">
        <div class="mb-8">
          <i class="fas fa-chart-line text-6xl text-gradient-start mb-6"></i>
          <h1 class="text-4xl font-bold gradient-text mb-4">
            Welcome to SARIMAX Dashboard
          </h1>
          <p class="text-xl text-gray-600 mb-8">
            Upload your BVH motion capture files to get started with advanced time series forecasting.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 mb-8">
          <div class="card p-8 text-center hover:shadow-medium transition-shadow duration-300">
            <i class="fas fa-brain text-3xl text-gradient-start mb-4"></i>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              Enhanced Dynamic Forecasting
            </h3>
            <p class="text-gray-600">
              Adaptive windowing with 70/30 weighting for quasi-unit root stability
            </p>
          </div>

          <div class="card p-8 text-center hover:shadow-medium transition-shadow duration-300">
            <i class="fas fa-chart-area text-3xl text-gradient-start mb-4"></i>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              Interactive Visualizations
            </h3>
            <p class="text-gray-600">
              Real-time plots with confidence intervals and model summaries
            </p>
          </div>

          <div class="card p-8 text-center hover:shadow-medium transition-shadow duration-300">
            <i class="fas fa-cog text-3xl text-gradient-start mb-4"></i>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              Configurable Models
            </h3>
            <p class="text-gray-600">
              Choose target joints, lags, and forecasting methods
            </p>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 class="text-lg font-semibold text-blue-800 mb-2">Getting Started</h4>
          <div class="text-left space-y-2 text-blue-700">
            <div class="flex items-center space-x-2">
              <span class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
              <span>Upload your training and test BVH files using the sidebar</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
              <span>Select your target joint and configure model parameters</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
              <span>Click "Start Analysis" to begin SARIMAX forecasting</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
              <span>Explore your results with interactive plots and model summaries</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen; 