import React, { createContext, useContext, useState } from 'react';
import { BVHParser, ALL_BVH_ANGLES } from '../services/bvhParser';
import { SARIMAXAnalyzer } from '../services/sarimaxModel';

const AppContext = createContext();

export function AppProvider({ children }) {
  // State with synthetic data
  const [ui, setUI] = useState({
    currentView: 'dashboard',
    activeTab: 'static',
    sidebarExpanded: true,
    showProgressModal: false
  });
  
  const [analysisState, setAnalysisState] = useState({
    isAnalyzing: false,
    progress: 0,
    currentStep: '',
    error: null,
    results: null
  });

  const [files, setFiles] = useState({
    train: null,
    test: null,
    trainParsed: null,
    testParsed: null
  });

  const [config, setConfig] = useState({
    targetJoint: 'Hips',
    targetAxis: 'Yrotation',
    modelParams: {
      lags: 2,  // Start with order 2 like in your main.js
      steps: 1  // Default to static forecasting (steps=1)
    }
  });

  const [analysisData, setAnalysisData] = useState({
    // Only the main 9 joints you want (from your list)
    availableJoints: [
      'LeftArm', 'LeftForeArm', 
      'RightArm', 'RightForeArm',
      'Spine', 'Spine1', 'Spine2', 'Spine3',
      'Hips'
    ],
    // 3 axes (X, Y, Z rotations) - Format to match BVH parser output
    availableAxes: ['Xrotation', 'Yrotation', 'Zrotation'],
    trainData: { frameCount: 0, fileName: null },
    testData: { frameCount: 0, fileName: null }
  });

  // Actions
  const actions = {
    setCurrentView: (view) => {
      setUI(prev => ({ ...prev, currentView: view }));
    },

    setActiveTab: (tab) => {
      setUI(prev => ({ ...prev, activeTab: tab }));
    },

    toggleSidebar: () => {
      setUI(prev => ({ ...prev, sidebarExpanded: !prev.sidebarExpanded }));
    },

    updateConfig: (newConfig) => {
      setConfig(prev => ({ ...prev, ...newConfig }));
    },

    updateModelParams: (newParams) => {
      setConfig(prev => ({ 
        ...prev, 
        modelParams: { ...prev.modelParams, ...newParams }
      }));
    },

    uploadTrainFile: async (file) => {
      if (file && file.name.endsWith('.bvh')) {
        try {
          setAnalysisState(prev => ({
            ...prev,
            isAnalyzing: true,
            progress: 20,
            currentStep: 'Parsing training file...'
          }));

          const parser = new BVHParser();
          const parsedData = await parser.parseFile(file);
          
          setFiles(prev => ({ ...prev, train: file, trainParsed: parsedData }));
          setAnalysisData(prev => ({
            ...prev,
            trainData: { 
              frameCount: parsedData.frameCount,
              fileName: file.name 
            }
          }));

          setAnalysisState(prev => ({
            ...prev,
            isAnalyzing: false,
            progress: 0,
            currentStep: 'Training file parsed successfully'
          }));
          
          return { success: true, message: `Training file ${file.name} parsed successfully` };
        } catch (error) {
          console.error('❌ Training file parsing error:', error);
          setAnalysisState(prev => ({
            ...prev,
            isAnalyzing: false,
            progress: 0,
            error: error.message
          }));
          return { success: false, message: `Failed to parse training file: ${error.message}` };
        }
      }
      return { success: false, message: 'Please select a valid .bvh file' };
    },

    uploadTestFile: async (file) => {
      if (file && file.name.endsWith('.bvh')) {
        try {
          setAnalysisState(prev => ({
            ...prev,
            isAnalyzing: true,
            progress: 20,
            currentStep: 'Parsing test file...'
          }));

          const parser = new BVHParser();
          const parsedData = await parser.parseFile(file);
          
          setFiles(prev => ({ ...prev, test: file, testParsed: parsedData }));
          setAnalysisData(prev => ({
            ...prev,
            testData: { 
              frameCount: parsedData.frameCount,
              fileName: file.name 
            }
          }));

          setAnalysisState(prev => ({
            ...prev,
            isAnalyzing: false,
            progress: 0,
            currentStep: 'Test file parsed successfully'
          }));
          
          return { success: true, message: `Test file ${file.name} parsed successfully` };
        } catch (error) {
          console.error('❌ Test file parsing error:', error);
          setAnalysisState(prev => ({
            ...prev,
            isAnalyzing: false,
            progress: 0,
            error: error.message
          }));
          return { success: false, message: `Failed to parse test file: ${error.message}` };
        }
      }
      return { success: false, message: 'Please select a valid .bvh file' };
    },

    clearFiles: () => {
      setFiles({ train: null, test: null, trainParsed: null, testParsed: null });
      setAnalysisData(prev => ({
        ...prev,
        trainData: { frameCount: 0, fileName: null },
        testData: { frameCount: 0, fileName: null }
      }));
      setAnalysisState(prev => ({
        ...prev,
        results: null,
        error: null
      }));
    },

    // SARIMAX analysis with your model
    analyzeData: async () => {
      if (!files.trainParsed || !files.testParsed) {
        return { success: false, message: 'Please upload and parse both training and test files first' };
      }

      try {
        const analyzer = new SARIMAXAnalyzer();
        analyzer.setData(files.trainParsed, files.testParsed);

        const progressCallback = (progress, step) => {
          setAnalysisState(prev => ({
            ...prev,
            progress,
            currentStep: step
          }));
        };

        setAnalysisState(prev => ({
          ...prev,
          isAnalyzing: true,
          progress: 0,
          currentStep: 'Starting SARIMAX analysis...',
          error: null
        }));

        const analysisConfig = {
          targetJoint: config.targetJoint,
          targetAxis: config.targetAxis,
          lags: config.modelParams.lags,
          steps: config.modelParams.steps
        };

        const result = await analyzer.analyze(analysisConfig, progressCallback);
        
        if (result.success) {
          setAnalysisState(prev => ({
            ...prev,
            isAnalyzing: false,
            progress: 100,
            currentStep: 'Analysis complete!',
            results: result.results
          }));
          
          return { success: true, message: 'Analysis completed successfully!' };
        } else {
          setAnalysisState(prev => ({
            ...prev,
            isAnalyzing: false,
            progress: 0,
            error: result.error
          }));
          return { success: false, message: result.error };
        }
      } catch (error) {
        console.error('❌ Analysis exception:', error);
        setAnalysisState(prev => ({
          ...prev,
          isAnalyzing: false,
          progress: 0,
          error: error.message
        }));
        return { success: false, message: `Analysis failed: ${error.message}` };
      }
    }
  };

  const contextValue = {
    ui,
    analysisState,
    files,
    config,
    analysisData,
    ...actions
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}; 