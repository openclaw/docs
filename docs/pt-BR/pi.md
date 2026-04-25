---
read_when:
    - Entendendo o design de integração do SDK do Pi no OpenClaw
    - Modificando o ciclo de vida da sessão do agente, ferramentas ou integração de provider para Pi
summary: Arquitetura da integração embutida do agente Pi no OpenClaw e ciclo de vida da sessão
title: Arquitetura da integração do Pi
x-i18n:
    generated_at: "2026-04-25T13:49:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ec260fd3e2726190ed7aa60e249b739689f2d42d230f52fa93a43cbbf90ea06
    source_path: pi.md
    workflow: 15
---

Este documento descreve como o OpenClaw se integra ao [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) e seus pacotes irmãos (`pi-ai`, `pi-agent-core`, `pi-tui`) para fornecer seus recursos de agente de IA.

## Visão geral

O OpenClaw usa o SDK do Pi para incorporar um agente de codificação com IA à sua arquitetura de Gateway de mensagens. Em vez de iniciar o Pi como subprocesso ou usar o modo RPC, o OpenClaw importa e instancia diretamente o `AgentSession` do Pi por meio de `createAgentSession()`. Essa abordagem incorporada oferece:

- Controle total sobre o ciclo de vida da sessão e o tratamento de eventos
- Injeção personalizada de ferramentas (mensagens, sandbox, ações específicas de canal)
- Personalização do prompt de sistema por canal/contexto
- Persistência de sessão com suporte a branching/Compaction
- Rotação de perfis de autenticação com várias contas e failover
- Troca de modelos agnóstica em relação ao provider

## Dependências de pacote

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Pacote           | Finalidade                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`          | Abstrações principais de LLM: `Model`, `streamSimple`, tipos de mensagem, APIs de provider            |
| `pi-agent-core`  | Loop do agente, execução de ferramentas, tipos `AgentMessage`                                          |
| `pi-coding-agent` | SDK de alto nível: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, ferramentas embutidas |
| `pi-tui`         | Componentes de UI de terminal (usados no modo TUI local do OpenClaw)                                   |

## Estrutura de arquivos

```
src/agents/
├── pi-embedded-runner.ts          # Reexportações de pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Entrada principal: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Lógica de tentativa única com configuração de sessão
│   │   ├── params.ts              # Tipo RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Monta payloads de resposta a partir dos resultados da execução
│   │   ├── images.ts              # Injeção de imagem para modelo de visão
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Detecção de erro de abort
│   ├── cache-ttl.ts               # Rastreamento de TTL de cache para poda de contexto
│   ├── compact.ts                 # Lógica de Compaction manual/automática
│   ├── extensions.ts              # Carrega extensões do Pi para execuções embutidas
│   ├── extra-params.ts            # Parâmetros de stream específicos de provider
│   ├── google.ts                  # Correções de ordenação de turnos para Google/Gemini
│   ├── history.ts                 # Limitação de histórico (DM vs grupo)
│   ├── lanes.ts                   # Faixas de comando de sessão/global
│   ├── logger.ts                  # Logger do subsistema
│   ├── model.ts                   # Resolução de modelo via ModelRegistry
│   ├── runs.ts                    # Rastreamento de execuções ativas, abort, fila
│   ├── sandbox-info.ts            # Informações do sandbox para o prompt de sistema
│   ├── session-manager-cache.ts   # Cache de instâncias de SessionManager
│   ├── session-manager-init.ts    # Inicialização do arquivo de sessão
│   ├── system-prompt.ts           # Builder de prompt de sistema
│   ├── tool-split.ts              # Divide ferramentas em builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapeamento de ThinkLevel, descrição de erro
├── pi-embedded-subscribe.ts       # Assinatura/despacho de eventos de sessão
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fábrica de handlers de evento
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Fragmentação de respostas em bloco de streaming
├── pi-embedded-messaging.ts       # Rastreamento de envios da ferramenta de mensagens
├── pi-embedded-helpers.ts         # Classificação de erro, validação de turno
├── pi-embedded-helpers/           # Módulos auxiliares
├── pi-embedded-utils.ts           # Utilitários de formatação
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Encapsulamento de AbortSignal para ferramentas
├── pi-tools.policy.ts             # Política de allowlist/denylist de ferramentas
├── pi-tools.read.ts               # Personalizações da ferramenta read
├── pi-tools.schema.ts             # Normalização de schema de ferramenta
├── pi-tools.types.ts              # Alias de tipo AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adaptador AgentTool -> ToolDefinition
├── pi-settings.ts                 # Substituições de Settings
├── pi-hooks/                      # Hooks personalizados do Pi
│   ├── compaction-safeguard.ts    # Extensão de proteção
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Extensão de poda de contexto com TTL de cache
│   └── context-pruning/
├── model-auth.ts                  # Resolução de perfil de autenticação
├── auth-profiles.ts               # Armazenamento de perfil, cooldown, failover
├── model-selection.ts             # Resolução de modelo padrão
├── models-config.ts               # Geração de models.json
├── model-catalog.ts               # Cache de catálogo de modelo
├── context-window-guard.ts        # Validação de janela de contexto
├── failover-error.ts              # Classe FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Resolução de parâmetros de prompt de sistema
├── system-prompt-report.ts        # Geração de relatório de depuração
├── tool-summaries.ts              # Resumos de descrição de ferramentas
├── tool-policy.ts                 # Resolução de política de ferramenta
├── transcript-policy.ts           # Política de validação de transcrição
├── skills.ts                      # Snapshot/prompt building de Skills
├── skills/                        # Subsistema de Skills
├── sandbox.ts                     # Resolução de contexto de sandbox
├── sandbox/                       # Subsistema de sandbox
├── channel-tools.ts               # Injeção de ferramentas específicas de canal
├── openclaw-tools.ts              # Ferramentas específicas do OpenClaw
├── bash-tools.ts                  # Ferramentas exec/process
├── apply-patch.ts                 # Ferramenta apply_patch (OpenAI)
├── tools/                         # Implementações individuais de ferramentas
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

