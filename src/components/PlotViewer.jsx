import { Show } from 'solid-js';

function PlotViewer(props) {
  return (
    <div class="w-full">
      <div class="plot-container bg-white border rounded-lg p-6 h-96">
        <Show
          when={props.plotData}
          fallback={
            <div class="flex items-center justify-center h-full">
              <div class="text-center">
                <div class="text-6xl mb-4">📊</div>
                <p class="text-gray-600">Select files and run analysis to view plot</p>
              </div>
            </div>
          }
        >
          <div class="h-full flex items-center justify-center">
            <div class="text-center">
              <h3 class="text-lg font-semibold mb-4">
                {props.activeTab === 'static' ? 'Static Forecasting' : 
                 props.activeTab === 'dynamic' ? 'Dynamic Forecasting' : 
                 'Comparison'} - {props.targetJoint}
              </h3>
              
              <div class="grid grid-cols-3 gap-4 text-sm">
                <div class="bg-red-100 p-3 rounded">
                  <div class="font-semibold text-red-800">Original Data</div>
                  <div class="text-red-600">{props.plotData.original?.length || 0} points</div>
                </div>
                
                <Show when={props.plotData.static && (props.activeTab === 'static' || props.activeTab === 'comparison')}>
                  <div class="bg-blue-100 p-3 rounded">
                    <div class="font-semibold text-blue-800">Static Prediction</div>
                    <div class="text-blue-600">{props.plotData.static?.length || 0} points</div>
                  </div>
                </Show>
                
                <Show when={props.plotData.dynamic && (props.activeTab === 'dynamic' || props.activeTab === 'comparison')}>
                  <div class="bg-purple-100 p-3 rounded">
                    <div class="font-semibold text-purple-800">Dynamic Prediction</div>
                    <div class="text-purple-600">{props.plotData.dynamic?.length || 0} points</div>
                  </div>
                </Show>
              </div>
              
              <div class="mt-6 p-4 bg-gray-50 rounded text-xs text-gray-600">
                <i class="fas fa-info-circle mr-2"></i>
                Interactive Plotly.js visualization will be implemented here
              </div>
            </div>
          </div>
        </Show>
      </div>
      
      {/* Plot Info */}
      <div class="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <div class="flex items-center justify-between">
          <div>
            <i class="fas fa-chart-line mr-2"></i>
            SARIMAX Analysis Visualization
          </div>
          <div class="flex items-center space-x-4">
            <span>Target: {props.targetJoint || 'None'}</span>
            <span>Tab: {props.activeTab}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlotViewer; 