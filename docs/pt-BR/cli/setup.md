---
read_when:
    - Você está fazendo a configuração inicial com o assistente de integração da CLI
    - Você quer definir o caminho padrão do espaço de trabalho
    - Você precisa do sinalizador de configuração somente de baseline para scripts
summary: Referência da CLI para `openclaw setup` (alias para integração inicial, com configuração de linha de base disponível via flag)
title: Configuração
x-i18n:
    generated_at: "2026-06-30T22:10:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Execute o fluxo completo de integração inicial da CLI. `openclaw setup` é um alias para `openclaw onboard`; use `--baseline` quando você só precisa inicializar as pastas de configuração/workspace sem o assistente.

<Note>
`openclaw setup` é para instalações com configuração mutável. No modo Nix (`OPENCLAW_NIX_MODE=1`), o OpenClaw recusa gravações de setup porque o arquivo de configuração é gerenciado pelo Nix. Use o [Início Rápido do nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oficial ou a configuração de origem equivalente para outro pacote Nix.
</Note>

## Opções

| Flag                       | Descrição                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Diretório de workspace do agente (padrão `~/.openclaw/workspace`; armazenado como `agents.defaults.workspace`). |
| `--baseline`               | Cria as pastas básicas de configuração/workspace/sessão sem integração inicial.                     |
| `--wizard`                 | Aceito por compatibilidade; o setup executa a integração inicial por padrão.                        |
| `--non-interactive`        | Executa a integração inicial sem prompts.                                                           |
| `--accept-risk`            | Reconhece o risco de acesso de agente ao sistema inteiro; obrigatório com `--non-interactive`.      |
| `--mode <mode>`            | Modo de integração inicial: `local` ou `remote`.                                                    |
| `--import-from <provider>` | Provedor de migração a ser executado durante a integração inicial.                                  |
| `--import-source <path>`   | Diretório inicial do agente de origem para `--import-from`.                                         |
| `--import-secrets`         | Importa segredos compatíveis durante a migração da integração inicial.                              |
| `--remote-url <url>`       | URL WebSocket do Gateway remoto.                                                                    |
| `--remote-token <token>`   | Token do Gateway remoto (opcional).                                                                 |

### Modo básico

`openclaw setup --baseline` preserva o comportamento antigo somente básico: cria os diretórios de configuração, workspace e sessão, depois sai sem executar a integração inicial.

## Exemplos

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Observações

- `openclaw setup` simples executa a mesma jornada guiada que `openclaw onboard`.
- Após o setup básico, execute `openclaw setup` ou `openclaw onboard` para a jornada guiada completa, `openclaw configure` para mudanças direcionadas, ou `openclaw channels add` para adicionar contas de canal.
- Se o estado do Hermes for detectado, a integração inicial interativa pode oferecer a migração automaticamente. A integração inicial de importação exige um setup novo; use [Migrar](/pt-BR/cli/migrate) para planos de simulação, backups e modo de sobrescrita fora da integração inicial.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Integração inicial (CLI)](/pt-BR/start/wizard)
- [Primeiros passos](/pt-BR/start/getting-started)
- [Visão geral da instalação](/pt-BR/install)
