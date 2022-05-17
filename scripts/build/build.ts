/*
Copyright 2021 Adobe. All rights reserved.
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

const yarg = yargs(hideBin(process.argv));

import { INIT_CWD, getWorkspacesFromPaths, packages } from 'scripts-utilities/workspace';
import { defaultOutdir, buildHandler, coerceInputs } from 'scripts-utilities/build';

const { npm_lifecycle_event: command } = process.env;

import readConfig from 'scripts-utilities/read-config';

const buildConfig = await readConfig('cli-flags.yaml');

// Define the accepted properties
const options = yarg
    .scriptName(`yarn ${command || 'build'} -- --`)
    .help()
    .wrap(yarg.terminalWidth())
    .config('settings', readConfig)
    .completion()
    .parserConfiguration({
        'strip-aliased': true,
        'strip-dashed': true,
        'set-placeholder-key': true,
    })
    .pkgConf('build', INIT_CWD)
    .command({
        command: ['$0', '$0 [input..]'],
        builder: {
            input: {
                describe: 'Optional folder or files to compile.',
                type: 'array',
                default: getWorkspacesFromPaths(INIT_CWD) || packages,
                defaultDescription: 'Current workspace or all workspaces if executed from root of project.',
                coerce: coerceInputs,
                normalize: true,
            },
            outdir: {
                alias: 'output',
                type: 'string',
                requiresArg: true,
                normalize: true,
                default: defaultOutdir(),
                describe: 'The output directory in which to write the build files. Can be a relative or an absolute path.',
            },
            ...buildConfig,
        },
        handler: buildHandler,
    }).argv;

export type Options = Awaited<typeof options>;
export default options;
