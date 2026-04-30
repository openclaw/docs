---
read_when:
    - Você quer gerenciar hooks de agentes
    - Você quer verificar a disponibilidade de ganchos ou habilitar ganchos do espaço de trabalho
summary: Referência da CLI para `openclaw hooks` (ganchos de agente)
title: Ganchos
x-i18n:
    generated_at: "2026-04-30T09:41:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ab6b014923dd4776767a6a0333129b85f51d008c63bb9fbdff06228d4c2f4b
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Gerencie ganchos de agentes (automações orientadas a eventos para comandos como `/new`, `/reset` e inicialização do Gateway).

Executar `openclaw hooks` sem subcomando equivale a `openclaw hooks list`.

Relacionado:

- Ganchos: [Ganchos](/pt-BR/automation/hooks)
- Ganchos de Plugin: [Ganchos de Plugin](/pt-BR/plugins/hooks)

## Listar todos os ganchos

```bash
openclaw hooks list
```

Liste todos os ganchos descobertos nos diretórios de workspace, gerenciados, extras e incluídos.
A inicialização do Gateway não carrega manipuladores internos de ganchos até que pelo menos um gancho interno esteja configurado.

**Opções:**

- `--eligible`: Mostra apenas ganchos elegíveis (requisitos atendidos)
- `--json`: Gera saída como JSON
- `-v, --verbose`: Mostra informações detalhadas, incluindo requisitos ausentes

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

Mostra requisitos ausentes para ganchos inelegíveis.

**Exemplo (JSON):**

```bash
openclaw hooks list --json
```

Retorna JSON estruturado para uso programático.

## Obter informações do gancho

```bash
openclaw hooks info <name>
```

Mostra informações detalhadas sobre um gancho específico.

**Argumentos:**

- `<name>`: Nome do gancho ou chave do gancho (por exemplo, `session-memory`)

**Opções:**

- `--json`: Gera saída como JSON

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

## Verificar elegibilidade dos ganchos

```bash
openclaw hooks check
```

Mostra um resumo do status de elegibilidade dos ganchos (quantos estão prontos e quantos não estão).

**Opções:**

- `--json`: Gera saída como JSON

**Exemplo de saída:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Habilitar um gancho

```bash
openclaw hooks enable <name>
```

Habilita um gancho específico adicionando-o à sua configuração (`~/.openclaw/openclaw.json` por padrão).

**Observação:** Ganchos de workspace ficam desabilitados por padrão até serem habilitados aqui ou na configuração. Ganchos gerenciados por plugins mostram `plugin:<id>` em `openclaw hooks list` e não podem ser habilitados/desabilitados aqui. Em vez disso, habilite/desabilite o plugin.

**Argumentos:**

- `<name>`: Nome do gancho (por exemplo, `session-memory`)

**Exemplo:**

```bash
openclaw hooks enable session-memory
```

**Saída:**

```
✓ Enabled hook: 💾 session-memory
```

**O que ele faz:**

- Verifica se o gancho existe e é elegível
- Atualiza `hooks.internal.entries.<name>.enabled = true` na sua configuração
- Salva a configuração no disco

Se o gancho veio de `<workspace>/hooks/`, esta etapa de adesão é obrigatória antes que
o Gateway o carregue.

**Depois de habilitar:**

- Reinicie o Gateway para que os ganchos sejam recarregados (reinício do app da barra de menus no macOS ou reinicie seu processo de Gateway em desenvolvimento).

## Desabilitar um gancho

```bash
openclaw hooks disable <name>
```

Desabilita um gancho específico atualizando sua configuração.

**Argumentos:**

- `<name>`: Nome do gancho (por exemplo, `command-logger`)

**Exemplo:**

```bash
openclaw hooks disable command-logger
```

**Saída:**

```
⏸ Disabled hook: 📝 command-logger
```

**Depois de desabilitar:**

