// BVH Parser JavaScript - Adapted from your SARIMAX_API for browser use
// List of all available BVH angles from your implementation
export const ALL_BVH_ANGLES = [
  'LeftArm_Zrotation', 'LeftArm_Xrotation', 'LeftArm_Yrotation',
  'LeftForeArm_Zrotation', 'LeftForeArm_Xrotation', 'LeftForeArm_Yrotation',
  'RightArm_Zrotation', 'RightArm_Xrotation', 'RightArm_Yrotation',
  'RightForeArm_Zrotation', 'RightForeArm_Xrotation', 'RightForeArm_Yrotation',
  'Spine_Zrotation', 'Spine_Xrotation', 'Spine_Yrotation',
  'Spine1_Zrotation', 'Spine1_Xrotation', 'Spine1_Yrotation',
  'Spine2_Zrotation', 'Spine2_Xrotation', 'Spine2_Yrotation',
  'Spine3_Zrotation', 'Spine3_Xrotation', 'Spine3_Yrotation',
  'Hips_Zrotation', 'Hips_Xrotation', 'Hips_Yrotation'
];

// Parse BVH header to extract channel names (adapted from your bvhUtils.js)
function parseBVHHeader(bvhContent) {
  const lines = bvhContent.split('\n');
  const channels = [];
  
  let currentJoint = null;
  let inMotionSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === 'MOTION') {
      inMotionSection = true;
      break;
    }
    
    if (line.startsWith('ROOT ') || line.startsWith('JOINT ')) {
      const parts = line.split(/\s+/);
      currentJoint = parts[1];
    } else if (line.startsWith('CHANNELS ')) {
      const parts = line.split(/\s+/);
      const numChannels = parseInt(parts[1]);
      const channelTypes = parts.slice(2, 2 + numChannels);
      
      channelTypes.forEach(channelType => {
        channels.push(`${currentJoint}_${channelType}`);
      });
    }
  }
  
  return { channels };
}

// BVH data extraction function adapted from your implementation
export function extractDataFromBVH(bvhContent, targetJoint, exogJoints) {
  try {
    console.log(`📂 Processing BVH content...`);
    
    // Parse BVH header to get proper channel names (your logic)
    const headerInfo = parseBVHHeader(bvhContent);
    console.log(`✅ Parsed header: ${headerInfo.channels.length} channels found`);
    
    // Parse BVH frames
    const lines = bvhContent.split('\n').map(line => line.trim()).filter(line => line);
    let motionStartIndex = -1;
    let frameCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === 'MOTION') {
        motionStartIndex = i;
        frameCount = parseInt(lines[i + 1].split(' ')[1]);
        break;
      }
    }
    
    if (motionStartIndex === -1) {
      throw new Error('No MOTION section found in BVH file');
    }
    
    // Extract frame data
    const frameDataStart = motionStartIndex + 3; // Skip MOTION, Frames:, Frame Time:
    const frames = [];
    
    for (let i = frameDataStart; i < frameDataStart + frameCount && i < lines.length; i++) {
      const values = lines[i].split(/\s+/).map(parseFloat);
      if (values.length > 0 && !values.some(isNaN)) {
        frames.push(values);
      }
    }
    
    if (frames.length === 0) {
      throw new Error('No valid frames found in BVH file');
    }
    
    console.log(`📊 Found ${frames.length} frames`);
    console.log(`🎯 Looking for target joint: ${targetJoint}`);
    console.log(`🔗 Looking for exogenous joints: ${exogJoints.join(', ')}`);
    
    // Find target joint index (your logic)
    const targetIndex = headerInfo.channels.findIndex(ch => ch === targetJoint);
    if (targetIndex === -1) {
      console.log('❌ Available channels:', headerInfo.channels.slice(0, 20));
      throw new Error(`Target joint "${targetJoint}" not found`);
    }
    
    // Find exogenous joint indices (your logic)
    const exogIndices = exogJoints.map(joint => {
      const index = headerInfo.channels.findIndex(ch => ch === joint);
      if (index === -1) {
        console.warn(`⚠️ Exogenous joint "${joint}" not found, using zeros`);
        return -1;
      }
      return index;
    });
    
    console.log(`✅ Target "${targetJoint}" found at index: ${targetIndex}`);
    console.log(`✅ Exogenous joints indices:`, exogIndices);
    
    // Extract data (your logic)
    const endog = frames.map(frame => frame[targetIndex]);
    const exog = frames.map(frame => 
      exogIndices.map(idx => idx === -1 ? 0 : frame[idx])
    );
    
    // Verify data quality (your validation logic)
    const validEndog = endog.filter(val => !isNaN(val) && isFinite(val));
    const validExog = exog.filter(row => row.every(val => !isNaN(val) && isFinite(val)));
    
    if (validEndog.length !== frames.length || validExog.length !== frames.length) {
      console.warn(`⚠️ Some invalid data found. Valid endog: ${validEndog.length}/${frames.length}`);
    }
    
    console.log(`✅ Successfully extracted:
      📈 Endogenous values: ${endog.length} frames
      📊 Exogenous values: ${exog.length} frames x ${exog[0].length} variables
      📋 Sample endogenous values: [${endog.slice(0, 5).map(v => v.toFixed(3)).join(', ')}...]
      📋 Sample exogenous values: [${exog[0].map(v => v.toFixed(3)).join(', ')}]`);
    
    return { endog, exog };
    
  } catch (error) {
    console.error('❌ Error processing BVH content:', error.message);
    throw error;
  }
}

