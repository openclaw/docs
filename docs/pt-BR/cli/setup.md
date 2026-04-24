---
read_when:
    - Você está fazendo a configuração da primeira execução sem o onboarding completo da CLI
    - Você quer definir o caminho padrão do workspace
summary: Referência de CLI para `openclaw setup` (inicializar config + workspace)
title: Configuração
x-i18n:
    generated_at: "2026-04-24T05:46:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 650b0faf99ef1bc24ec6514661093a9a2ba7edead2e2622b863d51553c44f267
    source_path: cli/setup.md
    workflow: 15
---

# `openclaw setup`

Inicialize `~/.openclaw/openclaw.json` e o workspace do agente.

Relacionado:

- Primeiros passos: [Getting started](/pt-BR/start/getting-started)
- Onboarding da CLI: [Onboarding (CLI)](/pt-BR/start/wizard)

## Exemplos

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opções

- `--workspace <dir>`: diretório de workspace do agente (armazenado como `agents.defaults.workspace`)
- `--wizard`: executa o onboarding
- `--non-interactive`: executa o onboarding sem prompts
- `--mode <local|remote>`: modo de onboarding
- `--remote-url <url>`: URL WebSocket do Gateway remoto
- `--remote-token <token>`: token do Gateway remoto

Para executar o onboarding via setup:

```bash
openclaw setup --wizard
```

Observações:

- `openclaw setup` simples inicializa config + workspace sem o fluxo completo de onboarding.
- O onboarding é executado automaticamente quando qualquer flag de onboarding está presente (`--wizard`, `--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

## Relacionado

- [Referência de CLI](/pt-BR/cli)
- [Visão geral de instalação](/pt-BR/install)
