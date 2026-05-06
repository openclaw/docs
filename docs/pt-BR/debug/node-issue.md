---
read_when:
    - Depuração de scripts de desenvolvimento exclusivos do Node ou falhas no modo de observação
    - Investigando falhas do carregador tsx/esbuild no OpenClaw
summary: Notas e soluções alternativas para a falha do Node + tsx "__name is not a function"
title: Falha do Node + tsx
x-i18n:
    generated_at: "2026-05-06T17:55:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
---

# Falha do Node + tsx com "\_\_name is not a function"

## Resumo

Executar o OpenClaw via Node com `tsx` falha na inicialização com:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Isso começou depois da troca dos scripts de desenvolvimento de Bun para `tsx` (commit `2871657e`, 2026-01-06). O mesmo caminho de runtime funcionava com Bun.

## Ambiente

- Node: v25.x (observado na v25.3.0)
- tsx: 4.21.0
- SO: macOS (a reprodução também é provável em outras plataformas que executam Node 25)

## Reprodução (somente Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Reprodução mínima no repositório

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Verificação da versão do Node

- Node 25.3.0: falha
- Node 22.22.0 (Homebrew `node@22`): falha
- Node 24: ainda não instalado aqui; precisa de verificação

## Observações / hipótese

- `tsx` usa esbuild para transformar TS/ESM. O `keepNames` do esbuild emite um auxiliar `__name` e envolve definições de função com `__name(...)`.
- A falha indica que `__name` existe, mas não é uma função em runtime, o que implica que o auxiliar está ausente ou foi sobrescrito para este módulo no caminho do loader do Node 25.
- Problemas semelhantes com o auxiliar `__name` foram relatados em outros consumidores do esbuild quando o auxiliar está ausente ou é reescrito.

## Histórico da regressão

- `2871657e` (2026-01-06): scripts alterados de Bun para tsx para tornar Bun opcional.
- Antes disso (caminho do Bun), `openclaw status` e `gateway:watch` funcionavam.

## Soluções alternativas

- Use Bun para scripts de desenvolvimento (reversão temporária atual).
- Use `tsgo` para verificação de tipos do repositório e depois execute a saída compilada:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Nota histórica: `tsc` foi usado aqui durante a depuração deste problema de Node/tsx, mas as lanes de verificação de tipos do repositório agora usam `tsgo`.
- Desative o keepNames do esbuild no loader TS, se possível (evita a inserção do auxiliar `__name`); atualmente, o tsx não expõe isso.
- Teste o Node LTS (22/24) com `tsx` para ver se o problema é específico do Node 25.

## Referências

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Próximos passos

- Reproduzir no Node 22/24 para confirmar a regressão no Node 25.
- Testar o nightly do `tsx` ou fixar em uma versão anterior, caso exista uma regressão conhecida.
- Se reproduzir no Node LTS, abrir uma reprodução mínima upstream com o stack trace de `__name`.

## Relacionado

- [Instalação do Node.js](/pt-BR/install/node)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
