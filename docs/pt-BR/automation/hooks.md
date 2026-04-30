---
read_when:
    - Você quer automação orientada a eventos para /new, /reset, /stop e eventos do ciclo de vida do agente
    - Você quer criar, instalar ou depurar ganchos
summary: 'Ganchos: automação orientada por eventos para comandos e eventos de ciclo de vida'
title: Ganchos
x-i18n:
    generated_at: "2026-04-30T09:34:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6c567ab79fbff8228d174816e9fb4613f0544ea15a99b5917190a4066af0f57
    source_path: automation/hooks.md
    workflow: 16
---

Hooks são pequenos scripts executados quando algo acontece dentro do Gateway. Eles podem ser descobertos a partir de diretórios e inspecionados com `openclaw hooks`. O Gateway carrega hooks internos somente depois que você habilita hooks ou configura pelo menos uma entrada de hook, pacote de hooks, manipulador legado ou diretório extra de hooks.

Há dois tipos de hooks no OpenClaw:

- **Hooks internos** (esta página): executados dentro do Gateway quando eventos do agente disparam, como `/new`, `/reset`, `/stop` ou eventos de ciclo de vida.
- **Webhooks**: endpoints HTTP externos que permitem que outros sistemas acionem trabalho no OpenClaw. Consulte [Webhooks](/pt-BR/automation/cron-jobs#webhooks).

Hooks também podem ser incluídos em plugins. `openclaw hooks list` mostra tanto hooks independentes quanto hooks gerenciados por plugin.

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

## Tipos de evento

| Evento                   | Quando dispara                                             |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Comando `/new` emitido                                     |
| `command:reset`          | Comando `/reset` emitido                                   |
| `command:stop`           | Comando `/stop` emitido                                    |
| `command`                | Qualquer evento de comando (ouvinte geral)                 |
| `session:compact:before` | Antes de a compaction resumir o histórico                  |
| `session:compact:after`  | Depois que a compaction é concluída                        |
| `session:patch`          | Quando propriedades da sessão são modificadas              |
| `agent:bootstrap`        | Antes que arquivos de bootstrap do workspace sejam injetados |
| `gateway:startup`        | Depois que os canais iniciam e os hooks são carregados     |
| `gateway:shutdown`       | Quando o encerramento do Gateway começa                    |
| `gateway:pre-restart`    | Antes de uma reinicialização esperada do Gateway           |
| `message:received`       | Mensagem de entrada de qualquer canal                      |
| `message:transcribed`    | Depois que a transcrição de áudio é concluída              |
| `message:preprocessed`   | Depois que o pré-processamento de mídia e links é concluído ou ignorado |
| `message:sent`           | Mensagem de saída entregue                                 |

## Escrevendo hooks

### Estrutura do hook

Cada hook é um diretório contendo dois arquivos:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### Formato de HOOK.md

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
| `emoji`    | Emoji de exibição para a CLI                         |
| `events`   | Array de eventos a observar                          |
| `export`   | Export nomeado a usar (o padrão é `"default"`)       |
| `os`       | Plataformas necessárias (por exemplo, `["darwin", "linux"]`) |
| `requires` | Caminhos de `bins`, `anyBins`, `env` ou `config` necessários |
| `always`   | Ignorar verificações de elegibilidade (booleano)     |
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

Cada evento inclui: `type`, `action`, `sessionKey`, `timestamp`, `messages` (adicione com push para enviar ao usuário) e `context` (dados específicos do evento). Contextos de hooks de agente e de plugin de ferramenta também podem incluir `trace`, um contexto de rastreamento de diagnóstico somente leitura compatível com W3C que plugins podem passar para logs estruturados para correlação de OTEL.

### Destaques do contexto de evento

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensagem** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dados específicos do provedor, incluindo `senderId`, `senderName`, `guildId`).

**Eventos de mensagem** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensagem** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensagem** (`message:preprocessed`): `context.bodyForAgent` (corpo enriquecido final), `context.from`, `context.channelId`.

**Eventos de bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutável), `context.agentId`.

**Eventos de patch da sessão** (`session:patch`): `context.sessionEntry`, `context.patch` (somente campos alterados), `context.cfg`. Somente clientes privilegiados podem acionar eventos de patch.

