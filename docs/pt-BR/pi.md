---
read_when:
    - Entendendo o design da integração do SDK do Pi no OpenClaw
    - Modificando o ciclo de vida da sessão do agente, o ferramental ou a conexão de provedores para Pi
summary: Arquitetura da integração do agente Pi embarcado do OpenClaw e do ciclo de vida da sessão
title: Arquitetura de integração do Pi
x-i18n:
    generated_at: "2026-05-10T19:39:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93f468416b453f4f3277406f5f40386748b7388502444266f611926cd66c96ba
    source_path: pi.md
    workflow: 16
---

OpenClaw se integra com [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) e seus pacotes irmãos (`pi-ai`, `pi-agent-core`, `pi-tui`) para alimentar seus recursos de agente de IA.

## Visão geral

OpenClaw usa o SDK do pi para incorporar um agente de codificação de IA à sua arquitetura de Gateway de mensagens. Em vez de iniciar o pi como um subprocesso ou usar o modo RPC, o OpenClaw importa e instancia diretamente o `AgentSession` do pi via `createAgentSession()`. Essa abordagem incorporada oferece:

- Controle total sobre o ciclo de vida da sessão e o tratamento de eventos
- Injeção de ferramentas personalizadas (mensagens, sandbox, ações específicas de canal)
- Personalização do prompt do sistema por canal/contexto
- Persistência de sessão com suporte a ramificação/Compaction
- Rotação de perfis de autenticação de múltiplas contas com failover
- Troca de modelos independente de provedor

## Dependências de pacotes

```json
{
  "@mariozechner/pi-agent-core": "0.73.0",
  "@mariozechner/pi-ai": "0.73.0",
  "@mariozechner/pi-coding-agent": "0.73.0",
  "@mariozechner/pi-tui": "0.73.0"
}
```

| Pacote            | Finalidade                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Abstrações principais de LLM: `Model`, `streamSimple`, tipos de mensagens, APIs de provedores          |
| `pi-agent-core`   | Loop do agente, execução de ferramentas, tipos `AgentMessage`                                          |
| `pi-coding-agent` | SDK de alto nível: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, ferramentas integradas |
| `pi-tui`          | Componentes de interface de terminal (usados no modo TUI local do OpenClaw)                            |

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

Os runtimes de ações de mensagem específicos de canal agora ficam nos diretórios de extensão pertencentes ao Plugin, em vez de sob `src/agents/tools`, por exemplo:

- os arquivos de runtime de ação do Plugin do Discord
- o arquivo de runtime de ação do Plugin do Slack
- o arquivo de runtime de ação do Plugin do Telegram
- o arquivo de runtime de ação do Plugin do WhatsApp

## Fluxo de integração principal

### 1. Executando um agente incorporado

O ponto de entrada principal é `runEmbeddedPiAgent()` em `pi-embedded-runner/run.ts`:

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

### 2. Criação da sessão

Dentro de `runEmbeddedAttempt()` (chamado por `runEmbeddedPiAgent()`), o SDK do pi é usado:

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

### 3. Inscrição em eventos

`subscribeEmbeddedPiSession()` se inscreve nos eventos de `AgentSession` do pi:

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