Os runtimes de ação de mensagem específicos de canal agora ficam nos diretórios
de extensão de propriedade do Plugin em vez de `src/agents/tools`, por exemplo:

- os arquivos de runtime de ação do Plugin do Discord
- o arquivo de runtime de ação do Plugin do Slack
- o arquivo de runtime de ação do Plugin do Telegram
- o arquivo de runtime de ação do Plugin do WhatsApp

## Fluxo principal de integração

### 1. Executando um agente embutido

A principal porta de entrada é `runEmbeddedPiAgent()` em `pi-embedded-runner/run.ts`:

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

`subscribeEmbeddedPiSession()` assina eventos do `AgentSession` do Pi:

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

- `message_start` / `message_end` / `message_update` (streaming de texto/thinking)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Após a configuração, a sessão recebe o prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

O SDK gerencia o loop completo do agente: envio ao LLM, execução de chamadas de ferramentas, streaming de respostas.

A injeção de imagem é local ao prompt: o OpenClaw carrega refs de imagem do prompt atual e
as passa via `images` apenas para aquele turno. Ele não reescaneia turnos anteriores do histórico
para reinjetar payloads de imagem.

## Arquitetura de ferramentas

### Pipeline de ferramentas

1. **Ferramentas base**: `codingTools` do Pi (`read`, `bash`, `edit`, `write`)
2. **Substituições personalizadas**: o OpenClaw substitui `bash` por `exec`/`process`, personaliza `read`/`edit`/`write` para sandbox
3. **Ferramentas do OpenClaw**: mensagens, navegador, canvas, sessões, Cron, Gateway etc.
4. **Ferramentas de canal**: ferramentas de ação específicas de Discord/Telegram/Slack/WhatsApp
5. **Filtragem por política**: ferramentas filtradas por perfil, provider, agente, grupo, políticas de sandbox
6. **Normalização de schema**: schemas limpos para peculiaridades de Gemini/OpenAI
7. **Encapsulamento de AbortSignal**: ferramentas encapsuladas para respeitar sinais de abort

### Adaptador de definição de ferramenta

`AgentTool` do pi-agent-core tem uma assinatura de `execute` diferente da `ToolDefinition` do pi-coding-agent. O adaptador em `pi-tool-definition-adapter.ts` faz essa ponte:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // A assinatura do pi-coding-agent difere da do pi-agent-core
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
    builtInTools: [], // Vazio. Substituímos tudo
    customTools: toToolDefinitions(options.tools),
  };
}
```

Isso garante que a filtragem de política, a integração com sandbox e o conjunto estendido de ferramentas do OpenClaw permaneçam consistentes entre providers.

## Construção do prompt de sistema

O prompt de sistema é construído em `buildAgentSystemPrompt()` (`system-prompt.ts`). Ele monta um prompt completo com seções incluindo Tooling, Tool Call Style, guardrails de Safety, referência de CLI do OpenClaw, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, metadados de Runtime, além de Memory e Reactions quando ativados, e arquivos de contexto opcionais e conteúdo extra de prompt de sistema. As seções são reduzidas para o modo de prompt minimal usado por subagentes.

O prompt é aplicado após a criação da sessão via `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gerenciamento de sessão

### Arquivos de sessão

As sessões são arquivos JSONL com estrutura em árvore (vinculação por id/parentId). O `SessionManager` do Pi cuida da persistência:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

