---
read_when:
    - Você quer gerenciar hooks de agente
    - Você quer inspecionar a disponibilidade de hooks ou habilitar hooks de workspace
summary: Referência de CLI para `openclaw hooks` (hooks de agente)
title: Hooks
x-i18n:
    generated_at: "2026-04-25T13:43:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd84cc984b24996c5509ce6b69f9bb76c61c4fa65b002809fdf5776abe67b48b
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Gerencie hooks de agente (automações orientadas a eventos para comandos como `/new`, `/reset` e inicialização do gateway).

Executar `openclaw hooks` sem subcomando equivale a `openclaw hooks list`.

Relacionado:

- Hooks: [Hooks](/pt-BR/automation/hooks)
- Hooks de Plugin: [Plugin hooks](/pt-BR/plugins/hooks)

## Listar todos os hooks

```bash
openclaw hooks list
```

Lista todos os hooks descobertos nos diretórios de workspace, gerenciados, extras e incluídos.
A inicialização do gateway não carrega handlers de hook internos até que pelo menos um hook interno esteja configurado.

**Opções:**

- `--eligible`: mostra apenas hooks elegíveis (requisitos atendidos)
- `--json`: gera saída em JSON
- `-v, --verbose`: mostra informações detalhadas, incluindo requisitos ausentes

**Exemplo de saída:**

```
Hooks (4/4 prontos)

Prontos:
  🚀 boot-md ✓ - Executar BOOT.md na inicialização do gateway
  📎 bootstrap-extra-files ✓ - Injetar arquivos extras de bootstrap do workspace durante o bootstrap do agente
  📝 command-logger ✓ - Registrar todos os eventos de comando em um arquivo centralizado de auditoria
  💾 session-memory ✓ - Salvar o contexto da sessão na memória quando o comando /new ou /reset for emitido
```

**Exemplo (verboso):**

```bash
openclaw hooks list --verbose
```

Mostra requisitos ausentes para hooks não elegíveis.

**Exemplo (JSON):**

```bash
openclaw hooks list --json
```

Retorna JSON estruturado para uso programático.

## Obter informações de um hook

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
💾 session-memory ✓ Pronto

Salvar o contexto da sessão na memória quando o comando /new ou /reset for emitido

Detalhes:
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

- `--json`: gera saída em JSON

**Exemplo de saída:**

```
Status dos hooks

Total de hooks: 4
Prontos: 4
Não prontos: 0
```

## Habilitar um hook

```bash
openclaw hooks enable <name>
```

Habilita um hook específico adicionando-o à sua configuração (`~/.openclaw/openclaw.json` por padrão).

**Observação:** Hooks de workspace ficam desabilitados por padrão até serem habilitados aqui ou na configuração. Hooks gerenciados por plugins mostram `plugin:<id>` em `openclaw hooks list` e não podem ser habilitados/desabilitados aqui. Habilite/desabilite o plugin em vez disso.

**Argumentos:**

- `<name>`: nome do hook (por exemplo, `session-memory`)

**Exemplo:**

```bash
openclaw hooks enable session-memory
```

**Saída:**

```
✓ Hook habilitado: 💾 session-memory
```

**O que isso faz:**

- Verifica se o hook existe e é elegível
- Atualiza `hooks.internal.entries.<name>.enabled = true` na sua configuração
- Salva a configuração no disco

Se o hook veio de `<workspace>/hooks/`, esta etapa de opt-in é necessária antes
que o Gateway o carregue.

**Depois de habilitar:**

- Reinicie o gateway para que os hooks sejam recarregados (reinicie o app da barra de menu no macOS, ou reinicie seu processo de gateway em dev).

## Desabilitar um hook

```bash
openclaw hooks disable <name>
```

Desabilita um hook específico atualizando sua configuração.

**Argumentos:**

- `<name>`: nome do hook (por exemplo, `command-logger`)

**Exemplo:**

```bash
openclaw hooks disable command-logger
```

**Saída:**

```
⏸ Hook desabilitado: 📝 command-logger
```

**Depois de desabilitar:**

- Reinicie o gateway para que os hooks sejam recarregados

## Observações

- `openclaw hooks list --json`, `info --json` e `check --json` escrevem JSON estruturado diretamente em stdout.
- Hooks gerenciados por plugins não podem ser habilitados ou desabilitados aqui; habilite ou desabilite o plugin proprietário em vez disso.

## Instalar pacotes de hooks

```bash
openclaw plugins install <package>        # ClawHub primeiro, depois npm
openclaw plugins install <package> --pin  # fixa a versão
openclaw plugins install <path>           # caminho local
```

Instale pacotes de hooks por meio do instalador unificado de plugins.

`openclaw hooks install` ainda funciona como alias de compatibilidade, mas exibe um
aviso de descontinuação e encaminha para `openclaw plugins install`.

Especificações npm são **somente registro** (nome do pacote + **versão exata** opcional ou
**dist-tag**). Especificações Git/URL/arquivo e intervalos semver são rejeitados. Instalações de
dependências são executadas com `--ignore-scripts` por segurança.

Especificações sem versão e `@latest` permanecem no canal estável. Se o npm resolver qualquer
um desses para uma pré-versão, o OpenClaw interrompe e pede que você faça opt-in explicitamente com uma
tag de pré-versão como `@beta`/`@rc` ou uma versão exata de pré-versão.

**O que isso faz:**

- Copia o pacote de hooks para `~/.openclaw/hooks/<id>`
- Habilita os hooks instalados em `hooks.internal.entries.*`
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

Atualize pacotes de hooks rastreados baseados em npm por meio do atualizador unificado de plugins.

`openclaw hooks update` ainda funciona como alias de compatibilidade, mas exibe um
aviso de descontinuação e encaminha para `openclaw plugins update`.

**Opções:**

- `--all`: atualiza todos os pacotes de hooks rastreados
- `--dry-run`: mostra o que mudaria sem gravar

Quando existe um hash de integridade armazenado e o hash do artefato buscado muda,
o OpenClaw exibe um aviso e pede confirmação antes de prosseguir. Use
o global `--yes` para ignorar prompts em execuções de CI/não interativas.

## Hooks incluídos

### session-memory

Salva o contexto da sessão na memória quando você emite `/new` ou `/reset`.

**Habilitar:**

```bash
openclaw hooks enable session-memory
```

**Saída:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Consulte:** [documentação do session-memory](/pt-BR/automation/hooks#session-memory)

### bootstrap-extra-files

Injeta arquivos adicionais de bootstrap (por exemplo `AGENTS.md` / `TOOLS.md` locais de monorepo) durante `agent:bootstrap`.

**Habilitar:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Consulte:** [documentação do bootstrap-extra-files](/pt-BR/automation/hooks#bootstrap-extra-files)

### command-logger

Registra todos os eventos de comando em um arquivo centralizado de auditoria.

**Habilitar:**

```bash
openclaw hooks enable command-logger
```

**Saída:** `~/.openclaw/logs/commands.log`

**Ver logs:**

```bash
# Comandos recentes
tail -n 20 ~/.openclaw/logs/commands.log

# Formatar para leitura
cat ~/.openclaw/logs/commands.log | jq .

# Filtrar por ação
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Consulte:** [documentação do command-logger](/pt-BR/automation/hooks#command-logger)

### boot-md

Executa `BOOT.md` quando o gateway inicia (depois que os canais iniciam).

**Eventos**: `gateway:startup`

**Habilitar**:

```bash
openclaw hooks enable boot-md
```

**Consulte:** [documentação do boot-md](/pt-BR/automation/hooks#boot-md)

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Hooks de automação](/pt-BR/automation/hooks)
