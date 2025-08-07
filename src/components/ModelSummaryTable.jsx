import React, { useState, useEffect } from 'react';

const ModelSummaryTable = ({ analysisResults, onRetrainModel }) => {
  const [selectedVariables, setSelectedVariables] = useState([]);
  const [showRetrainOptions, setShowRetrainOptions] = useState(false);

  // Reset selected variables when analysis results change
  useEffect(() => {
    setSelectedVariables([]);
    setShowRetrainOptions(false);
  }, [analysisResults]);

  if (!analysisResults) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          📊 Model Summary
        </h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">📋</div>
          <p>Model summary will appear here after analysis</p>
        </div>
      </div>
    );
  }

  if (!analysisResults.modelSummary?.variables || analysisResults.modelSummary.variables.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          📊 Model Summary
        </h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">⚠️</div>
          <p>No model summary data available</p>
        </div>
      </div>
    );
  }

  const { variables } = analysisResults.modelSummary;

  const getSignificanceColor = (pValue) => {
    if (pValue < 0.05) return 'text-green-600';
    if (pValue < 0.1) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSignificanceBackground = (pValue) => {
    if (pValue < 0.05) return 'bg-green-50';
    if (pValue < 0.1) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const isSignificant = (pValue) => pValue < 0.05;

  const handleVariableToggle = (variableName) => {
    setSelectedVariables(prev => {
      if (prev.includes(variableName)) {
        return prev.filter(v => v !== variableName);
      } else {
        return [...prev, variableName];
      }
    });
  };

  const handleSelectNonSignificant = () => {
    const nonSignificantVars = variables
      .filter(v => !isSignificant(v.pValue))
      .map(v => v.variable);
    setSelectedVariables(nonSignificantVars);
  };

  const handleClearSelection = () => {
    setSelectedVariables([]);
  };

  const handleRetrainModel = () => {
    if (onRetrainModel && selectedVariables.length > 0) {
      onRetrainModel(selectedVariables);
    }
  };

  const significantCount = variables.filter(v => isSignificant(v.pValue)).length;
  const nonSignificantCount = variables.length - significantCount;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          📊 Model Summary
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({variables.length} variables)
          </span>
        </h3>
        
        {/* Variable Selection Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowRetrainOptions(!showRetrainOptions)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            🔧 Variable Selection
          </button>
        </div>
      </div>

      {/* Variable Selection Panel */}
      {showRetrainOptions && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Variable Selection for Retraining</h4>
            <div className="text-xs text-gray-500">
              Selected: {selectedVariables.length} / {variables.length}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={handleSelectNonSignificant}
              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Select Non-Significant ({nonSignificantCount})
            </button>
            <button
              onClick={handleClearSelection}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Clear Selection
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {variables.map((variable, index) => (
              <label key={index} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedVariables.includes(variable.variable)}
                  onChange={() => handleVariableToggle(variable.variable)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`${isSignificant(variable.pValue) ? 'text-green-700' : 'text-red-700'}`}>
                  {variable.variable}
                </span>
              </label>
            ))}
          </div>

          {selectedVariables.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={handleRetrainModel}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                🔄 Retrain Model (Remove {selectedVariables.length} Variables)
              </button>
              <div className="mt-2 text-xs text-gray-600">
                Selected variables: {selectedVariables.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Coefficient Table */}
      <div>
        <h4 className="text-md font-medium mb-3 text-gray-700">Coefficient Estimates</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Variable</th>
                <th className="border border-gray-300 px-4 py-2 text-right font-semibold">Coefficient</th>
                <th className="border border-gray-300 px-4 py-2 text-right font-semibold">P-Value</th>
                <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Significance</th>
                <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {variables.map((variable, index) => (
                <tr 
                  key={index} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${
                    selectedVariables.includes(variable.variable) ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''
                  }`}
                >
                  <td className="border border-gray-300 px-4 py-2 font-medium">
                    {variable.variable}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right font-mono">
                    {variable.coefficient !== null && variable.coefficient !== undefined 
                      ? parseFloat(variable.coefficient).toFixed(6) 
                      : 'N/A'}
                  </td>
                  <td className={`border border-gray-300 px-4 py-2 text-right font-mono ${getSignificanceColor(variable.pValue)}`}>
                    {variable.pValue !== null && variable.pValue !== undefined
                      ? (variable.pValue < 0.001 ? '< 0.001' : parseFloat(variable.pValue).toFixed(6))
                      : 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center font-bold text-green-600">
                    {variable.significance || ''}
                  </td>
                  <td className={`border border-gray-300 px-4 py-2 text-center text-sm ${getSignificanceBackground(variable.pValue)}`}>
                    {isSignificant(variable.pValue) ? (
                      <span className="text-green-700 font-medium">✓ Significant</span>
                    ) : (
                      <span className="text-red-700 font-medium">✗ Non-Significant</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Summary Statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-sm text-green-600">Significant Variables</div>
            <div className="text-lg font-semibold text-green-800">{significantCount}</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-sm text-red-600">Non-Significant Variables</div>
            <div className="text-lg font-semibold text-red-800">{nonSignificantCount}</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-sm text-blue-600">Significance Rate</div>
            <div className="text-lg font-semibold text-blue-800">
              {((significantCount / variables.length) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-sm text-purple-600">Total Variables</div>
            <div className="text-lg font-semibold text-purple-800">{variables.length}</div>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          <span className="mr-4">Significance codes:</span>
          <span className="mr-2">*** p &lt; 0.001</span>
          <span className="mr-2">** p &lt; 0.01</span>
          <span className="mr-2">* p &lt; 0.05</span>
          <span>. p &lt; 0.1</span>
        </div>
      </div>
    </div>
  );
};

export default ModelSummaryTable; 