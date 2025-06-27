import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

const AnglePlot = ({ targetJoint, targetAxis, analysisType = 'static', realData = null }) => {
  // Générer des données synthétiques ou utiliser les vraies données
  const chartData = useMemo(() => {
    // Si nous avons des vraies données, les utiliser
    if (realData && realData.frames && realData.original && realData.predicted) {
      return {
        frames: realData.frames,
        originalData: realData.original,
        predictedData: realData.predicted,
        upperBound: realData.confidence_upper || realData.predicted.map(val => val + 5),
        lowerBound: realData.confidence_lower || realData.predicted.map(val => val - 5)
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
  }, [targetJoint, targetAxis, realData]);

  // Configuration du graphique ECharts
  const chartOptions = useMemo(() => ({
    title: {
      text: `${analysisType === 'static' ? 'Static' : 'Dynamic'} Forecasting`,
      subtext: `${targetJoint}_${targetAxis} Angle Analysis ${realData ? '(Real Data)' : '(Synthetic Data)'}`,
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
        let tooltipContent = `<strong>Frame ${params[0].axisValue}</strong><br/>`;
        params.forEach(param => {
          if (param.seriesName !== 'Confidence Interval') {
            tooltipContent += `${param.marker} ${param.seriesName}: ${param.value}°<br/>`;
          }
        });
        return tooltipContent;
      }
    },
    legend: {
      data: ['Original Data', 'Predicted Data', 'Confidence Interval'],
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
      {
        name: 'Confidence Interval',
        type: 'line',
        data: chartData.upperBound,
        lineStyle: {
          opacity: 0
        },
        stack: 'confidence-band',
        symbol: 'none'
      },
      {
        name: 'Confidence Interval',
        type: 'line',
        data: chartData.lowerBound,
        lineStyle: {
          opacity: 0
        },
        areaStyle: {
          color: 'rgba(239, 68, 68, 0.1)'
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
        {realData && <span className="text-green-600 font-semibold"> • Using real SARIMAX predictions</span>}
      </div>
    </div>
  );
};

export default AnglePlot; 