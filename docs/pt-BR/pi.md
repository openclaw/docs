---
read_when:
    - Entendendo o design de integração do SDK Pi no OpenClaw
    - Modificando o ciclo de vida da sessão do agente, as ferramentas ou o roteamento de provedor para Pi
summary: Arquitetura da integração do agente Pi embutido do OpenClaw e do ciclo de vida da sessão
title: Arquitetura de integração do Pi
x-i18n:
    generated_at: "2026-04-24T06:00:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c0c490cad121a65d557a72887ea619a7d0cff34a62220752214185c9148dc0b
    source_path: pi.md
    workflow: 15
---

Este documento descreve como o OpenClaw se integra ao [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) e a seus pacotes irmãos (`pi-ai`, `pi-agent-core`, `pi-tui`) para oferecer suas capacidades de agente de IA.

## Visão geral

O OpenClaw usa o SDK do Pi para embutir um agente de coding com IA em sua arquitetura de gateway de mensagens. Em vez de iniciar o Pi como um subprocesso ou usar modo RPC, o OpenClaw importa e instancia diretamente o `AgentSession` do Pi via `createAgentSession()`. Essa abordagem embutida oferece:

- Controle total sobre o ciclo de vida da sessão e o tratamento de eventos
- Injeção de ferramentas personalizadas (mensagens, sandbox, ações específicas de canal)
- Personalização do prompt de sistema por canal/contexto
- Persistência de sessão com suporte a branching/Compaction
- Rotação de perfis de autenticação de várias contas com failover
- Troca de modelo agnóstica em relação ao provedor

## Dependências de pacotes

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| Pacote           | Finalidade                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `pi-ai`          | Abstrações centrais de LLM: `Model`, `streamSimple`, tipos de mensagem, APIs de provedor                |
| `pi-agent-core`  | Loop do agente, execução de ferramentas, tipos `AgentMessage`                                            |
| `pi-coding-agent` | SDK de alto nível: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, ferramentas integradas |
| `pi-tui`         | Componentes de UI de terminal (usados no modo TUI local do OpenClaw)                                     |

## Estrutura de arquivos

```
src/agents/
├── pi-embedded-runner.ts          # Re-exports from pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Main entry: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Single attempt logic with session setup
│   │   ├── params.ts              # RunEmbeddedPiAgentParams type
│   │   ├── payloads.ts            # Build response payloads from run results
│   │   ├── images.ts              # Vision model image injection
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort error detection
│   ├── cache-ttl.ts               # Cache TTL tracking for context pruning
│   ├── compact.ts                 # Manual/auto compaction logic
│   ├── extensions.ts              # Load pi extensions for embedded runs
│   ├── extra-params.ts            # Provider-specific stream params
│   ├── google.ts                  # Google/Gemini turn ordering fixes
│   ├── history.ts                 # History limiting (DM vs group)
│   ├── lanes.ts                   # Session/global command lanes
│   ├── logger.ts                  # Subsystem logger
│   ├── model.ts                   # Model resolution via ModelRegistry
│   ├── runs.ts                    # Active run tracking, abort, queue
│   ├── sandbox-info.ts            # Sandbox info for system prompt
│   ├── session-manager-cache.ts   # SessionManager instance caching
│   ├── session-manager-init.ts    # Session file initialization
│   ├── system-prompt.ts           # System prompt builder
│   ├── tool-split.ts              # Split tools into builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel mapping, error description
├── pi-embedded-subscribe.ts       # Session event subscription/dispatch
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Event handler factory
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Streaming block reply chunking
├── pi-embedded-messaging.ts       # Messaging tool sent tracking
├── pi-embedded-helpers.ts         # Error classification, turn validation
├── pi-embedded-helpers/           # Helper modules
├── pi-embedded-utils.ts           # Formatting utilities
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # AbortSignal wrapping for tools
├── pi-tools.policy.ts             # Tool allowlist/denylist policy
├── pi-tools.read.ts               # Read tool customizations
├── pi-tools.schema.ts             # Tool schema normalization
├── pi-tools.types.ts              # AnyAgentTool type alias
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition adapter
├── pi-settings.ts                 # Settings overrides
├── pi-hooks/                      # Custom pi hooks
│   ├── compaction-safeguard.ts    # Safeguard extension
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL context pruning extension
│   └── context-pruning/
├── model-auth.ts                  # Auth profile resolution
├── auth-profiles.ts               # Profile store, cooldown, failover
├── model-selection.ts             # Default model resolution
├── models-config.ts               # models.json generation
├── model-catalog.ts               # Model catalog cache
├── context-window-guard.ts        # Context window validation
├── failover-error.ts              # FailoverError class
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # System prompt parameter resolution
├── system-prompt-report.ts        # Debug report generation
├── tool-summaries.ts              # Tool description summaries
├── tool-policy.ts                 # Tool policy resolution
├── transcript-policy.ts           # Transcript validation policy
├── skills.ts                      # Skill snapshot/prompt building
├── skills/                        # Skill subsystem
├── sandbox.ts                     # Sandbox context resolution
├── sandbox/                       # Sandbox subsystem
├── channel-tools.ts               # Channel-specific tool injection
├── openclaw-tools.ts              # OpenClaw-specific tools
├── bash-tools.ts                  # exec/process tools
├── apply-patch.ts                 # apply_patch tool (OpenAI)
├── tools/                         # Individual tool implementations
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── web-*.ts
│   └── ...
└── ...
```

