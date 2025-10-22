import * as core from '@actions/core';
import {exec} from '@actions/exec';

/**
 * Common packages for research and data science workflows
 */
const RESEARCH_PACKAGES = [
  'numpy',
  'pandas',
  'scipy',
  'matplotlib',
  'jupyter',
  'jupyterlab',
  'scikit-learn',
  'seaborn'
];

/**
 * Installs common research tools and packages
 */
export async function installResearcherTools(): Promise<void> {
  core.info('Installing researcher tools and packages...');

  try {
    core.info(`Installing packages: ${RESEARCH_PACKAGES.join(', ')}`);
    await exec('python', [
      '-m',
      'pip',
      'install',
      '--upgrade',
      ...RESEARCH_PACKAGES
    ]);
    core.info('Successfully installed researcher tools');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.warning(
      `Failed to install some researcher tools: ${errorMessage}. Continuing...`
    );
  }
}

/**
 * Verifies that research tools are properly installed
 */
export async function verifyResearcherTools(): Promise<boolean> {
  core.info('Verifying researcher tools installation...');

  try {
    // Verify key packages can be imported
    const verifyScript = `
import sys
packages = ['numpy', 'pandas', 'scipy', 'matplotlib', 'jupyter']
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
    print("All researcher tools verified successfully")
    sys.exit(0)
`;

    await exec('python', ['-c', verifyScript]);
    return true;
  } catch (error) {
    core.warning('Some researcher tools could not be verified');
    return false;
  }
}
