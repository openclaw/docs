---
read_when:
    - Você quer gerenciar os hooks do agente
    - Você quer verificar a disponibilidade de hooks ou habilitar hooks do espaço de trabalho
summary: Referência da CLI para `openclaw hooks` (hooks de agente)
title: Hooks
x-i18n:
    generated_at: "2026-07-12T15:00:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Gerencie hooks de agentes (automações orientadas a eventos para comandos como `/new`, `/reset` e a inicialização do Gateway). Executar apenas `openclaw hooks` equivale a `openclaw hooks list`.

Relacionado: [Hooks](/pt-BR/automation/hooks) - [Hooks de Plugin](/pt-BR/plugins/hooks)

## Listar hooks

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

Lista os hooks encontrados nos diretórios do espaço de trabalho, gerenciados, extras e incluídos.

- `--eligible`: somente hooks cujos requisitos foram atendidos.
- `--json`: saída estruturada.
- `-v, --verbose`: inclui uma coluna Missing com os requisitos não atendidos.

```
Hooks (4/5 prontos)

Prontos:
  🚀 boot-md ✓ - Executar BOOT.md na inicialização do Gateway
  📎 bootstrap-extra-files ✓ - Injetar arquivos adicionais de inicialização do espaço de trabalho durante a inicialização do agente
  📝 command-logger ✓ - Registrar todos os eventos de comando em um arquivo de auditoria centralizado
  💾 session-memory ✓ - Salvar o contexto da sessão na memória quando o comando /new ou /reset for emitido
```

## Obter informações do hook

```bash
openclaw hooks info <name> [--json]
```

`<name>` é o nome ou a chave do hook (por exemplo, `session-memory`). Exibe a origem, os caminhos de arquivo/handler, a página inicial, os eventos e o status de cada requisito (binários, ambiente, configuração, SO).

## Verificar a elegibilidade

```bash
openclaw hooks check [--json]
```

Exibe um resumo da contagem de prontos/não prontos; quando há hooks não prontos, lista cada um com o motivo do bloqueio.

## Ativar um hook

```bash
openclaw hooks enable <name>
```

Adiciona/atualiza `hooks.internal.entries.<name>.enabled = true` na configuração e também ativa a chave mestra `hooks.internal.enabled` (o Gateway não carrega nenhum handler de hook interno até que pelo menos um esteja configurado). Falha se o hook não existir, for gerenciado por um Plugin ou não estiver elegível (requisitos ausentes).

Hooks gerenciados por Plugins exibem `plugin:<id>` em `hooks list` e não podem ser ativados/desativados aqui; em vez disso, ative ou desative o Plugin responsável.

Reinicie o Gateway após a ativação (reinicie o aplicativo da barra de menus do macOS ou o processo do Gateway em desenvolvimento) para que ele recarregue os hooks.

## Desativar um hook

```bash
openclaw hooks disable <name>
```

Define `hooks.internal.entries.<name>.enabled = false`. Reinicie o Gateway em seguida.

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

Os pacotes de hooks são instalados pelo instalador/atualizador unificado de Plugins; `openclaw hooks install` / `openclaw hooks update` ainda funcionam como aliases obsoletos que exibem um aviso e encaminham para os comandos de `plugins`.

- As especificações npm aceitam somente o registro: nome do pacote mais uma versão exata ou dist-tag opcional. Especificações Git/URL/arquivo e intervalos semver são rejeitados. As instalações de dependências são executadas localmente no projeto com `--ignore-scripts`.
- Especificações simples e `@latest` permanecem no canal estável; se o npm resolver para uma versão de pré-lançamento, o OpenClaw interrompe o processo e solicita que você aceite explicitamente (`@beta`, `@rc` ou uma versão exata de pré-lançamento).
- Arquivos compactados compatíveis: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link` vincula um diretório local em vez de copiá-lo (adiciona-o a `hooks.internal.load.extraDirs`); pacotes de hooks vinculados são hooks gerenciados de um diretório configurado por um operador, não hooks do espaço de trabalho.
- `--pin` registra instalações npm como um `name@version` resolvido exato em `hooks.internal.installs`.
- A instalação copia o pacote para `~/.openclaw/hooks/<id>`, ativa seus hooks em `hooks.internal.entries.*` e registra a instalação em `hooks.internal.installs`.
- Se um hash de integridade armazenado não corresponder mais ao artefato obtido, o OpenClaw exibe um aviso e solicita confirmação antes de continuar; passe a opção global `--yes` para ignorar a solicitação (por exemplo, em CI).

## Hooks incluídos

| Hook                  | Eventos                                           | O que faz                                                                                                      |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | Executa `BOOT.md` na inicialização do Gateway para cada escopo de agente configurado                           |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injeta arquivos adicionais de inicialização (por exemplo, `AGENTS.md`/`TOOLS.md` de monorepo) durante a inicialização do agente |
| command-logger        | `command`                                         | Registra eventos de comando em `~/.openclaw/logs/commands.log`                                                 |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envia avisos visíveis no chat quando a compactação da sessão começa e termina                                  |
| session-memory        | `command:new`, `command:reset`                    | Salva o contexto da sessão na memória ao executar `/new` ou `/reset`                                           |

Ative qualquer hook incluído com `openclaw hooks enable <hook-name>`. Detalhes completos, chaves de configuração e valores padrão: [Hooks incluídos](/pt-BR/automation/hooks#bundled-hooks).

### Arquivo de log do command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # comandos recentes
cat ~/.openclaw/logs/commands.log | jq .          # formatação legível
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # filtrar por ação
```

## Observações

- `hooks list --json`, `info --json` e `check --json` gravam JSON estruturado diretamente na saída padrão.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Hooks de automação](/pt-BR/automation/hooks)
