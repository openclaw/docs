---
read_when:
    - Você quer gerenciar hooks do agente
    - Você quer inspecionar a disponibilidade de hooks ou ativar hooks do workspace
summary: Referência da CLI para `openclaw hooks` (hooks do agente)
title: Hooks
x-i18n:
    generated_at: "2026-04-24T05:45:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84f209e90a5679b889112fc03e22ea94f486ded9db25b5238c0366283695a5b9
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Gerencie hooks do agente (automações orientadas a eventos para comandos como `/new`, `/reset` e inicialização do gateway).

Executar `openclaw hooks` sem subcomando é equivalente a `openclaw hooks list`.

Relacionado:

- Hooks: [Hooks](/pt-BR/automation/hooks)
- Hooks de Plugin: [Hooks de Plugin](/pt-BR/plugins/architecture-internals#provider-runtime-hooks)

## Listar todos os hooks

```bash
openclaw hooks list
```

Lista todos os hooks descobertos em diretórios de workspace, gerenciados, extras e empacotados.
A inicialização do gateway não carrega handlers internos de hook até que pelo menos um hook interno esteja configurado.

**Opções:**

- `--eligible`: mostra apenas hooks elegíveis (requisitos atendidos)
- `--json`: gera saída em JSON
- `-v, --verbose`: mostra informações detalhadas, incluindo requisitos ausentes

**Exemplo de saída:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Exemplo (verbose):**

```bash
openclaw hooks list --verbose
```

Mostra requisitos ausentes para hooks não elegíveis.

**Exemplo (JSON):**

```bash
openclaw hooks list --json
```

Retorna JSON estruturado para uso programático.

## Obter informações de hook

```bash
openclaw hooks info <name>
```

Mostra informações detalhadas sobre um hook específico.

**Argumentos:**

- `<name>`: nome do hook ou chave do hook (por exemplo, `session-memory`)

**Opções:**

- `--json`: gera saída em JSON

**Exemplo:**

```bash
openclaw hooks info session-memory
```

**Saída:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Verificar elegibilidade de hooks

```bash
openclaw hooks check
```

Mostra um resumo do status de elegibilidade dos hooks (quantos estão prontos vs. não prontos).

**Opções:**

- `--json`: gera saída em JSON

**Exemplo de saída:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Ativar um hook

```bash
openclaw hooks enable <name>
```

Ativa um hook específico adicionando-o à sua configuração (`~/.openclaw/openclaw.json` por padrão).

**Observação:** hooks do workspace vêm desativados por padrão até serem ativados aqui ou na configuração. Hooks gerenciados por plugins mostram `plugin:<id>` em `openclaw hooks list` e não podem ser ativados/desativados aqui. Ative/desative o plugin correspondente.

**Argumentos:**

- `<name>`: nome do hook (por exemplo, `session-memory`)

**Exemplo:**

```bash
openclaw hooks enable session-memory
```

**Saída:**

```
✓ Hook ativado: 💾 session-memory
```

**O que isso faz:**

- Verifica se o hook existe e é elegível
- Atualiza `hooks.internal.entries.<name>.enabled = true` na sua configuração
- Salva a configuração em disco

Se o hook veio de `<workspace>/hooks/`, essa etapa de adesão é obrigatória antes
que o Gateway o carregue.

**Depois de ativar:**

- Reinicie o gateway para recarregar os hooks (reinicie o app da barra de menus no macOS, ou reinicie o processo do gateway em desenvolvimento).

## Desativar um hook

```bash
openclaw hooks disable <name>
```

Desativa um hook específico atualizando sua configuração.

**Argumentos:**

- `<name>`: nome do hook (por exemplo, `command-logger`)

**Exemplo:**

```bash
openclaw hooks disable command-logger
```

**Saída:**

```
⏸ Hook desativado: 📝 command-logger
```

**Depois de desativar:**

- Reinicie o gateway para recarregar os hooks

## Observações

- `openclaw hooks list --json`, `info --json` e `check --json` gravam JSON estruturado diretamente em stdout.
- Hooks gerenciados por plugins não podem ser ativados nem desativados aqui; ative ou desative o plugin proprietário em vez disso.

## Instalar pacotes de hooks

```bash
openclaw plugins install <package>        # ClawHub primeiro, depois npm
openclaw plugins install <package> --pin  # fixa a versão
openclaw plugins install <path>           # caminho local
```

Instale pacotes de hooks por meio do instalador unificado de plugins.

`openclaw hooks install` ainda funciona como alias de compatibilidade, mas exibe um
aviso de descontinuação e encaminha para `openclaw plugins install`.

Especificações npm são **somente de registro** (nome do pacote + **versão exata** opcional ou
**dist-tag**). Especificações git/URL/arquivo e intervalos semver são rejeitados. Instalações de
dependências são executadas com `--ignore-scripts` por segurança.

Especificações simples e `@latest` permanecem no canal estável. Se o npm resolver qualquer
um deles para uma versão de pré-lançamento, o OpenClaw interrompe e pede que você opte explicitamente
por uma tag de pré-lançamento como `@beta`/`@rc` ou uma versão exata de pré-lançamento.

**O que isso faz:**

- Copia o pacote de hooks para `~/.openclaw/hooks/<id>`
- Ativa os hooks instalados em `hooks.internal.entries.*`
- Registra a instalação em `hooks.internal.installs`

**Opções:**

- `-l, --link`: vincula um diretório local em vez de copiar (adiciona-o a `hooks.internal.load.extraDirs`)
- `--pin`: registra instalações npm como `name@version` exato resolvido em `hooks.internal.installs`

**Arquivos compatíveis:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Exemplos:**

```bash
# Diretório local
openclaw plugins install ./my-hook-pack

# Arquivo local
openclaw plugins install ./my-hook-pack.zip

# Pacote npm
openclaw plugins install @openclaw/my-hook-pack

# Vincular um diretório local sem copiar
openclaw plugins install -l ./my-hook-pack
```

Pacotes de hooks vinculados são tratados como hooks gerenciados de um
diretório configurado pelo operador, não como hooks do workspace.

## Atualizar pacotes de hooks

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Atualize pacotes de hooks baseados em npm rastreados por meio do atualizador unificado de plugins.

`openclaw hooks update` ainda funciona como alias de compatibilidade, mas exibe um
aviso de descontinuação e encaminha para `openclaw plugins update`.

**Opções:**

- `--all`: atualiza todos os pacotes de hooks rastreados
- `--dry-run`: mostra o que mudaria sem gravar

Quando existe um hash de integridade armazenado e o hash do artefato buscado muda,
o OpenClaw exibe um aviso e pede confirmação antes de continuar. Use
`--yes` global para ignorar prompts em execuções de CI/não interativas.

## Hooks empacotados

### session-memory

Salva o contexto da sessão na memória quando você emite `/new` ou `/reset`.

**Ativar:**

```bash
openclaw hooks enable session-memory
```

**Saída:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Consulte:** [documentação de session-memory](/pt-BR/automation/hooks#session-memory)

### bootstrap-extra-files

Injeta arquivos adicionais de bootstrap (por exemplo, `AGENTS.md` / `TOOLS.md` locais de monorepo) durante `agent:bootstrap`.

**Ativar:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Consulte:** [documentação de bootstrap-extra-files](/pt-BR/automation/hooks#bootstrap-extra-files)

### command-logger

Registra todos os eventos de comando em um arquivo centralizado de auditoria.

**Ativar:**

```bash
openclaw hooks enable command-logger
```

**Saída:** `~/.openclaw/logs/commands.log`

**Ver logs:**

```bash
# Comandos recentes
tail -n 20 ~/.openclaw/logs/commands.log

# Formatação legível
cat ~/.openclaw/logs/commands.log | jq .

# Filtrar por ação
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Consulte:** [documentação de command-logger](/pt-BR/automation/hooks#command-logger)

### boot-md

Executa `BOOT.md` quando o gateway é iniciado (após os canais iniciarem).

**Eventos**: `gateway:startup`

**Ativar**:

```bash
openclaw hooks enable boot-md
```

**Consulte:** [documentação de boot-md](/pt-BR/automation/hooks#boot-md)

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Hooks de automação](/pt-BR/automation/hooks)
