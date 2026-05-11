---
read_when:
    - Entendendo o design de integração do SDK do Pi no OpenClaw
    - Modificando o ciclo de vida da sessão do agente, o ferramental ou a integração de provedores para o Pi
summary: Arquitetura da integração do agente Pi embarcado do OpenClaw e do ciclo de vida da sessão
title: Arquitetura de integração do Pi
x-i18n:
    generated_at: "2026-05-11T20:32:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44d1f3fb0e04302f09c6259dbce8a12a0f25e345c2407162d82c7712d33d5e0a
    source_path: pi.md
    workflow: 16
---

OpenClaw integra-se com [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) e seus pacotes irmãos (`pi-ai`, `pi-agent-core`, `pi-tui`) para impulsionar seus recursos de agente de IA.

## Visão geral

OpenClaw usa o SDK pi para incorporar um agente de codificação de IA à sua arquitetura de Gateway de mensagens. Em vez de iniciar o pi como um subprocesso ou usar o modo RPC, o OpenClaw importa e instancia diretamente o `AgentSession` do pi por meio de `createAgentSession()`. Essa abordagem incorporada oferece:

- Controle total sobre o ciclo de vida da sessão e o tratamento de eventos
- Injeção personalizada de ferramentas (mensagens, sandbox, ações específicas de canal)
- Personalização do prompt do sistema por canal/contexto
- Persistência de sessão com suporte a ramificação/Compaction
- Rotação de perfis de autenticação de várias contas com failover
- Troca de modelos independente de provedor

## Dependências de pacote

```json
{
  "@earendil-works/pi-agent-core": "0.74.0",
  "@earendil-works/pi-ai": "0.74.0",
  "@earendil-works/pi-coding-agent": "0.74.0",
  "@earendil-works/pi-tui": "0.74.0"
}
```

| Pacote            | Finalidade                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Abstrações centrais de LLM: `Model`, `streamSimple`, tipos de mensagem, APIs de provedor               |
| `pi-agent-core`   | Loop do agente, execução de ferramentas, tipos `AgentMessage`                                          |
| `pi-coding-agent` | SDK de alto nível: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, ferramentas integradas |
| `pi-tui`          | Componentes de interface de terminal (usados no modo TUI local do OpenClaw)                            |

## Estrutura de arquivos

