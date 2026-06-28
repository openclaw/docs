---
read_when:
    - Você precisa de edições estruturadas em vários arquivos
    - Você quer documentar ou depurar edições baseadas em patches
summary: Aplicar patches em vários arquivos com a ferramenta apply_patch
title: ferramenta apply_patch
x-i18n:
    generated_at: "2026-05-06T09:14:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Aplique alterações em arquivos usando um formato de patch estruturado. Isso é ideal para edições em vários arquivos
ou com vários hunks, em que uma única chamada `edit` seria frágil.

A ferramenta aceita uma única string `input` que envolve uma ou mais operações de arquivo:

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

- `input` (obrigatório): Conteúdo completo do patch, incluindo `*** Begin Patch` e `*** End Patch`.

## Observações

- Os caminhos do patch aceitam caminhos relativos (a partir do diretório do workspace) e caminhos absolutos.
- `tools.exec.applyPatch.workspaceOnly` assume `true` como padrão (contido no workspace). Defina como `false` somente se você intencionalmente quiser que `apply_patch` grave/exclua fora do diretório do workspace.
- Use `*** Move to:` dentro de um hunk `*** Update File:` para renomear arquivos.
- `*** End of File` marca uma inserção somente EOF quando necessário.
- Disponível por padrão para modelos OpenAI e OpenAI Codex. Defina
  `tools.exec.applyPatch.enabled: false` para desativá-lo.
- Opcionalmente, restrinja por modelo via
  `tools.exec.applyPatch.allowModels`.
- A configuração fica somente em `tools.exec`.

## Exemplo

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Relacionados

<CardGroup cols={2}>
  <Card title="Diffs" href="/pt-BR/tools/diffs" icon="code-compare">
    Visualizador de diff somente leitura para apresentação de alterações.
  </Card>
  <Card title="Exec tool" href="/pt-BR/tools/exec" icon="terminal">
    Execução de comandos de shell a partir do agente.
  </Card>
  <Card title="Code execution" href="/pt-BR/tools/code-execution" icon="square-code">
    Análise remota de Python em sandbox com xAI.
  </Card>
</CardGroup>
