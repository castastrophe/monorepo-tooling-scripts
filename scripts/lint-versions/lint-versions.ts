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

import { join } from 'path';
import { existsSync } from 'fs';

import { PROJECT_CWD, workspaces } from 'scripts-utilities/workspace';
import readConfig from 'scripts-utilities/read-config';

import { processDependencies, readPackageJsonDeps, Dependencies } from './utilities.js';

const config = await readConfig('cli-flags.yaml');

const yarg = yargs(hideBin(process.argv));

yarg.scriptName('yarn lint:versions')
    .options({
        ...config,
    })
    .command({
        command: '$0',
        builder: {},
        handler: async args => {
            const verbose: boolean = Boolean(args.verbose);
            let versions: Dependencies = new Map();

            for (const subPackage of [PROJECT_CWD, ...workspaces]) {
                try {
                    if (existsSync(join(subPackage, 'package.json'))) {
                        const filePath = join(subPackage, 'package.json');
                        versions = await readPackageJsonDeps(filePath, versions, verbose);
                    }
                } catch (error) { }
            }

            return await processDependencies(versions, args.verbose as boolean)
                .then(upgraded => {
                    // Clear previous line: \x1B[A\x1B[K
                    console.log(`\nAll versions ${upgraded ? 'now ' : ''}aligned 💪\n`);
                })
                .catch(error => {
                    console.error(error);
                });
        },
    })
    .help()
    .wrap(yarg.terminalWidth()).argv;
