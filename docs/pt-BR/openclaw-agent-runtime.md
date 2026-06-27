---
read_when:
    - Trabalhando no código ou nos testes do runtime de agentes do OpenClaw
    - Executando fluxos de lint, verificação de tipos e testes live do agent-runtime
summary: 'Fluxo de trabalho do desenvolvedor para o runtime de agentes do OpenClaw: build, testes e validação ao vivo'
title: Fluxo de trabalho do runtime do agente OpenClaw
x-i18n:
    generated_at: "2026-06-27T17:41:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Um fluxo de trabalho sensato para trabalhar no runtime do agente OpenClaw no OpenClaw.

## Verificação de tipos e linting

- Gate local padrão: `pnpm check`
- Gate de build: `pnpm build` quando a alteração puder afetar a saída de build, o empacotamento ou limites de carregamento preguiçoso/módulos
- Gate completo de landing para alterações no runtime do agente: `pnpm check && pnpm test`

## Executando testes do runtime do agente

Execute o conjunto de testes do runtime do agente diretamente com Vitest:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Para incluir o exercício com provedor live:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

Isso cobre os principais conjuntos de testes unitários do runtime do agente:

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## Teste manual

Fluxo recomendado:

- Execute o Gateway em modo de desenvolvimento:
  - `pnpm gateway:dev`
- Acione o agente diretamente:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Use a TUI para depuração interativa:
  - `pnpm tui`

Para comportamento de chamada de ferramenta, solicite uma ação `read` ou `exec` para poder ver o streaming da ferramenta e o tratamento do payload.

## Redefinição para estado limpo

O estado fica no diretório de estado do OpenClaw. O padrão é `~/.openclaw`. Se `OPENCLAW_STATE_DIR` estiver definido, use esse diretório em vez disso.

Para redefinir tudo:

- `openclaw.json` para configuração
- `agents/<agentId>/agent/auth-profiles.json` para perfis de autenticação de modelo (chaves de API + OAuth)
- `credentials/` para estado de provedor/canal que ainda fica fora do armazenamento de perfis de autenticação
- `agents/<agentId>/sessions/` para histórico de sessões do agente
- `agents/<agentId>/sessions/sessions.json` para o índice de sessões
- `sessions/` se caminhos legados existirem
- `workspace/` se você quiser um espaço de trabalho em branco

Se você quiser redefinir apenas as sessões, exclua `agents/<agentId>/sessions/` para esse agente. Se quiser manter a autenticação, deixe `agents/<agentId>/agent/auth-profiles.json` e qualquer estado de provedor em `credentials/` no lugar.

## Referências

- [Testes](/pt-BR/help/testing)
- [Primeiros passos](/pt-BR/start/getting-started)

## Relacionado

- [Arquitetura do runtime do agente OpenClaw](/pt-BR/agent-runtime-architecture)
