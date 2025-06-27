import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import ModelSummaryTable from './ModelSummaryTable';
import AnglePlot from './AnglePlot';

function Dashboard() {
  const { 
    ui, 
    analysisState, 
    config, 
    analysisData, 
    files,
    updateConfig, 
    updateModelParams,
    uploadTrainFile, 
    uploadTestFile, 
    clearFiles,
    analyzeData 
  } = useApp();
  
  const trainFileRef = useRef(null);
  const testFileRef = useRef(null);
  
  // État local pour les onglets
  const [activeTab, setActiveTab] = useState('static');

  const handleTrainFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📁 Training file selected:', file.name);
      const result = await uploadTrainFile(file);
      if (!result.success) {
        alert(result.message);
      } else {
        console.log('✅ Training file uploaded successfully');
      }
    }
  };

  const handleTestFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📁 Test file selected:', file.name);
      const result = await uploadTestFile(file);
      if (!result.success) {
        alert(result.message);
      } else {
        console.log('✅ Test file uploaded successfully');
      }
    }
  };

  const handleAnalyze = async () => {
    console.log('🚀 Starting analysis...');
    const result = await analyzeData();
    if (!result.success) {
      alert(result.message);
    }
  };

  const canAnalyze = files.trainParsed && files.testParsed && !analysisState.isAnalyzing;
  
  // Render content based on active tab
  const renderTabContent = () => {
    if (!analysisState.results) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready for SARIMAX Analysis</h2>
              <p className="text-gray-600 max-w-md">
                Upload your training and test BVH files, select the target joint and axis, 
                configure the model parameters, and start the analysis.
              </p>
              <div className="mt-4 text-sm text-gray-500">
                Your real SARIMAX implementation with mathjs is ready to process motion capture data.
              </div>
            </div>
          </div>

        </div>
      );
    }

    switch (activeTab) {
      case 'static':
        return (
          <>
            {/* Static Forecasting Visualization */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">📊 Static Forecasting</h3>
              <AnglePlot 
                targetJoint={config.targetJoint}
                targetAxis={config.targetAxis}
                analysisType="static"
                realData={analysisState.results}
              />
            </div>

            {/* Model Summary Table */}
            <div className="mb-6">
              <ModelSummaryTable analysisResults={analysisState.results} />
            </div>

            {/* Static Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">MSE</div>
                <div className="text-lg font-semibold text-green-600">
                  {analysisState.results.metrics.static.mse.toFixed(6)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">MAE</div>
                <div className="text-lg font-semibold text-blue-600">
                  {analysisState.results.metrics.static.mae.toFixed(6)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">U-Theil</div>
                <div className="text-lg font-semibold text-purple-600">
                  {analysisState.results.metrics.static.uTheil.toFixed(6)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">Correlation</div>
                <div className="text-lg font-semibold text-green-600">
                  {analysisState.results.metrics.static.correlation.toFixed(4)}
                </div>
              </div>
            </div>
          </>
        );
        
      case 'dynamic':
        if (!analysisState.results.metrics.dynamic) {
          return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="text-center">
                <div className="text-4xl mb-4">🌊</div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Dynamic Forecasting Not Available</h3>
                <p className="text-yellow-700">
                  Dynamic forecasting is currently disabled in the configuration. 
                  Enable it in the model parameters to see dynamic predictions.
                </p>
                <button 
                  onClick={() => updateModelParams({ enableDynamic: true })}
                  className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                >
                  Enable Dynamic Forecasting
                </button>
              </div>
            </div>
          );
        }
        
        return (
          <>
            {/* Dynamic Forecasting Visualization */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">🌊 Dynamic Forecasting</h3>
              <AnglePlot 
                targetJoint={config.targetJoint}
                targetAxis={config.targetAxis}
                analysisType="dynamic"
                realData={analysisState.results}
              />
            </div>

            {/* Model Summary Table */}
            <div className="mb-6">
              <ModelSummaryTable analysisResults={analysisState.results} />
            </div>

            {/* Dynamic Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">MSE</div>
                <div className="text-lg font-semibold text-green-600">
                  {analysisState.results.metrics.dynamic.mse.toFixed(6)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">MAE</div>
                <div className="text-lg font-semibold text-blue-600">
                  {analysisState.results.metrics.dynamic.mae.toFixed(6)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">U-Theil</div>
                <div className="text-lg font-semibold text-purple-600">
                  {analysisState.results.metrics.dynamic.uTheil.toFixed(6)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">Correlation</div>
                <div className="text-lg font-semibold text-green-600">
                  {analysisState.results.metrics.dynamic.correlation.toFixed(4)}
                </div>
              </div>
            </div>
          </>
        );
        
      case 'comparison':
        return (
          <div className="space-y-6">
            {/* Comparison Overview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">🔍 Model Comparison</h3>
              
              {/* Metrics Comparison Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Metric</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">📊 Static</th>
                      {analysisState.results.metrics.dynamic && (
                        <th className="border border-gray-300 px-4 py-2 text-center font-semibold">🌊 Dynamic</th>
                      )}
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">🏆 Best</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['mse', 'mae', 'uTheil', 'correlation'].map((metric, index) => {
                      const staticValue = analysisState.results.metrics.static[metric];
                      const dynamicValue = analysisState.results.metrics.dynamic?.[metric];
                      
                      // Determine best (lower is better for mse, mae, uTheil; higher is better for correlation)
                      const isStaticBetter = dynamicValue ? 
                        (metric === 'correlation' ? staticValue > dynamicValue : staticValue < dynamicValue) : 
                        true;
                      
                      return (
                        <tr key={metric} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-2 font-semibold">
                            {metric.toUpperCase()}
                          </td>
                          <td className={`border border-gray-300 px-4 py-2 text-center font-mono ${
                            isStaticBetter ? 'bg-green-100 font-bold' : ''
                          }`}>
                            {staticValue.toFixed(6)}
                          </td>
                          {dynamicValue && (
                            <td className={`border border-gray-300 px-4 py-2 text-center font-mono ${
                              !isStaticBetter ? 'bg-green-100 font-bold' : ''
                            }`}>
                              {dynamicValue.toFixed(6)}
                            </td>
                          )}
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {isStaticBetter ? '📊 Static' : '🌊 Dynamic'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Side by side visualization if both methods are available */}
            {analysisState.results.metrics.dynamic && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-semibold mb-3">📊 Static Forecasting</h4>
                  <AnglePlot 
                    targetJoint={config.targetJoint}
                    targetAxis={config.targetAxis}
                    analysisType="static"
                    realData={analysisState.results}
                    compact={true}
                  />
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-semibold mb-3">🌊 Dynamic Forecasting</h4>
                  <AnglePlot 
                    targetJoint={config.targetJoint}
                    targetAxis={config.targetAxis}
                    analysisType="dynamic"
                    realData={analysisState.results}
                    compact={true}
                  />
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            🧠 SARIMAX Motion Analysis
          </h1>
          <div className="text-sm text-gray-500">
            Your Real SARIMAX Implementation
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Configuration</h2>
            
            {/* File Upload Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">📁 BVH Files</h3>
              <div className="space-y-3">
                {/* Training File */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Training File</label>
                  <div className="relative">
                    <input
                      ref={trainFileRef}
                      type="file"
                      accept=".bvh"
                      onChange={handleTrainFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => trainFileRef.current?.click()}
                      className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors"
                    >
                      {files.trainParsed ? (
                        <div>
                          <div className="text-sm text-green-600">✅ {analysisData.trainData.fileName}</div>
                          <div className="text-xs text-gray-500">{analysisData.trainData.frameCount} frames</div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">Click to upload training file</div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Test File */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Test File</label>
                  <div className="relative">
                    <input
                      ref={testFileRef}
                      type="file"
                      accept=".bvh"
                      onChange={handleTestFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => testFileRef.current?.click()}
                      className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors"
                    >
                      {files.testParsed ? (
                        <div>
                          <div className="text-sm text-green-600">✅ {analysisData.testData.fileName}</div>
                          <div className="text-xs text-gray-500">{analysisData.testData.frameCount} frames</div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">Click to upload test file</div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Clear Files Button */}
                {(files.train || files.test) && (
                  <button
                    onClick={clearFiles}
                    className="w-full text-xs text-red-600 hover:text-red-800 transition-colors"
                  >
                    🗑️ Clear all files
                  </button>
                )}
              </div>
            </div>

            {/* Target Joint and Axis Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">🎯 Target Joint & Axis</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Joint</label>
                  <select 
                    value={config.targetJoint}
                    onChange={(e) => updateConfig({ targetJoint: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    {analysisData.availableJoints.map(joint => (
                      <option key={joint} value={joint}>{joint}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Axis</label>
                  <select 
                    value={config.targetAxis}
                    onChange={(e) => updateConfig({ targetAxis: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    {analysisData.availableAxes.map(axis => (
                      <option key={axis} value={axis}>{axis}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Model Parameters - Simplified */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">⚙️ SARIMAX Parameters</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Lags (Order) - Current: {config.modelParams.lags}
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10"
                    value={config.modelParams.lags}
                    onChange={(e) => updateModelParams({ lags: parseInt(e.target.value) })}
                    className="w-full" 
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Steps - Current: {config.modelParams.steps} {config.modelParams.steps === 0 ? '(Static)' : '(Hybrid)'}
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="10"
                    value={config.modelParams.steps}
                    onChange={(e) => updateModelParams({ steps: parseInt(e.target.value) })}
                    className="w-full" 
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {config.modelParams.steps === 0 ? 
                      'Static method (all real training data)' :
                      `Hybrid: 1 real → ${config.modelParams.steps} predicted`
                    }
                  </div>
                </div>
                
                {/* Enable Dynamic Forecasting Option */}
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    id="enableDynamic"
                    checked={config.modelParams.enableDynamic}
                    onChange={(e) => updateModelParams({ enableDynamic: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="enableDynamic" className="text-xs text-gray-600">
                    Enable Dynamic Forecasting
                  </label>
                </div>
              </div>
            </div>

            {/* Analysis Button */}
            <button 
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                canAnalyze 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {analysisState.isAnalyzing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </div>
              ) : (
                '🚀 Start SARIMAX Analysis'
              )}
            </button>

            {/* Status */}
            <div className="mt-4">
              {analysisState.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                  <div className="text-sm font-medium text-red-800">❌ Error</div>
                  <div className="text-xs text-red-600 mt-1">{analysisState.error}</div>
                </div>
              )}
              
              {analysisState.isAnalyzing ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">⏳ {analysisState.currentStep}</div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${analysisState.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">{Math.round(analysisState.progress)}% complete</div>
                </div>
              ) : files.trainParsed && files.testParsed ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800">✅ Ready for Analysis</div>
                  <div className="text-xs text-green-600">
                    Train: {analysisData.trainData.frameCount} frames, Test: {analysisData.testData.frameCount} frames
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Target: {config.targetJoint}_{config.targetAxis}, Lags: {config.modelParams.lags}, Steps: {config.modelParams.steps}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800">⚠️ Upload Required</div>
                  <div className="text-xs text-yellow-600">Please upload both training and test BVH files</div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Tabs Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button 
                  onClick={() => setActiveTab('static')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'static' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📊 Static Forecasting
                </button>
                <button 
                  onClick={() => setActiveTab('dynamic')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'dynamic' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🌊 Dynamic Forecasting
                </button>
                <button 
                  onClick={() => setActiveTab('comparison')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'comparison' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🔍 Comparison
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}

export default Dashboard; 