- Reinicie o Gateway para que os ganchos sejam recarregados

## Observações

- `openclaw hooks list --json`, `info --json` e `check --json` escrevem JSON estruturado diretamente em stdout.
- Ganchos gerenciados por plugins não podem ser habilitados ou desabilitados aqui; em vez disso, habilite ou desabilite o plugin proprietário.

## Instalar pacotes de ganchos

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Instale pacotes de ganchos pelo instalador unificado de plugins.

`openclaw hooks install` ainda funciona como alias de compatibilidade, mas imprime um
aviso de descontinuação e encaminha para `openclaw plugins install`.

Especificações npm são **apenas de registro** (nome do pacote + **versão exata** opcional ou
**dist-tag**). Especificações Git/URL/arquivo e intervalos semver são rejeitados. Instalações de
dependências são executadas localmente no projeto com `--ignore-scripts` por segurança, mesmo quando seu
shell tem configurações globais de instalação do npm.

Especificações simples e `@latest` permanecem na trilha estável. Se o npm resolver qualquer uma
delas para uma pré-versão, o OpenClaw para e pede que você opte explicitamente com uma
tag de pré-versão, como `@beta`/`@rc`, ou uma versão de pré-lançamento exata.

**O que ele faz:**

- Copia o pacote de ganchos para `~/.openclaw/hooks/<id>`
- Habilita os ganchos instalados em `hooks.internal.entries.*`
- Registra a instalação em `hooks.internal.installs`

**Opções:**

- `-l, --link`: Vincula um diretório local em vez de copiá-lo (adiciona-o a `hooks.internal.load.extraDirs`)
- `--pin`: Registra instalações npm como `name@version` resolvido exato em `hooks.internal.installs`

**Arquivos compatíveis:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Exemplos:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

Pacotes de ganchos vinculados são tratados como ganchos gerenciados de um diretório
configurado pelo operador, não como ganchos de workspace.

## Atualizar pacotes de ganchos

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Atualize pacotes de ganchos baseados em npm rastreados pelo atualizador unificado de plugins.

`openclaw hooks update` ainda funciona como alias de compatibilidade, mas imprime um
aviso de descontinuação e encaminha para `openclaw plugins update`.

**Opções:**

- `--all`: Atualiza todos os pacotes de ganchos rastreados
- `--dry-run`: Mostra o que mudaria sem gravar

Quando existe um hash de integridade armazenado e o hash do artefato obtido muda,
o OpenClaw imprime um aviso e pede confirmação antes de prosseguir. Use
`--yes` global para ignorar prompts em execuções de CI/não interativas.

## Ganchos incluídos

### session-memory

Salva o contexto da sessão na memória quando você emite `/new` ou `/reset`.

**Habilitar:**

```bash
openclaw hooks enable session-memory
```

**Saída:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Veja:** [documentação de session-memory](/pt-BR/automation/hooks#session-memory)

### bootstrap-extra-files

Injeta arquivos de bootstrap adicionais (por exemplo, `AGENTS.md` / `TOOLS.md` locais do monorepo) durante `agent:bootstrap`.

**Habilitar:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Veja:** [documentação de bootstrap-extra-files](/pt-BR/automation/hooks#bootstrap-extra-files)

### command-logger

Registra todos os eventos de comando em um arquivo de auditoria centralizado.

**Habilitar:**

```bash
openclaw hooks enable command-logger
```

**Saída:** `~/.openclaw/logs/commands.log`

**Ver logs:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Veja:** [documentação de command-logger](/pt-BR/automation/hooks#command-logger)

### boot-md

Executa `BOOT.md` quando o Gateway inicia (depois que os canais iniciam).

**Eventos**: `gateway:startup`

**Habilitar**:

```bash
openclaw hooks enable boot-md
```

**Veja:** [documentação de boot-md](/pt-BR/automation/hooks#boot-md)

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Ganchos de automação](/pt-BR/automation/hooks)
