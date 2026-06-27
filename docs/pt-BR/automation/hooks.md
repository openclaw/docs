---
read_when:
    - Você quer automatização orientada a eventos para /new, /reset, /stop e eventos de ciclo de vida do agente
    - Você quer criar, instalar ou depurar hooks
summary: 'Hooks: automação orientada a eventos para comandos e eventos de ciclo de vida'
title: Hooks
x-i18n:
    generated_at: "2026-06-27T17:08:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Hooks são pequenos scripts que são executados quando algo acontece dentro do Gateway. Eles podem ser descobertos a partir de diretórios e inspecionados com `openclaw hooks`. O Gateway carrega hooks internos somente depois que você habilita hooks ou configura pelo menos uma entrada de hook, pacote de hooks, manipulador legado ou diretório extra de hooks.

Há dois tipos de hooks no OpenClaw:

- **Hooks internos** (esta página): são executados dentro do Gateway quando eventos do agente disparam, como `/new`, `/reset`, `/stop` ou eventos de ciclo de vida.
- **Webhooks**: endpoints HTTP externos que permitem que outros sistemas acionem trabalho no OpenClaw. Consulte [Webhooks](/pt-BR/automation/cron-jobs#webhooks).

Hooks também podem ser agrupados dentro de plugins. `openclaw hooks list` mostra tanto hooks independentes quanto hooks gerenciados por plugins.

## Escolha a superfície certa

O OpenClaw tem várias superfícies de extensão que parecem similares, mas resolvem problemas diferentes:

| Se você quer...                                                                                                                  | Use...                                       | Por quê                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Salvar um snapshot em `/new`, registrar `/reset`, chamar uma API externa após `message:sent` ou adicionar automação operacional ampla | Hooks internos (`HOOK.md`, esta página)     | Hooks baseados em arquivos são feitos para efeitos colaterais gerenciados pelo operador e automação de comandos/ciclo de vida |
| Reescrever prompts, bloquear ferramentas, cancelar mensagens de saída ou adicionar middleware/política ordenados                    | Hooks de plugin tipados via `api.on(...)`   | Hooks tipados têm contratos explícitos, prioridades, regras de mesclagem e semântica de bloqueio/cancelamento    |
| Adicionar exportação apenas de telemetria ou observabilidade                                                                         | Eventos de diagnóstico                      | Observabilidade é um barramento de eventos separado, não uma superfície de hook de política                       |

Use hooks internos quando quiser uma automação que se comporte como uma pequena integração instalada. Use hooks de plugin tipados quando precisar de controle do ciclo de vida em tempo de execução.

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
| `session:compact:before` | Antes de a compactação resumir o histórico                 |
| `session:compact:after`  | Depois que a compactação termina                           |
| `session:patch`          | Quando propriedades da sessão são modificadas              |
| `agent:bootstrap`        | Antes de os arquivos de bootstrap do workspace serem injetados |
| `gateway:startup`        | Depois que os canais iniciam e os hooks são carregados     |
| `gateway:shutdown`       | Quando o desligamento do gateway começa                    |
| `gateway:pre-restart`    | Antes de uma reinicialização esperada do gateway           |
| `message:received`       | Mensagem de entrada de qualquer canal                      |
| `message:transcribed`    | Depois que a transcrição de áudio termina                  |
| `message:preprocessed`   | Depois que o pré-processamento de mídia e links termina ou é ignorado |
| `message:sent`           | Mensagem de saída entregue                                 |

## Escrevendo hooks

### Estrutura do hook

Cada hook é um diretório que contém dois arquivos:

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
| `os`       | Plataformas obrigatórias (por exemplo, `["darwin", "linux"]`) |
| `requires` | Caminhos obrigatórios de `bins`, `anyBins`, `env` ou `config` |
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

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

Cada evento inclui: `type`, `action`, `sessionKey`, `timestamp`, `messages` (adicione respostas aqui apenas em superfícies que aceitam resposta) e `context` (dados específicos do evento). Contextos de hooks de agente e de plugin de ferramentas também podem incluir `trace`, um contexto de rastreamento de diagnóstico somente leitura compatível com W3C que os plugins podem passar para logs estruturados para correlação com OTEL.

`event.messages` só é entregue automaticamente em superfícies que aceitam resposta, como
`command:*` e `message:received`. Eventos apenas de ciclo de vida, como
`agent:bootstrap`, `session:*`, `gateway:*` ou `message:sent`, não têm um
canal de resposta e ignoram mensagens adicionadas.

### Destaques do contexto de evento

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensagem** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dados específicos do provedor, incluindo `senderId`, `senderName`, `guildId`). `context.content` prefere um corpo de comando não vazio para mensagens semelhantes a comandos; em seguida, recorre ao corpo bruto de entrada e ao corpo genérico; ele não inclui enriquecimento apenas do agente, como histórico de thread ou resumos de links.

