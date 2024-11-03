/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import {RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay} from '@codingame/monaco-vscode-files-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-java-default-extension';
import {MonacoEditorLanguageClientWrapper, WrapperConfig} from 'monaco-editor-wrapper';
import {LogLevel} from 'vscode/services';
import {eclipseJdtLsConfig} from './config.js';
// @ts-ignore
import helloJavaCode from '/Users/dy/Workspace/flow-engine-demo/src/main/java/cn/antly/flow/script/JavaFlowTemplate.java?raw';
import {configureMonacoWorkers} from './utils.js';

export const runEclipseJdtLsClient = () => {
    const helloJavaUri = vscode.Uri.file(`${eclipseJdtLsConfig.basePath}/workspace/src/main/java/cn/antly/flow/script/JavaFlowTemplate.java`);
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(helloJavaUri, helloJavaCode));
    registerFileSystemOverlay(1, fileSystemProvider);

    const userConfig: WrapperConfig = {
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            userServices: {
                ...getKeybindingsServiceOverride(),
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.guides.bracketPairsHorizontal': 'active',
                    'editor.wordBasedSuggestions': 'off',
                    'editor.experimental.asyncTokenization': true
                })
            }
        },
        editorAppConfig: {
            $type: 'extended',
            codeResources: {
                main: {
                    text: helloJavaCode,
                    uri: `${eclipseJdtLsConfig.basePath}/workspace/src/main/java/cn/antly/flow/script/JavaFlowTemplate.java`
                }
            },
            useDiffEditor: false,
            monacoWorkerFactory: configureMonacoWorkers,
            htmlContainer: document.getElementById('monaco-editor-root')!
        },
        languageClientConfigs: {
            java: {
                languageId: 'java',
                connection: {
                    options: {
                        $type: 'WebSocketUrl',
                        url: 'ws://localhost:30003/jdtls'
                    }
                },
                clientOptions: {
                    documentSelector: ['java'],
                    workspaceFolder: {
                        index: 0,
                        name: 'workspace',
                        uri: vscode.Uri.parse(`${eclipseJdtLsConfig.basePath}/workspace`)
                    }
                }
            }
        }
    };

    const wrapper = new MonacoEditorLanguageClientWrapper();

    try {
        // @ts-ignore
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            await wrapper.init(userConfig);

            // open files, so the LS can pick it up
            await vscode.workspace.openTextDocument(helloJavaUri);

            await wrapper.start();
        });
        // @ts-ignore
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await wrapper.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};