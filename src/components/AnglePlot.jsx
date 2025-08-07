import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

/**
 * Enhanced AnglePlot Component with Confidence Intervals
 * 
 * Features:
 * - Displays original vs predicted angle data
 * - Shows confidence intervals as shaded areas
 * - Enhanced hover tooltips with:
 *   * Original angle value
 *   * Predicted angle value  
 *   * Prediction error
 *   * Dynamic confidence interval bounds
 *   * Interval width
 * - Dynamic confidence level display (80%, 90%, 95%, 99%)
 * - Interactive zoom and pan controls
 */
const AnglePlot = ({ targetJoint, targetAxis, analysisType = 'static', realData = null, retrainedData = null }) => {
  // Générer des données synthétiques ou utiliser les vraies données
  const chartData = useMemo(() => {
    // Si nous avons des vraies données, les utiliser
    if (realData && realData.frames && realData.original && realData.predicted) {
      // Determine lag/order value
      const lag = realData.lags || realData.order || 0;
      // Slice arrays to align with predictions
      const alignedFrames = realData.frames.slice(lag);
      const alignedOriginal = realData.original.slice(lag);
      let alignedPredicted = realData.predicted;
      
      // Fix time shift by aligning predictions with original data
      // The model predicts future values, so we need to shift predictions back
      // Time shift pattern: lags + 2 (2 lags = 4 shift, 3 lags = 5 shift, etc.)
      const timeShift = lag + 2;
      console.log(`🔧 Fixing time shift: lags=${lag}, shifting predictions back by ${timeShift} frames`);
      console.log(`🔧 Debug: lag=${lag}, timeShift=${timeShift}, predicted length before shift=${alignedPredicted.length}`);
      
      if (alignedPredicted.length > timeShift) {
        // Shift predictions back by removing first few values
        alignedPredicted = alignedPredicted.slice(timeShift);
        console.log(`🔧 Debug: After shift, predicted length=${alignedPredicted.length}`);
      } else {
        console.log(`🔧 Warning: Cannot shift by ${timeShift}, predicted length=${alignedPredicted.length}`);
      }
      
      // Fix data length mismatch by trimming predicted to match original
      if (alignedPredicted.length > alignedOriginal.length) {
        const extraLength = alignedPredicted.length - alignedOriginal.length;
        console.log(`🔧 Fixing data length mismatch: trimming ${extraLength} extra values from predictions`);
        alignedPredicted = alignedPredicted.slice(0, alignedOriginal.length);
      } else if (alignedPredicted.length < alignedOriginal.length) {
        const missingLength = alignedOriginal.length - alignedPredicted.length;
        console.log(`🔧 Fixing data length mismatch: adding ${missingLength} zeros to predictions`);
        // Add zeros to match original length
        for (let i = 0; i < missingLength; i++) {
          alignedPredicted.push(0);
        }
      }
      
      // Handle confidence intervals with proper alignment
      let alignedUpper, alignedLower;
      
      if (realData.confidence_upper && realData.confidence_lower) {
        // Use real confidence intervals from the model
        console.log('📊 Using real confidence intervals from model');
        let upper = realData.confidence_upper;
        let lower = realData.confidence_lower;
        
        // Apply the same time shift to confidence intervals
        if (upper.length > timeShift) {
          upper = upper.slice(timeShift);
          lower = lower.slice(timeShift);
        }
        
        // Apply the same length trimming as predictions
        if (upper.length > alignedOriginal.length) {
          const extraLength = upper.length - alignedOriginal.length;
          upper = upper.slice(0, alignedOriginal.length);
          lower = lower.slice(0, alignedOriginal.length);
        }
        
        alignedUpper = upper;
        alignedLower = lower;
      } else {
        // Fallback: create simple confidence intervals
        console.log('📊 Using fallback confidence intervals (±5 degrees)');
        alignedUpper = alignedPredicted.map(val => val + 5);
        alignedLower = alignedPredicted.map(val => val - 5);
      }

      // Debug logging
      /*
      console.log('🔍 AnglePlot Debug - Real Data Structure:');
      console.log('Lag:', lag);
      console.log('Frames:', alignedFrames.slice(0, 10), '...');
      console.log('Original:', alignedOriginal.slice(0, 10), '...');
      console.log('Predicted:', alignedPredicted.slice(0, 10), '...');
      console.log('Data length:', alignedFrames.length);
      console.log('Frame range:', alignedFrames[0], 'to', alignedFrames[alignedFrames.length - 1]);
      
      // Show alignment check for ALL frames
      console.log('🔍 ALIGNMENT CHECK (ALL frames):');
      for (let i = 0; i < Math.min(alignedOriginal.length, alignedPredicted.length); i++) {
        console.log(`Frame ${alignedFrames[i]}: Original=${alignedOriginal[i].toFixed(2)}, Predicted=${alignedPredicted[i].toFixed(2)}`);
      }

      
      
      // Print frame counts
      console.log('📊 FRAME COUNTS:');
      console.log(`📈 Predicted frames: ${alignedPredicted.length}`);
      console.log(`📊 Original frames: ${alignedOriginal.length}`);
      console.log(`🎯 Frame indices: ${alignedFrames.length}`);
      console.log(`📊 Confidence intervals: ${alignedUpper.length} upper, ${alignedLower.length} lower`);


      */
      
      // Show confidence interval info
      if (realData.confidence_upper && realData.confidence_lower) {
        console.log(`📊 Confidence level: ${realData.confidence_level || 95}%`);
        console.log(`📊 ALL CONFIDENCE INTERVALS:`);
        for (let i = 0; i < alignedUpper.length; i++) {
          console.log(`  Frame ${alignedFrames[i]}: Prediction=${alignedPredicted[i].toFixed(2)}, Interval=[${alignedLower[i].toFixed(2)}, ${alignedUpper[i].toFixed(2)}], Width=${(alignedUpper[i] - alignedLower[i]).toFixed(2)}`);
        }
      } else {
        console.log(`📊 FALLBACK CONFIDENCE INTERVALS (±5 degrees):`);
        for (let i = 0; i < alignedUpper.length; i++) {
          console.log(`  Frame ${alignedFrames[i]}: Prediction=${alignedPredicted[i].toFixed(2)}, Interval=[${alignedLower[i].toFixed(2)}, ${alignedUpper[i].toFixed(2)}], Width=${(alignedUpper[i] - alignedLower[i]).toFixed(2)}`);
        }
      }
      
      // Check if data lengths are now aligned
      if (alignedFrames.length !== alignedOriginal.length || alignedFrames.length !== alignedPredicted.length) {
        console.warn('⚠️ Data length mismatch after fixing:', {
          frames: alignedFrames.length,
          original: alignedOriginal.length,
          predicted: alignedPredicted.length
        });
      } else {
        console.log('✅ Data lengths are now aligned!');
      }

      // Prepare retrained data if available
      let retrainedPredicted = null;
      if (retrainedData && retrainedData.predicted) {
        let alignedRetrained = retrainedData.predicted;
        
        // Apply the same time shift to retrained predictions
        if (alignedRetrained.length > timeShift) {
          alignedRetrained = alignedRetrained.slice(timeShift);
        }
        
        // Apply the same length trimming as original predictions
        if (alignedRetrained.length > alignedOriginal.length) {
          alignedRetrained = alignedRetrained.slice(0, alignedOriginal.length);
        } else if (alignedRetrained.length < alignedOriginal.length) {
          const missingLength = alignedOriginal.length - alignedRetrained.length;
          for (let i = 0; i < missingLength; i++) {
            alignedRetrained.push(0);
          }
        }
        
        retrainedPredicted = alignedRetrained;
        console.log('🔄 Retrained predictions prepared:', retrainedPredicted.length, 'frames');
      }

      return {
        frames: alignedFrames,
        originalData: alignedOriginal,
        predictedData: alignedPredicted,
        retrainedPredicted: retrainedPredicted,
        upperBound: alignedUpper,
        lowerBound: alignedLower
      };
    }
    
    // Sinon, utiliser des données synthétiques (pour le développement)
    const frames = Array.from({ length: 200 }, (_, i) => i + 1);
    
    // Données originales (simulées)
    const originalData = frames.map(frame => {
      const baseAngle = Math.sin(frame * 0.05) * 30;
      const noise = (Math.random() - 0.5) * 8;
      const trend = frame * 0.02;
      return Number((baseAngle + noise + trend).toFixed(2));
    });

    // Données prédites (simulées avec moins de bruit)
    const predictedData = frames.map(frame => {
      const baseAngle = Math.sin(frame * 0.05) * 30;
      const smoothNoise = (Math.random() - 0.5) * 4;
      const trend = frame * 0.02;
      return Number((baseAngle + smoothNoise + trend).toFixed(2));
    });

    // Données de confiance (intervalles)
    const upperBound = predictedData.map(val => val + 5);
    const lowerBound = predictedData.map(val => val - 5);

    return {
      frames,
      originalData,
      predictedData,
      upperBound,
      lowerBound
    };
  }, [targetJoint, targetAxis, realData, retrainedData]);

  // Configuration du graphique ECharts
  const chartOptions = useMemo(() => ({
    title: {
      text: `${analysisType === 'static' ? 'Static' : 'Dynamic'} Forecasting`,
      subtext: `${targetJoint}_${targetAxis} Angle Analysis ${realData ? '(Real Data)' : '(Synthetic Data)'}${retrainedData ? ' with Retrained Model' : ''}`,
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
        
        // Find the data points for this frame
        let originalValue = null;
        let predictedValue = null;
        let retrainedValue = null;
        let upperBound = null;
        let lowerBound = null;
        
        params.forEach(param => {
          if (param.seriesName === 'Original Data') {
            originalValue = param.value;
          } else if (param.seriesName === 'Predicted Data') {
            predictedValue = param.value;
          } else if (param.seriesName === 'Retrained Model') {
            retrainedValue = param.value;
          } else if (param.seriesName.includes('Confidence Interval')) {
            // We have two series with confidence interval in the name for upper and lower bounds
            if (upperBound === null) {
              upperBound = param.value;
            } else {
              lowerBound = param.value;
            }
          }
        });
        
        // Add original data
        if (originalValue !== null) {
          tooltipContent += `<span style="color: #3b82f6;">●</span> <strong>Original:</strong> ${originalValue.toFixed(2)}°<br/>`;
        }
        
        // Add predicted data
        if (predictedValue !== null) {
          tooltipContent += `<span style="color: #ef4444;">●</span> <strong>Predicted:</strong> ${predictedValue.toFixed(2)}°<br/>`;
        }
        
        // Add retrained data
        if (retrainedValue !== null) {
          tooltipContent += `<span style="color: #10b981;">●</span> <strong>Retrained:</strong> ${retrainedValue.toFixed(2)}°<br/>`;
        }
        
        // Add prediction error if both values are available
        if (originalValue !== null && predictedValue !== null) {
          const error = Math.abs(originalValue - predictedValue);
          tooltipContent += `<span style="color: #6b7280;"></span> <strong>Original Error:</strong> ${error.toFixed(2)}°<br/>`;
        }
        
        // Add retrained error if available
        if (originalValue !== null && retrainedValue !== null) {
          const retrainedError = Math.abs(originalValue - retrainedValue);
          tooltipContent += `<span style="color: #6b7280;"></span> <strong>Retrained Error:</strong> ${retrainedError.toFixed(2)}°<br/>`;
        }
        
        // Add confidence interval
        if (upperBound !== null && lowerBound !== null) {
          const confidenceLevel = realData?.confidence_level || 95;
          tooltipContent += `<span style="color: #ef4444; opacity: 0.6;"></span> <strong>${confidenceLevel}% Interval:</strong> [${lowerBound.toFixed(2)}°, ${upperBound.toFixed(2)}°]<br/>`;
          
          // Show interval width
          const intervalWidth = upperBound - lowerBound;
          tooltipContent += `<span style="color: #9333ea;"></span> <strong>Interval Width:</strong> ${intervalWidth.toFixed(2)}°`;
        }
        
        return tooltipContent;
      }
    },
    legend: {
      data: chartData.retrainedPredicted 
        ? ['Original Data', 'Predicted Data', 'Retrained Model', `${realData?.confidence_level || 95}% Confidence Interval`]
        : ['Original Data', 'Predicted Data', `${realData?.confidence_level || 95}% Confidence Interval`],
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
        saveAsImage: {
          title: 'Save as Image'
        },
        dataZoom: {
          title: {
            zoom: 'Zoom',
            back: 'Reset Zoom'
          }
        },
        restore: {
          title: 'Restore'
        }
      },
      right: 20,
      top: 20
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.frames,
      name: 'Frame',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        formatter: function(value, index) {
          return index % Math.max(1, Math.floor(chartData.frames.length / 10)) === 0 ? value : '';
        }
      }
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
      // Zoom horizontal (X-axis) - Inside
      {
        type: 'inside',
        start: 0,
        end: 100,
        orient: 'horizontal'
      },
      // Zoom horizontal (X-axis) - Slider
      {
        start: 0,
        end: 100,
        height: 20,
        bottom: 20,
        orient: 'horizontal'
      },
      // Zoom vertical (Y-axis) - Inside
      {
        type: 'inside',
        start: 0,
        end: 100,
        orient: 'vertical'
      },
      // Zoom vertical (Y-axis) - Slider
      {
        start: 0,
        end: 100,
        width: 20,
        right: 20,
        orient: 'vertical'
      }
    ],
    series: [
      {
        name: 'Original Data',
        type: 'line',
        data: chartData.originalData,
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
        name: 'Predicted Data',
        type: 'line',
        data: chartData.predictedData,
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
      // Add retrained model series if available
      ...(chartData.retrainedPredicted ? [{
        name: 'Retrained Model',
        type: 'line',
        data: chartData.retrainedPredicted,
        lineStyle: {
          color: '#10b981',
          width: 2
        },
        itemStyle: {
          color: '#10b981'
        },
        symbol: 'none',
        sampling: 'lttb'
      }] : []),
      {
        name: `${realData?.confidence_level || 95}% Confidence Interval`,
        type: 'line',
        data: chartData.upperBound,
        lineStyle: {
          opacity: 0
        },
        stack: 'confidence-band',
        symbol: 'none'
      },
      {
        name: `${realData?.confidence_level || 95}% Confidence Interval`,
        type: 'line',
        data: chartData.lowerBound,
        lineStyle: {
          opacity: 0
        },
        areaStyle: {
          color: 'rgba(34, 197, 94, 0.3)',
          opacity: 0.3
        },
        stack: 'confidence-band',
        symbol: 'none'
      }
    ]
  }), [chartData, targetJoint, targetAxis, analysisType, realData]);

  return (
    <div className="w-full">
      <ReactECharts
        option={chartOptions}
        style={{ height: '400px', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
      
      {/* Statistiques du graphique */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-sm text-blue-600">Data Points</div>
          <div className="text-lg font-semibold text-blue-800">{chartData.frames.length}</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-sm text-green-600">Max Angle</div>
          <div className="text-lg font-semibold text-green-800">
            {Math.max(...chartData.originalData).toFixed(1)}°
          </div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <div className="text-sm text-purple-600">Min Angle</div>
          <div className="text-lg font-semibold text-purple-800">
            {Math.min(...chartData.originalData).toFixed(1)}°
          </div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg text-center">
          <div className="text-sm text-orange-600">Range</div>
          <div className="text-lg font-semibold text-orange-800">
            {(Math.max(...chartData.originalData) - Math.min(...chartData.originalData)).toFixed(1)}°
          </div>
        </div>
      </div>
      
      {/* Instructions de navigation */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        💡 <strong>Navigation:</strong> Mouse wheel to zoom • Drag to pan • Use sliders to adjust range on both axes
        <br />
        🎯 <strong>Hover:</strong> Move mouse over chart to see detailed values, prediction error, and confidence intervals
        {realData && <span className="text-green-600 font-semibold"> • Using real SARIMAX predictions with {realData.confidence_level || 95}% confidence</span>}
      </div>
    </div>
  );
};

export default AnglePlot; 