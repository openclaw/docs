---
read_when:
    - Entendendo o design da integração do SDK do Pi no OpenClaw
    - Modificando o ciclo de vida da sessão do agente, as ferramentas ou a conexão do provedor para Pi
summary: Arquitetura da integração do agente Pi incorporado do OpenClaw e ciclo de vida da sessão
title: Arquitetura da integração com Pi
x-i18n:
    generated_at: "2026-04-24T15:21:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c0b019ff6d35f6fdcd57b56edd1945e62a96bb4b34e312d7fb0c627f01287f1
    source_path: pi.md
    workflow: 15
---

Este documento descreve como o OpenClaw integra com o [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) e seus pacotes irmãos (`pi-ai`, `pi-agent-core`, `pi-tui`) para viabilizar seus recursos de agente de IA.

## Visão geral

O OpenClaw usa o SDK do pi para incorporar um agente de codificação com IA à sua arquitetura de Gateway de mensagens. Em vez de iniciar o pi como um subprocesso ou usar o modo RPC, o OpenClaw importa e instancia diretamente o `AgentSession` do pi por meio de `createAgentSession()`. Essa abordagem incorporada fornece:

- Controle total sobre o ciclo de vida da sessão e o tratamento de eventos
- Injeção de ferramentas personalizada (mensagens, sandbox, ações específicas do canal)
- Personalização do prompt do sistema por canal/contexto
- Persistência da sessão com suporte a ramificação/Compaction
- Rotação de perfil de autenticação com múltiplas contas e failover
- Troca de modelo independente de provedor

## Dependências de pacotes

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Pacote            | Finalidade                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Abstrações principais de LLM: `Model`, `streamSimple`, tipos de mensagem, APIs de provedores          |
| `pi-agent-core`   | Loop do agente, execução de ferramentas, tipos `AgentMessage`                                          |
| `pi-coding-agent` | SDK de alto nível: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, ferramentas integradas |
| `pi-tui`          | Componentes de interface de terminal (usados no modo TUI local do OpenClaw)                            |

## Estrutura de arquivos

