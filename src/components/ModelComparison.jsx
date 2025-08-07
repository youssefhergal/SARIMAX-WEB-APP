import React from 'react';
import ReactECharts from 'echarts-for-react';

/**
 * ModelComparison Component
 * 
 * Displays comparison between original model and retrained model:
 * - Side-by-side plots showing original vs retrained predictions
 * - Model metrics comparison
 * - Variable coefficients comparison
 */
const ModelComparison = ({ originalResults, retrainedResults, removedVariables }) => {
  if (!originalResults || !retrainedResults) {
    return null;
  }

  // Prepare data for comparison plots
  const prepareComparisonData = () => {
    const frames = originalResults.frames || [];
    const originalPredicted = originalResults.predicted || [];
    const retrainedPredicted = retrainedResults.predicted || [];
    const originalData = originalResults.original || [];
    
    // Align data lengths
    const minLength = Math.min(
      frames.length,
      originalPredicted.length,
      retrainedPredicted.length,
      originalData.length
    );

    return {
      frames: frames.slice(0, minLength),
      originalData: originalData.slice(0, minLength),
      originalPredicted: originalPredicted.slice(0, minLength),
      retrainedPredicted: retrainedPredicted.slice(0, minLength),
      originalUpper: originalResults.confidence_upper?.slice(0, minLength) || [],
      originalLower: originalResults.confidence_lower?.slice(0, minLength) || [],
      retrainedUpper: retrainedResults.confidence_upper?.slice(0, minLength) || [],
      retrainedLower: retrainedResults.confidence_lower?.slice(0, minLength) || []
    };
  };

  const comparisonData = prepareComparisonData();

  // Create comparison chart options
  const createComparisonChartOptions = () => ({
    title: {
      text: 'Model Comparison: Original vs Retrained',
      subtext: `Removed variables: ${removedVariables?.join(', ') || 'None'}`,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: function(params) {
        const frameIndex = params[0].axisValue;
        let tooltipContent = `<strong>Frame ${frameIndex}</strong><br/>`;
        
        params.forEach(param => {
          const color = param.color;
          const name = param.seriesName;
          const value = param.value;
          tooltipContent += `<span style="color: ${color};">●</span> <strong>${name}:</strong> ${value.toFixed(2)}°<br/>`;
        });
        
        return tooltipContent;
      }
    },
    legend: {
      data: ['Original Data', 'Original Model', 'Retrained Model'],
      top: 40,
      left: 'center'
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '8%',
      top: 100,
      containLabel: true
    },
    toolbox: {
      feature: {
        saveAsImage: { title: 'Save as Image' },
        dataZoom: { title: { zoom: 'Zoom', back: 'Reset Zoom' } },
        restore: { title: 'Restore' }
      },
      right: 20,
      top: 20
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: comparisonData.frames,
      name: 'Frame',
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      name: 'Angle (degrees)',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
        formatter: '{value}°'
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
        orient: 'horizontal'
      },
      {
        start: 0,
        end: 100,
        height: 20,
        bottom: 20,
        orient: 'horizontal'
      }
    ],
    series: [
      {
        name: 'Original Data',
        type: 'line',
        data: comparisonData.originalData,
        lineStyle: {
          color: '#3b82f6',
          width: 2
        },
        itemStyle: {
          color: '#3b82f6'
        },
        symbol: 'none',
        sampling: 'lttb'
      },
      {
        name: 'Original Model',
        type: 'line',
        data: comparisonData.originalPredicted,
        lineStyle: {
          color: '#ef4444',
          width: 2
        },
        itemStyle: {
          color: '#ef4444'
        },
        symbol: 'none',
        sampling: 'lttb'
      },
      {
        name: 'Retrained Model',
        type: 'line',
        data: comparisonData.retrainedPredicted,
        lineStyle: {
          color: '#10b981',
          width: 2
        },
        itemStyle: {
          color: '#10b981'
        },
        symbol: 'none',
        sampling: 'lttb'
      }
    ]
  });

  // Calculate metrics comparison
  const calculateMetricsComparison = () => {
    const originalMetrics = originalResults.metrics || {};
    const retrainedMetrics = retrainedResults.metrics || {};
    
    return {
      original: {
        mse: originalMetrics.mse || 0,
        mae: originalMetrics.mae || 0,
        uTheil: originalMetrics.uTheil || 0,
        correlation: originalMetrics.correlation || 0
      },
      retrained: {
        mse: retrainedMetrics.mse || 0,
        mae: retrainedMetrics.mae || 0,
        uTheil: retrainedMetrics.uTheil || 0,
        correlation: retrainedMetrics.correlation || 0
      }
    };
  };

  const metricsComparison = calculateMetricsComparison();

  // Calculate improvement percentages
  const calculateImprovements = () => {
    const original = metricsComparison.original;
    const retrained = metricsComparison.retrained;
    
    return {
      mse: ((original.mse - retrained.mse) / original.mse * 100),
      mae: ((original.mae - retrained.mae) / original.mae * 100),
      uTheil: ((original.uTheil - retrained.uTheil) / original.uTheil * 100),
      correlation: ((retrained.correlation - original.correlation) / original.correlation * 100)
    };
  };

  const improvements = calculateImprovements();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        🔄 Model Comparison
        <span className="ml-2 text-sm font-normal text-gray-500">
          Original vs Retrained Model
        </span>
      </h3>

      {/* Comparison Chart */}
      <div className="mb-6">
        <ReactECharts
          option={createComparisonChartOptions()}
          style={{ height: '400px', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>

      {/* Metrics Comparison */}
      <div className="mb-6">
        <h4 className="text-md font-medium mb-3 text-gray-700">Performance Metrics Comparison</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-sm text-blue-600">MSE</div>
            <div className="text-lg font-semibold text-blue-800">
              {metricsComparison.original.mse.toFixed(6)}
            </div>
            <div className="text-xs text-gray-500">Original</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-sm text-green-600">MSE</div>
            <div className="text-lg font-semibold text-green-800">
              {metricsComparison.retrained.mse.toFixed(6)}
            </div>
            <div className={`text-xs ${improvements.mse > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {improvements.mse > 0 ? '+' : ''}{improvements.mse.toFixed(1)}% change
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-sm text-blue-600">Correlation</div>
            <div className="text-lg font-semibold text-blue-800">
              {metricsComparison.original.correlation.toFixed(4)}
            </div>
            <div className="text-xs text-gray-500">Original</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-sm text-green-600">Correlation</div>
            <div className="text-lg font-semibold text-green-800">
              {metricsComparison.retrained.correlation.toFixed(4)}
            </div>
            <div className={`text-xs ${improvements.correlation > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {improvements.correlation > 0 ? '+' : ''}{improvements.correlation.toFixed(1)}% change
            </div>
          </div>
        </div>
      </div>

      {/* Model Summary Comparison */}
      <div className="mb-6">
        <h4 className="text-md font-medium mb-3 text-gray-700">Model Summary Comparison</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Model */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-700 mb-3">Original Model</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Variables:</span>
                <span className="font-mono">{originalResults.modelSummary?.variables?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Significant:</span>
                <span className="font-mono">
                  {originalResults.modelSummary?.variables?.filter(v => v.pValue < 0.05).length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>R²:</span>
                <span className="font-mono">
                  {originalResults.modelSummary?.statistics?.rSquared?.toFixed(4) || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>AIC:</span>
                <span className="font-mono">
                  {originalResults.modelSummary?.statistics?.aic?.toFixed(3) || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Retrained Model */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-700 mb-3">Retrained Model</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Variables:</span>
                <span className="font-mono">{retrainedResults.modelSummary?.variables?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Significant:</span>
                <span className="font-mono">
                  {retrainedResults.modelSummary?.variables?.filter(v => v.pValue < 0.05).length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>R²:</span>
                <span className="font-mono">
                  {retrainedResults.modelSummary?.statistics?.rSquared?.toFixed(4) || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>AIC:</span>
                <span className="font-mono">
                  {retrainedResults.modelSummary?.statistics?.aic?.toFixed(3) || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Removed Variables Summary */}
      {removedVariables && removedVariables.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-medium mb-3 text-gray-700">Removed Variables</h4>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-700">
              <strong>Variables removed:</strong> {removedVariables.join(', ')}
            </div>
            <div className="text-xs text-red-600 mt-1">
              Total removed: {removedVariables.length} variables
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-md font-medium mb-2 text-gray-700">Summary</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Model improvement:</strong> 
            {improvements.mse > 0 ? (
              <span className="text-green-600"> The retrained model shows improvement in MSE ({improvements.mse.toFixed(1)}% better)</span>
            ) : (
              <span className="text-red-600"> The retrained model shows degradation in MSE ({Math.abs(improvements.mse).toFixed(1)}% worse)</span>
            )}
          </p>
          <p>
            <strong>Correlation change:</strong>
            {improvements.correlation > 0 ? (
              <span className="text-green-600"> Correlation improved by {improvements.correlation.toFixed(1)}%</span>
            ) : (
              <span className="text-red-600"> Correlation decreased by {Math.abs(improvements.correlation).toFixed(1)}%</span>
            )}
          </p>
          <p>
            <strong>Model complexity:</strong> Reduced from {originalResults.modelSummary?.variables?.length || 0} to {retrainedResults.modelSummary?.variables?.length || 0} variables
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModelComparison; 