**Eventos de mensagem** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensagem** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensagem** (`message:preprocessed`): `context.bodyForAgent` (corpo enriquecido final), `context.from`, `context.channelId`.

**Eventos de bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutável), `context.agentId`.

**Eventos de patch de sessão** (`session:patch`): `context.sessionEntry`, `context.patch` (somente campos alterados), `context.cfg`. Somente clientes privilegiados podem acionar eventos de patch.

**Eventos de Compaction**: `session:compact:before` inclui `messageCount`, `tokenCount`. `session:compact:after` adiciona `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` observa o usuário emitindo `/stop`; ele é um ciclo de vida de cancelamento/comando, não um gate de finalização do agente. Plugins que precisam inspecionar uma resposta final natural e pedir ao agente mais uma passagem devem usar o hook de plugin tipado `before_agent_finalize` em vez disso. Consulte [Hooks de plugin](/pt-BR/plugins/hooks).

**Eventos de ciclo de vida do Gateway**: `gateway:shutdown` inclui `reason` e `restartExpectedMs` e dispara quando o desligamento do gateway começa. `gateway:pre-restart` inclui o mesmo contexto, mas dispara somente quando o desligamento faz parte de uma reinicialização esperada e um valor finito de `restartExpectedMs` é fornecido. Durante o desligamento, a espera de cada hook de ciclo de vida é de melhor esforço e limitada, para que o desligamento continue se um manipulador travar. O orçamento de espera padrão é de 5 segundos para `gateway:shutdown` e 10 segundos para `gateway:pre-restart`.

Use `gateway:pre-restart` para avisos curtos de reinicialização enquanto os canais ainda estão disponíveis:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

Entre o evento `gateway:shutdown` (ou `gateway:pre-restart`) e o restante da sequência de desligamento, o gateway também dispara um hook de plugin tipado `session_end` para cada sessão que ainda estava ativa quando o processo parou. O `reason` do evento é `shutdown` para uma parada simples por SIGTERM/SIGINT e `restart` quando o fechamento foi agendado como parte de uma reinicialização esperada. Essa drenagem é limitada para que um manipulador `session_end` lento não possa bloquear a saída do processo, e sessões que já foram finalizadas por substituição / redefinição / exclusão / compactação são ignoradas para evitar disparo duplicado.

## Descoberta de hooks

Hooks são descobertos a partir destes diretórios, em ordem crescente de precedência de substituição:

1. **Hooks agrupados**: enviados com o OpenClaw
2. **Hooks de plugin**: hooks agrupados dentro de plugins instalados
3. **Hooks gerenciados**: `~/.openclaw/hooks/` (instalados pelo usuário, compartilhados entre workspaces). Diretórios extras de `hooks.internal.load.extraDirs` compartilham esta precedência.
4. **Hooks de workspace**: `<workspace>/hooks/` (por agente, desabilitados por padrão até serem habilitados explicitamente)

Hooks de workspace podem adicionar novos nomes de hook, mas não podem substituir hooks agrupados, gerenciados ou fornecidos por plugins com o mesmo nome.

O Gateway ignora a descoberta de hooks internos na inicialização até que hooks internos estejam configurados. Habilite um hook agrupado ou gerenciado com `openclaw hooks enable <name>`, instale um pacote de hooks ou defina `hooks.internal.enabled=true` para optar por entrar. Quando você habilita um hook nomeado, o Gateway carrega apenas o manipulador desse hook; `hooks.internal.enabled=true`, diretórios extras de hooks e manipuladores legados optam por descoberta ampla.

### Pacotes de hooks

Pacotes de hooks são pacotes npm que exportam hooks via `openclaw.hooks` em `package.json`. Instale com:

```bash
openclaw plugins install <path-or-spec>
```

Specs npm são apenas de registro (nome do pacote + versão exata opcional ou dist-tag). Specs Git/URL/arquivo e intervalos semver são rejeitados.

## Hooks agrupados

