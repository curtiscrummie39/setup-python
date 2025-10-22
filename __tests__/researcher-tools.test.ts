import * as core from '@actions/core';
import * as exec from '@actions/exec';
import {
  installResearcherTools,
  verifyResearcherTools
} from '../src/researcher-tools';

jest.mock('@actions/core');
jest.mock('@actions/exec');

describe('Researcher Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('installResearcherTools', () => {
    it('should install research packages successfully', async () => {
      const execMock = jest.spyOn(exec, 'exec').mockResolvedValue(0);

      await installResearcherTools();

      expect(execMock).toHaveBeenCalledWith('python', [
        '-m',
        'pip',
        'install',
        '--upgrade',
        'numpy',
        'pandas',
        'scipy',
        'matplotlib',
        'jupyter',
        'jupyterlab',
        'scikit-learn',
        'seaborn'
      ]);
      expect(core.info).toHaveBeenCalledWith(
        'Installing researcher tools and packages...'
      );
      expect(core.info).toHaveBeenCalledWith(
        'Successfully installed researcher tools'
      );
    });

    it('should handle installation errors gracefully', async () => {
      const execMock = jest
        .spyOn(exec, 'exec')
        .mockRejectedValue(new Error('Installation failed'));

      await installResearcherTools();

      expect(execMock).toHaveBeenCalled();
      expect(core.warning).toHaveBeenCalledWith(
        expect.stringContaining('Failed to install some researcher tools')
      );
    });
  });

  describe('verifyResearcherTools', () => {
    it('should verify tools successfully', async () => {
      const execMock = jest.spyOn(exec, 'exec').mockResolvedValue(0);

      const result = await verifyResearcherTools();

      expect(result).toBe(true);
      expect(execMock).toHaveBeenCalledWith('python', [
        '-c',
        expect.stringContaining('import sys')
      ]);
    });

    it('should handle verification failures', async () => {
      const execMock = jest
        .spyOn(exec, 'exec')
        .mockRejectedValue(new Error('Verification failed'));

      const result = await verifyResearcherTools();

      expect(result).toBe(false);
      expect(core.warning).toHaveBeenCalledWith(
        'Some researcher tools could not be verified'
      );
    });
  });
});
