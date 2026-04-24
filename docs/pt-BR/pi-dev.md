---
read_when:
    - Trabalhando no código ou nos testes de integração do Pi
    - Executando fluxos específicos do Pi de lint, typecheck e teste live
summary: 'Fluxo de trabalho de desenvolvimento para integração do Pi: build, teste e validação live'
title: Fluxo de trabalho de desenvolvimento do Pi
x-i18n:
    generated_at: "2026-04-24T06:00:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb626bf21bc731b8ca7bb2a48692e17c8b93f2b6ffa471ed9e70d9c91cd57149
    source_path: pi-dev.md
    workflow: 15
---

Este guia resume um fluxo de trabalho sensato para trabalhar na integração do Pi no OpenClaw.

## Type checking e linting

- Gate local padrão: `pnpm check`
- Gate de build: `pnpm build` quando a mudança puder afetar saída de build, empacotamento ou boundaries de lazy-loading/módulo
- Gate completo antes de landing para mudanças pesadas de Pi: `pnpm check && pnpm test`

## Executando testes do Pi

Execute diretamente o conjunto de testes focado em Pi com Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Para incluir o exercício live de provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Isso cobre as principais suítes unitárias do Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Teste manual

Fluxo recomendado:

- Execute o gateway em modo dev:
  - `pnpm gateway:dev`
- Dispare o agente diretamente:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Use a TUI para depuração interativa:
  - `pnpm tui`

Para comportamento de chamada de tools, peça uma ação `read` ou `exec` para que você possa ver o streaming de tools e o tratamento de payloads.

## Reset completo

O estado fica no diretório de estado do OpenClaw. O padrão é `~/.openclaw`. Se `OPENCLAW_STATE_DIR` estiver definido, use esse diretório.

Para resetar tudo:

- `openclaw.json` para configuração
- `agents/<agentId>/agent/auth-profiles.json` para perfis de autenticação de modelo (chaves de API + OAuth)
- `credentials/` para estado de provider/canal que ainda vive fora do armazenamento de perfil de autenticação
- `agents/<agentId>/sessions/` para histórico de sessão do agente
- `agents/<agentId>/sessions/sessions.json` para o índice de sessões
- `sessions/` se existirem caminhos legados
- `workspace/` se você quiser um workspace em branco

Se quiser apenas resetar sessões, exclua `agents/<agentId>/sessions/` desse agente. Se quiser manter a autenticação, deixe `agents/<agentId>/agent/auth-profiles.json` e qualquer estado de provider em `credentials/` intactos.

## Referências

- [Testes](/pt-BR/help/testing)
- [Primeiros passos](/pt-BR/start/getting-started)

## Relacionado

- [Arquitetura de integração do Pi](/pt-BR/pi)
