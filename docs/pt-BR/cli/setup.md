---
read_when:
    - Você está realizando a configuração de primeira execução sem o fluxo guiado completo da CLI
    - Você quer definir o caminho padrão do espaço de trabalho
summary: Referência da CLI para `openclaw setup` (inicializar configuração + espaço de trabalho)
title: Configuração
x-i18n:
    generated_at: "2026-04-30T09:42:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inicialize `~/.openclaw/openclaw.json` e a área de trabalho do agente.

Relacionado:

- Primeiros passos: [Primeiros passos](/pt-BR/start/getting-started)
- Integração inicial da CLI: [Integração inicial (CLI)](/pt-BR/start/wizard)

## Exemplos

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opções

- `--workspace <dir>`: diretório da área de trabalho do agente (armazenado como `agents.defaults.workspace`)
- `--wizard`: executar a integração inicial
- `--non-interactive`: executar a integração inicial sem prompts
- `--mode <local|remote>`: modo de integração inicial
- `--import-from <provider>`: provedor de migração a executar durante a integração inicial
- `--import-source <path>`: diretório inicial do agente de origem para `--import-from`
- `--import-secrets`: importar segredos compatíveis durante a migração da integração inicial
- `--remote-url <url>`: URL WebSocket do Gateway remoto
- `--remote-token <token>`: token do Gateway remoto

Para executar a integração inicial via setup:

```bash
openclaw setup --wizard
```

Observações:

- `openclaw setup` simples inicializa a configuração + área de trabalho sem o fluxo completo de integração inicial.
- A integração inicial é executada automaticamente quando quaisquer flags de integração inicial estão presentes (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Se o estado do Hermes for detectado, a integração inicial interativa pode oferecer a migração automaticamente. A integração inicial com importação exige uma configuração nova; use [Migrar](/pt-BR/cli/migrate) para planos de simulação, cópias de segurança e modo de sobrescrita fora da integração inicial.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Visão geral da instalação](/pt-BR/install)