- `message_start` / `message_end` / `message_update` (texto/pensamento em streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Envio de prompt

Após a configuração, a sessão recebe o prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

O SDK trata o loop completo do agente: envio ao LLM, execução de chamadas de ferramentas, streaming de respostas.

A injeção de imagens é local ao prompt: o OpenClaw carrega referências de imagem do prompt atual e as passa via `images` apenas para esse turno. Ele não reanalisa turnos anteriores do histórico para reinjetar payloads de imagem.

## Arquitetura de ferramentas

### Pipeline de ferramentas

1. **Ferramentas base**: `codingTools` do pi (read, bash, edit, write)
2. **Substituições personalizadas**: OpenClaw substitui bash por `exec`/`process`, personaliza read/edit/write para sandbox
3. **Ferramentas do OpenClaw**: mensagens, navegador, canvas, sessões, Cron, Gateway etc.
4. **Ferramentas de canal**: ferramentas de ação específicas de Discord/Telegram/Slack/WhatsApp
5. **Filtragem por política**: ferramentas filtradas por políticas de perfil, provedor, agente, grupo e sandbox
6. **Normalização de esquema**: esquemas limpos para peculiaridades do Gemini/OpenAI
7. **Encapsulamento de AbortSignal**: ferramentas encapsuladas para respeitar sinais de abortamento

### Adaptador de definição de ferramenta

O `AgentTool` do pi-agent-core tem uma assinatura de `execute` diferente da `ToolDefinition` do pi-coding-agent. O adaptador em `pi-tool-definition-adapter.ts` faz a ponte:

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

Isso garante que a filtragem de políticas, a integração com sandbox e o conjunto de ferramentas estendido do OpenClaw permaneçam consistentes entre provedores.

## Construção do prompt do sistema

O prompt do sistema é criado em `buildAgentSystemPrompt()` (`system-prompt.ts`). Ele monta um prompt completo com seções incluindo Ferramental, Estilo de Chamada de Ferramenta, proteções de Segurança, Controle do OpenClaw, Skills, Documentação, Workspace, Sandbox, Mensagens, Diretivas de Saída do Assistente, Voz, Respostas Silenciosas, Heartbeats, metadados de Runtime, além de Memória e Reações quando habilitadas, e arquivos de contexto opcionais e conteúdo extra de prompt do sistema. As seções são reduzidas para o modo de prompt mínimo usado por subagentes.

O prompt é aplicado após a criação da sessão via `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gerenciamento de sessões

### Arquivos de sessão

Sessões são arquivos JSONL com estrutura em árvore (vinculação por id/parentId). O `SessionManager` do Pi lida com a persistência:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

O OpenClaw envolve isso com `guardSessionManager()` para segurança dos resultados de ferramentas.

### Cache de sessões

`session-manager-cache.ts` armazena em cache instâncias de SessionManager para evitar análise repetida de arquivos:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitação de histórico

`limitHistoryTurns()` reduz o histórico da conversa com base no tipo de canal (DM vs grupo).

### Compaction

A Compaction automática é acionada em estouro de contexto. Assinaturas comuns de estouro
incluem `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` e `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` lida com a
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

Os perfis são rotacionados em falhas com acompanhamento de cooldown:

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

O OpenClaw carrega extensões personalizadas do pi para comportamento especializado:

### Proteção de Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` adiciona proteções à Compaction, incluindo orçamento adaptativo de tokens, além de resumos de falhas de ferramentas e operações de arquivo:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Poda de contexto

`src/agents/pi-hooks/context-pruning.ts` implementa poda de contexto baseada em TTL de cache:

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

## Streaming e respostas em blocos

### Divisão em blocos

`EmbeddedBlockChunker` gerencia o streaming de texto em blocos de resposta discretos:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Remoção de tags Thinking/Final

A saída de streaming é processada para remover blocos `<think>`/`<thinking>` e extrair conteúdo de `<final>`:

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

Se um nível de raciocínio não for compatível, ele faz fallback:

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

## Integração com Sandbox

Quando o modo sandbox está habilitado, ferramentas e caminhos ficam restritos:

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
- Validação rigorosa upstream de parâmetros de ferramenta do Pi

### Google/Gemini

- Sanitização de esquema de ferramenta de propriedade do Plugin

### OpenAI

- Ferramenta `apply_patch` para modelos Codex
- Tratamento de rebaixamento de nível de raciocínio

## Integração com TUI

O OpenClaw também tem um modo TUI local que usa componentes pi-tui diretamente:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Isso fornece a experiência de terminal interativo semelhante ao modo nativo do pi.

## Principais diferenças em relação à CLI do Pi

| Aspecto              | CLI do Pi               | OpenClaw Embutido                                                                            |
| -------------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| Invocação            | comando `pi` / RPC      | SDK via `createAgentSession()`                                                               |
| Ferramentas          | Ferramentas de codificação padrão | Conjunto personalizado de ferramentas do OpenClaw                                  |
| Prompt do sistema    | AGENTS.md + prompts     | Dinâmico por canal/contexto                                                                  |
| Armazenamento de sessão | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (ou `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Autenticação         | Credencial única        | Vários perfis com rotação                                                                    |
| Extensões            | Carregadas do disco     | Programáticas + caminhos em disco                                                           |
| Tratamento de eventos | Renderização TUI       | Baseado em callbacks (onBlockReply etc.)                                                     |

## Considerações futuras

Áreas para possível retrabalho:

1. **Alinhamento de assinatura de ferramenta**: Atualmente adaptando entre assinaturas de pi-agent-core e pi-coding-agent
2. **Empacotamento do gerenciador de sessões**: `guardSessionManager` adiciona segurança, mas aumenta a complexidade
3. **Carregamento de extensões**: Poderia usar o `ResourceLoader` do pi mais diretamente
4. **Complexidade do manipulador de streaming**: `subscribeEmbeddedPiSession` ficou grande
5. **Peculiaridades de provedores**: Muitos caminhos de código específicos de provedores que o pi poderia potencialmente tratar

## Testes

A cobertura de integração do Pi abrange estas suítes:

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

Ao vivo/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (habilite `OPENCLAW_LIVE_TEST=1`)

Para comandos de execução atuais, consulte [Fluxo de desenvolvimento do Pi](/pt-BR/pi-dev).

## Relacionados

- [Fluxo de desenvolvimento do Pi](/pt-BR/pi-dev)
- [Visão geral da instalação](/pt-BR/install)
