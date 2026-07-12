---
read_when:
    - Você precisa de edições estruturadas em vários arquivos
    - Você quer documentar ou depurar edições baseadas em patches
summary: Aplique patches em vários arquivos com a ferramenta apply_patch
title: ferramenta apply_patch
x-i18n:
    generated_at: "2026-07-12T00:23:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

Aplique alterações em arquivos usando um formato de patch estruturado. Isso é ideal para edições em vários arquivos
ou com vários trechos, nas quais uma única chamada `edit` seria frágil.

A ferramenta aceita uma única string `input` que envolve uma ou mais operações de arquivo:

```text
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@ optional change context
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Parâmetros

- `input` (obrigatório): conteúdo completo do patch, incluindo `*** Begin Patch` e `*** End Patch`.

## Observações

- Os caminhos do patch aceitam caminhos relativos (a partir do diretório do espaço de trabalho) e caminhos absolutos.
- O padrão de `tools.exec.applyPatch.workspaceOnly` é `true` (restrito ao espaço de trabalho). Defina-o como `false` somente se você quiser intencionalmente que `apply_patch` grave/exclua fora do diretório do espaço de trabalho.
- Use `*** Move to:` dentro de um trecho `*** Update File:` para renomear arquivos.
- `*** End of File` marca uma inserção somente no fim do arquivo quando necessário.
- Habilitado por padrão para todos os modelos. Defina `tools.exec.applyPatch.enabled: false`
  para desabilitá-lo ou restrinja-o a modelos específicos com
  `tools.exec.applyPatch.allowModels` (aceita IDs simples, como `gpt-5.4`, ou IDs
  completos, como `openai/gpt-5.4`).
- A configuração fica em `tools.exec.applyPatch.*`.

## Exemplo

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## Relacionados

<CardGroup cols={2}>
  <Card title="Diferenças" href="/pt-BR/tools/diffs" icon="code-compare">
    Visualizador de diferenças somente leitura para apresentação de alterações.
  </Card>
  <Card title="Ferramenta Exec" href="/pt-BR/tools/exec" icon="terminal">
    Execução de comandos do shell pelo agente.
  </Card>
  <Card title="Execução de código" href="/pt-BR/tools/code-execution" icon="square-code">
    Análise remota de Python em ambiente isolado com xAI.
  </Card>
</CardGroup>
