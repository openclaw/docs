---
read_when:
    - Você está fazendo a configuração inicial sem o onboarding completo da CLI
    - Você quer definir o caminho padrão do workspace
    - Você precisa de cada flag e de como a configuração decide entre o modo base e o modo assistente.
summary: Referência da CLI para `openclaw setup` (inicializar configuração e espaço de trabalho, opcionalmente executar a integração inicial)
title: Configuração
x-i18n:
    generated_at: "2026-06-27T17:21:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inicializa a configuração base e o espaço de trabalho do agente. Com qualquer sinalizador de onboarding presente, também executa o assistente.

<Note>
`openclaw setup` é para instalações com configuração mutável. No modo Nix (`OPENCLAW_NIX_MODE=1`), o OpenClaw recusa gravações de setup porque o arquivo de configuração é gerenciado pelo Nix. Use o [Início rápido do nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oficial ou a configuração de origem equivalente para outro pacote Nix.
</Note>

## Opções

| Sinalizador                | Descrição                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `--workspace <dir>`        | Diretório do espaço de trabalho do agente (padrão `~/.openclaw/workspace`; armazenado como `agents.defaults.workspace`). |
| `--wizard`                 | Executa o onboarding interativo.                                                                             |
| `--non-interactive`        | Executa o onboarding sem prompts.                                                                            |
| `--accept-risk`            | Reconhece o risco de acesso do agente ao sistema completo; obrigatório com `--non-interactive`.              |
| `--mode <mode>`            | Modo de onboarding: `local` ou `remote`.                                                                     |
| `--import-from <provider>` | Provedor de migração a ser executado durante o onboarding.                                                   |
| `--import-source <path>`   | Diretório inicial do agente de origem para `--import-from`.                                                  |
| `--import-secrets`         | Importa segredos compatíveis durante a migração de onboarding.                                               |
| `--remote-url <url>`       | URL WebSocket do Gateway remoto.                                                                             |
| `--remote-token <token>`   | Token do Gateway remoto (opcional).                                                                          |

### Acionamento automático do assistente

`openclaw setup` executa o assistente quando qualquer um destes sinalizadores está explicitamente presente, mesmo sem `--wizard`:

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Exemplos

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Observações

- `openclaw setup` simples inicializa a configuração e o espaço de trabalho sem executar o fluxo completo de onboarding.
- Após o setup simples, execute `openclaw onboard` para a jornada guiada completa, `openclaw configure` para alterações direcionadas ou `openclaw channels add` para adicionar contas de canais.
- Se o estado do Hermes for detectado, o onboarding interativo pode oferecer a migração automaticamente. O onboarding de importação exige um setup novo; use [Migrar](/pt-BR/cli/migrate) para planos de simulação, backups e modo de sobrescrita fora do onboarding.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Onboarding (CLI)](/pt-BR/start/wizard)
- [Introdução](/pt-BR/start/getting-started)
- [Visão geral da instalação](/pt-BR/install)
