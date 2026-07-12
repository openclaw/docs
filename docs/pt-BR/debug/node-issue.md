---
read_when:
    - Investigando uma falha do carregador tsx/esbuild que menciona a ausência do auxiliar __name
summary: Falha histórica do Node + tsx com "__name is not a function" e sua causa
title: Falha do Node + tsx
x-i18n:
    generated_at: "2026-07-11T23:56:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Falha do Node + tsx com "\_\_name is not a function"

## Status

Resolvido. Essa falha não se reproduz na versão atual do `tsx` fixada no
`package.json` (`4.22.3`) nem nas versões atuais do Node. Mantido aqui para o caso de uma
futura atualização do `tsx`/esbuild reintroduzi-la.

## Sintoma original

A execução dos scripts de desenvolvimento do OpenClaw por meio do `tsx` falhava na inicialização com:

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

Os números das linhas foram omitidos; ambos os arquivos mudaram desde a falha original,
e as linhas específicas não correspondem mais.

Isso surgiu depois que os scripts de desenvolvimento trocaram o Bun pelo `tsx` (`2871657e`,
2026-01-06) para tornar o Bun opcional. O caminho equivalente baseado no Bun não falhava.
O problema foi observado originalmente no Node v25.3.0 no macOS; considerou-se provável que outras plataformas que executam
o Node 25 também fossem afetadas.

## Causa

O `tsx` transforma TS/ESM por meio do esbuild com `keepNames: true` definido diretamente em
suas opções de transformação. Essa configuração faz o esbuild envolver declarações nomeadas de funções/classes
em uma chamada a um auxiliar `__name`, para que `fn.name` seja preservado durante a minificação
e o empacotamento. A falha significa que o auxiliar estava ausente ou foi ocultado no ponto da chamada
desse módulo na combinação afetada de `tsx`/Node; assim, `__name(...)`
lançou um erro em vez de retornar o valor envolvido.

## Verificação atual de reprodução

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

Reprodução mínima isolada (carrega apenas o módulo do rastreamento de pilha original):

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

Atualmente, ambos os comandos são concluídos sem erros. Se algum deles voltar a lançar `__name is not a
function`, registre a versão exata do Node, a versão do `tsx`
(`node_modules/tsx/package.json`) e o rastreamento de pilha completo antes de relatar o problema ao projeto upstream.

## Soluções alternativas (se a falha retornar)

- Execute os scripts de desenvolvimento com o Bun em vez de `node --import tsx`.
- Execute `pnpm tsgo` para verificar os tipos e, em seguida, execute a saída compilada em vez do
  código-fonte por meio do `tsx`:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Tente outra versão do `tsx` (`pnpm add -D tsx@<version>` é uma alteração de dependência
  e requer aprovação de acordo com a política do repositório) para determinar por bisseção se a versão do esbuild
  incluída por ela reintroduziu o bug.
- Teste com outra versão principal/secundária do Node para verificar se a falha é específica
  da versão.

## Referências

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Relacionado

- [Instalação do Node.js](/pt-BR/install/node)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