| Hook                  | Eventos                                           | O que faz                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Salva o contexto da sessão em `<workspace>/memory/`            |
| bootstrap-extra-files | `agent:bootstrap`                                 | Injeta arquivos de bootstrap adicionais a partir de padrões glob |
| command-logger        | `command`                                         | Registra todos os comandos em `~/.openclaw/logs/commands.log`  |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Envia avisos visíveis no chat quando a compactação da sessão começa/termina |
| boot-md               | `gateway:startup`                                 | Executa `BOOT.md` quando o gateway inicia                      |

Ative qualquer hook incluído:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalhes de session-memory

Extrai as últimas 15 mensagens de usuário/assistente e salva em `<workspace>/memory/YYYY-MM-DD-HHMM.md` usando a data local do host. A captura de memória é executada em segundo plano, para que as confirmações de `/new` e `/reset` não sejam atrasadas por leituras de transcrição ou geração opcional de slug. Defina `hooks.internal.entries.session-memory.llmSlug: true` para gerar slugs descritivos de nome de arquivo com o modelo configurado. Requer que `workspace.dir` esteja configurado.

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

Os caminhos são resolvidos em relação ao workspace. Somente nomes base de bootstrap reconhecidos são carregados (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalhes de command-logger

Registra todos os comandos de barra em `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Detalhes de compaction-notifier

Envia mensagens curtas de status para a conversa atual quando o OpenClaw começa e termina a compactação da transcrição da sessão. Isso torna turnos longos menos confusos em superfícies de chat, porque o usuário pode ver que o assistente está resumindo o contexto e continuará após a Compaction.

<a id="boot-md"></a>

### Detalhes de boot-md

Executa `BOOT.md` do workspace ativo quando o gateway inicia.

## Hooks de Plugin

Plugins podem registrar hooks tipados por meio do Plugin SDK para uma integração mais profunda:
interceptar chamadas de ferramentas, modificar prompts, controlar o fluxo de mensagens e mais.
Use hooks de plugin quando precisar de `before_tool_call`, `before_agent_reply`,
`before_install` ou outros hooks de ciclo de vida em processo.

Hooks internos gerenciados por plugin são diferentes: eles participam do sistema
amplo de eventos de comando/ciclo de vida desta página e aparecem em `openclaw hooks list` como
`plugin:<id>`. Use-os para efeitos colaterais e compatibilidade com pacotes de hooks, não
para middleware ordenado ou barreiras de política.

Para a referência completa de hooks de plugin, veja [Hooks de Plugin](/pt-BR/plugins/hooks).

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
# Listar todos os hooks (adicione --eligible, --verbose ou --json)
openclaw hooks list

# Mostrar informações detalhadas sobre um hook
openclaw hooks info <hook-name>

# Mostrar resumo de elegibilidade
openclaw hooks check

# Ativar/desativar
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Boas práticas

- **Mantenha os handlers rápidos.** Hooks são executados durante o processamento de comandos. Dispare trabalhos pesados sem aguardar com `void processInBackground(event)`.
- **Trate erros com cuidado.** Envolva operações arriscadas em try/catch; não lance exceções para que outros handlers possam ser executados.
- **Filtre eventos cedo.** Retorne imediatamente se o tipo/ação do evento não for relevante.
- **Use chaves de evento específicas.** Prefira `"events": ["command:new"]` em vez de `"events": ["command"]` para reduzir a sobrecarga.

## Solução de problemas

### Hook não descoberto

```bash
# Verificar estrutura do diretório
ls -la ~/.openclaw/hooks/my-hook/
# Deve mostrar: HOOK.md, handler.ts

# Listar todos os hooks descobertos
openclaw hooks list
```

### Hook não elegível

```bash
openclaw hooks info my-hook
```

Verifique binários ausentes (PATH), variáveis de ambiente, valores de configuração ou compatibilidade com o sistema operacional.

### Hook não executando

1. Verifique se o hook está ativado: `openclaw hooks list`
2. Reinicie seu processo de gateway para que os hooks sejam recarregados.
3. Verifique os logs do gateway: `./scripts/clawlog.sh | grep hook`

## Relacionados

- [Referência da CLI: hooks](/pt-BR/cli/hooks)
- [Webhooks](/pt-BR/automation/cron-jobs#webhooks)
- [Hooks de Plugin](/pt-BR/plugins/hooks) — hooks de ciclo de vida de plugin em processo
- [Configuração](/pt-BR/gateway/configuration-reference#hooks)
