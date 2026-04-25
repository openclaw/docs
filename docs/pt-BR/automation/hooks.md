---
read_when:
    - Você quer automação orientada a eventos para `/new`, `/reset`, `/stop` e eventos do ciclo de vida do agente
    - Você quer criar, instalar ou depurar hooks
summary: 'Hooks: automação orientada a eventos para comandos e eventos do ciclo de vida'
title: Hooks
x-i18n:
    generated_at: "2026-04-25T13:40:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 437b8b8dc37e9ec9c10bbdddc4d63184ccc46e89bc532aea0c5bd176404186f6
    source_path: automation/hooks.md
    workflow: 15
---

Hooks são pequenos scripts executados quando algo acontece dentro do Gateway. Eles podem ser descobertos a partir de diretórios e inspecionados com `openclaw hooks`. O Gateway carrega hooks internos somente depois que você ativa hooks ou configura pelo menos uma entrada de hook, hook pack, manipulador legado ou diretório extra de hooks.

Há dois tipos de hooks no OpenClaw:

- **Hooks internos** (esta página): executados dentro do Gateway quando eventos do agente são disparados, como `/new`, `/reset`, `/stop` ou eventos do ciclo de vida.
- **Webhooks**: endpoints HTTP externos que permitem que outros sistemas acionem trabalho no OpenClaw. Consulte [Webhooks](/pt-BR/automation/cron-jobs#webhooks).

Hooks também podem ser incluídos em plugins. `openclaw hooks list` mostra tanto hooks independentes quanto hooks gerenciados por plugins.

## Início rápido

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## Tipos de eventos

| Evento                   | Quando é disparado                               |
| ------------------------ | ------------------------------------------------ |
| `command:new`            | Comando `/new` emitido                           |
| `command:reset`          | Comando `/reset` emitido                         |
| `command:stop`           | Comando `/stop` emitido                          |
| `command`                | Qualquer evento de comando (listener geral)      |
| `session:compact:before` | Antes de Compaction resumir o histórico          |
| `session:compact:after`  | Depois que Compaction é concluída                |
| `session:patch`          | Quando propriedades da sessão são modificadas    |
| `agent:bootstrap`        | Antes de os arquivos de bootstrap serem injetados no workspace |
| `gateway:startup`        | Depois que os canais iniciam e os hooks são carregados |
| `message:received`       | Mensagem recebida de qualquer canal              |
| `message:transcribed`    | Depois que a transcrição de áudio é concluída    |
| `message:preprocessed`   | Depois que todo o processamento de mídia e compreensão de links é concluído |
| `message:sent`           | Mensagem enviada entregue                        |

## Como escrever hooks

### Estrutura do hook

Cada hook é um diretório que contém dois arquivos:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### Formato de `HOOK.md`

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Campos de metadados** (`metadata.openclaw`):

| Campo      | Descrição                                            |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji exibido na CLI                                 |
| `events`   | Array de eventos a serem escutados                   |
| `export`   | Export nomeado a usar (o padrão é `"default"`)       |
| `os`       | Plataformas obrigatórias (por exemplo, `["darwin", "linux"]`) |
| `requires` | `bins`, `anyBins`, `env` ou caminhos `config` obrigatórios |
| `always`   | Ignora verificações de elegibilidade (booleano)      |
| `install`  | Métodos de instalação                                |

### Implementação do manipulador

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Cada evento inclui: `type`, `action`, `sessionKey`, `timestamp`, `messages` (faça push para enviar ao usuário) e `context` (dados específicos do evento). Contextos de hooks de plugin de agente e ferramenta também podem incluir `trace`, um contexto de rastreamento de diagnóstico compatível com W3C e somente leitura que plugins podem repassar para logs estruturados para correlação OTEL.

### Destaques do contexto de evento

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensagem** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dados específicos do provedor, incluindo `senderId`, `senderName`, `guildId`).

**Eventos de mensagem** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensagem** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensagem** (`message:preprocessed`): `context.bodyForAgent` (corpo final enriquecido), `context.from`, `context.channelId`.

**Eventos de bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutável), `context.agentId`.

**Eventos de patch de sessão** (`session:patch`): `context.sessionEntry`, `context.patch` (somente campos alterados), `context.cfg`. Somente clientes privilegiados podem disparar eventos de patch.

