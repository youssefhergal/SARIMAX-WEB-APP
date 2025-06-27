import React from 'react';

const ModelSummaryTable = ({ analysisResults }) => {
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        📊 Model Summary
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({variables.length} variables)
        </span>
      </h3>

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
              </tr>
            </thead>
            <tbody>
              {variables.map((variable, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
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
                </tr>
              ))}
            </tbody>
          </table>
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