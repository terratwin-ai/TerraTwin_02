import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';

// This component won't be used immediately in our 2-day demo
// But it's prepared for future integration of the 3D bamboo model

interface BambooModel3DProps {
  viewer: Cesium.Viewer;
  position: {
    longitude: number;
    latitude: number;
    height?: number;
  };
  scale?: number;
  growthStage?: 'seedling' | 'young' | 'mature';
}

const BambooModel3D: React.FC<BambooModel3DProps> = ({
  viewer,
  position,
  scale = 1.0,
  growthStage = 'mature'
}) => {
  const entityRef = useRef<Cesium.Entity | null>(null);

  useEffect(() => {
    // Adjust scale based on growth stage
    let adjustedScale = scale;
    if (growthStage === 'seedling') {
      adjustedScale = scale * 0.3;
    } else if (growthStage === 'young') {
      adjustedScale = scale * 0.7;
    }

    // Height offset to place model on the ground
    const height = position.height || 0;
    
    // Clean up any existing entity
    if (entityRef.current) {
      viewer.entities.remove(entityRef.current);
    }
    
    try {
      // Create a model entity for the 3D bamboo
      // When we have the glTF file properly available in public/models/bamboo/
      // we can use it instead of a placeholder billboard
      
      // Model loading approach - future implementation
      /*
      entityRef.current = viewer.entities.add({
        name: `Bamboo (${growthStage})`,
        position: Cesium.Cartesian3.fromDegrees(
          position.longitude,
          position.latitude,
          height
        ),
        model: {
          uri: '/models/bamboo/scene.gltf',
          scale: adjustedScale,
          minimumPixelSize: 64,
          maximumScale: 20000,
          runAnimations: true,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
        }
      });
      */
      
      // For the 2-day demo, we'll use a simpler approach with billboards
      entityRef.current = viewer.entities.add({
        name: `Bamboo (${growthStage})`,
        position: Cesium.Cartesian3.fromDegrees(
          position.longitude,
          position.latitude,
          height
        ),
        billboard: {
          image: '/images/bamboo-icon.svg',
          scale: adjustedScale,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        description: `Bamboo plant (${growthStage} stage)`
      });
      
      // Optional: zoom to the entity
      // viewer.zoomTo(entityRef.current);
      
    } catch (error) {
      console.error('Error creating bamboo 3D model:', error);
    }
    
    return () => {
      // Clean up when component unmounts
      if (entityRef.current) {
        viewer.entities.remove(entityRef.current);
        entityRef.current = null;
      }
    };
  }, [viewer, position, scale, growthStage]);
  
  return null; // This component doesn't render anything directly
};

export default BambooModel3D;