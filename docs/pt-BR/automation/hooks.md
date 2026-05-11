---
read_when:
    - Você quer automação orientada a eventos para /new, /reset, /stop e eventos de ciclo de vida do agente
    - Você quer criar, instalar ou depurar ganchos
summary: 'Ganchos: automação orientada por eventos para comandos e eventos do ciclo de vida'
title: Ganchos
x-i18n:
    generated_at: "2026-05-11T20:20:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02f44dd117d52040ea1205521c6ecd4eb410510175e2312e2584a15e6df27d96
    source_path: automation/hooks.md
    workflow: 16
---

Ganchos são pequenos scripts executados quando algo acontece dentro do Gateway. Eles podem ser descobertos a partir de diretórios e inspecionados com `openclaw hooks`. O Gateway carrega ganchos internos somente depois que você habilita ganchos ou configura pelo menos uma entrada de gancho, pacote de ganchos, manipulador legado ou diretório extra de ganchos.

Há dois tipos de ganchos no OpenClaw:

- **Ganchos internos** (esta página): executados dentro do Gateway quando eventos de agente são disparados, como `/new`, `/reset`, `/stop` ou eventos de ciclo de vida.
- **Webhooks**: endpoints HTTP externos que permitem que outros sistemas acionem trabalho no OpenClaw. Consulte [Webhooks](/pt-BR/automation/cron-jobs#webhooks).

Ganchos também podem ser agrupados dentro de plugins. `openclaw hooks list` mostra tanto ganchos independentes quanto ganchos gerenciados por plugins.

## Início rápido

```bash
# List Listar ganchos disponíveis
openclaw hooks list

# Habilitar um gancho
openclaw hooks enable session-memory

# Verificar o status dos ganchos
openclaw hooks check

# Obter informações detalhadas
openclaw hooks info session-memory
```

## Tipos de evento

| Evento                   | Quando é disparado                                                 |
| ------------------------ | ------------------------------------------------------------------ |
| `command:new`            | Comando `/new` emitido                                             |
| `command:reset`          | Comando `/reset` emitido                                           |
| `command:stop`           | Comando `/stop` emitido                                            |
| `command`                | Qualquer evento de comando (ouvinte geral)                         |
| `session:compact:before` | Antes de a compactação resumir o histórico                         |
| `session:compact:after`  | Depois que a compactação é concluída                               |
| `session:patch`          | Quando propriedades da sessão são modificadas                      |
| `agent:bootstrap`        | Antes de os arquivos de bootstrap do workspace serem injetados     |
| `gateway:startup`        | Depois que os canais iniciam e os ganchos são carregados           |
| `gateway:shutdown`       | Quando o desligamento do gateway começa                            |
| `gateway:pre-restart`    | Antes de uma reinicialização esperada do gateway                   |
| `message:received`       | Mensagem de entrada de qualquer canal                              |
| `message:transcribed`    | Depois que a transcrição de áudio é concluída                      |
| `message:preprocessed`   | Depois que o pré-processamento de mídia e links é concluído ou ignorado |
| `message:sent`           | Mensagem de saída entregue                                         |

## Escrevendo ganchos

### Estrutura do gancho

Cada gancho é um diretório contendo dois arquivos:

```
my-hook/
├── HOOK.md          # Metadados + documentação
└── handler.ts       # Implementação do manipulador
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
| `emoji`    | Emoji exibido para a CLI                             |
| `events`   | Array de eventos a observar                          |
| `export`   | Export nomeado a usar (o padrão é `"default"`)       |
| `os`       | Plataformas exigidas (por exemplo, `["darwin", "linux"]`) |
| `requires` | Caminhos de `bins`, `anyBins`, `env` ou `config` exigidos |
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

Cada evento inclui: `type`, `action`, `sessionKey`, `timestamp`, `messages` (adicione para enviar ao usuário) e `context` (dados específicos do evento). Contextos de gancho de agente e ferramenta de Plugin também podem incluir `trace`, um contexto de rastreamento diagnóstico somente leitura compatível com W3C que plugins podem repassar a logs estruturados para correlação OTEL.

### Destaques do contexto de evento

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensagem** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dados específicos do provedor, incluindo `senderId`, `senderName`, `guildId`). `context.content` prefere um corpo de comando não vazio para mensagens semelhantes a comando, depois recorre ao corpo bruto de entrada e ao corpo genérico; ele não inclui enriquecimento exclusivo do agente, como histórico da thread ou resumos de links.

**Eventos de mensagem** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensagem** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensagem** (`message:preprocessed`): `context.bodyForAgent` (corpo enriquecido final), `context.from`, `context.channelId`.

**Eventos de bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutável), `context.agentId`.

**Eventos de patch de sessão** (`session:patch`): `context.sessionEntry`, `context.patch` (somente campos alterados), `context.cfg`. Somente clientes privilegiados podem acionar eventos de patch.

**Eventos de Compaction**: `session:compact:before` inclui `messageCount`, `tokenCount`. `session:compact:after` adiciona `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observa o usuário emitindo `/stop`; ele é ciclo de vida de cancelamento/comando, não uma barreira de finalização de agente. Plugins que precisam inspecionar uma resposta final natural e pedir ao agente mais uma passada devem usar o gancho de Plugin tipado `before_agent_finalize`. Consulte [Ganchos de Plugin](/pt-BR/plugins/hooks).

**Eventos de ciclo de vida do Gateway**: `gateway:shutdown` inclui `reason` e `restartExpectedMs` e é disparado quando o desligamento do gateway começa. `gateway:pre-restart` inclui o mesmo contexto, mas só é disparado quando o desligamento faz parte de uma reinicialização esperada e um valor finito de `restartExpectedMs` é fornecido. Durante o desligamento, cada espera de gancho de ciclo de vida é de melhor esforço e limitada, para que o desligamento continue se um manipulador travar.

Entre o evento `gateway:shutdown` (ou `gateway:pre-restart`) e o restante da sequência de desligamento, o gateway também dispara um gancho de Plugin tipado `session_end` para cada sessão que ainda estava ativa quando o processo parou. O `reason` do evento é `shutdown` para uma parada SIGTERM/SIGINT simples e `restart` quando o fechamento foi agendado como parte de uma reinicialização esperada. Esse esvaziamento é limitado para que um manipulador `session_end` lento não bloqueie a saída do processo, e sessões que já foram finalizadas por replace / reset / delete / compactação são ignoradas para evitar disparo duplicado.

## Descoberta de ganchos

Ganchos são descobertos a partir destes diretórios, em ordem crescente de precedência de substituição:

1. **Ganchos incluídos**: enviados com o OpenClaw
2. **Ganchos de Plugin**: ganchos agrupados dentro de plugins instalados
3. **Ganchos gerenciados**: `~/.openclaw/hooks/` (instalados pelo usuário, compartilhados entre workspaces). Diretórios extras de `hooks.internal.load.extraDirs` compartilham essa precedência.
4. **Ganchos de workspace**: `<workspace>/hooks/` (por agente, desabilitados por padrão até serem habilitados explicitamente)

Ganchos de workspace podem adicionar novos nomes de ganchos, mas não podem substituir ganchos incluídos, gerenciados ou fornecidos por plugins com o mesmo nome.

O Gateway ignora a descoberta de ganchos internos na inicialização até que ganchos internos sejam configurados. Habilite um gancho incluído ou gerenciado com `openclaw hooks enable <name>`, instale um pacote de ganchos ou defina `hooks.internal.enabled=true` para aceitar. Quando você habilita um gancho nomeado, o Gateway carrega somente o manipulador desse gancho; `hooks.internal.enabled=true`, diretórios extras de ganchos e manipuladores legados aceitam descoberta ampla.

### Pacotes de ganchos

Pacotes de ganchos são pacotes npm que exportam ganchos via `openclaw.hooks` em `package.json`. Instale com:

```bash
openclaw plugins install <path-or-spec>
```

Especificações npm são somente de registro (nome do pacote + versão exata opcional ou dist-tag). Especificações Git/URL/file e intervalos semver são rejeitados.

## Ganchos incluídos

| Gancho                | Eventos                                           | O que ele faz                                                  |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Salva o contexto da sessão em `<workspace>/memory/`            |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injeta arquivos de bootstrap adicionais a partir de padrões glob |
| command-logger        | `command`                                         | Registra todos os comandos em `~/.openclaw/logs/commands.log`  |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envia avisos visíveis no chat quando a compactação da sessão começa/termina |
| boot-md               | `gateway:startup`                                 | Executa `BOOT.md` quando o gateway inicia                      |

Habilite qualquer gancho incluído:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalhes de session-memory

Extrai as últimas 15 mensagens de usuário/assistente e salva em `<workspace>/memory/YYYY-MM-DD-HHMM.md` usando a data local do host. A captura de memória é executada em segundo plano, então as confirmações de `/new` e `/reset` não são atrasadas por leituras de transcrição ou geração opcional de slug. Defina `hooks.internal.entries.session-memory.llmSlug: true` para gerar slugs descritivos de nome de arquivo com o modelo configurado. Requer que `workspace.dir` esteja configurado.

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

Registra todo comando de barra em `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Detalhes de compaction-notifier

Envia mensagens curtas de status para a conversa atual quando o OpenClaw começa e termina de compactar a transcrição da sessão. Isso torna turnos longos menos confusos em superfícies de chat, porque o usuário consegue ver que o assistente está resumindo o contexto e continuará após a compactação.

<a id="boot-md"></a>

### Detalhes de boot-md

Executa `BOOT.md` do workspace ativo quando o gateway inicia.

## Ganchos de Plugin

Plugins podem registrar ganchos tipados por meio do Plugin SDK para integração mais profunda:
interceptar chamadas de ferramentas, modificar prompts, controlar fluxo de mensagens e muito mais.
Use ganchos de Plugin quando precisar de `before_tool_call`, `before_agent_reply`,
`before_install` ou outros ganchos de ciclo de vida dentro do processo.

Para a referência completa de ganchos de Plugin, consulte [Ganchos de Plugin](/pt-BR/plugins/hooks).

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

Variáveis de ambiente por gancho:

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

Diretórios extras de ganchos:

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
O formato legado de configuração de array `hooks.internal.handlers` ainda é compatível por compatibilidade retroativa, mas novos ganchos devem usar o sistema baseado em descoberta.
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

## Melhores práticas

- **Mantenha os manipuladores rápidos.** Ganchos são executados durante o processamento de comandos. Dispare trabalhos pesados em segundo plano com `void processInBackground(event)`.
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

Verifique binários ausentes (PATH), variáveis de ambiente, valores de configuração ou compatibilidade com o SO.

### Gancho não executando

1. Verifique se o gancho está habilitado: `openclaw hooks list`
2. Reinicie seu processo de Gateway para que os ganchos sejam recarregados.
3. Verifique os logs do Gateway: `./scripts/clawlog.sh | grep hook`

## Relacionado

- [Referência da CLI: ganchos](/pt-BR/cli/hooks)
- [Webhooks](/pt-BR/automation/cron-jobs#webhooks)
- [Ganchos de Plugin](/pt-BR/plugins/hooks) — ganchos de ciclo de vida de Plugin em processo
- [Configuração](/pt-BR/gateway/configuration-reference#hooks)