```
src/agents/
├── pi-embedded-runner.ts          # Reexporta de pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Entrada principal: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Lógica de tentativa única com configuração da sessão
│   │   ├── params.ts              # Tipo RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Monta payloads de resposta a partir dos resultados da execução
│   │   ├── images.ts              # Injeção de imagens do modelo de visão
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Detecção de erro de cancelamento
│   ├── cache-ttl.ts               # Rastreamento de TTL de cache para poda de contexto
│   ├── compact.ts                 # Lógica manual/automática de Compaction
│   ├── extensions.ts              # Carrega extensões do pi para execuções incorporadas
│   ├── extra-params.ts            # Parâmetros de stream específicos do provedor
│   ├── google.ts                  # Correções de ordenação de turnos do Google/Gemini
│   ├── history.ts                 # Limitação de histórico (DM vs grupo)
│   ├── lanes.ts                   # Faixas de comando da sessão/globais
│   ├── logger.ts                  # Logger do subsistema
│   ├── model.ts                   # Resolução de modelo via ModelRegistry
│   ├── runs.ts                    # Rastreamento de execuções ativas, cancelamento, fila
│   ├── sandbox-info.ts            # Informações de sandbox para o prompt do sistema
│   ├── session-manager-cache.ts   # Cache de instância de SessionManager
│   ├── session-manager-init.ts    # Inicialização do arquivo de sessão
│   ├── system-prompt.ts           # Construtor do prompt do sistema
│   ├── tool-split.ts              # Divide ferramentas em builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapeamento de ThinkLevel, descrição de erro
├── pi-embedded-subscribe.ts       # Assinatura/encaminhamento de eventos da sessão
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fábrica de manipuladores de eventos
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Fragmentação de resposta em blocos para streaming
├── pi-embedded-messaging.ts       # Rastreamento de envios da ferramenta de mensagens
├── pi-embedded-helpers.ts         # Classificação de erro, validação de turno
├── pi-embedded-helpers/           # Módulos auxiliares
├── pi-embedded-utils.ts           # Utilitários de formatação
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Empacotamento de AbortSignal para ferramentas
├── pi-tools.policy.ts             # Política de allowlist/denylist de ferramentas
├── pi-tools.read.ts               # Personalizações da ferramenta read
├── pi-tools.schema.ts             # Normalização de schema de ferramentas
├── pi-tools.types.ts              # Alias de tipo AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adaptador de AgentTool -> ToolDefinition
├── pi-settings.ts                 # Sobrescritas de configurações
├── pi-hooks/                      # Hooks personalizados do pi
│   ├── compaction-safeguard.ts    # Extensão de proteção
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Extensão de poda de contexto com TTL de cache
│   └── context-pruning/
├── model-auth.ts                  # Resolução de perfil de autenticação
├── auth-profiles.ts               # Armazenamento de perfis, cooldown, failover
├── model-selection.ts             # Resolução do modelo padrão
├── models-config.ts               # Geração de models.json
├── model-catalog.ts               # Cache de catálogo de modelos
├── context-window-guard.ts        # Validação da janela de contexto
├── failover-error.ts              # Classe FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Resolução de parâmetros do prompt do sistema
├── system-prompt-report.ts        # Geração de relatório de depuração
├── tool-summaries.ts              # Resumos de descrição de ferramentas
├── tool-policy.ts                 # Resolução de política de ferramentas
├── transcript-policy.ts           # Política de validação de transcrição
├── skills.ts                      # Snapshot de Skills/construção de prompt
├── skills/                        # Subsistema de Skills
├── sandbox.ts                     # Resolução de contexto de sandbox
├── sandbox/                       # Subsistema de sandbox
├── channel-tools.ts               # Injeção de ferramentas específicas do canal
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

Os runtimes de ação de mensagens específicos de canal agora ficam nos diretórios de extensão de propriedade do Plugin, em vez de em `src/agents/tools`, por exemplo:

- os arquivos de runtime de ação do Plugin do Discord
- o arquivo de runtime de ação do Plugin do Slack
- o arquivo de runtime de ação do Plugin do Telegram
- o arquivo de runtime de ação do Plugin do WhatsApp

## Fluxo principal de integração

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

### 4. Envio do prompt

Após a configuração, o prompt é enviado à sessão:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

O SDK lida com o loop completo do agente: envio para o LLM, execução de chamadas de ferramenta e streaming de respostas.

A injeção de imagens é local ao prompt: o OpenClaw carrega referências de imagem do prompt atual e as passa por `images` apenas para aquele turno. Ele não reexamina turnos antigos do histórico para reinjetar payloads de imagem.

## Arquitetura de ferramentas

### Pipeline de ferramentas

1. **Ferramentas base**: `codingTools` do pi (`read`, `bash`, `edit`, `write`)
2. **Substituições personalizadas**: o OpenClaw substitui `bash` por `exec`/`process`, personaliza `read`/`edit`/`write` para sandbox
3. **Ferramentas do OpenClaw**: mensagens, navegador, canvas, sessões, Cron, Gateway etc.
4. **Ferramentas de canal**: ferramentas de ação específicas de Discord/Telegram/Slack/WhatsApp
5. **Filtragem por política**: ferramentas filtradas por políticas de perfil, provedor, agente, grupo e sandbox
6. **Normalização de schema**: schemas limpos para particularidades do Gemini/OpenAI
7. **Empacotamento com AbortSignal**: ferramentas empacotadas para respeitar sinais de cancelamento

### Adaptador de definição de ferramenta

O `AgentTool` de pi-agent-core tem uma assinatura `execute` diferente da `ToolDefinition` de pi-coding-agent. O adaptador em `pi-tool-definition-adapter.ts` faz essa ponte:

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

`splitSdkTools()` passa todas as ferramentas por `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Isso garante que a filtragem por política, a integração com sandbox e o conjunto estendido de ferramentas do OpenClaw permaneçam consistentes entre provedores.

## Construção do prompt do sistema

O prompt do sistema é construído em `buildAgentSystemPrompt()` (`system-prompt.ts`). Ele monta um prompt completo com seções que incluem Ferramentas, Estilo de chamada de ferramenta, Proteções de segurança, referência da CLI do OpenClaw, Skills, Documentação, Workspace, Sandbox, Mensagens, Tags de resposta, Voz, Respostas silenciosas, Heartbeats, Metadados de runtime, além de Memória e Reações quando habilitados, e arquivos de contexto opcionais e conteúdo extra para o prompt do sistema. As seções são reduzidas para um modo de prompt mínimo usado por subagentes.