Os runtimes de ação de mensagem específicos de canal agora ficam nos diretórios de extensão controlados pelo Plugin em vez de em `src/agents/tools`, por exemplo:

- os arquivos de runtime de ação do Plugin Discord
- o arquivo de runtime de ação do Plugin Slack
- o arquivo de runtime de ação do Plugin Telegram
- o arquivo de runtime de ação do Plugin WhatsApp

## Fluxo principal de integração

### 1. Executando um agente embutido

O ponto principal de entrada é `runEmbeddedPiAgent()` em `pi-embedded-runner/run.ts`:

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. Criação de sessão

Dentro de `runEmbeddedAttempt()` (chamado por `runEmbeddedPiAgent()`), o SDK do Pi é usado:

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. Assinatura de eventos

`subscribeEmbeddedPiSession()` assina os eventos de `AgentSession` do Pi:

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

Os eventos tratados incluem:

- `message_start` / `message_end` / `message_update` (texto/raciocínio em streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Após a configuração, a sessão recebe o prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

O SDK trata o loop completo do agente: envio para a LLM, execução de chamadas de ferramenta, streaming de respostas.

A injeção de imagem é local ao prompt: o OpenClaw carrega refs de imagem do prompt atual e
as passa via `images` apenas para esse turno. Ele não revarre turnos mais antigos do histórico
para reinjetar cargas de imagem.

## Arquitetura de ferramentas

### Pipeline de ferramentas

1. **Ferramentas base**: `codingTools` do Pi (`read`, `bash`, `edit`, `write`)
2. **Substituições personalizadas**: o OpenClaw substitui `bash` por `exec`/`process`, personaliza read/edit/write para sandbox
3. **Ferramentas OpenClaw**: mensagens, navegador, canvas, sessões, cron, gateway etc.
4. **Ferramentas de canal**: ferramentas de ação específicas de Discord/Telegram/Slack/WhatsApp
5. **Filtragem por política**: ferramentas filtradas por políticas de perfil, provedor, agente, grupo e sandbox
6. **Normalização de schema**: schemas limpos para particularidades de Gemini/OpenAI
7. **Encapsulamento de AbortSignal**: ferramentas encapsuladas para respeitar sinais de abort

### Adaptador de definição de ferramenta

`AgentTool` do pi-agent-core tem uma assinatura `execute` diferente de `ToolDefinition` do pi-coding-agent. O adaptador em `pi-tool-definition-adapter.ts` faz essa ponte:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent signature differs from pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Estratégia de divisão de ferramentas

`splitSdkTools()` passa todas as ferramentas via `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Isso garante que a filtragem por política, a integração com sandbox e o conjunto estendido de ferramentas do OpenClaw permaneçam consistentes entre provedores.

## Construção do prompt de sistema

O prompt de sistema é construído em `buildAgentSystemPrompt()` (`system-prompt.ts`). Ele monta um prompt completo com seções como Tooling, Tool Call Style, proteções de Safety, referência da CLI do OpenClaw, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, metadados de Runtime, além de Memory e Reactions quando ativados, e arquivos de contexto opcionais e conteúdo extra de prompt de sistema. As seções são reduzidas para o modo de prompt minimal usado por subagentes.

O prompt é aplicado após a criação da sessão via `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gerenciamento de sessão

### Arquivos de sessão

As sessões são arquivos JSONL com estrutura de árvore (ligação por id/parentId). O `SessionManager` do Pi cuida da persistência:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

O OpenClaw encapsula isso com `guardSessionManager()` para segurança de resultados de ferramentas.

### Cache de sessão

`session-manager-cache.ts` armazena em cache instâncias de SessionManager para evitar análise repetida de arquivos:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitação de histórico

`limitHistoryTurns()` reduz o histórico da conversa com base no tipo de canal (DM vs grupo).

### Compaction

A Compaction automática é acionada em caso de estouro de contexto. Assinaturas comuns de estouro
incluem `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` e `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` trata a
Compaction manual:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autenticação e resolução de modelo

### Perfis de autenticação

O OpenClaw mantém um armazenamento de perfis de autenticação com várias chaves de API por provedor:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Os perfis entram em rotação em falhas com rastreamento de cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Resolução de modelo

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Uses pi's ModelRegistry and AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` aciona fallback de modelo quando configurado:

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Extensões do Pi

O OpenClaw carrega extensões personalizadas do Pi para comportamentos especializados:

### Safeguard de Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` adiciona proteções à Compaction, incluindo orçamento adaptativo de tokens e resumos de falha de ferramenta e de operação de arquivo:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context Pruning

`src/agents/pi-hooks/context-pruning.ts` implementa context pruning baseado em cache-TTL:

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## Streaming e respostas em bloco

### Chunking de bloco

`EmbeddedBlockChunker` gerencia o streaming de texto em blocos discretos de resposta:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Remoção de tags de raciocínio/final

A saída de streaming é processada para remover blocos `<think>`/`<thinking>` e extrair conteúdo `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Diretivas de resposta

Diretivas de resposta como `[[media:url]]`, `[[voice]]`, `[[reply:id]]` são analisadas e extraídas:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Tratamento de erros

### Classificação de erros

`pi-embedded-helpers.ts` classifica erros para o tratamento apropriado:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback de nível de raciocínio

Se um nível de raciocínio não for compatível, ele usa fallback:

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## Integração com sandbox

Quando o modo sandbox está ativado, ferramentas e caminhos são restringidos:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Use sandboxed read/edit/write tools
  // Exec runs in container
  // Browser uses bridge URL
}
```

## Tratamento específico por provedor

### Anthropic

- Limpeza de string mágica de recusa
- Validação de turno para papéis consecutivos
- Validação estrita upstream do Pi para parâmetros de ferramenta

### Google/Gemini

- Sanitização de schema de ferramenta controlada pelo Plugin

### OpenAI

- ferramenta `apply_patch` para modelos Codex
- tratamento de downgrade de nível de raciocínio

## Integração com TUI

O OpenClaw também tem um modo TUI local que usa diretamente componentes do pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Isso fornece a experiência interativa de terminal semelhante ao modo nativo do Pi.

## Principais diferenças em relação à CLI do Pi

| Aspecto         | CLI do Pi               | OpenClaw embutido                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Invocação       | comando `pi` / RPC      | SDK via `createAgentSession()`                                                                 |
| Ferramentas     | Ferramentas padrão de coding | Conjunto personalizado de ferramentas do OpenClaw                                        |
| Prompt de sistema | `AGENTS.md` + prompts | Dinâmico por canal/contexto                                                                    |
| Armazenamento de sessão | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (ou `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Autenticação    | Credencial única        | Vários perfis com rotação                                                                      |
| Extensões       | Carregadas do disco     | Caminhos programáticos + disco                                                                 |
| Tratamento de eventos | Renderização TUI    | Baseado em callback (`onBlockReply` etc.)                                                      |

## Considerações futuras

Áreas para possível retrabalho:

1. **Alinhamento de assinatura de ferramenta**: atualmente adaptando entre assinaturas de pi-agent-core e pi-coding-agent
2. **Encapsulamento do gerenciador de sessão**: `guardSessionManager` adiciona segurança, mas aumenta a complexidade
3. **Carregamento de extensões**: poderia usar o `ResourceLoader` do Pi mais diretamente
4. **Complexidade do handler de streaming**: `subscribeEmbeddedPiSession` cresceu bastante
5. **Particularidades de provedores**: muitos caminhos de código específicos de provedor que o Pi poderia potencialmente tratar

## Testes

A cobertura da integração com Pi se estende por estas suítes:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-hooks/**/*.test.ts`

Live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (ative com `OPENCLAW_LIVE_TEST=1`)

Para os comandos atuais de execução, consulte [Pi Development Workflow](/pt-BR/pi-dev).

## Relacionado

- [Fluxo de desenvolvimento do Pi](/pt-BR/pi-dev)
- [Visão geral de instalação](/pt-BR/install)
