'use strict'

import * as vscode from 'vscode'
import * as voca from 'voca'
import * as path from 'path'
import { importVueFile } from './vueFileImporter'
import { grepAsync } from './lib/grep'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.vuejsAutoImportForMe', async () => {
      const text: string = getText(
        vscode.window.activeTextEditor!.document,
        vscode.window.activeTextEditor!.selection.active
      )

      if (
        !vscode.window.activeTextEditor ||
        vscode.window.activeTextEditor.document.languageId !== 'vue'
      ) {
        vscode.window.showWarningMessage('Vue.js AutoImport is only vue file.')
        return false
      }

      const rootPath = vscode.workspace.rootPath
        ? path.resolve(
          vscode.workspace.rootPath,
          vscode.workspace
            .getConfiguration()
            .get<string>('vuejsAutoImportForMe.rootDirectory')!
        )
        : ''

      // const rootRelative = vscode.workspace.rootRelative
      //   ? path.resolve(
      //     vscode.workspace.rootRelative,
      //     vscode.workspaceπ
      //       .getConfiguration()
      //       .get<boolean>('vuejsAutoImport.rootRelative')!
      //   )
      //   : false

      const pathList: string[] = await grepAsync([
        path.join(rootPath, `**/${voca.camelCase(text)}.vue`),
        path.join(rootPath, `**/${voca.kebabCase(text)}.vue`),
        path.join(rootPath, `**/${voca.capitalize(text)}.vue`)
      ])

      const importCore = (fullPath: string) => {
        let importPath = ''
        const parsedTargetFilePath = path.parse(fullPath)
        // if (!rootRelative) {
        //   const activeEditorPath = path.parse(
        //     vscode.window.activeTextEditor!.document.fileName
        //   )
        //   const relationalDir = path.relative(
        //     activeEditorPath.dir,
        //     parsedTargetFilePath.dir
        //   )
        //   importPath = path
        //     .join(relationalDir, parsedTargetFilePath.base)
        //     .replace(/\\/g, '/')
        //   // if just under
        //   if (!importPath.startsWith('../')) {
        //     importPath = './' + importPath
        //   }
        // }
        // else {
        const relationalDir = path.relative(
          vscode.workspace.rootPath!,
          parsedTargetFilePath.dir
        )
        importPath = '~/' + path
          .join(relationalDir, parsedTargetFilePath.base)
          .replace(/\\/g, '/')
        // }

        importVueFile(parsedTargetFilePath.name, importPath)
      }

      if (pathList.length === 1) {
        importCore(pathList[0])
      } else if (pathList.length > 1) {
        vscode.window.showQuickPick(pathList).then(selectedPath => {
          importCore(selectedPath!)
        })
      }
    })
  )
}

function getText(
  document: vscode.TextDocument,
  position: vscode.Position
): string {
  const targetRange = document.getWordRangeAtPosition(
    position,
    /<.+?-?.+?(>| |\n|\r\n|$)/
  )
  const targetText = document.getText(targetRange)
  const formatedText = targetText
    .replace('<', '')
    .replace('>', '')
    .replace('/', '')
    .trim()
  return formatedText
}