O prompt é aplicado após a criação da sessão por meio de `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gerenciamento de sessão

### Arquivos de sessão

As sessões são arquivos JSONL com estrutura em árvore (vinculação por id/parentId). O `SessionManager` do Pi gerencia a persistência:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

O OpenClaw encapsula isso com `guardSessionManager()` para segurança dos resultados de ferramentas.

### Cache de sessão

`session-manager-cache.ts` armazena em cache instâncias de SessionManager para evitar parsing repetido de arquivos:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitação de histórico

`limitHistoryTurns()` reduz o histórico da conversa com base no tipo de canal (DM vs grupo).

### Compaction

A Compaction automática é acionada em caso de overflow de contexto. Assinaturas comuns de overflow incluem `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model` e `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` lida com a Compaction
manual:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Autenticação e resolução de modelo

### Perfis de autenticação

O OpenClaw mantém um armazenamento de perfis de autenticação com múltiplas chaves de API por provedor:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Os perfis são rotacionados em falhas com rastreamento de cooldown:

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

`src/agents/pi-hooks/compaction-safeguard.ts` adiciona proteções à Compaction, incluindo orçamento adaptativo de tokens, além de resumos de falha de ferramenta e operações de arquivo:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Poda de contexto

`src/agents/pi-hooks/context-pruning.ts` implementa poda de contexto com base em TTL de cache:

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

### Fragmentação de blocos

`EmbeddedBlockChunker` gerencia texto em streaming em blocos discretos de resposta:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Remoção de tags de pensamento/final

A saída em streaming é processada para remover blocos `<think>`/`<thinking>` e extrair o conteúdo de `<final>`:

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

### Fallback de nível de pensamento

Se um nível de pensamento não for compatível, ele recua para outro:

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

- Remoção de string mágica de recusa
- Validação de turno para papéis consecutivos
- Validação estrita upstream de parâmetros de ferramenta do Pi

### Google/Gemini

- Sanitização de schema de ferramenta de propriedade do Plugin

### OpenAI

- Ferramenta `apply_patch` para modelos Codex
- Tratamento de downgrade de nível de pensamento

## Integração com TUI

O OpenClaw também tem um modo TUI local que usa componentes de pi-tui diretamente:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Isso fornece a experiência interativa de terminal semelhante ao modo nativo do pi.

## Principais diferenças em relação à CLI do Pi

| Aspecto         | CLI do Pi                | OpenClaw incorporado                                                                            |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| Invocação       | comando `pi` / RPC       | SDK via `createAgentSession()`                                                                   |
| Ferramentas     | Ferramentas padrão de código | Conjunto de ferramentas personalizadas do OpenClaw                                            |
| Prompt do sistema | AGENTS.md + prompts    | Dinâmico por canal/contexto                                                                      |
| Armazenamento de sessão | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (ou `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Autenticação    | Credencial única         | Múltiplos perfis com rotação                                                                     |
| Extensões       | Carregadas do disco      | Caminhos programáticos + em disco                                                                |
| Tratamento de eventos | Renderização em TUI | Baseado em callback (`onBlockReply` etc.)                                                        |

## Considerações futuras

Áreas para possível reformulação:

1. **Alinhamento de assinatura de ferramenta**: atualmente adaptando entre assinaturas de pi-agent-core e pi-coding-agent
2. **Encapsulamento de session manager**: `guardSessionManager` adiciona segurança, mas aumenta a complexidade
3. **Carregamento de extensões**: poderia usar o `ResourceLoader` do pi de forma mais direta
4. **Complexidade do manipulador de streaming**: `subscribeEmbeddedPiSession` cresceu bastante
5. **Particularidades de provedores**: muitos fluxos de código específicos de provedor que o pi talvez pudesse tratar

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

Ao vivo/opcional:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (habilite `OPENCLAW_LIVE_TEST=1`)

Para os comandos atuais de execução, consulte [fluxo de desenvolvimento do Pi](/pt-BR/pi-dev).

## Relacionado

- [Fluxo de desenvolvimento do Pi](/pt-BR/pi-dev)
- [Visão geral da instalação](/pt-BR/install)
