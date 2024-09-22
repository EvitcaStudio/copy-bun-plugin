# @evitcastudio/copy-bun-plugin

A simple Bun plugin to copy files from your source directories to the output (dist) folder, making sure your bundled code has access to all the necessary static assets.

# Features

- File and Directory Copying: copies files and directories from your source folder to the destination folder.
- Pattern Matching: Supports glob patterns to match files by extension.
- Verbose Logging: Get detailed log output for each action with a verbose mode.
- Directory Recursion: Recursively copies entire directories to the destination folder.

# Installation

To install the plugin, use npm or any package manager of your choice:

```bash
npm install @evitcastudio/copy-bun-plugin
```
Usage
Add the plugin to your Bun configuration to copy specific files and directories during the build process. Below is an example configuration:

```js
import CopyBunPlugin from '@evitcastudio/copy-bun-plugin';
```
```js
await Bun.build({
  entrypoints: ['./index.mjs'],
  // The plugin will use this as the default dst directory if one is not specified
  outdir: './dist',
  plugins: [
    CopyBunPlugin({
      verbose: true,
      resources: [
        {
          src: './test-folder/test-nested/*.{js,css,txt,json,png,html}', // Specify glob patterns!
          dst: './dist/'
        },
        // Uncomment to copy entire directories
        // {
        //   src: './test-folder/test-nested',
        //   dst: './dist/',
        // },
      ],
    }),
  ],
});
```

# Plugin Options
 - verbose: (Boolean) Enable detailed logging for better debugging. Defaults to false.
 - resources: (Array) An array of resources to copy. Each resource has:
 - src: (String) The source path or glob pattern for matching files.
 - dst: (String) The destination directory. Defaults to the Bun outdir if not specified.

# Example Resource Config
```json

{
  "src": "./assets/*.{js,css}",
  "dst": "./dist/assets"
}
```
# API

- CopyBunPlugin(options)
- options:
- verbose: Enable verbose logging (true/false).
- resources: Array of resource objects, each defining:
- src: Source directory or file pattern (supports glob).
- dst: Destination directory (optional).

# Logging

- Info Logs: Displayed when files or directories are successfully copied (if verbose is enabled).
- Error Logs: Displayed if any error occurs during the file copying process, regardless of verbosity.

# License

MIT License