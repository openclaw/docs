---
read_when:
    - Entendendo o design da integração do SDK do Pi no OpenClaw
    - Modificando o ciclo de vida da sessão do agente, as ferramentas ou a integração do provedor para o Pi
summary: Arquitetura da integração incorporada do agente Pi do OpenClaw e ciclo de vida da sessão
title: Arquitetura da integração com o Pi
x-i18n:
    generated_at: "2026-04-22T04:23:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ab2934958cd699b585ce57da5ac3077754d46725e74a8e604afc14d2b4ca022
    source_path: pi.md
    workflow: 15
---

# Arquitetura da integração com o Pi

Este documento descreve como o OpenClaw se integra com [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) e seus pacotes relacionados (`pi-ai`, `pi-agent-core`, `pi-tui`) para oferecer seus recursos de agente de IA.

## Visão geral

O OpenClaw usa o SDK do Pi para incorporar um agente de codificação com IA em sua arquitetura de gateway de mensagens. Em vez de iniciar o pi como subprocesso ou usar o modo RPC, o OpenClaw importa e instancia diretamente o `AgentSession` do pi via `createAgentSession()`. Essa abordagem incorporada oferece:

- Controle total sobre o ciclo de vida da sessão e o tratamento de eventos
- Injeção de ferramentas personalizadas (mensagens, sandbox, ações específicas de canal)
- Personalização do prompt do sistema por canal/contexto
- Persistência de sessão com suporte a branching/Compaction
- Rotação de perfil de autenticação com múltiplas contas e failover
- Alternância de modelo independente de provedor

## Dependências de pacote

```json
{
  "@mariozechner/pi-agent-core": "0.68.1",
  "@mariozechner/pi-ai": "0.68.1",
  "@mariozechner/pi-coding-agent": "0.68.1",
  "@mariozechner/pi-tui": "0.68.1"
}
```

| Pacote            | Finalidade                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `pi-ai`           | Abstrações principais de LLM: `Model`, `streamSimple`, tipos de mensagem, APIs de provedor             |
| `pi-agent-core`   | Loop do agente, execução de ferramentas, tipos `AgentMessage`                                           |
| `pi-coding-agent` | SDK de alto nível: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, ferramentas nativas |
| `pi-tui`          | Componentes de UI de terminal (usados no modo TUI local do OpenClaw)                                    |

## Estrutura de arquivos