// Utility function to prepare SARIMAX data from parsed BVH data
export function prepareForSARIMAX(parsedData, targetAngle, exogAngles = null) {
  if (!exogAngles) {
    exogAngles = ALL_BVH_ANGLES.filter(angle => angle !== targetAngle);
  }

  try {
    // Robust validation
    if (!parsedData) {
      throw new Error('ParsedData is null or undefined');
    }
    
    if (!parsedData.channels || !Array.isArray(parsedData.channels)) {
      throw new Error(`Invalid channels data: ${typeof parsedData.channels}. Expected array.`);
    }
    
    if (!parsedData.motionData || !Array.isArray(parsedData.motionData)) {
      throw new Error(`Invalid motionData: ${typeof parsedData.motionData}. Expected array.`);
    }
    
    if (parsedData.motionData.length === 0) {
      throw new Error('Motion data is empty');
    }
    
    // Find target angle index
    const targetIndex = parsedData.channels.findIndex(ch => ch === targetAngle);
    if (targetIndex === -1) {
      throw new Error(`Target angle "${targetAngle}" not found in parsed data`);
    }
    
    // Find exogenous angles indices
    const exogIndices = exogAngles.map(angle => {
      const index = parsedData.channels.findIndex(ch => ch === angle);
      if (index === -1) {
        return -1;
      }
      return index;
    });
    
    // Validate motion data structure
    if (!parsedData.motionData[0] || !Array.isArray(parsedData.motionData[0])) {
      throw new Error('Invalid motion data structure - first frame is not an array');
    }
    
    const frameSize = parsedData.motionData[0].length;
    
    if (targetIndex >= frameSize) {
      throw new Error(`Target index ${targetIndex} is out of bounds for frame size ${frameSize}`);
    }
    
    // Extract endogenous data with validation
    const endog = parsedData.motionData.map((frame, frameIndex) => {
      if (!frame || !Array.isArray(frame)) {
        throw new Error(`Frame ${frameIndex} is not an array`);
      }
      if (frame.length <= targetIndex) {
        throw new Error(`Frame ${frameIndex} has insufficient data (${frame.length} < ${targetIndex + 1})`);
      }
      return frame[targetIndex] || 0;
    });
    
    // Extract exogenous data with validation
    const exog = parsedData.motionData.map((frame, frameIndex) => {
      if (!frame || !Array.isArray(frame)) {
        throw new Error(`Frame ${frameIndex} is not an array for exog data`);
      }
      return exogIndices.map(idx => {
        if (idx === -1) return 0;
        if (idx >= frame.length) {
          return 0;
        }
        return frame[idx] || 0;
      });
    });
    
    if (endog.length === 0) {
      throw new Error('No endogenous data extracted');
    }
    
    if (exog.length === 0) {
      throw new Error('No exogenous data extracted');
    }
    
    if (exog[0].length === 0) {
      throw new Error('No exogenous variables extracted');
    }
    
    return {
      endog,
      exog,
      targetAngle,
      exogAngles,
      frameCount: parsedData.frameCount
    };
    
  } catch (error) {
    console.error('Error preparing SARIMAX data:', error.message);
    throw error;
  }
}

