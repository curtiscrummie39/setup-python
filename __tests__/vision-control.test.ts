import * as core from '@actions/core';
import * as exec from '@actions/exec';
import {
  configureVisionControl,
  setupVisionEnvironment,
  verifyVisionControl,
  MIN_DEVICE_CHANNELS
} from '../src/vision-control';

jest.mock('@actions/core');
jest.mock('@actions/exec');

describe('Vision Control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MIN_DEVICE_CHANNELS', () => {
    it('should be at least 32 channels', () => {
      expect(MIN_DEVICE_CHANNELS).toBeGreaterThanOrEqual(32);
    });
  });

  describe('configureVisionControl', () => {
    it('should install basic packages', async () => {
      const execMock = jest.spyOn(exec, 'exec').mockResolvedValue(0);

      await configureVisionControl('basic');

      expect(execMock).toHaveBeenCalledWith('python', [
        '-m',
        'pip',
        'install',
        '--upgrade',
        'opencv-python',
        'pillow'
      ]);
      expect(core.info).toHaveBeenCalledWith(
        'Configuring vision control at basic level...'
      );
    });

    it('should install advanced packages', async () => {
      const execMock = jest.spyOn(exec, 'exec').mockResolvedValue(0);

      await configureVisionControl('advanced');

      expect(execMock).toHaveBeenCalledWith('python', [
        '-m',
        'pip',
        'install',
        '--upgrade',
        'opencv-python',
        'pillow',
        'tensorflow',
        'torch'
      ]);
    });

    it('should install full packages', async () => {
      const execMock = jest.spyOn(exec, 'exec').mockResolvedValue(0);

      await configureVisionControl('full');

      expect(execMock).toHaveBeenCalledWith('python', [
        '-m',
        'pip',
        'install',
        '--upgrade',
        'opencv-python',
        'pillow',
        'tensorflow',
        'torch',
        'torchvision',
        'keras',
        'scikit-image',
        'mne',
        'pyeeg'
      ]);
    });

    it('should handle invalid level', async () => {
      const execMock = jest.spyOn(exec, 'exec');

      await configureVisionControl('invalid' as any);

      expect(execMock).not.toHaveBeenCalled();
      expect(core.warning).toHaveBeenCalledWith(
        expect.stringContaining('Invalid vision control level')
      );
    });

    it('should handle installation errors', async () => {
      jest
        .spyOn(exec, 'exec')
        .mockRejectedValue(new Error('Installation failed'));

      await configureVisionControl('basic');

      expect(core.warning).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to install some vision control packages'
        )
      );
    });
  });

  describe('setupVisionEnvironment', () => {
    it('should set basic environment variables', () => {
      const exportVarMock = jest.spyOn(core, 'exportVariable');

      setupVisionEnvironment('basic');

      expect(exportVarMock).toHaveBeenCalledWith(
        'VISION_CONTROL_ENABLED',
        'true'
      );
      expect(exportVarMock).toHaveBeenCalledWith(
        'VISION_CONTROL_LEVEL',
        'basic'
      );
    });

    it('should set advanced environment variables', () => {
      const exportVarMock = jest.spyOn(core, 'exportVariable');

      setupVisionEnvironment('advanced');

      expect(exportVarMock).toHaveBeenCalledWith(
        'VISION_CONTROL_ENABLED',
        'true'
      );
      expect(exportVarMock).toHaveBeenCalledWith(
        'VISION_CONTROL_LEVEL',
        'advanced'
      );
      expect(exportVarMock).toHaveBeenCalledWith('OMP_NUM_THREADS', '4');
      expect(exportVarMock).toHaveBeenCalledWith('MKL_NUM_THREADS', '4');
    });

    it('should set full environment variables', () => {
      const exportVarMock = jest.spyOn(core, 'exportVariable');

      setupVisionEnvironment('full');

      expect(exportVarMock).toHaveBeenCalledWith(
        'VISION_CONTROL_ENABLED',
        'true'
      );
      expect(exportVarMock).toHaveBeenCalledWith(
        'VISION_CONTROL_LEVEL',
        'full'
      );
      expect(exportVarMock).toHaveBeenCalledWith('OMP_NUM_THREADS', '4');
      expect(exportVarMock).toHaveBeenCalledWith('MKL_NUM_THREADS', '4');
      expect(exportVarMock).toHaveBeenCalledWith('TF_CPP_MIN_LOG_LEVEL', '2');
      expect(exportVarMock).toHaveBeenCalledWith(
        'PYTORCH_ENABLE_MPS_FALLBACK',
        '1'
      );
      expect(exportVarMock).toHaveBeenCalledWith(
        'MNE_DEVICE_CHANNELS',
        String(MIN_DEVICE_CHANNELS)
      );
    });
  });

  describe('verifyVisionControl', () => {
    it('should verify packages successfully', async () => {
      const execMock = jest.spyOn(exec, 'exec').mockResolvedValue(0);

      const result = await verifyVisionControl('basic');

      expect(result).toBe(true);
      expect(execMock).toHaveBeenCalledWith('python', [
        '-c',
        expect.stringContaining('import sys')
      ]);
    });

    it('should handle verification failures', async () => {
      jest
        .spyOn(exec, 'exec')
        .mockRejectedValue(new Error('Verification failed'));

      const result = await verifyVisionControl('basic');

      expect(result).toBe(false);
      expect(core.warning).toHaveBeenCalledWith(
        'Some vision control packages could not be verified'
      );
    });
  });
});
