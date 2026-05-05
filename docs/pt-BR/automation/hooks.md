---
read_when:
    - Você quer automação orientada a eventos para /new, /reset, /stop e eventos do ciclo de vida do agente
    - Você quer criar, instalar ou depurar ganchos
summary: 'Ganchos: automação orientada por eventos para comandos e eventos de ciclo de vida'
title: Ganchos
x-i18n:
    generated_at: "2026-05-05T08:25:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321eb7a583d5e8c90d2c2026f6e1cf46cd207bef52213774b469a8d46b993967
    source_path: automation/hooks.md
    workflow: 16
---

Hooks são pequenos scripts executados quando algo acontece dentro do Gateway. Eles podem ser descobertos a partir de diretórios e inspecionados com `openclaw hooks`. O Gateway carrega hooks internos somente depois que você habilita hooks ou configura pelo menos uma entrada de hook, pacote de hooks, handler legado ou diretório extra de hooks.

Há dois tipos de hooks no OpenClaw:

- **Hooks internos** (esta página): executados dentro do Gateway quando eventos de agente são disparados, como `/new`, `/reset`, `/stop` ou eventos de ciclo de vida.
- **Webhooks**: endpoints HTTP externos que permitem que outros sistemas disparem trabalho no OpenClaw. Consulte [Webhooks](/pt-BR/automation/cron-jobs#webhooks).

Hooks também podem ser empacotados dentro de plugins. `openclaw hooks list` mostra hooks independentes e hooks gerenciados por plugin.

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

| Evento                   | Quando é disparado                                        |
| ------------------------ | --------------------------------------------------------- |
| `command:new`            | Comando `/new` emitido                                    |
| `command:reset`          | Comando `/reset` emitido                                  |
| `command:stop`           | Comando `/stop` emitido                                   |
| `command`                | Qualquer evento de comando (listener geral)               |
| `session:compact:before` | Antes de a compaction resumir o histórico                 |
| `session:compact:after`  | Depois que a compaction é concluída                       |
| `session:patch`          | Quando propriedades da sessão são modificadas             |
| `agent:bootstrap`        | Antes de arquivos de bootstrap do workspace serem injetados |
| `gateway:startup`        | Depois que os canais iniciam e os hooks são carregados    |
| `gateway:shutdown`       | Quando o desligamento do gateway começa                   |
| `gateway:pre-restart`    | Antes de uma reinicialização esperada do gateway          |
| `message:received`       | Mensagem recebida de qualquer canal                       |
| `message:transcribed`    | Depois que a transcrição de áudio é concluída             |
| `message:preprocessed`   | Depois que o pré-processamento de mídia e links é concluído ou ignorado |
| `message:sent`           | Mensagem enviada entregue                                 |

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
| `emoji`    | Emoji exibido na CLI                                 |
| `events`   | Array de eventos a escutar                           |
| `export`   | Export nomeado a usar (o padrão é `"default"`)       |
| `os`       | Plataformas necessárias (por exemplo, `["darwin", "linux"]`) |
| `requires` | Caminhos obrigatórios de `bins`, `anyBins`, `env` ou `config` |
| `always`   | Ignora verificações de elegibilidade (booleano)      |
| `install`  | Métodos de instalação                                |

### Implementação do handler

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

Cada evento inclui: `type`, `action`, `sessionKey`, `timestamp`, `messages` (faça push para enviar ao usuário) e `context` (dados específicos do evento). Contextos de hook de agente e ferramenta de plugin também podem incluir `trace`, um contexto de rastreamento diagnóstico somente leitura compatível com W3C que plugins podem passar para logs estruturados para correlação OTEL.

### Destaques do contexto de evento

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensagem** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dados específicos do provedor, incluindo `senderId`, `senderName`, `guildId`). `context.content` prefere um corpo de comando não vazio para mensagens semelhantes a comandos; em seguida, recorre ao corpo bruto recebido e ao corpo genérico; ele não inclui enriquecimento exclusivo do agente, como histórico da thread ou resumos de links.

**Eventos de mensagem** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensagem** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensagem** (`message:preprocessed`): `context.bodyForAgent` (corpo enriquecido final), `context.from`, `context.channelId`.

**Eventos de bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutável), `context.agentId`.

**Eventos de patch de sessão** (`session:patch`): `context.sessionEntry`, `context.patch` (somente campos alterados), `context.cfg`. Somente clientes privilegiados podem disparar eventos de patch.