export class BVHParser {
  constructor() {
    this.joints = [];
    this.motionData = [];
    this.frameCount = 0;
    this.frameTime = 0;
    this.channels = [];
    this.eulerAngles = {};
  }

  async parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const result = this.parseBVH(content);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  parseBVH(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    // Reset all data
    this.joints = [];
    this.channels = [];
    this.motionData = [];
    this.frameCount = 0;
    this.frameTime = 0;
    this.eulerAngles = {};
    
    let currentLine = 0;
    
    // Parse HIERARCHY section
    const hierarchyResult = this.parseHierarchy(lines, currentLine);
    currentLine = hierarchyResult.nextLine;
    
    // Parse MOTION section
    const motionResult = this.parseMotion(lines, currentLine);
    
    // Extract Euler angles
    this.eulerAngles = this.extractEulerAnglesFromMotion();
    
    return {
      joints: this.joints,
      channels: this.channels,
      frameCount: this.frameCount,
      frameTime: this.frameTime,
      motionData: this.motionData,
      eulerAngles: this.eulerAngles,
      availableJoints: this.getAvailableJoints()
    };
  }

  parseHierarchy(lines, startLine) {
    let currentLine = startLine;
    this.joints = [];
    
    let jointCount = 0;
    let inJointDefinition = false;
    let currentJoint = null;
    
    while (currentLine < lines.length && !lines[currentLine].startsWith('MOTION')) {
      const line = lines[currentLine];
      
      if (line.startsWith('HIERARCHY')) {
        // Found HIERARCHY section
      } else if (line.startsWith('ROOT') || line.startsWith('JOINT')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const jointName = parts[1];
          this.joints.push(jointName);
          currentJoint = jointName;
          jointCount++;
          inJointDefinition = true;
        }
      } else if (line.startsWith('CHANNELS')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const channelCount = parseInt(parts[1]);
          const channelTypes = parts.slice(2, 2 + channelCount);
          
          // Add channels to our list
          channelTypes.forEach(channelType => {
            const channelName = `${currentJoint}_${channelType}`;
            if (!this.channels.includes(channelName)) {
              this.channels.push(channelName);
            }
          });
        }
      } else if (line.startsWith('{')) {
        // Opening block
      } else if (line.startsWith('}')) {
        // Closing block
        inJointDefinition = false;
      } else if (line.startsWith('OFFSET')) {
        // Offset data
      }
      
