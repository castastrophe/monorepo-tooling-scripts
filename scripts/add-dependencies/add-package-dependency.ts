/*!
Copyright 2020. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import type { ExecException } from 'child_process';
import { exit } from 'process';

import { getScopeFromPath, getWorkspacesFromPaths, INIT_CWD, fetchLocalPackageScope } from 'scripts-utilities/workspace';

import readConfig from 'scripts-utilities/read-config';
const config = await readConfig('cli-flags.yaml');

import { exec as execAsync } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

export function addPackageDependency(
    packageName: string,
    dependencyName: string,
    dependencyType: 'dependency' | 'devDependency' = 'devDependency'
) {
    const exec = promisify(execAsync);
    const command = `yarn workspace ${packageName} add ${dependencyType !== 'devDependency' ? '' : '-D '}${dependencyName}`;
    console.log(chalk`\n{dim ${command}}\n`);
    return exec(command);
}

// Define the accepted properties
yargs(hideBin(process.argv))
    .scriptName('yarn add:dep')
    .command({
        command: '$0 [pkg] [dep]',
        builder: yargs =>
            yargs
                .positional('pkg', {
                    describe:
                        'The package to which to add this dependency. e.g. "header". Scope can be optionally included. e.g. "@unified-experience-components/header"',
                    type: 'string',
                    // required: 'Package name not found. Add `--help` for more information.',
                    default: () => {
                        const ws = getWorkspacesFromPaths(INIT_CWD);
                        return ws ? getScopeFromPath(ws) : false;
                    },
                    coerce: (arg: string) => fetchLocalPackageScope(arg) || arg,
                })
                .positional('dep', {
                    describe:
                        'The dependency to add. e.g. "slider". Scope can be optionally included. e.g. "@spectrum-web-components/slider"',
                    type: 'string',
                    default: '@spectrum-web-components/base',
                    coerce: arg => {
                        if (!arg) return `@spectrum-web-components/base`;
                        if (arg.includes('/')) return arg;

                        // If scope is not provided, we're going to assume @spectrum-web-components
                        return `@spectrum-web-components/${arg}`;
                    },
                })
                .options({
                    ...config,
                }),
        handler: options => {
            return addPackageDependency(options.pkg as string, options.dep as string, options.D ? 'devDependency' : 'dependency')
                .then(({ stdout, stderr }) => {
                    if (stdout && options.verbose) console.log(stdout);

                    let fail = false;
                    stderr.split('\n').forEach(line => {
                        if (line.includes('error')) fail = true;
                        if (options.verbose) console.log(`\n${line}`);
                    });

                    if (!fail) console.log(`✅ ${options.dep} added successfully to ${options.pkg}`);
                })
                .catch((error: ExecException) => {
                    console.error(error.message);
                    exit(error.code);
                });
        },
    })
    .check(argv => {
        if (!argv.pkg) {
            throw new Error('Package name not found. Add `--help` for more information.');
        }
        return true;
    })
    .showHelpOnFail(true)
    .help().argv;