```
src/agents/
├── pi-embedded-runner.ts          # Reexportações de pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Entrada principal: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Lógica de uma única tentativa com configuração de sessão
│   │   ├── params.ts              # Tipo RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Cria payloads de resposta a partir dos resultados da execução
│   │   ├── images.ts              # Injeção de imagens no modelo de visão
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Detecção de erro de abortamento
│   ├── cache-ttl.ts               # Rastreamento de TTL de cache para poda de contexto
│   ├── compact.ts                 # Lógica de Compaction manual/automática
│   ├── extensions.ts              # Carrega extensões do pi para execuções incorporadas
│   ├── extra-params.ts            # Parâmetros de stream específicos de provedor
│   ├── google.ts                  # Correções de ordenação de turnos do Google/Gemini
│   ├── history.ts                 # Limitação de histórico (DM vs grupo)
│   ├── lanes.ts                   # Trilhas de comandos de sessão/globais
│   ├── logger.ts                  # Logger do subsistema
│   ├── model.ts                   # Resolução de modelo via ModelRegistry
│   ├── runs.ts                    # Rastreamento de execuções ativas, abortamento, fila
│   ├── sandbox-info.ts            # Informações de sandbox para o prompt do sistema
│   ├── session-manager-cache.ts   # Cache de instâncias de SessionManager
│   ├── session-manager-init.ts    # Inicialização do arquivo de sessão
│   ├── system-prompt.ts           # Construtor de prompt do sistema
│   ├── tool-split.ts              # Divide ferramentas entre builtIn e personalizadas
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapeamento de ThinkLevel, descrição de erro
├── pi-embedded-subscribe.ts       # Assinatura/despacho de eventos de sessão
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fábrica de manipuladores de eventos
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Divisão de respostas em bloco por streaming
├── pi-embedded-messaging.ts       # Rastreamento de ferramenta de mensagens enviadas
├── pi-embedded-helpers.ts         # Classificação de erros, validação de turno
├── pi-embedded-helpers/           # Módulos auxiliares
├── pi-embedded-utils.ts           # Utilitários de formatação
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Encapsulamento de AbortSignal para ferramentas
├── pi-tools.policy.ts             # Política de lista de permissão/negação de ferramentas
├── pi-tools.read.ts               # Personalizações da ferramenta de leitura
├── pi-tools.schema.ts             # Normalização de esquema de ferramentas
├── pi-tools.types.ts              # Alias de tipo AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adaptador AgentTool -> ToolDefinition
├── pi-settings.ts                 # Substituições de configurações
├── pi-hooks/                      # Hooks personalizados do pi
│   ├── compaction-safeguard.ts    # Extensão de salvaguarda
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Extensão de poda de contexto com TTL de cache
│   └── context-pruning/
├── model-auth.ts                  # Resolução de perfil de autenticação
├── auth-profiles.ts               # Armazenamento de perfis, cooldown, failover
├── model-selection.ts             # Resolução do modelo padrão
├── models-config.ts               # Geração de models.json
├── model-catalog.ts               # Cache do catálogo de modelos
├── context-window-guard.ts        # Validação da janela de contexto
├── failover-error.ts              # Classe FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Resolução de parâmetros do prompt do sistema
├── system-prompt-report.ts        # Geração de relatório de depuração
├── tool-summaries.ts              # Resumos de descrições de ferramentas
├── tool-policy.ts                 # Resolução da política de ferramentas
├── transcript-policy.ts           # Política de validação de transcrição
├── skills.ts                      # Criação de snapshot/prompt de Skills
├── skills/                        # Subsistema de Skills
├── sandbox.ts                     # Resolução de contexto de sandbox
├── sandbox/                       # Subsistema de sandbox
├── channel-tools.ts               # Injeção de ferramentas específicas de canal
├── openclaw-tools.ts              # Ferramentas específicas do OpenClaw
├── bash-tools.ts                  # Ferramentas de exec/process
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

Os runtimes de ações de mensagem específicas de canal agora ficam nos diretórios de extensão pertencentes ao Plugin, em vez de sob `src/agents/tools`, por exemplo:

- os arquivos de runtime de ações do Plugin Discord
- o arquivo de runtime de ações do Plugin Slack
- o arquivo de runtime de ações do Plugin Telegram
- o arquivo de runtime de ações do Plugin WhatsApp

## Fluxo de integração central

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

### 2. Criação de sessão

Dentro de `runEmbeddedAttempt()` (chamado por `runEmbeddedPiAgent()`), o SDK pi é usado:

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@earendil-works/pi-coding-agent";

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

`subscribeEmbeddedPiSession()` assina os eventos de `AgentSession` do pi:

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

### 4. Prompting

Após a configuração, a sessão recebe o prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

O SDK lida com o loop completo do agente: envio ao LLM, execução de chamadas de ferramentas, streaming de respostas.

A injeção de imagem é local ao prompt: OpenClaw carrega referências de imagem do prompt atual e as passa via `images` apenas para esse turno. Ele não reexamina turnos mais antigos do histórico para reinjetar payloads de imagem.

## Arquitetura de ferramentas

### Pipeline de ferramentas

1. **Ferramentas base**: `codingTools` do pi (read, bash, edit, write)
2. **Substituições personalizadas**: OpenClaw substitui bash por `exec`/`process`, personaliza read/edit/write para sandbox
3. **Ferramentas OpenClaw**: mensagens, navegador, canvas, sessões, Cron, Gateway etc.
4. **Ferramentas de canal**: ferramentas de ação específicas de Discord/Telegram/Slack/WhatsApp
5. **Filtragem de políticas**: ferramentas filtradas por perfil, provedor, agente, grupo, políticas de sandbox
6. **Normalização de esquema**: esquemas limpos para peculiaridades do Gemini/OpenAI
7. **Encapsulamento de AbortSignal**: ferramentas encapsuladas para respeitar sinais de abortamento

### Adaptador de definição de ferramenta

O `AgentTool` do pi-agent-core tem uma assinatura de `execute` diferente do `ToolDefinition` do pi-coding-agent. O adaptador em `pi-tool-definition-adapter.ts` faz a ponte:

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

O prompt do sistema é construído em `buildAgentSystemPrompt()` (`system-prompt.ts`). Ele monta um prompt completo com seções que incluem Ferramentas, Estilo de Chamada de Ferramenta, proteções de segurança, Controle do OpenClaw, Skills, Documentos, Workspace, Sandbox, Mensagens, Diretivas de Saída do Assistente, Voz, Respostas Silenciosas, Heartbeats, metadados de runtime, além de Memória e Reações quando habilitadas, e arquivos de contexto opcionais e conteúdo extra do prompt do sistema. As seções são reduzidas para o modo de prompt mínimo usado por subagentes.

O prompt é aplicado após a criação da sessão via `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gerenciamento de sessões

