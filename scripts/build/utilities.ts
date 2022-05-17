/*!
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { statSync } from 'fs';
import { join } from 'path';

import fg from 'fast-glob';
import chalk from 'chalk';

import { INIT_CWD, getWorkspacesFromPaths, packages } from '../utilities/workspace.js';
import { build, getBuildOptions, printFile } from './esbuild.config.js';
import type { Reporting } from './esbuild.config.js';

export const report: Reporting = {
    debug: (data: any, label?: string) => console.log(chalk`{dim [${label}]}`, data, '\n'),
    log: (message: string) => console.log(chalk`{dim [log]} ${message}`),
    warn: (message: string) => console.log(chalk`{yellow [warn]} ${message}`),
    error: (message: string) => console.log(chalk`{red [error]} ${message}`),
};

export const defaultOutdir = (): string => {
    const w = getWorkspacesFromPaths(INIT_CWD);
    if (w && packages.includes(w)) return w;
    else return '.';
};

// If the preview & dev flags are off, ensure storybook assets are removed before building
// If the test flag is off, ensure test assets are removed before building
export const filterBuildFiles = (files: string[], preview: boolean, test: boolean) =>
    files.filter(
        (f: string) =>
            !(
                (!preview && (f.endsWith('stories.ts') || f.split('/').includes('stories'))) ||
                (!test && (f.endsWith('test.ts') || f.split('/').includes('test')))
            )
    );

export const fetchFilesFromGlobs = (files: string[]): string[] =>
    fg.sync(files, {
        onlyFiles: true,
        ignore: ['**/node_modules/**', '**/*.d.ts', '**/*.svg.ts', '**/*.css.ts'],
        absolute: true,
    });

export const buildHandler = async (args: any) => {
    const files = filterBuildFiles(args.input, args.preview, args.test);
    args.input = files;

    if (args.debug) report.debug(args, 'options');
    if (args.verbose)
        report.log(chalk`Files for processing: ${files.map((f: string) => chalk`\n\t- {cyan ${printFile(f, INIT_CWD)}}`).join('')}\n`);

    if (args.build) {
        // Fetch the build options
        const buildOptions = getBuildOptions(args, report);

        if (args.debug) report.debug(buildOptions, 'buildOptions');

        // Build it!
        await build(buildOptions, args, report);
    }
};

// Check that the inputs are files or directories
export const coerceInputs = (paths: string[]) => {
    const files = paths.reduce((result: string[], file: string) => {
        const stat = statSync(file, {
            throwIfNoEntry: false,
        });

        if (stat && stat.isDirectory()) {
            result.push(join(file, '**/*.(ts|css|svg|xlf)'));
        } else if (stat && stat.isFile()) {
            result.push(file);
        } else {
            report.warn(`${printFile(file)} is not a valid file or directory.`);
        }

        return result;
    }, []);

    return fetchFilesFromGlobs(files);
};
