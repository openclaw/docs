---
read_when:
    - Você quer gerenciar hooks de agente
    - Você quer inspecionar a disponibilidade de hooks ou ativar hooks do workspace
summary: Referência da CLI para `openclaw hooks` (hooks de agente)
title: hooks
x-i18n:
    generated_at: "2026-04-23T14:00:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: a09978267783734aaf9bd8bf36aa365ca680a3652afb904db2e5b55dfa64dcd1
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Gerencie hooks de agente (automações orientadas a eventos para comandos como `/new`, `/reset` e inicialização do gateway).

Executar `openclaw hooks` sem subcomando é equivalente a `openclaw hooks list`.

Relacionado:

- Hooks: [Hooks](/pt-BR/automation/hooks)
- Hooks de Plugin: [Plugin hooks](/pt-BR/plugins/architecture#provider-runtime-hooks)

## Listar todos os hooks

```bash
openclaw hooks list
```

Lista todos os hooks descobertos dos diretórios de workspace, gerenciados, extras e incluídos.
A inicialização do gateway não carrega handlers de hook internos até que pelo menos um hook interno seja configurado.

**Opções:**

- `--eligible`: mostrar apenas hooks elegíveis (requisitos atendidos)
- `--json`: saída em JSON
- `-v, --verbose`: mostrar informações detalhadas, incluindo requisitos ausentes

**Exemplo de saída:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Exemplo (detalhado):**

```bash
openclaw hooks list --verbose
```

Mostra os requisitos ausentes para hooks não elegíveis.

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

- `--json`: saída em JSON

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

## Verificar elegibilidade dos hooks

```bash
openclaw hooks check
```

Mostra um resumo do status de elegibilidade dos hooks (quantos estão prontos vs. não prontos).

**Opções:**

- `--json`: saída em JSON

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

Ativa um hook específico adicionando-o à sua configuração (por padrão, `~/.openclaw/openclaw.json`).

**Observação:** hooks de workspace ficam desativados por padrão até serem ativados aqui ou na configuração. Hooks gerenciados por plugins mostram `plugin:<id>` em `openclaw hooks list` e não podem ser ativados/desativados aqui. Ative/desative o plugin em vez disso.

**Argumentos:**

- `<name>`: nome do hook (por exemplo, `session-memory`)

**Exemplo:**

```bash
openclaw hooks enable session-memory
```

**Saída:**

```
✓ Enabled hook: 💾 session-memory
```

**O que isso faz:**

- Verifica se o hook existe e é elegível
- Atualiza `hooks.internal.entries.<name>.enabled = true` na sua configuração
- Salva a configuração em disco

Se o hook veio de `<workspace>/hooks/`, essa etapa de opt-in é necessária antes
que o Gateway o carregue.

**Depois de ativar:**

- Reinicie o gateway para que os hooks sejam recarregados (reinício do app da barra de menu no macOS, ou reinicie seu processo de gateway em desenvolvimento).

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
⏸ Disabled hook: 📝 command-logger
```

**Depois de desativar:**

- Reinicie o gateway para que os hooks sejam recarregados

## Observações

- `openclaw hooks list --json`, `info --json` e `check --json` escrevem JSON estruturado diretamente em stdout.
- Hooks gerenciados por plugins não podem ser ativados nem desativados aqui; ative ou desative o plugin proprietário em vez disso.

## Instalar pacotes de hooks

```bash
openclaw plugins install <package>        # ClawHub primeiro, depois npm
openclaw plugins install <package> --pin  # fixar versão
openclaw plugins install <path>           # caminho local
```

Instale pacotes de hooks por meio do instalador unificado de plugins.

`openclaw hooks install` ainda funciona como alias de compatibilidade, mas exibe um
aviso de descontinuação e encaminha para `openclaw plugins install`.

Especificações npm são **somente de registro** (nome do pacote + **versão exata** opcional ou
**dist-tag**). Especificações git/URL/arquivo e intervalos semver são rejeitados. Instalações
de dependências são executadas com `--ignore-scripts` por segurança.

Especificações simples e `@latest` permanecem na trilha estável. Se o npm resolver qualquer
uma delas para uma pré-versão, o OpenClaw para e pede que você opte explicitamente por uma
tag de pré-versão, como `@beta`/`@rc`, ou uma versão de pré-versão exata.

**O que isso faz:**

- Copia o pacote de hooks para `~/.openclaw/hooks/<id>`
- Ativa os hooks instalados em `hooks.internal.entries.*`
- Registra a instalação em `hooks.internal.installs`

**Opções:**

- `-l, --link`: vincula um diretório local em vez de copiar (adiciona-o a `hooks.internal.load.extraDirs`)
- `--pin`: registra instalações npm como `name@version` resolvido exato em `hooks.internal.installs`

**Arquivos compatíveis:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Exemplos:**

```bash
# Diretório local
openclaw plugins install ./my-hook-pack

# Arquivo local
openclaw plugins install ./my-hook-pack.zip

# Pacote NPM
openclaw plugins install @openclaw/my-hook-pack

# Vincular um diretório local sem copiar
openclaw plugins install -l ./my-hook-pack
```

Pacotes de hooks vinculados são tratados como hooks gerenciados de um diretório
configurado pelo operador, não como hooks de workspace.

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
o OpenClaw exibe um aviso e pede confirmação antes de prosseguir. Use
`--yes` global para ignorar prompts em execuções de CI/não interativas.

## Hooks incluídos

### session-memory

Salva o contexto da sessão na memória quando você executa `/new` ou `/reset`.

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

Registra todos os eventos de comando em um arquivo de auditoria centralizado.

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

Executa `BOOT.md` quando o gateway inicia (depois que os canais iniciam).

**Eventos**: `gateway:startup`

**Ativar**:

```bash
openclaw hooks enable boot-md
```

**Consulte:** [documentação de boot-md](/pt-BR/automation/hooks#boot-md)
