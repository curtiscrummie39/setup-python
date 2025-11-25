import * as core from '@actions/core';
import {exec} from '@actions/exec';

export type VisionControlLevel = 'basic' | 'advanced' | 'full' | '';

/**
 * Minimum number of device channels for EEG/brain wave processing
 */
export const MIN_DEVICE_CHANNELS = 32;

/**
 * Packages for vision and brain wave control configurations
 */
const VISION_PACKAGES: Record<Exclude<VisionControlLevel, ''>, string[]> = {
  basic: ['opencv-python', 'pillow'],
  advanced: ['opencv-python', 'pillow', 'tensorflow', 'torch'],
  full: [
    'opencv-python',
    'pillow',
    'tensorflow',
    'torch',
    'torchvision',
    'keras',
    'scikit-image',
    'mne',
    'pyeeg'
  ]
};

/**
 * Configures vision and brain wave control options
 */
export async function configureVisionControl(
  level: VisionControlLevel
): Promise<void> {
  if (!level) {
    core.info('Vision control configuration not requested');
    return;
  }

  core.info(`Configuring vision control at ${level} level...`);

  const packages = VISION_PACKAGES[level as Exclude<VisionControlLevel, ''>];
  if (!packages) {
    core.warning(
      `Invalid vision control level: ${level}. Supported levels are: basic, advanced, full`
    );
    return;
  }

  try {
    core.info(`Installing vision control packages: ${packages.join(', ')}`);
    await exec('python', ['-m', 'pip', 'install', '--upgrade', ...packages]);
    core.info('Successfully configured vision control');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.warning(
      `Failed to install some vision control packages: ${errorMessage}. Continuing...`
    );
  }
}

/**
 * Sets environment variables for vision and brain wave control
 */
export function setupVisionEnvironment(level: VisionControlLevel): void {
  if (!level) {
    return;
  }

  core.info('Setting up vision control environment variables...');

  // Set environment variables based on configuration level
  core.exportVariable('VISION_CONTROL_ENABLED', 'true');
  core.exportVariable('VISION_CONTROL_LEVEL', level);

  // Set OpenCV and deep learning framework optimizations
  if (level === 'advanced' || level === 'full') {
    core.exportVariable('OMP_NUM_THREADS', '4');
    core.exportVariable('MKL_NUM_THREADS', '4');
  }

  if (level === 'full') {
    core.exportVariable('TF_CPP_MIN_LOG_LEVEL', '2');
    core.exportVariable('PYTORCH_ENABLE_MPS_FALLBACK', '1');
    // Set device channel configuration for EEG/brain wave processing
    core.exportVariable('MNE_DEVICE_CHANNELS', String(MIN_DEVICE_CHANNELS));
    core.info(
      `Device configured with minimum ${MIN_DEVICE_CHANNELS} channels for EEG processing`
    );
  }

  core.info('Vision control environment configured');
}

/**
 * Verifies vision control configuration
 */
export async function verifyVisionControl(
  level: VisionControlLevel
): Promise<boolean> {
  if (!level) {
    return true;
  }

  core.info('Verifying vision control configuration...');

  const packages = VISION_PACKAGES[level as Exclude<VisionControlLevel, ''>];
  const importNames = packages.map(pkg => {
    // Convert package names to import names
    if (pkg === 'opencv-python') return 'cv2';
    if (pkg === 'pillow') return 'PIL';
    if (pkg === 'scikit-image') return 'skimage';
    return pkg;
  });

  try {
    const verifyScript = `
import sys
packages = ${JSON.stringify(importNames)}
failed = []
for pkg in packages:
    try:
        __import__(pkg)
    except ImportError:
        failed.append(pkg)
if failed:
    print(f"Failed to import: {', '.join(failed)}")
    sys.exit(1)
else:
    print("Vision control packages verified successfully")
    sys.exit(0)
`;

    await exec('python', ['-c', verifyScript]);
    return true;
  } catch (error) {
    core.warning('Some vision control packages could not be verified');
    return false;
  }
}
