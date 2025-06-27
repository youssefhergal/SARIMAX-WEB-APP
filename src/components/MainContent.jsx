import { Show, For, onMount } from 'solid-js';
import { useApp } from '../context/AppContext';
import PlotViewer from './PlotViewer';

function MainContent() {
  const { analysisResults, selectedTargetJoint, activeTab, setActiveTab, statusMessage } = useApp();

  return (
    <div class="flex-1 overflow-y-auto">
      {/* Header */}
      <header class="bg-white border-b border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">Analysis Results</h1>
            <p class="text-gray-600 mt-1">{statusMessage()}</p>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-500">
              Target: <span class="font-mono font-medium">{selectedTargetJoint()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div class="p-6 space-y-8">
        
        {/* Model Summary */}
        <section class="card p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-table text-gradient-start mr-2"></i>
            Model Summary
          </h2>
          
          <Show
            when={analysisResults()?.modelSummary}
            fallback={<p class="text-gray-500">No model summary available</p>}
          >
            <ModelSummaryTable summary={analysisResults().modelSummary} />
          </Show>
        </section>

        {/* Performance Metrics */}
        <section class="card p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-tachometer-alt text-gradient-start mr-2"></i>
            Performance Metrics
          </h2>
          
          <Show
            when={analysisResults()?.metrics}
            fallback={<p class="text-gray-500">No metrics available</p>}
          >
            <MetricsGrid metrics={analysisResults().metrics} />
          </Show>
        </section>

        {/* Plots */}
        <section class="card p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-chart-line text-gradient-start mr-2"></i>
            Forecasting Results
          </h2>
          
          {/* Plot Tabs */}
          <div class="border-b border-gray-200 mb-6">
            <nav class="flex space-x-8">
              <Show when={analysisResults()?.plotData?.static}>
                <button
                  class={`tab-button ${activeTab() === 'static' ? 'active' : ''}`}
                  onClick={() => setActiveTab('static')}
                >
                  Static Forecasting
                </button>
              </Show>
              
              <Show when={analysisResults()?.plotData?.dynamic}>
                <button
                  class={`tab-button ${activeTab() === 'dynamic' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dynamic')}
                >
                  Dynamic Forecasting
                </button>
              </Show>
              
              <Show when={analysisResults()?.plotData?.static && analysisResults()?.plotData?.dynamic}>
                <button
                  class={`tab-button ${activeTab() === 'comparison' ? 'active' : ''}`}
                  onClick={() => setActiveTab('comparison')}
                >
                  Comparison
                </button>
              </Show>
            </nav>
          </div>
          
          {/* Plot Content */}
          <Show
            when={analysisResults()?.plotData}
            fallback={<p class="text-gray-500">No plot data available</p>}
          >
            <PlotViewer 
              plotData={analysisResults().plotData}
              activeTab={activeTab()}
              targetJoint={selectedTargetJoint()}
            />
          </Show>
        </section>

        {/* Export Section */}
        <section class="card p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <i class="fas fa-download text-gradient-start mr-2"></i>
            Export Results
          </h2>
          
          <div class="grid md:grid-cols-3 gap-4">
            <Show when={analysisResults()?.plotData?.static}>
              <button class="btn-download">
                <i class="fas fa-file-code mr-2"></i>
                Download Static Plot
              </button>
            </Show>
            
            <Show when={analysisResults()?.plotData?.dynamic}>
              <button class="btn-download">
                <i class="fas fa-file-code mr-2"></i>
                Download Dynamic Plot
              </button>
            </Show>
            
            <button class="btn-download">
              <i class="fas fa-file-csv mr-2"></i>
              Download Data (JSON)
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

// Model Summary Table Component
function ModelSummaryTable(props) {
  return (
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="border border-gray-200 p-3 text-left font-semibold text-gray-700">Variable</th>
            <th class="border border-gray-200 p-3 text-left font-semibold text-gray-700">Coefficient</th>
            <th class="border border-gray-200 p-3 text-left font-semibold text-gray-700">P-value</th>
            <th class="border border-gray-200 p-3 text-left font-semibold text-gray-700">Significance</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.summary.variables}>
            {(variable, index) => {
              const coeff = props.summary.coefficients[index()];
              const pVal = props.summary.pValues[index()];
              const isSignificant = pVal < 0.05;
              const significance = pVal < 0.001 ? '***' : pVal < 0.01 ? '**' : pVal < 0.05 ? '*' : '';
              
              return (
                <tr class={isSignificant ? 'bg-green-50' : ''}>
                  <td class="border border-gray-200 p-3 font-mono text-sm">{variable}</td>
                  <td class="border border-gray-200 p-3 font-mono text-sm text-right">{coeff.toFixed(6)}</td>
                  <td class="border border-gray-200 p-3 font-mono text-sm text-right">{pVal.toFixed(6)}</td>
                  <td class="border border-gray-200 p-3 text-center font-bold text-red-600">{significance}</td>
                </tr>
              );
            }}
          </For>
        </tbody>
      </table>
      
      <div class="mt-4 p-4 bg-gray-50 rounded-lg">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="font-semibold">R-squared:</span> {props.summary.rSquared.toFixed(4)}
          </div>
          <div>
            <span class="font-semibold">MSE:</span> {props.summary.mse.toFixed(6)}
          </div>
          <div>
            <span class="font-semibold">AIC:</span> {props.summary.aic.toFixed(2)}
          </div>
          <div>
            <span class="font-semibold">BIC:</span> {props.summary.bic.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Metrics Grid Component
function MetricsGrid(props) {
  const getMetricType = (value, thresholds) => {
    if (value < thresholds.good) return 'good';
    if (value < thresholds.warning) return 'warning';
    return 'error';
  };

  return (
    <div class="space-y-6">
      <Show when={props.metrics.static}>
        <div>
          <h3 class="text-lg font-semibold text-gray-700 mb-3">Static Forecasting</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="metric-card">
              <div class="metric-label">MSE</div>
              <div class={`metric-value ${getMetricType(props.metrics.static.mse, {good: 0.1, warning: 0.3})}`}>
                {props.metrics.static.mse.toFixed(6)}
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-label">MAE</div>
              <div class="metric-value">{props.metrics.static.mae.toFixed(6)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">U-Theil</div>
              <div class="metric-value">{props.metrics.static.uTheil.toFixed(6)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Correlation</div>
              <div class={`metric-value ${props.metrics.static.correlation > 0.8 ? 'good' : props.metrics.static.correlation > 0.6 ? 'warning' : 'error'}`}>
                {props.metrics.static.correlation.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      </Show>
      
      <Show when={props.metrics.dynamic}>
        <div>
          <h3 class="text-lg font-semibold text-gray-700 mb-3">Enhanced Dynamic Forecasting</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="metric-card">
              <div class="metric-label">MSE</div>
              <div class={`metric-value ${getMetricType(props.metrics.dynamic.mse, {good: 0.1, warning: 0.3})}`}>
                {props.metrics.dynamic.mse.toFixed(6)}
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-label">MAE</div>
              <div class="metric-value">{props.metrics.dynamic.mae.toFixed(6)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">U-Theil</div>
              <div class="metric-value">{props.metrics.dynamic.uTheil.toFixed(6)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Correlation</div>
              <div class={`metric-value ${props.metrics.dynamic.correlation > 0.8 ? 'good' : props.metrics.dynamic.correlation > 0.6 ? 'warning' : 'error'}`}>
                {props.metrics.dynamic.correlation.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

export default MainContent; 