```
src/agents/
├── pi-embedded-runner.ts          # Reexportações de pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Entrada principal: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Lógica de tentativa única com configuração de sessão
│   │   ├── params.ts              # Tipo RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Monta cargas de resposta a partir dos resultados da execução
│   │   ├── images.ts              # Injeção de imagens para modelo de visão
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Detecção de erro de abort
│   ├── cache-ttl.ts               # Rastreamento de TTL de cache para poda de contexto
│   ├── compact.ts                 # Lógica de Compaction manual/automática
│   ├── extensions.ts              # Carrega extensões do pi para execuções incorporadas
│   ├── extra-params.ts            # Parâmetros de stream específicos do provedor
│   ├── google.ts                  # Correções de ordenação de turno para Google/Gemini
│   ├── history.ts                 # Limitação de histórico (DM vs grupo)
│   ├── lanes.ts                   # Lanes de comando de sessão/global
│   ├── logger.ts                  # Logger do subsistema
│   ├── model.ts                   # Resolução de modelo via ModelRegistry
│   ├── runs.ts                    # Rastreamento de execuções ativas, abort, fila
│   ├── sandbox-info.ts            # Informações de sandbox para o prompt do sistema
│   ├── session-manager-cache.ts   # Cache de instância de SessionManager
│   ├── session-manager-init.ts    # Inicialização de arquivo de sessão
│   ├── system-prompt.ts           # Construtor do prompt do sistema
│   ├── tool-split.ts              # Divide ferramentas em builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapeamento de ThinkLevel, descrição de erro
├── pi-embedded-subscribe.ts       # Assinatura/dispatch de evento de sessão
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fábrica de handlers de evento
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Fragmentação de resposta em bloco para streaming
├── pi-embedded-messaging.ts       # Rastreamento de envios da ferramenta de mensagem
├── pi-embedded-helpers.ts         # Classificação de erro, validação de turno
├── pi-embedded-helpers/           # Módulos auxiliares
├── pi-embedded-utils.ts           # Utilitários de formatação
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Encapsulamento de AbortSignal para ferramentas
├── pi-tools.policy.ts             # Política de allowlist/denylist de ferramentas
├── pi-tools.read.ts               # Personalizações da ferramenta de leitura
├── pi-tools.schema.ts             # Normalização de esquema de ferramentas
├── pi-tools.types.ts              # Alias de tipo AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adaptador AgentTool -> ToolDefinition
├── pi-settings.ts                 # Sobrescritas de configuração
├── pi-hooks/                      # Hooks personalizados do pi
│   ├── compaction-safeguard.ts    # Extensão de proteção
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Extensão de poda de contexto com TTL de cache
│   └── context-pruning/
├── model-auth.ts                  # Resolução de perfil de autenticação
├── auth-profiles.ts               # Armazenamento de perfil, cooldown, failover
├── model-selection.ts             # Resolução de modelo padrão
├── models-config.ts               # Geração de models.json
├── model-catalog.ts               # Cache de catálogo de modelos
├── context-window-guard.ts        # Validação de janela de contexto
├── failover-error.ts              # Classe FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Resolução de parâmetros do prompt do sistema
├── system-prompt-report.ts        # Geração de relatório de depuração
├── tool-summaries.ts              # Resumos de descrição de ferramenta
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
├── tools/                         # Implementações individuais de ferramenta
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
de extensão pertencentes ao plugin, em vez de em `src/agents/tools`, por exemplo:

- os arquivos de runtime de ação do plugin do Discord
- o arquivo de runtime de ação do plugin do Slack
- o arquivo de runtime de ação do plugin do Telegram
- o arquivo de runtime de ação do plugin do WhatsApp

## Fluxo principal de integração

### 1. Executando um agente incorporado

O principal ponto de entrada é `runEmbeddedPiAgent()` em `pi-embedded-runner/run.ts`:

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

### 4. Prompting

Após a configuração, a sessão recebe o prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

O SDK trata o loop completo do agente: envio para LLM, execução de chamadas de ferramenta, streaming de respostas.

A injeção de imagem é local ao prompt: o OpenClaw carrega refs de imagem do prompt atual e
as passa por `images` apenas para esse turno. Ele não revarre turnos antigos do histórico
para reinjetar cargas de imagem.

## Arquitetura de ferramentas

### Pipeline de ferramentas

1. **Ferramentas base**: `codingTools` do pi (`read`, `bash`, `edit`, `write`)
2. **Substituições personalizadas**: o OpenClaw substitui `bash` por `exec`/`process`, personaliza `read`/`edit`/`write` para sandbox
3. **Ferramentas do OpenClaw**: mensagens, navegador, canvas, sessões, Cron, Gateway etc.
4. **Ferramentas de canal**: ferramentas de ação específicas de Discord/Telegram/Slack/WhatsApp
5. **Filtragem por política**: ferramentas filtradas por perfil, provedor, agente, grupo, políticas de sandbox
6. **Normalização de esquema**: esquemas limpos para particularidades de Gemini/OpenAI
7. **Encapsulamento de AbortSignal**: ferramentas encapsuladas para respeitar sinais de abort

### Adaptador de definição de ferramenta

O `AgentTool` de pi-agent-core tem uma assinatura `execute` diferente da `ToolDefinition` de pi-coding-agent. O adaptador em `pi-tool-definition-adapter.ts` faz a ponte:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // a assinatura de pi-coding-agent difere da de pi-agent-core
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
    builtInTools: [], // Vazio. Sobrescrevemos tudo
    customTools: toToolDefinitions(options.tools),
  };
}
```

Isso garante que a filtragem de política, a integração com sandbox e o conjunto estendido de ferramentas do OpenClaw permaneçam consistentes entre provedores.

## Construção do prompt do sistema

O prompt do sistema é construído em `buildAgentSystemPrompt()` (`system-prompt.ts`). Ele monta um prompt completo com seções incluindo Ferramentas, Estilo de chamada de ferramenta, proteções de segurança, referência da CLI do OpenClaw, Skills, Documentação, Workspace, Sandbox, Mensagens, Tags de resposta, Voz, Respostas silenciosas, Heartbeats, metadados de runtime, além de Memória e Reações quando ativadas, e arquivos de contexto opcionais e conteúdo extra do prompt do sistema. As seções são reduzidas para o modo de prompt mínimo usado por subagentes.

