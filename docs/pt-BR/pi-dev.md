---
read_when:
    - Trabalhando no código ou nos testes de integração do Pi
    - Executando fluxos de lint, verificação de tipos e testes ao vivo específicos do Pi
summary: 'Fluxo de trabalho do desenvolvedor para integração com Pi: compilação, teste e validação ao vivo'
title: Fluxo de trabalho de desenvolvimento do Pi
x-i18n:
    generated_at: "2026-04-30T09:56:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c4025c8ed1a4dff0d8116440fd48f375264eb4cac06f71afebf8c05f3470ab4
    source_path: pi-dev.md
    workflow: 16
---

Um fluxo de trabalho sensato para trabalhar na integração com Pi no OpenClaw.

## Verificação de tipos e lint

- Verificação local padrão: `pnpm check`
- Verificação de compilação: `pnpm build` quando a alteração puder afetar a saída de compilação, o empacotamento ou os limites de carregamento tardio/módulo
- Verificação completa antes da integração para alterações com foco pesado em Pi: `pnpm check && pnpm test`

## Executando testes de Pi

Execute o conjunto de testes focado em Pi diretamente com Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Para incluir o exercício do provedor ao vivo:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Isso cobre os principais conjuntos de testes unitários de Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Testes manuais

Fluxo recomendado:

- Execute o gateway em modo de desenvolvimento:
  - `pnpm gateway:dev`
- Acione o agente diretamente:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Use a TUI para depuração interativa:
  - `pnpm tui`

Para comportamento de chamadas de ferramenta, solicite uma ação `read` ou `exec` para que você possa ver o streaming de ferramentas e o tratamento de payloads.

## Redefinição completa do estado inicial

O estado fica no diretório de estado do OpenClaw. O padrão é `~/.openclaw`. Se `OPENCLAW_STATE_DIR` estiver definido, use esse diretório.

Para redefinir tudo:

- `openclaw.json` para configuração
- `agents/<agentId>/agent/auth-profiles.json` para perfis de autenticação de modelo (chaves de API + OAuth)
- `credentials/` para estado de provedor/canal que ainda fica fora do armazenamento de perfis de autenticação
- `agents/<agentId>/sessions/` para histórico de sessões do agente
- `agents/<agentId>/sessions/sessions.json` para o índice de sessões
- `sessions/` se existirem caminhos legados
- `workspace/` se você quiser um workspace em branco

Se você quiser apenas redefinir sessões, exclua `agents/<agentId>/sessions/` desse agente. Se quiser manter a autenticação, deixe `agents/<agentId>/agent/auth-profiles.json` e qualquer estado de provedor em `credentials/` no lugar.

## Referências

- [Testes](/pt-BR/help/testing)
- [Introdução](/pt-BR/start/getting-started)

## Relacionado

- [Arquitetura da integração com Pi](/pt-BR/pi)
