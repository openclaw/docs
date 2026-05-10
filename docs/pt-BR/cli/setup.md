---
read_when:
    - Você está fazendo a configuração de primeira execução sem a integração completa pela CLI
    - Você quer definir o caminho padrão do espaço de trabalho
    - Você precisa de todas as flags e de como a configuração decide entre o modo baseline e o modo assistente
summary: Referência da CLI para `openclaw setup` (inicializa a configuração e o espaço de trabalho, opcionalmente executa a integração inicial)
title: Configuração
x-i18n:
    generated_at: "2026-05-10T19:29:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Inicialize a configuração base e o espaço de trabalho do agente. Com qualquer flag de integração inicial presente, também executa o assistente.

<Note>
`openclaw setup` é para instalações com configuração mutável. No modo Nix (`OPENCLAW_NIX_MODE=1`), o OpenClaw recusa gravações de setup porque o arquivo de configuração é gerenciado pelo Nix. Use o [Início rápido do nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oficial ou a configuração de origem equivalente para outro pacote Nix.
</Note>

## Opções

| Flag                       | Descrição                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Diretório do espaço de trabalho do agente (padrão `~/.openclaw/workspace`; armazenado como `agents.defaults.workspace`). |
| `--wizard`                 | Executa a integração inicial interativa.                                                                   |
| `--non-interactive`        | Executa a integração inicial sem prompts.                                                                  |
| `--mode <mode>`            | Modo de integração inicial: `local` ou `remote`.                                                           |
| `--import-from <provider>` | Provedor de migração a executar durante a integração inicial.                                               |
| `--import-source <path>`   | Diretório inicial do agente de origem para `--import-from`.                                                 |
| `--import-secrets`         | Importa segredos compatíveis durante a migração da integração inicial.                                      |
| `--remote-url <url>`       | URL WebSocket do Gateway remoto.                                                                           |
| `--remote-token <token>`   | Token do Gateway remoto (opcional).                                                                        |

### Acionamento automático do assistente

`openclaw setup` executa o assistente quando qualquer uma destas flags está explicitamente presente, mesmo sem `--wizard`:

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Exemplos

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Observações

- `openclaw setup` simples inicializa a configuração e o espaço de trabalho sem executar o fluxo completo de integração inicial.
- Após o setup simples, execute `openclaw onboard` para a jornada guiada completa, `openclaw configure` para alterações direcionadas ou `openclaw channels add` para adicionar contas de canal.
- Se o estado do Hermes for detectado, a integração inicial interativa pode oferecer a migração automaticamente. A integração inicial com importação exige um setup novo; use [Migrar](/pt-BR/cli/migrate) para planos de simulação, backups e modo de sobrescrita fora da integração inicial.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Integração inicial (CLI)](/pt-BR/start/wizard)
- [Primeiros passos](/pt-BR/start/getting-started)
- [Visão geral da instalação](/pt-BR/install)