O prompt é aplicado após a criação da sessão via `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gerenciamento de sessão

### Arquivos de sessão

As sessões são arquivos JSONL com estrutura em árvore (vinculação por id/parentId). O `SessionManager` do Pi trata a persistência:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

O OpenClaw encapsula isso com `guardSessionManager()` para segurança do resultado de ferramenta.

### Cache de sessão

`session-manager-cache.ts` faz cache de instâncias de SessionManager para evitar parse repetido de arquivo:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitação de histórico

`limitHistoryTurns()` reduz o histórico da conversa com base no tipo de canal (DM vs grupo).

### Compaction

A Compaction automática é acionada em overflow de contexto. Assinaturas comuns de overflow
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

Os perfis giram em falhas com rastreamento de cooldown:

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

// Usa o ModelRegistry e o AuthStorage do Pi
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

`src/agents/pi-hooks/compaction-safeguard.ts` adiciona proteções à Compaction, incluindo orçamento adaptativo de tokens mais resumos de falhas de ferramenta e operações de arquivo:

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

`EmbeddedBlockChunker` gerencia texto em streaming em blocos discretos de resposta:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Remoção de tags de thinking/final

A saída em streaming é processada para remover blocos `<think>`/`<thinking>` e extrair conteúdo de `<final>`:

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
isCompactionFailureError(errorText)   // Falha de Compaction
isAuthAssistantError(lastAssistant)   // Falha de autenticação
isRateLimitAssistantError(...)        // Limite de taxa atingido
isFailoverAssistantError(...)         // Deve fazer failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback de nível de thinking

Se um nível de thinking não for compatível, ele faz fallback:

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
  // Exec executa no contêiner
  // O navegador usa URL de bridge
}
```

## Tratamento específico de provedor

### Anthropic

- Limpeza de string mágica de recusa
- Validação de turno para papéis consecutivos
- Validação rigorosa upstream de parâmetros de ferramenta do Pi

### Google/Gemini

- Sanitização de esquema de ferramenta pertencente ao plugin

### OpenAI

- Ferramenta `apply_patch` para modelos Codex
- Tratamento de downgrade de nível de thinking

## Integração com TUI

O OpenClaw também tem um modo TUI local que usa diretamente componentes de pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Isso oferece a experiência interativa de terminal semelhante ao modo nativo do pi.

## Principais diferenças em relação à CLI do Pi

| Aspecto         | CLI do Pi                | OpenClaw incorporado                                                                            |
| --------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| Invocação       | comando `pi` / RPC       | SDK via `createAgentSession()`                                                                  |
| Ferramentas     | Ferramentas padrão de codificação | Suíte personalizada de ferramentas do OpenClaw                                           |
| Prompt do sistema | AGENTS.md + prompts    | Dinâmico por canal/contexto                                                                     |
| Armazenamento de sessão | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (ou `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Autenticação    | Credencial única         | Múltiplos perfis com rotação                                                                    |
| Extensões       | Carregadas do disco      | Caminhos programáticos + do disco                                                               |
| Tratamento de eventos | Renderização TUI    | Baseado em callback (`onBlockReply` etc.)                                                       |

## Considerações futuras

Áreas para possível retrabalho:

1. **Alinhamento de assinatura de ferramenta**: atualmente adaptando entre assinaturas de pi-agent-core e pi-coding-agent
2. **Encapsulamento de session manager**: `guardSessionManager` adiciona segurança, mas aumenta a complexidade
3. **Carregamento de extensão**: poderia usar o `ResourceLoader` do Pi de forma mais direta
4. **Complexidade do handler de streaming**: `subscribeEmbeddedPiSession` cresceu bastante
5. **Particularidades de provedor**: muitos caminhos de código específicos de provedor que o Pi potencialmente poderia tratar

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

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (ative `OPENCLAW_LIVE_TEST=1`)

Para ver os comandos atuais de execução, consulte [Fluxo de desenvolvimento do Pi](/pt-BR/pi-dev).
