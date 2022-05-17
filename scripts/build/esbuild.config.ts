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

import chalk from 'chalk';
import esbuild, { Plugin } from 'esbuild';
import { PROJECT_CWD } from 'scripts-utilities/workspace';

import type { BuildResult, BuildFailure, BuildOptions } from 'esbuild';
// import { esBuildPlugins } from './esbuild.plugins.js';
import { Options } from './build.js';

export const printFile = (filePath: string, from: string = PROJECT_CWD || '.') => filePath.replace(from, '');

export type Reporting = {
    debug: (data: any, label?: string, debug?: boolean) => void;
    log: (message: string, verbose?: boolean) => void;
    warn: (message: string, verbose?: boolean) => void;
    error: (message: string) => void;
};

export const defaultReporting: Reporting = {
    debug: console.log,
    log: console.log,
    warn: console.warn,
    error: console.error,
};

export function getBuildOptions(
    {
        input = ['**.*.ts'],
        outdir = '.',
        watch = false,
        build = true,
        dev = true,
        verbose = false,
        debug = false,
        quiet = true,
        map = true,
        bundle = false,
        ...config
    },
    report: Reporting = defaultReporting,
    plugins?: ((files?: string[], options?: Partial<Options>) => Plugin[]) | Plugin[]
): BuildOptions {
    const watchReporting = watch
        ? {
            onRebuild(error: BuildFailure | null, result: BuildResult | null) {
                [...(error ? error.message : []), ...(result ? result.errors : [])].forEach(message =>
                    report.error(chalk`{italic Note:} ${message}`)
                );
                if (verbose && result && result.warnings) {
                    result.warnings.forEach(message => {
                        if (verbose) report.warn(chalk`{italic Note:} ${message}`);
                    });
                }
            },
        }
        : false;

    let pluginObj = [];
    if (plugins instanceof Function) {
        pluginObj = plugins(input.length > 0 ? [...input] : [], {
            ...config,
            input,
            outdir,
            build,
            watch,
            dev,
            verbose,
            debug,
            quiet,
            map,
            bundle,
        });
    } else if (plugins instanceof Array) {
        pluginObj = plugins;
    } else {
        pluginObj = esBuildPlugins(input.length > 0 ? [...input] : [], {
            ...config,
            input,
            outdir,
            build,
            watch,
            dev,
            verbose,
            debug,
            quiet,
            map,
            bundle,
        });
    }

    if (debug) report.debug(pluginObj, 'pluginObj', debug);

    return {
        entryPoints: input.length > 0 ? [...input] : [],
        bundle: bundle,
        outdir: outdir,
        sourcemap: map,
        resolveExtensions: ['.ts', '.js', '.css', '.json', '.svg', '.xlf'],
        // outExtension: {
        //     '.js': extension || '.js',
        //     '.css': '.css.js',
        //     // '.svg': '.svg.js',
        // },
        platform: 'browser',
        minify: !dev,
        write: build || true,
        allowOverwrite: true,
        watch: watchReporting,
        target: ['esnext'],
        tsconfig: 'tsconfig.json',
        banner: {
            js: '// DO NOT EDIT; this file brought to you by esbuild',
            css: '/* DO NOT EDIT; this file brought to you by esbuild */',
            // svg: '<!-- DO NOT EDIT; this file brought to you by esbuild -->',
        },
        plugins: pluginObj,
        logLevel: debug ? 'debug' : quiet ? 'error' : 'info',
        color: true,
    };
}

// Returns the error code
export async function build(
    buildOptions?: BuildOptions,
    options?: Partial<Options>,
    report: Reporting = defaultReporting
): Promise<number> {
    if (!buildOptions) {
        buildOptions = getBuildOptions(options || {}, report, esBuildPlugins); //options?.plugins
    }

    const verbose = (options?.verbose as boolean) ?? false;

    // Build it!
    return esbuild
        .build(buildOptions)
        .then((result: BuildResult | BuildFailure) => {
            // Print warnings
            result.warnings.map(w =>
                report.warn(
                    chalk`{dim ${w.pluginName}} ${w.text}${w.location
                        ? chalk` {dim (${w.location!.file ? printFile(w.location!.file) : ''}${w.location!.line ? chalk`; line: ${w.location!.line}` : ''
                            })}`
                        : ''
                        }`,
                    verbose
                )
            );
            // Print errors
            result.errors.map(r =>
                report.error(
                    chalk`{dim ${r.pluginName}} ${r.text}${r.location
                        ? chalk` {dim (${r.location!.file ? printFile(r.location!.file) : ''}${r.location!.line ? chalk`; line: ${r.location!.line}` : ''
                            })}`
                        : ''
                        }`
                )
            );

            // If no errors, print success!
            if (result.errors.length === 0) console.log(chalk`{green ✓ successful build}`);

            return 0;
        })
        .catch(error => {
            report.error(error.message || error);
            return 1;
        });
}
