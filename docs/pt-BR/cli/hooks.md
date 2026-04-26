---
read_when:
    - Você quer gerenciar hooks de agente
    - Você quer inspecionar a disponibilidade de hooks ou ativar hooks do workspace
summary: Referência da CLI para `openclaw hooks` (hooks de agente)
title: Hooks
x-i18n:
    generated_at: "2026-04-26T11:26:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 874c3c7e7b603066209857e8b8b39bbe23eb8d1eda148025c74907c05bacd8f2
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Gerencie hooks de agente (automações orientadas por eventos para comandos como `/new`, `/reset` e inicialização do gateway).

Executar `openclaw hooks` sem subcomando equivale a `openclaw hooks list`.

Relacionados:

- Hooks: [Hooks](/pt-BR/automation/hooks)
- Hooks de Plugin: [Hooks de Plugin](/pt-BR/plugins/hooks)

## Listar todos os hooks

```bash
openclaw hooks list
```

Lista todos os hooks descobertos dos diretórios de workspace, gerenciados, extras e empacotados.
A inicialização do gateway não carrega handlers de hook internos até que pelo menos um hook interno seja configurado.

**Opções:**

- `--eligible`: Mostrar apenas hooks elegíveis (requisitos atendidos)
- `--json`: Saída em JSON
- `-v, --verbose`: Mostrar informações detalhadas, incluindo requisitos ausentes

**Exemplo de saída:**

```
Hooks (4/4 prontos)

Prontos:
  🚀 boot-md ✓ - Executar BOOT.md na inicialização do gateway
  📎 bootstrap-extra-files ✓ - Injetar arquivos extras de bootstrap do workspace durante o bootstrap do agente
  📝 command-logger ✓ - Registrar todos os eventos de comando em um arquivo centralizado de auditoria
  💾 session-memory ✓ - Salvar o contexto da sessão na memória quando o comando /new ou /reset for emitido
```

**Exemplo (detalhado):**

```bash
openclaw hooks list --verbose
```

Mostra requisitos ausentes para hooks inelegíveis.

**Exemplo (JSON):**

```bash
openclaw hooks list --json
```

Retorna JSON estruturado para uso programático.

## Obter informações do hook

```bash
openclaw hooks info <name>
```

Mostra informações detalhadas sobre um hook específico.

**Argumentos:**

- `<name>`: Nome do hook ou chave do hook (por exemplo, `session-memory`)

**Opções:**

- `--json`: Saída em JSON

**Exemplo:**

```bash
openclaw hooks info session-memory
```

**Saída:**

```
💾 session-memory ✓ Pronto

Salva o contexto da sessão na memória quando o comando /new ou /reset é emitido

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

- `--json`: Saída em JSON

**Exemplo de saída:**

```
Status dos hooks

Total de hooks: 4
Prontos: 4
Não prontos: 0
```

## Ativar um hook

```bash
openclaw hooks enable <name>
```

Ativa um hook específico adicionando-o à sua configuração (`~/.openclaw/openclaw.json` por padrão).

**Observação:** Hooks de workspace ficam desativados por padrão até serem ativados aqui ou na configuração. Hooks gerenciados por plugins mostram `plugin:<id>` em `openclaw hooks list` e não podem ser ativados/desativados aqui. Em vez disso, ative/desative o plugin.

**Argumentos:**

- `<name>`: Nome do hook (por exemplo, `session-memory`)

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
- Salva a configuração no disco

Se o hook veio de `<workspace>/hooks/`, essa etapa de opt-in é necessária antes
que o Gateway o carregue.

**Após ativar:**

- Reinicie o gateway para que os hooks sejam recarregados (reinício pelo app de barra de menu no macOS, ou reinicie seu processo do gateway em dev).

## Desativar um hook

```bash
openclaw hooks disable <name>
```

Desativa um hook específico atualizando sua configuração.

**Argumentos:**

- `<name>`: Nome do hook (por exemplo, `command-logger`)

**Exemplo:**

```bash
openclaw hooks disable command-logger
```

**Saída:**

```
⏸ Hook desativado: 📝 command-logger
```

**Após desativar:**

- Reinicie o gateway para que os hooks sejam recarregados

## Observações

- `openclaw hooks list --json`, `info --json` e `check --json` gravam JSON estruturado diretamente em stdout.
- Hooks gerenciados por plugins não podem ser ativados ou desativados aqui; em vez disso, ative ou desative o plugin proprietário.

## Instalar pacotes de hooks

```bash
openclaw plugins install <package>        # ClawHub primeiro, depois npm
openclaw plugins install <package> --pin  # fixar versão
openclaw plugins install <path>           # caminho local
```

Instale pacotes de hooks por meio do instalador unificado de plugins.

`openclaw hooks install` ainda funciona como alias de compatibilidade, mas imprime um
aviso de descontinuação e encaminha para `openclaw plugins install`.

Especificações npm são **somente de registro** (nome do pacote + **versão exata** opcional ou
**dist-tag**). Especificações Git/URL/arquivo e intervalos semver são rejeitados. As
instalações de dependência são executadas localmente no projeto com `--ignore-scripts` por segurança, mesmo quando seu
shell tem configurações globais de instalação do npm.

Especificações simples e `@latest` permanecem na trilha estável. Se o npm resolver qualquer uma
delas para uma versão de pré-lançamento, o OpenClaw interrompe e pede que você faça o opt-in explicitamente com uma
tag de pré-lançamento como `@beta`/`@rc` ou uma versão exata de pré-lançamento.

**O que isso faz:**

- Copia o pacote de hooks para `~/.openclaw/hooks/<id>`
- Ativa os hooks instalados em `hooks.internal.entries.*`
- Registra a instalação em `hooks.internal.installs`

**Opções:**

- `-l, --link`: Vincular um diretório local em vez de copiar (adiciona-o a `hooks.internal.load.extraDirs`)
- `--pin`: Registrar instalações npm como `name@version` exato resolvido em `hooks.internal.installs`

**Arquivos suportados:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

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

Pacotes de hooks vinculados são tratados como hooks gerenciados de um
diretório configurado pelo operador, não como hooks de workspace.

## Atualizar pacotes de hooks

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Atualize pacotes de hooks baseados em npm rastreados por meio do atualizador unificado de plugins.

`openclaw hooks update` ainda funciona como alias de compatibilidade, mas imprime um
aviso de descontinuação e encaminha para `openclaw plugins update`.

**Opções:**

- `--all`: Atualizar todos os pacotes de hooks rastreados
- `--dry-run`: Mostrar o que mudaria sem gravar

Quando existe um hash de integridade armazenado e o hash do artefato buscado muda,
o OpenClaw imprime um aviso e pede confirmação antes de prosseguir. Use o `--yes` global para ignorar prompts em execuções de CI/não interativas.

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

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filtrar por ação
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Consulte:** [documentação de command-logger](/pt-BR/automation/hooks#command-logger)

### boot-md

Executa `BOOT.md` quando o gateway inicia (após os canais iniciarem).

**Eventos**: `gateway:startup`

**Ativar**:

```bash
openclaw hooks enable boot-md
```

**Consulte:** [documentação de boot-md](/pt-BR/automation/hooks#boot-md)

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Hooks de automação](/pt-BR/automation/hooks)