### Arquivos de sessão

Sessões são arquivos JSONL com estrutura em árvore (vínculo id/parentId). O `SessionManager` do Pi lida com a persistência:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

O OpenClaw envolve isso com `guardSessionManager()` para segurança de resultados de ferramentas.

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

A compactação automática é acionada em caso de estouro de contexto. Assinaturas comuns de estouro incluem `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` e `ollama error: context length exceeded`. `compactEmbeddedPiSessionDirect()` lida com Compaction manual:

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

Perfis são rotacionados em falhas com acompanhamento de cooldown:

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

O OpenClaw carrega extensões personalizadas do Pi para comportamento especializado:

### Proteção de Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` adiciona proteções à compactação, incluindo orçamento adaptativo de tokens e resumos de falhas de ferramentas e operações de arquivo:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Poda de contexto

`src/agents/pi-hooks/context-pruning.ts` implementa poda de contexto baseada em cache-TTL:

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

### Fragmentação de blocos

`EmbeddedBlockChunker` gerencia streaming de texto em blocos discretos de resposta:

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

`pi-embedded-helpers.ts` classifica erros para o tratamento adequado:

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback de nível de pensamento

Se um nível de pensamento não for compatível, ele usa fallback:

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

Quando o modo sandbox está habilitado, ferramentas e caminhos são restringidos:

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
- Validação de turnos para papéis consecutivos
- Validação estrita de parâmetros de ferramenta do Pi upstream

### Google/Gemini

- Sanitização de schema de ferramentas de propriedade do Plugin

### OpenAI

- Ferramenta `apply_patch` para modelos Codex
- Tratamento de rebaixamento de nível de pensamento

## Integração com TUI

O OpenClaw também tem um modo TUI local que usa diretamente componentes pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@earendil-works/pi-tui";
```

Isso fornece a experiência interativa de terminal semelhante ao modo nativo do Pi.

## Principais diferenças em relação à CLI do Pi

| Aspecto          | CLI do Pi                | OpenClaw incorporado                                                                           |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Invocação       | comando `pi` / RPC      | SDK via `createAgentSession()`                                                                 |
| Ferramentas     | Ferramentas de codificação padrão | Conjunto personalizado de ferramentas do OpenClaw                                              |
| Prompt do sistema | AGENTS.md + prompts   | Dinâmico por canal/contexto                                                                    |
| Armazenamento de sessão | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (ou `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Autenticação    | Credencial única        | Vários perfis com rotação                                                                      |
| Extensões       | Carregadas do disco     | Programáticas + caminhos em disco                                                              |
| Tratamento de eventos | Renderização TUI    | Baseado em callbacks (onBlockReply etc.)                                                       |

## Considerações futuras

Áreas para possível retrabalho:

1. **Alinhamento de assinaturas de ferramentas**: atualmente adapta entre assinaturas de pi-agent-core e pi-coding-agent
2. **Encapsulamento do gerenciador de sessões**: `guardSessionManager` adiciona segurança, mas aumenta a complexidade
3. **Carregamento de extensões**: poderia usar o `ResourceLoader` do Pi mais diretamente
4. **Complexidade do manipulador de streaming**: `subscribeEmbeddedPiSession` cresceu bastante
5. **Peculiaridades de provedores**: muitos caminhos de código específicos por provedor que o Pi poderia potencialmente tratar

## Testes

A cobertura da integração com Pi abrange estas suítes:

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

## Relacionado

- [Fluxo de desenvolvimento do Pi](/pt-BR/pi-dev)
- [Visão geral da instalação](/pt-BR/install)