**Eventos de Compaction**: `session:compact:before` inclui `messageCount`, `tokenCount`. `session:compact:after` adiciona `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observa o usuário emitir `/stop`; isso é ciclo de vida de cancelamento/comando, não uma barreira de finalização do agente. Plugins que precisam inspecionar uma resposta final natural e pedir ao agente mais uma passada devem usar o hook de plugin tipado `before_agent_finalize`. Consulte [Hooks de plugin](/pt-BR/plugins/hooks).

**Eventos de ciclo de vida do Gateway**: `gateway:shutdown` inclui `reason` e `restartExpectedMs` e é disparado quando o desligamento do gateway começa. `gateway:pre-restart` inclui o mesmo contexto, mas só é disparado quando o desligamento faz parte de uma reinicialização esperada e um valor finito de `restartExpectedMs` é fornecido. Durante o desligamento, a espera de cada hook de ciclo de vida é de melhor esforço e limitada para que o desligamento continue se um handler travar.

## Descoberta de hooks

Hooks são descobertos a partir destes diretórios, em ordem crescente de precedência de substituição:

1. **Hooks empacotados**: enviados com o OpenClaw
2. **Hooks de plugin**: hooks empacotados dentro de plugins instalados
3. **Hooks gerenciados**: `~/.openclaw/hooks/` (instalados pelo usuário, compartilhados entre workspaces). Diretórios extras de `hooks.internal.load.extraDirs` compartilham esta precedência.
4. **Hooks de workspace**: `<workspace>/hooks/` (por agente, desabilitados por padrão até serem explicitamente habilitados)

Hooks de workspace podem adicionar novos nomes de hook, mas não podem substituir hooks empacotados, gerenciados ou fornecidos por plugin com o mesmo nome.

O Gateway ignora a descoberta de hooks internos na inicialização até que hooks internos sejam configurados. Habilite um hook empacotado ou gerenciado com `openclaw hooks enable <name>`, instale um pacote de hooks ou defina `hooks.internal.enabled=true` para optar por usar. Quando você habilita um hook nomeado, o Gateway carrega somente o handler desse hook; `hooks.internal.enabled=true`, diretórios extras de hooks e handlers legados optam pela descoberta ampla.

### Pacotes de hooks

Pacotes de hooks são pacotes npm que exportam hooks via `openclaw.hooks` em `package.json`. Instale com:

```bash
openclaw plugins install <path-or-spec>
```

Especificações npm são apenas de registro (nome do pacote + versão exata opcional ou dist-tag). Especificações Git/URL/arquivo e intervalos semver são rejeitados.

## Hooks incluídos

| Hook                  | Eventos                                           | O que faz                                                      |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Salva o contexto da sessão em `<workspace>/memory/`            |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injeta arquivos adicionais de bootstrap a partir de padrões glob |
| command-logger        | `command`                                         | Registra todos os comandos em `~/.openclaw/logs/commands.log`  |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envia avisos visíveis no chat quando a compactação da sessão começa/termina |
| boot-md               | `gateway:startup`                                 | Executa `BOOT.md` quando o gateway inicia                      |

Habilite qualquer hook incluído:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalhes de session-memory

Extrai as últimas 15 mensagens de usuário/assistente e salva em `<workspace>/memory/YYYY-MM-DD-HHMM.md` usando a data local do host. A captura de memória é executada em segundo plano para que confirmações de `/new` e `/reset` não sejam atrasadas por leituras de transcrição ou geração opcional de slug. Defina `hooks.internal.entries.session-memory.llmSlug: true` para gerar slugs descritivos de nome de arquivo com o modelo configurado. Requer que `workspace.dir` esteja configurado.

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

Os caminhos são resolvidos em relação ao workspace. Somente basenames de bootstrap reconhecidos são carregados (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalhes de command-logger

Registra todos os comandos de barra em `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Detalhes de compaction-notifier

Envia mensagens curtas de status para a conversa atual quando o OpenClaw começa e termina de compactar a transcrição da sessão. Isso torna turnos longos menos confusos em superfícies de chat porque o usuário pode ver que o assistente está resumindo o contexto e continuará após a Compaction.

<a id="boot-md"></a>

### Detalhes de boot-md

Executa `BOOT.md` do workspace ativo quando o gateway inicia.

## Hooks de Plugin

Plugins podem registrar hooks tipados por meio do SDK de Plugin para integração mais profunda:
interceptar chamadas de ferramentas, modificar prompts, controlar o fluxo de mensagens e mais.
Use hooks de Plugin quando precisar de `before_tool_call`, `before_agent_reply`,
`before_install` ou outros hooks de ciclo de vida em processo.

Para a referência completa de hooks de Plugin, consulte [Hooks de Plugin](/pt-BR/plugins/hooks).

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
O formato legado de configuração do array `hooks.internal.handlers` ainda é compatível para compatibilidade retroativa, mas novos hooks devem usar o sistema baseado em descoberta.
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

- **Mantenha os manipuladores rápidos.** Os ganchos são executados durante o processamento de comandos. Dispare trabalhos pesados em segundo plano sem aguardar com `void processInBackground(event)`.
- **Trate erros com elegância.** Envolva operações arriscadas em try/catch; não lance exceções para que outros manipuladores possam ser executados.
- **Filtre eventos cedo.** Retorne imediatamente se o tipo/ação do evento não for relevante.
- **Use chaves de evento específicas.** Prefira `"events": ["command:new"]` em vez de `"events": ["command"]` para reduzir a sobrecarga.

## Solução de problemas

### Gancho não descoberto

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Gancho não elegível

```bash
openclaw hooks info my-hook
```

Verifique binários ausentes (PATH), variáveis de ambiente, valores de configuração ou compatibilidade com o sistema operacional.

### Gancho não está executando

1. Verifique se o gancho está habilitado: `openclaw hooks list`
2. Reinicie o processo do Gateway para que os ganchos sejam recarregados.
3. Verifique os logs do Gateway: `./scripts/clawlog.sh | grep hook`

## Relacionado

- [Referência da CLI: hooks](/pt-BR/cli/hooks)
- [Webhooks](/pt-BR/automation/cron-jobs#webhooks)
- [Ganchos de Plugin](/pt-BR/plugins/hooks) — ganchos de ciclo de vida de Plugin em processo
- [Configuração](/pt-BR/gateway/configuration-reference#hooks)
