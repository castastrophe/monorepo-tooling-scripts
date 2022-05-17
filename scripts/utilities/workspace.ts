/*!
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import fg from 'fast-glob';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import { existsSync, readFileSync, realpathSync } from 'fs';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const { PROJECT_CWD = join(__dirname, '../..'), INIT_CWD = process.cwd() } = process.env;
export type ScopeMeta = { directory: string; scope: string };
export const scopeDefaults: ScopeMeta[] = [
    {
        directory: 'packages',
        scope: '@unified-experience-components',
    },
    {
        directory: 'experiments',
        scope: '@uec-labs',
    },
];

export const getWorkspaces = async (packagesOnly: boolean = false): Promise<string[]> => {
    const packageJSON: string | undefined = await readFile(join(PROJECT_CWD, 'package.json'), 'utf8');
    if (packageJSON) {
        const { workspaces: ws } = JSON.parse(packageJSON);
        if (!ws) return [];

        let ret = [];
        if (packagesOnly) {
            ret = ws.filter((w: string) => {
                for (const { directory } of scopeDefaults) {
                    if (w.startsWith(directory)) return true;
                }
                return false;
            });
        } else ret = ws;

        return await fg(ret, {
            cwd: PROJECT_CWD,
            onlyDirectories: true,
            absolute: true,
            ignore: ['**/node_modules/**'],
        });
    } else return [];
};

export const workspaces = await getWorkspaces();

export function getWorkspacesFromPaths<T extends string | string[]>(paths: T, ws: string[] = workspaces): T | undefined {
    let pathArray: string[];
    if (!Array.isArray(paths)) pathArray = [paths];
    else pathArray = paths;

    const found = pathArray.reduce((foundSpaces: string[], file: string): string[] => {
        // Validate this path exists in a workspace and return the workspace value
        const myWorkspace = ws.reduce((found: string, w: string) => {
            var a = realpathSync(w);
            var b = realpathSync(file);
            // TODO do we want to check if it's inside a workspace or is a workspace?
            return b.indexOf(a) === 0 ? b : found;
        }, '');

        if (myWorkspace && !foundSpaces.includes(myWorkspace)) {
            foundSpaces.push(myWorkspace);
        }

        return foundSpaces;
    }, []);

    if (found.length === 0) return;
    if (found.length === 1) return found[0] as T;
    return found as T;
}

export const getScopeFromPath = (path: string): string => {
    const defaultScope = '@unified-experience-components';
    const workspace = getWorkspacesFromPaths(path);

    if (!workspace) return defaultScope;

    try {
        const packageJSON: string | undefined = readFileSync(join(PROJECT_CWD, workspace, 'package.json'), 'utf8');
        if (packageJSON) return JSON.parse(packageJSON)?.name || defaultScope;
    } catch (_e) { }

    return defaultScope;
};

export function fetchLocalPackageScope(pkgName: string): string | undefined {
    if (!pkgName) return;

    // If the package name includes a scope, return it
    if (pkgName.includes('/') || !scopeDefaults) return pkgName;

    // Fetch the scope by the package name if not provided
    return scopeDefaults.reduce((pkg: string, { directory, scope: defaultScope }: ScopeMeta): string => {
        if (pkg.includes('/')) return pkg;

        let path = join(PROJECT_CWD, directory, pkg);

        // If the package exists in this directory, return the scope
        if (existsSync(path)) {
            const scope = getScopeFromPath(path) || defaultScope;
            return `${scope}/${pkg}`;
        }
        return pkg;
    }, pkgName);
}

export const packages = await getWorkspaces(true);

export const report: Reporting = {
    debug: (data: any, label?: string, debug: boolean = false) => (debug ? console.log(chalk`{dim [${label}]}`, data, '\n') : null),
    log: (message: string, verbose: boolean = false) => (verbose ? console.log(chalk`{dim [log]} ${message}`) : ''),
    warn: (message: string, verbose: boolean = false) => (verbose ? console.log(chalk`{yellow [warn]} ${message}`) : ''),
    error: (message: string) => console.log(chalk`{red [error]} ${message}`),
};
