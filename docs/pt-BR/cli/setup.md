---
read_when:
    - Você quer conversar com o OpenClaw para configurá-lo ou repará-lo
    - Você está realizando a configuração inicial com o assistente de integração
    - Você deseja definir o caminho padrão do espaço de trabalho
    - Você precisa da opção de configuração somente de linha de base para scripts
summary: Referência da CLI para `openclaw setup` (chat do agente do sistema com fallback de integração)
title: Configuração
x-i18n:
    generated_at: "2026-07-16T12:21:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3395dbfe94c2f9686757fff85db709f0a9ed0ac9579e8e3c80ee1d51038f8e18
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` é o ponto de entrada do agente do sistema. Em um sistema configurado,
`openclaw setup` sem argumentos abre um chat interativo do OpenClaw. Em um sistema novo, ele
prossegue para a integração guiada. Use `-m`/`--message` para uma solicitação ou
`--baseline` para inicializar as pastas de configuração/espaço de trabalho sem o assistente.

Ordem de roteamento:

1. Qualquer opção de integração (`--wizard`, `--baseline`, espaço de trabalho, redefinição,
   modo não interativo, fluxo, modo, Gateway, daemon, ignorar, importar, remoto ou opções de
   autenticação) executa a integração exatamente como `openclaw onboard`.
2. `-m`/`--message` ou `--yes` executa o agente do sistema.
3. Sem uma opção de roteamento, um sistema interativo configurado abre o OpenClaw. Um
   sistema novo executa a integração. Em um sistema configurado, `--json` exibe a
   visão geral do sistema mesmo sem um TTY; uma opção de integração mantém o
   resumo JSON da integração.

No modo guiado, `--workspace <dir>` é o espaço de trabalho proposto ao OpenClaw;
ele só é persistido depois que a proposta é aprovada. As configurações básica, clássica e
não interativa persistem o espaço de trabalho fornecido por meio de seus fluxos normais.

A detecção de inferência guiada é executada no host do Gateway no macOS ou Linux. A CLI
e o aplicativo para macOS chamam o mesmo detector pertencente ao Gateway, que verifica
modelos configurados, logins de CLI compatíveis, variáveis de ambiente de chave de API e
modelos do Ollama ou LM Studio já instalados. Os modelos locais nunca são baixados por essa
verificação automática; o candidato selecionado deve responder a uma conclusão real antes
que a configuração do provedor e do modelo seja salva.

`setup` aceita os mesmos sinalizadores de integração que `openclaw onboard`, incluindo
autenticação (`--auth-choice`, `--token`, sinalizadores de chave do provedor), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), redefinição (`--reset`, `--reset-scope`), fluxo
(`--flow quickstart|advanced|manual|import`) e sinalizadores para ignorar etapas
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Consulte [Integração](/pt-BR/cli/onboard) e
[Automação da CLI](/pt-BR/start/wizard-cli-automation) para obter a referência completa dos sinalizadores e
exemplos não interativos. `openclaw onboard --modern` continua sendo uma entrada de
compatibilidade para o mesmo assistente do OpenClaw condicionado à inferência.

<Note>
`openclaw setup` destina-se a instalações com configuração mutável. No modo Nix (`OPENCLAW_NIX_MODE=1`), o OpenClaw recusa gravações de configuração porque o arquivo de configuração é gerenciado pelo Nix. Use o [Início rápido do nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) oficial ou a configuração de origem equivalente para outro pacote Nix.
</Note>

## Opções

| Sinalizador                | Descrição                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | Executa uma solicitação do OpenClaw.                                                                  |
| `--yes`                    | Aprova gravações persistentes de configuração para uma solicitação `--message`.                       |
| `--workspace <dir>`        | Proposta de espaço de trabalho no modo guiado; persistida diretamente pelas configurações básica, clássica e não interativa. |
| `--baseline`               | Cria pastas básicas de configuração/espaço de trabalho/sessão sem integração.                         |
| `--wizard`                 | Força a integração interativa.                                                                        |
| `--non-interactive`        | Executa a integração sem prompts.                                                                     |
| `--accept-risk`            | Reconhece o risco de acesso do agente a todo o sistema; obrigatório com `--non-interactive`.          |
| `--mode <mode>`            | Modo de integração: `local` ou `remote`.                                                       |
| `--flow <flow>`            | Fluxo de integração: `quickstart`, `advanced`, `manual` ou `import`.             |
| `--reset`                  | Redefine a configuração + credenciais + sessões antes da integração (espaço de trabalho somente com `--reset-scope full`). |
| `--reset-scope <scope>`    | Escopo da redefinição: `config`, `config+creds+sessions` ou `full`.                              |
| `--import-from <provider>` | Provedor de migração a ser executado durante a integração.                                            |
| `--import-source <path>`   | Diretório inicial do agente de origem para `--import-from`.                                        |
| `--import-secrets`         | Importa segredos compatíveis durante a migração da integração.                                        |
| `--remote-url <url>`       | URL WebSocket do Gateway remoto.                                                                      |
| `--remote-token <token>`   | Token do Gateway remoto (opcional).                                                                   |
| `--json`                   | Sistema configurado: visão geral do OpenClaw. Rota de integração: resumo da integração.               |

`--classic` e `--non-interactive` são mutuamente exclusivos: o modo clássico abre o
assistente com prompts, enquanto a configuração não interativa usa o caminho de automação.

### Modo básico

`openclaw setup --baseline` preserva o comportamento anterior limitado ao modo básico: ele
cria os diretórios de configuração, espaço de trabalho e sessão e, em seguida, encerra sem
executar a integração.

## Exemplos

```bash
openclaw setup
openclaw setup -m "status"
openclaw setup -m "restart gateway" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Observações

- Após a configuração básica, execute `openclaw onboard` para a jornada guiada completa, `openclaw configure` para alterações específicas ou `openclaw channels add` para adicionar contas de canais.
- Se um estado do Hermes for detectado, a integração interativa poderá oferecer a migração automaticamente. A integração com importação exige uma configuração nova; use [Migrar](/pt-BR/cli/migrate) para planos de simulação, backups e modo de substituição fora da integração.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Integração](/pt-BR/cli/onboard)
- [Integração (CLI)](/pt-BR/start/wizard)
- [Primeiros passos](/pt-BR/start/getting-started)
- [Visão geral da instalação](/pt-BR/install)
