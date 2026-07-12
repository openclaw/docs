---
read_when:
    - Você quer gerenciar os hooks do agente
    - Você deseja verificar a disponibilidade de hooks ou habilitar hooks no espaço de trabalho
summary: Referência da CLI para `openclaw hooks` (hooks de agente)
title: Ganchos
x-i18n:
    generated_at: "2026-07-11T23:49:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Gerencie hooks de agentes (automações orientadas a eventos para comandos como `/new`, `/reset` e a inicialização do Gateway). Executar apenas `openclaw hooks` equivale a `openclaw hooks list`.

Relacionado: [Hooks](/pt-BR/automation/hooks) - [Hooks de Plugins](/pt-BR/plugins/hooks)

## Listar hooks

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

Lista os hooks descobertos nos diretórios do espaço de trabalho, gerenciados, extras e integrados.

- `--eligible`: somente hooks cujos requisitos são atendidos.
- `--json`: saída estruturada.
- `-v, --verbose`: inclui uma coluna Ausente com os requisitos não atendidos.

```
Hooks (4/5 prontos)

Prontos:
  🚀 boot-md ✓ - Executa BOOT.md na inicialização do Gateway
  📎 bootstrap-extra-files ✓ - Injeta arquivos adicionais de inicialização do espaço de trabalho durante a inicialização do agente
  📝 command-logger ✓ - Registra todos os eventos de comando em um arquivo de auditoria centralizado
  💾 session-memory ✓ - Salva o contexto da sessão na memória quando o comando /new ou /reset é emitido
```

## Obter informações do hook

```bash
openclaw hooks info <name> [--json]
```

`<name>` é o nome ou a chave do hook (por exemplo, `session-memory`). Mostra a origem, os caminhos do arquivo/manipulador, a página inicial, os eventos e o status de cada requisito (binários, ambiente, configuração e sistema operacional).

## Verificar qualificação

```bash
openclaw hooks check [--json]
```

Exibe um resumo da contagem de hooks prontos/não prontos; quando há hooks não prontos, lista cada um com o motivo do bloqueio.

## Habilitar um hook

```bash
openclaw hooks enable <name>
```

Adiciona/atualiza `hooks.internal.entries.<name>.enabled = true` na configuração e também ativa o interruptor mestre `hooks.internal.enabled` (o Gateway não carrega nenhum manipulador de hook interno até que pelo menos um seja configurado). Falha se o hook não existir, for gerenciado por um Plugin ou não estiver qualificado (requisitos ausentes).

Hooks gerenciados por Plugins exibem `plugin:<id>` em `hooks list` e não podem ser habilitados/desabilitados aqui; em vez disso, habilite ou desabilite o Plugin proprietário.

Reinicie o Gateway após a habilitação (reinicie o aplicativo da barra de menus do macOS ou o processo do Gateway no ambiente de desenvolvimento) para que ele recarregue os hooks.

## Desabilitar um hook

```bash
openclaw hooks disable <name>
```

Define `hooks.internal.entries.<name>.enabled = false`. Reinicie o Gateway depois disso.

## Instalar e atualizar pacotes de hooks

```bash
openclaw plugins install <package>        # npm por padrão
openclaw plugins install npm:<package>    # somente npm
openclaw plugins install <package> --pin  # fixa a versão resolvida
openclaw plugins install <path>           # diretório local ou arquivo compactado
openclaw plugins install -l <path>        # vincula um diretório local em vez de copiá-lo

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

Os pacotes de hooks são instalados por meio do instalador/atualizador unificado de Plugins; `openclaw hooks install` / `openclaw hooks update` ainda funcionam como aliases obsoletos que exibem um aviso e encaminham para os comandos de `plugins`.

- As especificações do npm são restritas ao registro: nome do pacote acompanhado opcionalmente de uma versão exata ou dist-tag. Especificações de Git/URL/arquivo e intervalos semver são rejeitados. As instalações de dependências são executadas localmente no projeto com `--ignore-scripts`.
- Especificações simples e `@latest` permanecem no canal estável; se o npm resolver para uma versão de pré-lançamento, o OpenClaw interrompe a operação e solicita que você confirme explicitamente (`@beta`, `@rc` ou uma versão exata de pré-lançamento).
- Arquivos compactados compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link` vincula um diretório local em vez de copiá-lo (adiciona-o a `hooks.internal.load.extraDirs`); pacotes de hooks vinculados são hooks gerenciados de um diretório configurado pelo operador, não hooks do espaço de trabalho.
- `--pin` registra instalações do npm como um `name@version` exato resolvido em `hooks.internal.installs`.
- A instalação copia o pacote para `~/.openclaw/hooks/<id>`, habilita seus hooks em `hooks.internal.entries.*` e registra a instalação em `hooks.internal.installs`.
- Se um hash de integridade armazenado não corresponder mais ao artefato obtido, o OpenClaw exibirá um aviso e solicitará confirmação antes de continuar; use a opção global `--yes` para ignorar a solicitação (por exemplo, em CI).

## Hooks integrados

| Hook                  | Eventos                                           | O que faz                                                                                               |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | Executa `BOOT.md` na inicialização do Gateway para cada escopo de agente configurado                    |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injeta arquivos adicionais de inicialização (por exemplo, `AGENTS.md`/`TOOLS.md` de monorepositórios) durante a inicialização do agente |
| command-logger        | `command`                                         | Registra eventos de comando em `~/.openclaw/logs/commands.log`                                          |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envia avisos visíveis no chat quando a compactação da sessão começa e termina                           |
| session-memory        | `command:new`, `command:reset`                    | Salva o contexto da sessão na memória ao executar `/new` ou `/reset`                                    |

Habilite qualquer hook integrado com `openclaw hooks enable <hook-name>`. Detalhes completos, chaves de configuração e valores padrão: [Hooks integrados](/pt-BR/automation/hooks#bundled-hooks).

### Arquivo de log do command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # comandos recentes
cat ~/.openclaw/logs/commands.log | jq .          # formata para facilitar a leitura
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # filtra por ação
```

## Observações

- `hooks list --json`, `info --json` e `check --json` gravam JSON estruturado diretamente na saída padrão.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Hooks de automação](/pt-BR/automation/hooks)
