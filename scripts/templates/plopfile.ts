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

import pkg from 'lodash';
const { kebabCase, startCase } = pkg;
import { NodePlopAPI } from 'plop';
import { sync } from 'git-config';

declare interface GitConfig {
    user?: {
        name: string;
        email: string;
    };
    github?: {
        user: string;
    };
}

export default async function (plop: NodePlopAPI) {
    plop.setHelper('folder', (isExperiment: boolean) => (isExperiment ? 'experiments' : 'packages'));
    plop.setHelper('project', (isExperiment: boolean): string => (isExperiment ? 'uec-labs' : 'unified-experience-components'));

    // name of custom element tag
    plop.setPartial('tagnamePartial', 'ue-{{name}}');

    // name of LitElement class
    plop.setHelper('className', (name: string) => startCase(name).replace(/ /g, ''));

    // name used as title in storybook and documentation
    plop.setHelper('displayName', (name: string) => startCase(name));
    plop.setHelper('section', (folder: string) => startCase(folder));

    plop.setGenerator('component', {
        description: 'application controller logic',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'Package name (i.e., loading-screen)',
                transformer: (input: string) => kebabCase(input),
                filter: (input: string) => kebabCase(input),
                validate: (input: string) =>
                    new Promise((resolve, reject) => {
                        if (input.length > 0 && input.match(/\w(-\w)*/g)) resolve(true);
                        else reject('Package name is required.');
                    }),
            },
            {
                type: 'confirm',
                name: 'isExperiment',
                message: 'Is this an experiment?',
                default: false,
            },
        ],
        actions: (data = {}) => {
            const config: GitConfig = sync();
            data.user = {
                name: config?.user?.name || '',
                email: config?.user?.email || '',
                handle: config?.github?.user || '',
            };

            // Read in the template files from the provided template directory

            return [
                {
                    type: 'add',
                    path: '../../{{folder isExperiment}}/{{name}}/src/index.ts',
                    templateFile: 'plop-templates/index.ts.hbs',
                },
                {
                    type: 'add',
                    path: '../../{{folder isExperiment}}/{{name}}/src/{{className name}}.ts',
                    templateFile: 'plop-templates/component.ts.hbs',
                },
                {
                    type: 'add',
                    path: '../../{{folder isExperiment}}/{{name}}/{{> tagnamePartial }}.ts',
                    templateFile: 'plop-templates/component-registration.ts.hbs',
                },
                {
                    type: 'add',
                    path: '../../{{folder isExperiment}}/{{name}}/src/{{name}}.css',
                    templateFile: 'plop-templates/component.css.hbs',
                },
                {
                    type: 'add',
                    path: '../../{{folder isExperiment}}/{{name}}/test/{{name}}.test.ts',
                    templateFile: 'plop-templates/test.ts.hbs',
                },
                // {
                //     type: 'add',
                //     path: '../../{{folder isExperiment}}/{{name}}/test/benchmark/basic-test.ts',
                //     templateFile: 'plop-templates/benchmark.ts.hbs',
                // },
                {
                    type: 'add',
                    path: '../../{{folder isExperiment}}/{{name}}/stories/{{name}}.stories.ts',
                    templateFile: 'plop-templates/stories.ts.hbs',
                },
                {
                    type: 'add',
                    path: '../../{{folder isExperiment}}/{{name}}/README.md',
                    templateFile: 'plop-templates/README.md.hbs',
                },
                {
                    type: 'add',
                    path: '../../{{folder isExperiment}}/{{name}}/tsconfig.json',
                    templateFile: 'plop-templates/tsconfig.json.hbs',
                },
                {
                    type: 'add',
                    path: '../../{{folder isExperiment}}/{{name}}/package.json',
                    templateFile: 'plop-templates/package.json.hbs',
                },
                {
                    type: 'add',
                    path: '../../{{folder isExperiment}}/{{name}}/.npmignore',
                    templateFile: 'plop-templates/.npmignore.hbs',
                },
            ];
        },
    });
}
