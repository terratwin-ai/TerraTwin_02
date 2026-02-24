import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { BambooSimulation } from '@/lib/BambooSimulation';

export interface BambooSimulationRef {
  play: () => void;
  pause: () => void;
  setYear: (year: number) => void;
  loadTerrain: (terrainUrl: string) => void;
  getMetrics: () => {
    height: number;
    poleCount: number;
    carbon: number;
  };
  getSimulation: () => BambooSimulation | null;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  topView: () => void;
  sideView: () => void;
}

interface BambooSimulationComponentProps {
  width?: string | number;
  height?: string | number;
  initialYear?: number;
  autoPlay?: boolean;
  showControls?: boolean;
  className?: string;
  onMetricsChange?: (metrics: {
    height: number;
    poleCount: number;
    carbon: number;
  }) => void;
  onYearChange?: (year: number) => void;
}

const BambooSimulationComponent = forwardRef<BambooSimulationRef, BambooSimulationComponentProps>(
  function BambooSimulationComponent(props, ref) {
    const {
      width = '100%',
      height = '100%',
      initialYear = 2025,
      autoPlay = true,
      showControls = true,
      className = '',
      onMetricsChange,
      onYearChange,
    } = props;
    
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const [metrics, setMetrics] = useState({
      height: 0.5,
      poleCount: 5,
      carbon: 0.0,
    });
    const [currentYear, setCurrentYear] = useState(initialYear);
    const [isAnimating, setIsAnimating] = useState(autoPlay);
    const [currentTimeValue, setCurrentTimeValue] = useState(0);
    const [webglError, setWebglError] = useState<boolean>(false);
    
    const simulationRef = useRef<BambooSimulation | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
      if (!canvasContainerRef.current) return;

      try {
        simulationRef.current = new BambooSimulation(canvasContainerRef.current);
        
        const initialTimeValue = (initialYear - 2025);
        setCurrentTimeValue(initialTimeValue);
        
        updateSimulation(initialTimeValue / 10);
      } catch (error) {
        console.error('Failed to initialize bamboo simulation:', error);
        setWebglError(true);
      }

      const handleResize = () => {
        if (simulationRef.current) {
          simulationRef.current.handleResize();
        }
      };

      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (simulationRef.current) {
          simulationRef.current.cleanup();
        }
      };
    }, [initialYear]);

    const updateSimulation = (progress: number) => {
      if (!simulationRef.current) return;
      
      const updatedMetrics = simulationRef.current.update(progress);
      
      setMetrics(updatedMetrics);
      
      const exactYear = 2025 + (progress * 10);
      
      if (onMetricsChange) {
        onMetricsChange(updatedMetrics);
      }
      
      setCurrentYear(exactYear);
      
      if (onYearChange) {
        onYearChange(Math.floor(exactYear));
      }
    };

    const handleTimelineChange = (value: number) => {
      setCurrentTimeValue(value);
      updateSimulation(value / 10);
    };

    const toggleAnimation = () => {
      setIsAnimating(prev => !prev);
    };

    const loadTerrain = (terrainUrl: string) => {
      if (simulationRef.current) {
        simulationRef.current.loadTerrain(terrainUrl);
      }
    };

    useEffect(() => {
      if (isAnimating) {
        let time = currentTimeValue;
        let lastTimestamp = performance.now();
        
        const yearPerSecond = 1.0;
        
        const animate = (timestamp: number) => {
          const deltaTime = (timestamp - lastTimestamp) / 1000;
          lastTimestamp = timestamp;
          
          time += deltaTime * yearPerSecond;
          
          if (time >= 10) {
            time = time % 10;
          }
          
          setCurrentTimeValue(time);
          
          updateSimulation(time / 10);
          
          animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);
        
        return () => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
        };
      } else if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }, [isAnimating]);

    useImperativeHandle(ref, () => ({
      play: () => {
        setIsAnimating(true);
      },
      pause: () => setIsAnimating(false),
      setYear: (year: number) => {
        const timeValue = (year - 2025);
        setCurrentTimeValue(timeValue);
        updateSimulation(timeValue / 10);
      },
      loadTerrain,
      getMetrics: () => metrics,
      getSimulation: () => simulationRef.current,
      
      zoomIn: () => {
        if (simulationRef.current) {
          simulationRef.current.zoomIn();
        }
      },
      zoomOut: () => {
        if (simulationRef.current) {
          simulationRef.current.zoomOut();
        }
      },
      resetView: () => {
        if (simulationRef.current) {
          simulationRef.current.resetCameraPosition();
        }
      },
      topView: () => {
        if (simulationRef.current) {
          simulationRef.current.topView();
        }
      },
      sideView: () => {
        if (simulationRef.current) {
          simulationRef.current.sideView();
        }
      }
    }));
    
    useEffect(() => {
      if (autoPlay) {
        setIsAnimating(true);
        
        const keepAnimationRunning = setInterval(() => {
          if (!isAnimating) {
            setIsAnimating(true);
          }
        }, 500);
        
        return () => clearInterval(keepAnimationRunning);
      }
    }, [autoPlay, isAnimating]);

    if (webglError) {
      return (
        <div 
          className={`bamboo-simulation ${className}`} 
          style={{ 
            width, 
            height, 
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
            padding: '2rem'
          }}
        >
          <div className="text-center max-w-2xl">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold mb-3">3D Visualization Unavailable</h3>
            <p className="text-gray-600 mb-4">
              WebGL could not be initialized in your browser.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-4">
              <p className="font-semibold text-blue-900 mb-2">Quick Fix for Chrome/Edge:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Open a new tab and go to: <code className="bg-blue-100 px-1 rounded">chrome://flags</code></li>
                <li>Search for "WebGL" and enable both WebGL flags</li>
                <li>Or try: <code className="bg-blue-100 px-1 rounded">chrome://settings</code> → System → Turn off "Use hardware acceleration"</li>
                <li>Restart your browser and reload this page</li>
              </ol>
            </div>
            <p className="text-sm text-gray-500">
              The simulation shows bamboo growth from 2025-2035 with carbon sequestration metrics.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div 
        className={`bamboo-simulation ${className}`} 
        style={{ 
          width, 
          height, 
          position: 'relative',
          overflow: 'hidden'
        }}
        data-testid="bamboo-simulation"
      >
        <div 
          id="simulation-canvas-container" 
          ref={canvasContainerRef} 
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute'
          }}
        />
        
        {showControls && (
          <div className="absolute bottom-4 left-4 z-10 bg-white bg-opacity-80 p-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAnimation}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                data-testid="button-toggle-animation"
              >
                {isAnimating ? 'Pause' : 'Play'}
              </button>
              <span className="text-sm font-medium">Year: {Math.floor(currentYear)}</span>
              <span className="text-xs text-gray-500">(2025-2035 simulation)</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default BambooSimulationComponent;
