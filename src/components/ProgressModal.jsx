import { useApp } from '../context/AppContext';

function ProgressModal() {
  const { progress } = useApp();

  return (
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-strong p-8 max-w-md w-full mx-4">
        <div class="text-center">
          {/* Animated Icon */}
          <div class="mb-6">
            <div class="w-16 h-16 mx-auto bg-gradient-to-r from-gradient-start to-gradient-end rounded-full flex items-center justify-center mb-4">
              <i class="fas fa-brain text-white text-2xl animate-pulse"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-800">
              Analyzing Motion Data
            </h3>
          </div>

          {/* Progress Bar */}
          <div class="mb-6">
            <div class="progress-bar mb-2">
              <div 
                class="progress-fill"
                style={{ width: `${progress().percent}%` }}
              ></div>
            </div>
            <div class="flex justify-between text-sm text-gray-600">
              <span>{progress().message}</span>
              <span>{progress().percent}%</span>
            </div>
          </div>

          {/* Process Steps */}
          <div class="space-y-3 text-left">
            <div class="flex items-center space-x-3">
              <div class={`w-4 h-4 rounded-full ${progress().percent >= 20 ? 'bg-green-500' : 'bg-gray-300'} transition-colors duration-300`}></div>
              <span class={`text-sm ${progress().percent >= 20 ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                Upload and validate files
              </span>
            </div>
            
            <div class="flex items-center space-x-3">
              <div class={`w-4 h-4 rounded-full ${progress().percent >= 60 ? 'bg-green-500' : 'bg-gray-300'} transition-colors duration-300`}></div>
              <span class={`text-sm ${progress().percent >= 60 ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                Train SARIMAX model
              </span>
            </div>
            
            <div class="flex items-center space-x-3">
              <div class={`w-4 h-4 rounded-full ${progress().percent >= 90 ? 'bg-green-500' : 'bg-gray-300'} transition-colors duration-300`}></div>
              <span class={`text-sm ${progress().percent >= 90 ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                Generate visualizations
              </span>
            </div>
            
            <div class="flex items-center space-x-3">
              <div class={`w-4 h-4 rounded-full ${progress().percent >= 100 ? 'bg-green-500' : 'bg-gray-300'} transition-colors duration-300`}></div>
              <span class={`text-sm ${progress().percent >= 100 ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                Analysis complete
              </span>
            </div>
          </div>

          {/* Tips */}
          <div class="mt-6 p-4 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-700">
              <i class="fas fa-lightbulb mr-2"></i>
              The Enhanced Dynamic Forecasting uses 70/30 weighting for optimal stability with motion capture data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressModal; 