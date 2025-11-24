import React from 'react';
import { Truck, Trash2, Recycle, User } from 'lucide-react';
import './TruckAnimation.css';

interface TruckAnimationProps {
  className?: string;
}

export default function TruckAnimation({ className = '' }: TruckAnimationProps) {
  return (
    <div className={`truck-animation-container ${className}`}>
      {/* Road/Path */}
      <div className="road-path"></div>
      
      {/* Animated Truck */}
      <div className="truck-container">
        <div className="truck">
          <div className="truck-body">
            <Truck className="truck-icon" />
          </div>
          <div className="truck-wheels">
            <div className="wheel wheel-1"></div>
            <div className="wheel wheel-2"></div>
            <div className="wheel wheel-3"></div>
          </div>
        </div>
        
        {/* Worker Character */}
        <div className="worker">
          <div className="worker-head">
            <div className="worker-face"></div>
          </div>
          <div className="worker-body">
            <div className="worker-torso"></div>
          </div>
          <div className="worker-arms">
            <div className="arm arm-left">
              <div className="hand hand-left"></div>
            </div>
            <div className="arm arm-right">
              <div className="hand hand-right"></div>
            </div>
          </div>
          <div className="worker-legs">
            <div className="leg leg-left">
              <div className="foot foot-left"></div>
            </div>
            <div className="leg leg-right">
              <div className="foot foot-right"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trash Bins */}
      <div className="trash-bins">
        <div className="trash-bin bin-1">
          <Trash2 className="bin-icon" />
        </div>
        <div className="trash-bin bin-2">
          <Recycle className="bin-icon" />
        </div>
        <div className="trash-bin bin-3">
          <Trash2 className="bin-icon" />
        </div>
      </div>
      
      {/* Floating Particles */}
      <div className="particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
      </div>
    </div>
  );
}