O OpenClaw encapsula isso com `guardSessionManager()` para segurança de resultados de ferramenta.

### Cache de sessão

`session-manager-cache.ts` armazena em cache instâncias de SessionManager para evitar análise repetida de arquivo:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitação de histórico

`limitHistoryTurns()` reduz o histórico da conversa com base no tipo de canal (DM vs grupo).

### Compaction

A Compaction automática é acionada em caso de overflow de contexto. Assinaturas comuns de overflow
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

O OpenClaw mantém um armazenamento de perfis de autenticação com várias chaves de API por provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Os perfis são rotacionados em caso de falha com rastreamento de cooldown:

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

// Usa ModelRegistry e AuthStorage do Pi
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

O OpenClaw carrega extensões personalizadas do Pi para comportamento especializado:

### Proteção de Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` adiciona guardrails à Compaction, incluindo orçamento adaptativo de tokens, além de resumos de falha de ferramenta e operação de arquivo:

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

## Streaming e respostas em bloco

### Fragmentação em bloco

`EmbeddedBlockChunker` gerencia o streaming de texto em blocos discretos de resposta:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Remoção de tags de thinking/final

A saída de streaming é processada para remover blocos `<think>`/`<thinking>` e extrair conteúdo de `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Remove conteúdo <think>...</think>
  // Se enforceFinalTag, retorna apenas conteúdo <final>...</final>
};
```

### Diretivas de resposta

Diretivas de resposta como `[[media:url]]`, `[[voice]]`, `[[reply:id]]` são analisadas e extraídas:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Tratamento de erros

### Classificação de erros

`pi-embedded-helpers.ts` classifica erros para tratamento apropriado:

```typescript
isContextOverflowError(errorText)     // Contexto grande demais
isCompactionFailureError(errorText)   // Falha na Compaction
isAuthAssistantError(lastAssistant)   // Falha de autenticação
isRateLimitAssistantError(...)        // Limite de taxa atingido
isFailoverAssistantError(...)         // Deve fazer failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback de nível de thinking

Se um nível de thinking não for compatível, é feito fallback:

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

Quando o modo sandbox está ativado, ferramentas e caminhos ficam restritos:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Usa ferramentas read/edit/write em sandbox
  // Exec roda no container
  // Browser usa URL de bridge
}
```

## Tratamento específico por provider

### Anthropic

- Limpeza de string mágica de recusa
- Validação de turno para papéis consecutivos
- Validação estrita upstream de parâmetros de ferramenta do Pi

### Google/Gemini

- Sanitização de schema de ferramenta de propriedade do Plugin

### OpenAI

- Ferramenta `apply_patch` para modelos Codex
- Tratamento de downgrade de nível de thinking

## Integração com TUI

O OpenClaw também tem um modo TUI local que usa componentes do pi-tui diretamente:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Isso fornece a experiência interativa de terminal semelhante ao modo nativo do Pi.

## Principais diferenças em relação ao Pi CLI

| Aspecto         | Pi CLI                  | OpenClaw embutido                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Invocação       | comando `pi` / RPC      | SDK via `createAgentSession()`                                                                 |
| Ferramentas     | Ferramentas padrão de codificação | Suíte personalizada de ferramentas do OpenClaw                                         |
| Prompt de sistema | `AGENTS.md` + prompts   | Dinâmico por canal/contexto                                                                    |
| Armazenamento de sessão | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (ou `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Credencial única        | Vários perfis com rotação                                                                      |
| Extensões       | Carregadas do disco     | Caminhos programáticos + em disco                                                              |
| Tratamento de eventos | Renderização TUI          | Baseado em callback (`onBlockReply` etc.)                                                     |

## Considerações futuras

Áreas para possível retrabalho:

1. **Alinhamento de assinatura de ferramenta**: atualmente adaptando entre assinaturas de pi-agent-core e pi-coding-agent
2. **Encapsulamento de session manager**: `guardSessionManager` adiciona segurança, mas aumenta a complexidade
3. **Carregamento de extensões**: poderia usar `ResourceLoader` do Pi mais diretamente
4. **Complexidade do handler de streaming**: `subscribeEmbeddedPiSession` cresceu bastante
5. **Peculiaridades de provider**: muitos codepaths específicos de provider que o Pi talvez pudesse tratar

## Testes

A cobertura da integração com Pi abrange estes conjuntos:

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

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (ative `OPENCLAW_LIVE_TEST=1`)

Para os comandos atuais de execução, consulte [Fluxo de desenvolvimento do Pi](/pt-BR/pi-dev).

## Relacionado

- [Fluxo de desenvolvimento do Pi](/pt-BR/pi-dev)
- [Visão geral da instalação](/pt-BR/install)
