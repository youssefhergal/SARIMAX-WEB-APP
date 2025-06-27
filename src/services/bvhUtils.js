// BVH Utilities - Adapted from SARIMAX_API/utils/bvhUtils.js
// Simplified for browser-based file processing

// Extract data from BVH content for SARIMAX usage
export function extractDataFromBVH(content, targetAngle, exogAngles) {
  const parser = new BVHParser();
  const bvhData = parser.parseBVH(content);
  
  return bvhData.prepareForSARIMAX(targetAngle, exogAngles);
}

// Extract Euler angles from BVH data
export function extractEulerAngles(bvhData) {
  return bvhData.eulerAngles || {};
}

// Basic BVH Parser class for utilities
class BVHParser {
  constructor() {
    this.joints = [];
    this.motionData = [];
    this.frameCount = 0;
    this.frameTime = 0;
    this.channels = [];
    this.eulerAngles = {};
  }

  parseBVH(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    let currentLine = 0;
    
    // Parse HIERARCHY section
    const hierarchyResult = this.parseHierarchy(lines, currentLine);
    currentLine = hierarchyResult.nextLine;
    
    // Parse MOTION section
    const motionResult = this.parseMotion(lines, currentLine);
    
    // Extract Euler angles
    this.eulerAngles = this.extractEulerAnglesFromMotion();
    
    return this;
  }

  parseHierarchy(lines, startLine) {
    let currentLine = startLine;
    this.joints = [];
    this.channels = [];
    
    while (currentLine < lines.length && !lines[currentLine].startsWith('MOTION')) {
      const line = lines[currentLine];
      
      if (line.startsWith('ROOT') || line.startsWith('JOINT')) {
        const jointName = line.split(' ')[1];
        this.joints.push(jointName);
      } else if (line.startsWith('CHANNELS')) {
        const parts = line.split(' ');
        const channelCount = parseInt(parts[1]);
        const channelNames = parts.slice(2, 2 + channelCount);
        
        const jointName = this.joints[this.joints.length - 1];
        channelNames.forEach(channel => {
          this.channels.push(`${jointName}_${channel}`);
        });
      }
      
      currentLine++;
    }
    
    return { nextLine: currentLine };
  }

  parseMotion(lines, startLine) {
    let currentLine = startLine;
    
    // Skip "MOTION" line
    currentLine++;
    
    // Parse frame count
    const framesLine = lines[currentLine];
    this.frameCount = parseInt(framesLine.split(' ')[1]);
    currentLine++;
    
    // Parse frame time
    const frameTimeLine = lines[currentLine];
    this.frameTime = parseFloat(frameTimeLine.split(' ')[2]);
    currentLine++;
    
    // Parse motion data
    this.motionData = [];
    for (let i = currentLine; i < lines.length && i < currentLine + this.frameCount; i++) {
      const values = lines[i].split(' ').map(parseFloat);
      this.motionData.push(values);
    }
    
    return { success: true };
  }

  extractEulerAnglesFromMotion() {
    const eulerAngles = {};
    
    // Extract angles for each channel
    this.channels.forEach((channelName, index) => {
      eulerAngles[channelName] = this.motionData.map(frame => frame[index] || 0);
    });
    
    return eulerAngles;
  }

  getChannelData(jointName, axis) {
    const channelName = `${jointName}_${axis}`;
    
    if (this.eulerAngles && this.eulerAngles[channelName]) {
      return this.eulerAngles[channelName];
    }
    
    const channelIndex = this.channels.indexOf(channelName);
    if (channelIndex === -1) {
      throw new Error(`Channel ${channelName} not found`);
    }
    
    return this.motionData.map(frame => frame[channelIndex] || 0);
  }

  prepareForSARIMAX(targetAngle, exogAngles) {
    // Extract target (endogenous) data
    const [targetJoint, targetAxis] = targetAngle.split('_');
    const endog = this.getChannelData(targetJoint, targetAxis);
    
    // Extract exogenous data
    const exog = [];
    for (let i = 0; i < this.frameCount; i++) {
      const exogFrame = [];
      exogAngles.forEach(angle => {
        try {
          const [joint, axis] = angle.split('_');
          const data = this.getChannelData(joint, axis);
          exogFrame.push(data[i] || 0);
        } catch (error) {
          exogFrame.push(0); // Default value if channel not found
        }
      });
      exog.push(exogFrame);
    }

    return {
      endog,
      exog,
      targetAngle,
      exogAngles,
      frameCount: this.frameCount
    };
  }
} 