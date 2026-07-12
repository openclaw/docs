---
read_when:
    - Trabalhando no código de runtime ou nos testes do agente OpenClaw
    - Executando fluxos de lint, verificação de tipos e testes em ambiente real do runtime do agente
summary: 'Fluxo de trabalho de desenvolvimento para o runtime de agentes do OpenClaw: compilação, testes e validação em ambiente real'
title: Fluxo de trabalho do runtime do agente OpenClaw
x-i18n:
    generated_at: "2026-07-12T15:20:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

Fluxo de trabalho de desenvolvimento para o runtime do agente (`src/agents/`) no repositório do OpenClaw.

## Verificação de tipos e lint

- Verificação local padrão: `pnpm check` (verificação de tipos, lint e verificações de políticas)
- Verificação de build: `pnpm build` quando a alteração puder afetar a saída do build, o empacotamento ou os limites de carregamento tardio/módulos
- Verificação completa antes do push: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## Execução dos testes do runtime do agente

Execute as suítes de testes unitários do runtime do agente:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

O primeiro glob também abrange as suítes `agent-tools*`, `agent-settings` e
`agent-tool-definition-adapter*`.

Os testes em ambiente real são excluídos da configuração de testes unitários; execute-os por meio do
wrapper de testes em ambiente real (define `OPENCLAW_LIVE_TEST=1` e requer credenciais do provedor):

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## Testes manuais

- Execute o Gateway no modo de desenvolvimento (ignora as conexões de canais por meio de `OPENCLAW_SKIP_CHANNELS=1`): `pnpm gateway:dev`
- Acione um turno do agente por meio do Gateway: `pnpm openclaw agent --message "Hello" --thinking low`
- Use a TUI para depuração interativa: `pnpm tui`

Para o comportamento de chamadas de ferramentas, solicite uma ação `read` ou `exec` para poder observar
o streaming da ferramenta e o tratamento do payload.

## Redefinição completa

O estado fica no diretório de estado do OpenClaw: `~/.openclaw` por padrão, ou
`$OPENCLAW_STATE_DIR` quando definido. Caminhos relativos a esse diretório:

| Caminho                                        | Armazena                                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `openclaw.json`                                | Configuração                                                                       |
| `state/openclaw.sqlite`                        | Banco de dados compartilhado de estado de runtime                                  |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | Perfis de autenticação de modelo por agente (chaves de API + OAuth) e estado de runtime |
| `credentials/`                                 | Credenciais de provedores/canais fora do armazenamento de perfis de autenticação   |
| `agents/<agentId>/sessions/`                   | Histórico de transcrições e fontes de migração de sessões legadas                  |
| `sessions/`                                    | Armazenamento legado de sessões de agente único (somente instalações antigas)      |
| `workspace/`                                   | Workspace padrão do agente (agentes adicionais usam `workspace-<agentId>`)         |

Exclua esses caminhos para uma redefinição completa. Redefinições mais específicas:

- Somente sessões: não exclua `agents/<agentId>/agent/openclaw-agent.sqlite`; as linhas de sessão ficam nele junto com outros estados por agente. Use `/new` ou `/reset` para iniciar uma nova sessão em um chat e `openclaw sessions cleanup` para a manutenção de sessões.
- Manter autenticação: preserve `agents/<agentId>/agent/openclaw-agent.sqlite` e `credentials/`.

Os arquivos legados `auth-profiles.json` não são mais lidos durante o runtime;
`openclaw doctor --fix` os importa para o armazenamento SQLite.

## Referências

- [Testes](/pt-BR/help/testing)
- [Primeiros passos](/pt-BR/start/getting-started)

## Relacionado

- [Arquitetura de runtime do agente OpenClaw](/pt-BR/agent-runtime-architecture)