**Eventos de Compaction**: `session:compact:before` inclui `messageCount`, `tokenCount`. `session:compact:after` adiciona `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Descoberta de hooks

Os hooks são descobertos nestes diretórios, em ordem crescente de precedência de substituição:

1. **Hooks incluídos**: distribuídos com o OpenClaw
2. **Hooks de plugin**: hooks incluídos em plugins instalados
3. **Hooks gerenciados**: `~/.openclaw/hooks/` (instalados pelo usuário, compartilhados entre workspaces). Diretórios extras de `hooks.internal.load.extraDirs` compartilham essa precedência.
4. **Hooks de workspace**: `<workspace>/hooks/` (por agente, desativados por padrão até serem ativados explicitamente)

Hooks de workspace podem adicionar novos nomes de hook, mas não podem substituir hooks incluídos, gerenciados ou fornecidos por plugins com o mesmo nome.

O Gateway ignora a descoberta de hooks internos na inicialização até que hooks internos sejam configurados. Ative um hook incluído ou gerenciado com `openclaw hooks enable <name>`, instale um hook pack ou defina `hooks.internal.enabled=true` para aderir. Quando você ativa um hook nomeado, o Gateway carrega somente o manipulador desse hook; `hooks.internal.enabled=true`, diretórios extras de hooks e manipuladores legados ativam a descoberta ampla.

### Hook packs

Hook packs são pacotes npm que exportam hooks via `openclaw.hooks` em `package.json`. Instale com:

```bash
openclaw plugins install <path-or-spec>
```

Especificações npm são aceitas apenas pelo registro (nome do pacote + versão exata opcional ou dist-tag). Especificações Git/URL/arquivo e intervalos semver são rejeitados.

## Hooks incluídos

| Hook                  | Eventos                        | O que ele faz                                         |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Salva o contexto da sessão em `<workspace>/memory/`   |
| bootstrap-extra-files | `agent:bootstrap`              | Injeta arquivos extras de bootstrap a partir de padrões glob |
| command-logger        | `command`                      | Registra todos os comandos em `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Executa `BOOT.md` quando o gateway inicia             |

Ative qualquer hook incluído:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalhes de session-memory

Extrai as últimas 15 mensagens de usuário/assistente, gera um slug de nome de arquivo descritivo via LLM e salva em `<workspace>/memory/YYYY-MM-DD-slug.md`. Requer que `workspace.dir` esteja configurado.

<a id="bootstrap-extra-files"></a>

### Configuração de bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Os caminhos são resolvidos em relação ao workspace. Somente nomes-base de bootstrap reconhecidos são carregados (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalhes de command-logger

Registra todo comando de barra em `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Detalhes de boot-md

Executa `BOOT.md` a partir do workspace ativo quando o gateway inicia.

## Hooks de plugin

Plugins podem registrar hooks tipados por meio do Plugin SDK para uma integração mais profunda:
interceptando chamadas de ferramentas, modificando prompts, controlando o fluxo de mensagens e mais.
Use hooks de plugin quando precisar de `before_tool_call`, `before_agent_reply`,
`before_install` ou outros hooks do ciclo de vida em processo.

Para a referência completa de hooks de plugin, consulte [Plugin hooks](/pt-BR/plugins/hooks).

## Configuração

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Variáveis de ambiente por hook:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Diretórios extras de hooks:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
O formato legado de configuração em array `hooks.internal.handlers` ainda é compatível por retrocompatibilidade, mas hooks novos devem usar o sistema baseado em descoberta.
</Note>

## Referência da CLI

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Boas práticas

- **Mantenha os manipuladores rápidos.** Hooks são executados durante o processamento de comandos. Dispare trabalho pesado em segundo plano com `void processInBackground(event)`.
- **Trate erros com elegância.** Envolva operações arriscadas em try/catch; não lance exceções para que outros manipuladores possam ser executados.
- **Filtre eventos cedo.** Retorne imediatamente se o tipo/ação do evento não for relevante.
- **Use chaves de evento específicas.** Prefira `"events": ["command:new"]` em vez de `"events": ["command"]` para reduzir sobrecarga.

## Solução de problemas

### Hook não descoberto

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook não elegível

```bash
openclaw hooks info my-hook
```

Verifique se há binários ausentes (PATH), variáveis de ambiente, valores de configuração ou compatibilidade com o sistema operacional.

### Hook não está sendo executado

1. Verifique se o hook está ativado: `openclaw hooks list`
2. Reinicie o processo do gateway para que os hooks sejam recarregados.
3. Verifique os logs do gateway: `./scripts/clawlog.sh | grep hook`

## Relacionado

- [CLI Reference: hooks](/pt-BR/cli/hooks)
- [Webhooks](/pt-BR/automation/cron-jobs#webhooks)
- [Plugin hooks](/pt-BR/plugins/hooks) — hooks do ciclo de vida de plugins em processo
- [Configuration](/pt-BR/gateway/configuration-reference#hooks)
