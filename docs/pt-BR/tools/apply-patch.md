---
read_when:
    - Você precisa de edições estruturadas em vários arquivos
    - Você quer documentar ou depurar edições baseadas em patch
summary: Aplicar patches em vários arquivos com a ferramenta apply_patch
title: ferramenta apply_patch
x-i18n:
    generated_at: "2026-04-24T06:14:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 15
---

Aplicar alterações em arquivos usando um formato de patch estruturado. Isso é ideal para edições com vários arquivos
ou vários hunks, em que uma única chamada `edit` seria frágil.

A ferramenta aceita uma única string `input` que encapsula uma ou mais operações em arquivos:

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Parâmetros

- `input` (obrigatório): conteúdo completo do patch, incluindo `*** Begin Patch` e `*** End Patch`.

## Observações

- Caminhos de patch oferecem suporte a caminhos relativos (a partir do diretório do workspace) e caminhos absolutos.
- `tools.exec.applyPatch.workspaceOnly` usa `true` por padrão (contido no workspace). Defina como `false` apenas se você quiser intencionalmente que `apply_patch` grave/exclua fora do diretório do workspace.
- Use `*** Move to:` dentro de um hunk `*** Update File:` para renomear arquivos.
- `*** End of File` marca uma inserção apenas em EOF quando necessário.
- Disponível por padrão para modelos OpenAI e OpenAI Codex. Defina
  `tools.exec.applyPatch.enabled: false` para desativá-la.
- Opcionalmente faça controle por modelo via
  `tools.exec.applyPatch.allowModels`.
- A configuração existe apenas em `tools.exec`.

## Exemplo

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Relacionado

- [Diffs](/pt-BR/tools/diffs)
- [Ferramenta exec](/pt-BR/tools/exec)
- [Execução de código](/pt-BR/tools/code-execution)