      currentLine++;
    }
    
    if (this.joints.length === 0) {
      throw new Error('No joints found in HIERARCHY section');
    }
    
    if (this.channels.length === 0) {
      throw new Error('No channels found in HIERARCHY section');
    }
    
    return { nextLine: currentLine };
  }

  parseMotion(lines, startLine) {
    let currentLine = startLine;
    
    // Skip "MOTION" line
    if (lines[currentLine] && lines[currentLine].startsWith('MOTION')) {
      currentLine++;
    }
    
    // Parse frame count
    if (currentLine >= lines.length) {
      throw new Error('No frame count line found after MOTION');
    }
    
    const framesLine = lines[currentLine];
    
    if (!framesLine.startsWith('Frames:')) {
      throw new Error(`Expected "Frames:" but got: "${framesLine}"`);
    }
    
    this.frameCount = parseInt(framesLine.split(/\s+/)[1]);
    if (isNaN(this.frameCount) || this.frameCount <= 0) {
      throw new Error(`Invalid frame count: ${this.frameCount}`);
    }
    
    currentLine++;
    
    // Parse frame time
    if (currentLine >= lines.length) {
      throw new Error('No frame time line found');
    }
    
    const frameTimeLine = lines[currentLine];
    
    if (!frameTimeLine.startsWith('Frame Time:')) {
      throw new Error(`Expected "Frame Time:" but got: "${frameTimeLine}"`);
    }
    
    this.frameTime = parseFloat(frameTimeLine.split(/\s+/)[2]);
    if (isNaN(this.frameTime) || this.frameTime <= 0) {
      throw new Error(`Invalid frame time: ${this.frameTime}`);
    }
    
    currentLine++;
    
    // Parse motion data
    this.motionData = [];
    const motionStartLine = currentLine;
    
    let parsedFrames = 0;
    for (let i = currentLine; i < lines.length && parsedFrames < this.frameCount; i++) {
      const line = lines[i];
      
      if (!line || line.trim() === '') {
        continue;
      }
      
      // Split by whitespace and parse as floats
      const values = line.trim().split(/\s+/).map(val => {
        const parsed = parseFloat(val);
        if (isNaN(parsed)) {
          return 0;
        }
        return parsed;
      });
      
      if (values.length > 0) {
        this.motionData.push(values);
        parsedFrames++;
      }
    }
    
    if (this.motionData.length === 0) {
      throw new Error(`No motion data could be parsed. Expected ${this.frameCount} frames starting from line ${motionStartLine}`);
    }
    
    return { success: true };
  }

  extractEulerAnglesFromMotion() {
    const eulerAngles = {};
    
    // Extract angles for each channel using your channel names
    this.channels.forEach((channelName, index) => {
      if (index < this.motionData[0]?.length) {
        eulerAngles[channelName] = this.motionData.map(frame => frame[index] || 0);
      }
    });
    
    return eulerAngles;
  }

  getAvailableJoints() {
    // Extract unique joint names from available angles
    const jointNames = new Set();
    this.channels.forEach(channel => {
      const parts = channel.split('_');
      if (parts.length >= 2) {
        const jointName = parts.slice(0, -1).join('_');
        jointNames.add(jointName);
      }
    });
    return Array.from(jointNames);
  }

  getChannelData(jointName, axis) {
    const channelName = `${jointName}_${axis}`;
    
    if (this.eulerAngles && this.eulerAngles[channelName]) {
      return this.eulerAngles[channelName];
    }
    
    // Fallback to original method
    const channelIndex = this.channels.indexOf(channelName);
    if (channelIndex === -1) {
      throw new Error(`Channel ${channelName} not found`);
    }
    
    return this.motionData.map(frame => frame[channelIndex] || 0);
  }

  // Prepare data for SARIMAX using your logic
  prepareForSARIMAX(targetAngle, exogAngles = null) {
    if (!exogAngles) {
      exogAngles = ALL_BVH_ANGLES.filter(angle => angle !== targetAngle);
    }

    // Use your extractDataFromBVH logic adapted for browser
    const bvhContent = this.reconstructBVHContent(); // We'll create this
    return extractDataFromBVH(bvhContent, targetAngle, exogAngles);
  }

  // Helper to reconstruct BVH content structure for your extraction function
  reconstructBVHContent() {
    let content = 'HIERARCHY\n';
    
    // Add joints
    this.joints.forEach(joint => {
      content += `JOINT ${joint}\n`;
    });
    
    content += 'MOTION\n';
    content += `Frames: ${this.frameCount}\n`;
    content += `Frame Time: ${this.frameTime}\n`;
    
    // Add motion data
    this.motionData.forEach(frame => {
      content += frame.join(' ') + '\n';
    });
    
    return content;
  }

  getChannelNames() {
    return this.channels;
  }

  exportData() {
    return {
      joints: this.joints,
      channels: this.channels,
      frameCount: this.frameCount,
      frameTime: this.frameTime,
      motionData: this.motionData,
      eulerAngles: this.eulerAngles,
      availableJoints: this.getAvailableJoints()
    };
  }
} 