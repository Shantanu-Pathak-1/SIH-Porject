import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TelemetryChart({ dataHistory = [] }) {
  if (!dataHistory || dataHistory.length === 0) {
    return <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>No history data available</div>;
  }

  const labels = dataHistory.map(item => item.timestamp || 'day');
  const moistureData = dataHistory.map(item => item.soil_moisture_percent || 0);
  const rainfallData = dataHistory.map(item => item.rainfall_24h_mm || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Soil Moisture (%)',
        data: moistureData,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        fill: true,
        tension: 0.4,
        yAxisID: 'yMoisture',
      },
      {
        label: '24h Rainfall (mm)',
        data: rainfallData,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        fill: true,
        tension: 0.4,
        yAxisID: 'yRain',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { size: 10 }
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1'
      }
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 9 } },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      yMoisture: {
        type: 'linear',
        position: 'left',
        min: 0,
        max: 100,
        ticks: { color: '#38bdf8', font: { size: 9 } },
        grid: { color: 'rgba(255,255,255,0.05)' },
        title: { display: true, text: 'Moisture %', color: '#38bdf8', font: { size: 9 } }
      },
      yRain: {
        type: 'linear',
        position: 'right',
        min: 0,
        ticks: { color: '#818cf8', font: { size: 9 } },
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Rain (mm)', color: '#818cf8', font: { size: 9 } }
      }
    }
  };

  return (
    <div style={{ height: '180px', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
