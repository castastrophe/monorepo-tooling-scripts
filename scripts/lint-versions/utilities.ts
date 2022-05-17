/* eslint-disable no-console */
/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { relative } from 'path';
import chalk from 'chalk';

import { exec as execAsync } from 'child_process';
import { promisify } from 'util';
const exec = promisify(execAsync);

type DependencyName = string;
type PackageName = string;
type Version = string;
type DependencyTypes = 'dependencies' | 'devDependencies';
type Meta = Map<
    Version,
    {
        from?: PackageName;
        type?: DependencyTypes;
    }[]
>;
export type Dependencies = Map<DependencyName, Meta>;
import { PROJECT_CWD } from '../utilities/workspace.js';

// const readable = (path: string) => path.replace(PROJECT_CWD, '').replace('/package.json', '');
export async function readPackageJsonDeps(
    filePath: string,
    existingDependencies: Dependencies = new Map(),
    verbose: boolean = false
): Promise<Dependencies> {
    if (verbose) console.log(chalk`Reading in versions from {magenta ${relative(PROJECT_CWD, filePath)}}`);

    if (!existsSync(filePath)) {
        if (verbose) console.log(chalk`{magenta package.json} not found. Skipping.`);
        return existingDependencies;
    }

    const jsonData = await readFile(filePath, 'utf-8').then(JSON.parse);
    if (!jsonData) return existingDependencies;
    // Merge the existing dependencies with the new ones
    return mergeDependencies(jsonData, existingDependencies);
}

function mergeDependencies(json: any, dependencies: Dependencies): Dependencies {
    const from = json.name;

    // Loop over deps and devDeps in package to compare with existing sets
    for (const type of ['dependencies', 'devDependencies'] as DependencyTypes[]) {
        const dependencySets: {
            [key: DependencyName]: Version;
        } = json[type];
        if (!dependencySets) continue;

        // Filter out local file refs any any undefined or null values
        const depNames = Object.keys(dependencySets).filter(dep => dependencySets[dep] && !dependencySets[dep].includes('file:'));
        // Loop over each dependency
        for (const dep of depNames) {
            const version = dependencySets[dep];
            const meta = { from, type };

            // Check previous dependencies for mismatches
            const versionsMap: Meta = dependencies.get(dep) || new Map();
            if (versionsMap.size > 0 && versionsMap.has(version)) {
                const previousMeta = versionsMap.get(version)!;
                previousMeta.push(meta);
                versionsMap.set(version, previousMeta);
                dependencies.set(dep, versionsMap);
            } else {
                versionsMap.set(version, [meta]);
                dependencies.set(dep, versionsMap);
            }
        }
    }

    return dependencies;
}

function fetchHighestVersion(versions: Version[]): Version {
    return versions.reduce((a, b) => {
        if (a === b) return a;

        const [majA, minA, patchA] = a.split('.').map(Number);
        const [majB, minB, patchB] = b.split('.').map(Number);

        if (majA > majB) return a;
        if (majA < majB) return b;

        if (minA > minB) return a;
        if (minA < minB) return b;

        if (patchA > patchB) return a;
        return b;
    });
}

async function upgrade(
    workspace: PackageName,
    dep: PackageName,
    from: Version,
    to: Version,
    type?: DependencyTypes,
    verbose: boolean = false
): Promise<boolean> {
    console.log(chalk`Upgrade {cyan ${dep}} from {cyan ${from}} to {cyan ${to}} in {yellow ${workspace!}}`);
    console.log(
        chalk`{dim yarn workspace {yellow ${workspace!}} add ${type === 'devDependencies' ? '-D ' : ''}{cyan ${dep}}@{green ${to}}}`
    );

    try {
        const { stdout, stderr } = await exec(`yarn workspace ${workspace} add ${type === 'devDependencies' ? '-D ' : ''}${dep}@${to}`);
        if (verbose) console.log(`\n${stdout}`);

        stderr.split('\n').forEach(line => {
            if (line.includes('error')) console.log(line);
            else if (verbose) console.log(line);
        });

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function processDependencies(allVersions: Dependencies, verbose: boolean = false): Promise<boolean> {
    let upgrades = false;
    if (verbose) console.log(chalk`\nParsing {green ${allVersions.size}} packages for version mismatches...`);

    for (const [dep, versionData] of allVersions.entries()) {
        if (versionData.size <= 1) continue;

        let versions = Array.from(versionData.keys());
        const highestVersion = fetchHighestVersion(versions);

        if (verbose) console.log(chalk`{red ${dep}} has {green ${versions.length}} versions: {green ${versions.join(', ')}}\n`);

        // Remove the highest version from the list before iterating
        versions = versions.filter(v => v !== highestVersion);

        for (const v of versions) {
            if (!versionData.has(v)) continue;

            // Everything not matching the highest version needs to be upgraded
            for (const { from, type } of versionData.get(v)!) {
                if (!from) continue;
                upgrades = (await upgrade(from, dep, v, highestVersion, type, verbose)) || upgrades;
            }
        }
    }

    return upgrades;
}
