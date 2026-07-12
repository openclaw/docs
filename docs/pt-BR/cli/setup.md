---
read_when:
    - Você está fazendo a configuração inicial com o assistente de integração da CLI
    - Você quer definir o caminho padrão do espaço de trabalho
    - Você precisa do sinalizador de configuração somente de linha de base para scripts
summary: Referência da CLI para `openclaw setup` (alias para integração inicial, com configuração básica disponível por flag)
title: Configuração
x-i18n:
    generated_at: "2026-07-11T23:50:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` executa o mesmo fluxo guiado de integração inicial que `openclaw onboard`:
primeiro, ele verifica e persiste a inferência e, em seguida, inicia o Crestodian para configurar
o espaço de trabalho, o Gateway, os canais, as Skills e a integridade. Use `--baseline` quando
precisar apenas inicializar as pastas de configuração e do espaço de trabalho sem o assistente.

No modo guiado, `--workspace <dir>` é o espaço de trabalho proposto ao Crestodian;
ele é persistido somente depois que você aprova essa proposta. As configurações de referência,
clássica e não interativa persistem o espaço de trabalho fornecido por meio de seu fluxo normal.

`setup` aceita as mesmas opções de integração inicial que `openclaw onboard`, incluindo
autenticação (`--auth-choice`, `--token`, opções de chave do provedor), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), redefinição (`--reset`, `--reset-scope`), fluxo
(`--flow quickstart|advanced|manual|import`) e opções para ignorar etapas
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Consulte [Integração inicial](/pt-BR/cli/onboard) e
[Automação da CLI](/pt-BR/start/wizard-cli-automation) para obter a referência completa das opções e
exemplos não interativos. `openclaw onboard --modern` é o alias de compatibilidade
do assistente Crestodian condicionado à inferência e não possui equivalente em `setup`.

<Note>
`openclaw setup` destina-se a instalações com configuração mutável. No modo Nix (`OPENCLAW_NIX_MODE=1`), o OpenClaw recusa gravações da configuração porque o arquivo de configuração é gerenciado pelo Nix. Use o [Início rápido do nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oficial ou a configuração de origem equivalente para outro pacote Nix.
</Note>

## Opções

| Opção                      | Descrição                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Proposta de espaço de trabalho no modo guiado; persistida diretamente pelas configurações de referência, clássica e não interativa. |
| `--baseline`               | Cria as pastas básicas de configuração, espaço de trabalho e sessão sem realizar a integração inicial.           |
| `--wizard`                 | Aceita para fins de compatibilidade; por padrão, a configuração executa a integração inicial.                    |
| `--non-interactive`        | Executa a integração inicial sem solicitações.                                                                    |
| `--accept-risk`            | Reconhece o risco de acesso do agente ao sistema completo; obrigatória com `--non-interactive`.                  |
| `--mode <mode>`            | Modo de integração inicial: `local` ou `remote`.                                                                  |
| `--flow <flow>`            | Fluxo de integração inicial: `quickstart`, `advanced`, `manual` ou `import`.                                      |
| `--reset`                  | Redefine a configuração, as credenciais e as sessões antes da integração inicial (o espaço de trabalho somente com `--reset-scope full`). |
| `--reset-scope <scope>`    | Escopo da redefinição: `config`, `config+creds+sessions` ou `full`.                                               |
| `--import-from <provider>` | Provedor de migração a ser executado durante a integração inicial.                                               |
| `--import-source <path>`   | Diretório inicial do agente de origem para `--import-from`.                                                       |
| `--import-secrets`         | Importa os segredos compatíveis durante a migração da integração inicial.                                        |
| `--remote-url <url>`       | URL WebSocket do Gateway remoto.                                                                                  |
| `--remote-token <token>`   | Token do Gateway remoto (opcional).                                                                               |
| `--json`                   | Gera um resumo em JSON.                                                                                           |

`--classic` e `--non-interactive` são mutuamente exclusivas: o modo clássico abre o
assistente interativo, enquanto a configuração não interativa usa o caminho de automação.

### Modo de referência

`openclaw setup --baseline` preserva o comportamento anterior, restrito à configuração
de referência: ele cria os diretórios de configuração, espaço de trabalho e sessão e,
em seguida, encerra sem executar a integração inicial.

## Exemplos

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Observações

- Após a configuração de referência, execute `openclaw setup` ou `openclaw onboard` para realizar toda a jornada guiada, `openclaw configure` para alterações específicas ou `openclaw channels add` para adicionar contas de canais.
- Se o estado do Hermes for detectado, a integração inicial interativa poderá oferecer a migração automaticamente. A integração inicial por importação exige uma configuração nova; use [Migrar](/pt-BR/cli/migrate) para planos de simulação, backups e o modo de substituição fora da integração inicial.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Integração inicial](/pt-BR/cli/onboard)
- [Integração inicial (CLI)](/pt-BR/start/wizard)
- [Primeiros passos](/pt-BR/start/getting-started)
- [Visão geral da instalação](/pt-BR/install)
