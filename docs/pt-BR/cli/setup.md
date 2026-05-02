---
read_when:
    - Você está fazendo a configuração de primeira execução sem a integração inicial completa da CLI
    - Você quer definir o caminho padrão do espaço de trabalho
summary: Referência da CLI para `openclaw setup` (inicializar configuração + espaço de trabalho)
title: Configuração
x-i18n:
    generated_at: "2026-05-02T20:44:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inicialize `~/.openclaw/openclaw.json` e o espaço de trabalho do agente.

Relacionado:

- Primeiros passos: [Primeiros passos](/pt-BR/start/getting-started)
- Integração inicial pela CLI: [Integração inicial (CLI)](/pt-BR/start/wizard)

## Exemplos

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Opções

- `--workspace <dir>`: diretório do espaço de trabalho do agente (armazenado como `agents.defaults.workspace`)
- `--wizard`: executar a integração inicial
- `--non-interactive`: executar a integração inicial sem prompts
- `--mode <local|remote>`: modo da integração inicial
- `--import-from <provider>`: provedor de migração a ser executado durante a integração inicial
- `--import-source <path>`: origem do diretório inicial do agente para `--import-from`
- `--import-secrets`: importar segredos compatíveis durante a migração da integração inicial
- `--remote-url <url>`: URL WebSocket do Gateway remoto
- `--remote-token <token>`: token do Gateway remoto

Para executar a integração inicial via setup:

```bash
openclaw setup --wizard
```

Observações:

- `openclaw setup` simples inicializa a configuração + o espaço de trabalho sem o fluxo completo de integração inicial.
- Após o setup simples, execute `openclaw configure` para escolher modelos, canais, Gateway, plugins, Skills ou verificações de integridade.
- A integração inicial é executada automaticamente quando qualquer flag de integração inicial está presente (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Se o estado do Hermes for detectado, a integração inicial interativa pode oferecer a migração automaticamente. A integração inicial com importação exige um setup novo; use [Migrar](/pt-BR/cli/migrate) para planos de simulação, backups e modo de sobrescrita fora da integração inicial.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Visão geral da instalação](/pt-BR/install)
