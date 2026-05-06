---
read_when:
    - Você está fazendo a configuração da primeira execução sem a integração inicial completa da CLI
    - Você quer definir o caminho padrão do espaço de trabalho
summary: Referência da CLI para `openclaw setup` (inicializar configuração + espaço de trabalho)
title: Configuração
x-i18n:
    generated_at: "2026-05-06T17:54:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inicialize `~/.openclaw/openclaw.json` e o espaço de trabalho do agente.

<Note>
`openclaw setup` é para instalações de configuração mutável. No modo Nix (`OPENCLAW_NIX_MODE=1`), o OpenClaw recusa gravações de configuração porque o arquivo de configuração é gerenciado pelo Nix. Os agentes devem usar o [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) oficial ou a configuração de origem equivalente para outro pacote Nix.
</Note>

Relacionado:

- Primeiros passos: [Primeiros passos](/pt-BR/start/getting-started)
- Integração da CLI: [Integração (CLI)](/pt-BR/start/wizard)

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
- `--wizard`: executar integração
- `--non-interactive`: executar integração sem prompts
- `--mode <local|remote>`: modo de integração
- `--import-from <provider>`: provedor de migração a ser executado durante a integração
- `--import-source <path>`: diretório inicial do agente de origem para `--import-from`
- `--import-secrets`: importar segredos compatíveis durante a migração de integração
- `--remote-url <url>`: URL WebSocket do Gateway remoto
- `--remote-token <token>`: token do Gateway remoto

Para executar a integração via setup:

```bash
openclaw setup --wizard
```

Observações:

- `openclaw setup` simples inicializa a configuração + o espaço de trabalho sem o fluxo completo de integração.
- Após o setup simples, execute `openclaw configure` para escolher modelos, canais, Gateway, plugins, Skills ou verificações de integridade.
- A integração é executada automaticamente quando quaisquer flags de integração estão presentes (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Se o estado do Hermes for detectado, a integração interativa pode oferecer migração automaticamente. A integração por importação exige uma configuração nova; use [Migrar](/pt-BR/cli/migrate) para planos de simulação, backups e modo de sobrescrita fora da integração.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Visão geral da instalação](/pt-BR/install)