**Eventos de compaction**: `session:compact:before` inclui `messageCount`, `tokenCount`. `session:compact:after` adiciona `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observa o usuário emitindo `/stop`; é ciclo de vida de cancelamento/comando, não uma barreira de finalização do agente. Plugins que precisam inspecionar uma resposta final natural e pedir ao agente mais uma passagem devem usar o hook tipado de plugin `before_agent_finalize`. Consulte [Hooks de plugin](/pt-BR/plugins/hooks).

**Eventos de ciclo de vida do Gateway**: `gateway:shutdown` inclui `reason` e `restartExpectedMs` e dispara quando o encerramento do Gateway começa. `gateway:pre-restart` inclui o mesmo contexto, mas dispara somente quando o encerramento faz parte de uma reinicialização esperada e um valor finito de `restartExpectedMs` é fornecido. Durante o encerramento, cada espera de hook de ciclo de vida é de melhor esforço e limitada, para que o encerramento continue se um manipulador travar.

## Descoberta de hooks

Hooks são descobertos a partir destes diretórios, em ordem crescente de precedência de substituição:

1. **Hooks incluídos**: enviados com o OpenClaw
2. **Hooks de plugin**: hooks incluídos dentro de plugins instalados
3. **Hooks gerenciados**: `~/.openclaw/hooks/` (instalados pelo usuário, compartilhados entre workspaces). Diretórios extras de `hooks.internal.load.extraDirs` compartilham essa precedência.
4. **Hooks de workspace**: `<workspace>/hooks/` (por agente, desabilitados por padrão até serem explicitamente habilitados)

Hooks de workspace podem adicionar novos nomes de hook, mas não podem substituir hooks incluídos, gerenciados ou fornecidos por plugin com o mesmo nome.

O Gateway ignora a descoberta de hooks internos na inicialização até que hooks internos estejam configurados. Habilite um hook incluído ou gerenciado com `openclaw hooks enable <name>`, instale um pacote de hooks ou defina `hooks.internal.enabled=true` para participar. Quando você habilita um hook nomeado, o Gateway carrega somente o manipulador desse hook; `hooks.internal.enabled=true`, diretórios extras de hooks e manipuladores legados ativam a descoberta ampla.

### Pacotes de hooks

Pacotes de hooks são pacotes npm que exportam hooks via `openclaw.hooks` em `package.json`. Instale com:

```bash
openclaw plugins install <path-or-spec>
```

Especificações npm são somente de registry (nome do pacote + versão exata opcional ou dist-tag). Especificações Git/URL/arquivo e intervalos semver são rejeitados.

## Hooks incluídos

| Hook                  | Eventos                        | O que faz                                             |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Salva o contexto da sessão em `<workspace>/memory/`   |
| bootstrap-extra-files | `agent:bootstrap`              | Injeta arquivos de bootstrap adicionais a partir de padrões glob |
| command-logger        | `command`                      | Registra todos os comandos em `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Executa `BOOT.md` quando o Gateway inicia             |

Habilite qualquer hook incluído:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalhes de session-memory

Extrai as últimas 15 mensagens de usuário/assistente, gera um slug descritivo de nome de arquivo via LLM e salva em `<workspace>/memory/YYYY-MM-DD-slug.md` usando a data local do host. Exige que `workspace.dir` esteja configurado.

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

Caminhos são resolvidos em relação ao workspace. Somente basenames de bootstrap reconhecidos são carregados (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalhes de command-logger

Registra todos os comandos slash em `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Detalhes de boot-md

Executa `BOOT.md` do workspace ativo quando o Gateway inicia.

## Hooks de plugin

Plugins podem registrar hooks tipados por meio do Plugin SDK para integração mais profunda:
interceptar chamadas de ferramenta, modificar prompts, controlar o fluxo de mensagens e mais.
Use hooks de plugin quando precisar de `before_tool_call`, `before_agent_reply`,
`before_install` ou outros hooks de ciclo de vida em processo.

Para a referência completa de hooks de plugin, consulte [Hooks de plugin](/pt-BR/plugins/hooks).

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
O formato legado de configuração do array `hooks.internal.handlers` ainda é compatível por retrocompatibilidade, mas novos hooks devem usar o sistema baseado em descoberta.
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

- **Mantenha os manipuladores rápidos.** Hooks são executados durante o processamento de comandos. Dispare trabalhos pesados sem aguardar com `void processInBackground(event)`.
- **Trate erros com cuidado.** Envolva operações arriscadas em try/catch; não lance exceções para que outros manipuladores possam executar.
- **Filtre eventos cedo.** Retorne imediatamente se o tipo/ação do evento não for relevante.
- **Use chaves de evento específicas.** Prefira `"events": ["command:new"]` em vez de `"events": ["command"]` para reduzir a sobrecarga.

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

Verifique binários ausentes (PATH), variáveis de ambiente, valores de configuração ou compatibilidade com o sistema operacional.

### Hook não executando

1. Verifique se o hook está habilitado: `openclaw hooks list`
2. Reinicie seu processo do Gateway para que os hooks sejam recarregados.
3. Verifique os logs do Gateway: `./scripts/clawlog.sh | grep hook`

## Relacionados

- [Referência da CLI: hooks](/pt-BR/cli/hooks)
- [Webhooks](/pt-BR/automation/cron-jobs#webhooks)
- [Hooks de Plugin](/pt-BR/plugins/hooks) — hooks de ciclo de vida de Plugin no mesmo processo
- [Configuração](/pt-BR/gateway/configuration-reference#hooks)
