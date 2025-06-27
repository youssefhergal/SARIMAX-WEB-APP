import { For, Show } from 'solid-js';
import { useApp } from '../context/AppContext';
import FileUpload from './FileUpload';
import StatusIndicator from './StatusIndicator';

function Sidebar() {
  const {
    availableJoints,
    selectedTargetJoint,
    setSelectedTargetJoint,
    numLags,
    setNumLags,
    enableStatic,
    setEnableStatic,
    enableDynamic,
    setEnableDynamic,
    canAnalyze,
    isAnalyzing,
    exogJointsCount,
    startAnalysis,
    clearAll,
    trainFileStatus,
    testFileStatus,
    modelStatus
  } = useApp();

  const handleTargetJointChange = (e) => {
    setSelectedTargetJoint(e.target.value);
  };

  const handleNumLagsChange = (e) => {
    setNumLags(parseInt(e.target.value));
  };

  const handleStaticChange = (e) => {
    setEnableStatic(e.target.checked);
  };

  const handleDynamicChange = (e) => {
    setEnableDynamic(e.target.checked);
  };

  return (
    <aside class="sidebar">
      {/* Header */}
      <div class="p-6 border-b border-white/20">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-r from-gradient-start to-gradient-end rounded-lg flex items-center justify-center">
            <i class="fas fa-chart-line text-white text-lg"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold gradient-text">SARIMAX</h2>
            <p class="text-sm text-gray-600">Enhanced Dynamic Forecasting</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div class="p-6 space-y-8 overflow-y-auto">
        
        {/* File Upload Section */}
        <section class="space-y-4">
          <h3 class="flex items-center space-x-2 text-lg font-semibold text-gray-800">
            <i class="fas fa-upload text-gradient-start"></i>
            <span>Data Files</span>
          </h3>
          
          <div class="space-y-4">
            <FileUpload
              label="Training File"
              icon="fas fa-database"
              type="train"
              accept=".bvh"
            />
            
            <FileUpload
              label="Testing File"  
              icon="fas fa-vial"
              type="test"
              accept=".bvh"
            />
          </div>
        </section>

        {/* Model Configuration */}
        <section class="space-y-4">
          <h3 class="flex items-center space-x-2 text-lg font-semibold text-gray-800">
            <i class="fas fa-cogs text-gradient-start"></i>
            <span>Model Configuration</span>
          </h3>
          
          <div class="space-y-4">
            {/* Number of Lags */}
            {/*
            <div class="space-y-2">
              <label class="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <i class="fas fa-history text-gradient-start"></i>
                <span>Number of Lags</span>
              </label>
              <select 
                class="input-field"
                value={numLags()}
                onChange={handleNumLagsChange}
              >
                <option value={1}>1 Lag</option>
                <option value={2}>2 Lags</option>
                <option value={3}>3 Lags</option>
                <option value={4}>4 Lags</option>
                <option value={5}>5 Lags</option>
              </select>
            </div>
*/}
            {/* Target Joint */}
            <div class="space-y-2">
              <label class="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <i class="fas fa-crosshairs text-gradient-start"></i>
                <span>Target Joint</span>
              </label>
              <select 
                class="input-field"
                value={selectedTargetJoint()}
                onChange={handleTargetJointChange}
                disabled={availableJoints().length === 0}
              >
                <Show 
                  when={availableJoints().length > 0}
                  fallback={<option>Upload files to see joints</option>}
                >
                  <option value="">Select target joint</option>
                  <For each={availableJoints()}>
                    {(joint) => <option value={joint}>{joint}</option>}
                  </For>
                </Show>
              </select>
            </div>

            {/* Info Box */}
            <Show when={selectedTargetJoint()}>
              <div class="card p-4 bg-blue-50/80 border-blue-200">
                <div class="flex items-start space-x-2">
                  <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
                  <div class="text-sm text-blue-700">
                    <p class="font-medium">Configuration:</p>
                    <p>Target: <span class="font-mono">{selectedTargetJoint()}</span></p>
                    <p>Exogenous: {exogJointsCount()} joints</p>
                  </div>
                </div>
              </div>
            </Show>
          </div>
        </section>

        {/* Forecasting Options */}
        <section class="space-y-4">
          <h3 class="flex items-center space-x-2 text-lg font-semibold text-gray-800">
            <i class="fas fa-crystal-ball text-gradient-start"></i>
            <span>Forecasting Methods</span>
          </h3>
          
          <div class="space-y-3">
            <label class="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableStatic()}
                onChange={handleStaticChange}
                class="w-5 h-5 text-gradient-start rounded focus:ring-gradient-start"
              />
              <div class="flex-1">
                <div class="font-medium text-gray-800">Static Forecasting</div>
                <div class="text-sm text-gray-600">Traditional one-step-ahead predictions</div>
              </div>
            </label>
            
            <label class="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableDynamic()}
                onChange={handleDynamicChange}
                class="w-5 h-5 text-gradient-start rounded focus:ring-gradient-start"
              />
              <div class="flex-1">
                <div class="font-medium text-gray-800">Enhanced Dynamic</div>
                <div class="text-sm text-gray-600">70/30 weighting with adaptive windowing</div>
              </div>
            </label>
          </div>
        </section>

        {/* Action Buttons */}
        <section class="space-y-4">
          <button
            onClick={startAnalysis}
            disabled={!canAnalyze()}
            class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            classList={{
              'animate-pulse': isAnalyzing(),
            }}
          >
            <Show
              when={!isAnalyzing()}
              fallback={
                <>
                  <i class="fas fa-spinner fa-spin"></i>
                  <span>Analyzing...</span>
                </>
              }
            >
              <i class="fas fa-play"></i>
              <span>Start Analysis</span>
            </Show>
          </button>
          
          <button
            onClick={clearAll}
            class="w-full btn-secondary"
            disabled={isAnalyzing()}
          >
            <i class="fas fa-trash"></i>
            <span>Clear All</span>
          </button>
        </section>

        {/* Status Indicators */}
        <section class="space-y-4">
          <h3 class="flex items-center space-x-2 text-lg font-semibold text-gray-800">
            <i class="fas fa-signal text-gradient-start"></i>
            <span>Status</span>
          </h3>
          
          <div class="space-y-3">
            <StatusIndicator
              label="Training Data"
              status={trainFileStatus()}
              icon="fas fa-database"
            />
            <StatusIndicator
              label="Test Data"
              status={testFileStatus()}
              icon="fas fa-vial"
            />
            <StatusIndicator
              label="Model"
              status={modelStatus()}
              icon="fas fa-brain"
            />
          </div>
        </section>

      </div>
    </aside>
  );
}

export default Sidebar; 