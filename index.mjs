import { promises as fs } from 'fs';
import { basename, join, resolve } from 'path';
import fg from 'fast-glob'; // Pattern matching
import chalk from 'chalk';

// For logging
const colors = { error: '#c42847', info: '#ffa552' };
// Plugin options
let verbose = false;
let outDir;

const logMessage = (pLevel, pMessage) => {
    const shouldLog = verbose || pLevel === 'error';

    if (shouldLog) {
        const levelFormatted = pLevel.charAt(0).toUpperCase() + pLevel.slice(1);
        const color = colors[pLevel] || '#ffa552';
        console.log(chalk.hex(color)(`[${levelFormatted}]`), `${pMessage}`);
    }
};

/**
 * Processes the resource directory and copies the files to the destination directory.
 * @param {Array} pResources - An array of resource paths to be processed.
 * @returns {Promise<void>}
 */
async function process(pResources) {
    const startStamp = Date.now();
    for (const resource of pResources) {
        const { src, dst } = resource;
        const destination = dst || outDir;

        // Check for patterns
        if (src.includes('*')) {
            await processPattern(src, destination);
        } else {
            // Check if it's a directory or file that was passed
            const stats = await fs.stat(src);
            if (stats.isDirectory()) {
                await copyDirectory(src, destination);
            } else {
                await copyFileToDirectory(src, destination);
            }
        }
    }
    const endStamp = Date.now();
    logMessage('info', `Process took ${(endStamp - startStamp) / 1000} seconds`);
}

/**
 * Processes files based on a pattern (glob support for file matching).
 * @param {string} pSourcePattern - The glob pattern for matching files.
 * @param {string} pDestination - The destination directory.
 * @returns {Promise<void>}
 */
async function processPattern(pSourcePattern, pDestination) {
    try {
        // Match both files and directories
        const entries = await fg(pSourcePattern);

        if (entries.length === 0) {
            logMessage('error', `No files or directories found for pattern: ${pSourcePattern}`);
        } else {
            for (const entry of entries) {
                const stats = await fs.stat(entry);

                if (stats.isDirectory()) {
                    // Recursively copy the directory
                    const destDir = join(pDestination, basename(entry));
                    await copyDirectory(entry, destDir);
                } else if (stats.isFile()) {
                    // Copy the file to the destination
                    await copyFileToDirectory(entry, pDestination);
                }
            }
        }
    } catch (pError) {
        logMessage('error', `Error processing pattern: ${pError.message}`);
    }
}

/**
 * Recursively copies directories.
 * @param {string} pSource - Source directory path.
 * @param {string} pDestination - Destination directory path.
 * @returns {Promise<void>}
 */
async function copyDirectory(pSource, pDestination) {
    await fs.mkdir(pDestination, { recursive: true });
    const entries = await fs.readdir(pSource, { withFileTypes: true });

    await Promise.all(entries.map(async (pEntry) => {
        const srcPath = join(pSource, pEntry.name);
        const dstPath = join(pDestination, pEntry.name);
        // Recursively copy directories
        if (pEntry.isDirectory()) {
            await copyDirectory(srcPath, dstPath);
        } else {
            await fs.copyFile(srcPath, dstPath);
        }
    }));
    logMessage('info', `Copied directory ${pSource} to ${pDestination}`);
}

/**
 * Copies a file or directory to a destination directory.
 * @param {string} pSource - The source file or directory path.
 * @param {string} pDestination - The destination directory.
 * @returns {Promise<void>}
 */
async function copyFileToDirectory(pSource, pDestination) {
    try {
        const srcPath = resolve(pSource);
        const dstDir = resolve(pDestination);

        await fs.mkdir(dstDir, { recursive: true });

        const stats = await fs.stat(srcPath);
        if (stats.isDirectory()) {
            const dstPath = join(dstDir, basename(srcPath));
            await copyDirectory(srcPath, dstPath);
        } else if (stats.isFile()) {
            const dstPath = join(dstDir, basename(srcPath));
            await fs.copyFile(srcPath, dstPath);
            logMessage('info', `Copied file ${pSource} to ${pDestination}`);
        }
    } catch (pError) {
        logMessage('error', `Error copying file/directory: ${pError.message}`);
    }
}

/**
 * Bun Copy Plugin for handling resource copying in Bun builds.
 * 
 * This plugin copies specified resources from the source directories to the output directory during the build process.
 * It supports glob patterns, allowing you to specify multiple file types and nested directories.
 *
 * @param {Object} pOptions - The options for the copy plugin.
 * @param {boolean} [pOptions.verbose=false] - Whether to enable verbose logging. Logs will provide additional information when enabled.
 * @param {Array<{ src: string, dst: string }>} pOptions.resources - An array of resource objects specifying what to copy.
 * @param {string} pOptions.resources[].src - The source path or glob pattern for files to copy. Supports glob patterns for matching multiple files.
 * @param {string} [pOptions.resources[].dst] - The destination directory to copy files to. If not provided, it defaults to the output directory of the build.
 * 
 * @returns {Object} The CopyBunPlugin object.
 * 
 * @example
 * // Import the CopyBunPlugin
 * import CopyBunPlugin from './index.mjs';
 * 
 * // Using Bun with the CopyBunPlugin to copy specific resources
 * await Bun.build({
 *   entrypoints: ['./index.mjs'],
 *   outdir: './dist',
 *   ...otherBunOptions,
 *   plugins: [
 *     CopyBunPlugin({
 *       verbose: true,
 *       resources: [
 *         {
 *           src: './folder/nested/*.{js,css}',  // Copy all .js and .css files
 *           dst: './dist/folder/nested'        // Destination folder
 *         },
 *       ]
 *     }),
 *   ],
 * });
 */
const CopyBunPlugin = (pOptions) => {
    verbose = pOptions.verbose;
    return {
        name: '@evitcastudio/copy-bun-plugin',
        async setup(pBuild) {
            outDir = pBuild.config.outdir;
            await process(pOptions.resources);
        }
    };
};

export default CopyBunPlugin;
