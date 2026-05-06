---
read_when:
    - Comprendre la conception de l’intégration du SDK Pi dans OpenClaw
    - Modification du cycle de vie des sessions d’agent, de l’outillage ou du câblage des fournisseurs pour Pi
summary: Architecture de l’intégration de l’agent Pi embarqué d’OpenClaw et du cycle de vie des sessions
title: Architecture de l’intégration Pi
x-i18n:
    generated_at: "2026-05-06T07:30:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: abd9e828b0a72ac4e796f33c247bb2b5d7143ddf5e897ad9d7380cfbfce1eb64
    source_path: pi.md
    workflow: 16
---

OpenClaw s’intègre à [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) et à ses packages voisins (`pi-ai`, `pi-agent-core`, `pi-tui`) pour alimenter ses capacités d’agent IA.

## Vue d’ensemble

OpenClaw utilise le SDK pi pour intégrer un agent de codage IA dans son architecture de Gateway de messagerie. Au lieu de lancer pi comme sous-processus ou d’utiliser le mode RPC, OpenClaw importe et instancie directement l’`AgentSession` de pi via `createAgentSession()`. Cette approche intégrée fournit :

- Un contrôle complet du cycle de vie des sessions et de la gestion des événements
- L’injection d’outils personnalisés (messagerie, sandbox, actions propres au canal)
- La personnalisation du prompt système par canal/contexte
- La persistance des sessions avec prise en charge du branchement/de la Compaction
- La rotation des profils d’authentification multi-comptes avec basculement
- Le changement de modèle indépendant du fournisseur

## Dépendances de packages

```json
{
  "@mariozechner/pi-agent-core": "0.73.0",
  "@mariozechner/pi-ai": "0.73.0",
  "@mariozechner/pi-coding-agent": "0.73.0",
  "@mariozechner/pi-tui": "0.73.0"
}
```

| Package           | Objectif                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Abstractions LLM de base : `Model`, `streamSimple`, types de messages, API de fournisseurs             |
| `pi-agent-core`   | Boucle d’agent, exécution d’outils, types `AgentMessage`                                               |
| `pi-coding-agent` | SDK de haut niveau : `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, outils intégrés |
| `pi-tui`          | Composants d’interface utilisateur de terminal (utilisés dans le mode TUI local d’OpenClaw)            |

## Structure des fichiers

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

Les runtimes d’actions de message propres aux canaux résident désormais dans les répertoires d’extension appartenant au Plugin au lieu de se trouver sous `src/agents/tools`, par exemple :

- les fichiers de runtime d’actions du Plugin Discord
- le fichier de runtime d’actions du Plugin Slack
- le fichier de runtime d’actions du Plugin Telegram
- le fichier de runtime d’actions du Plugin WhatsApp

## Flux d’intégration principal

### 1. Exécution d’un agent intégré

Le point d’entrée principal est `runEmbeddedPiAgent()` dans `pi-embedded-runner/run.ts` :

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

### 2. Création de session

Dans `runEmbeddedAttempt()` (appelé par `runEmbeddedPiAgent()`), le SDK pi est utilisé :

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

### 3. Abonnement aux événements

`subscribeEmbeddedPiSession()` s’abonne aux événements `AgentSession` de pi :

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

Les événements gérés comprennent :

- `message_start` / `message_end` / `message_update` (texte/réflexion en streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Après la configuration, la session reçoit un prompt :

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

Le SDK gère la boucle d’agent complète : envoi au LLM, exécution des appels d’outils, diffusion des réponses en streaming.

L’injection d’images est locale au prompt : OpenClaw charge les références d’images depuis le prompt actuel et les transmet via `images` uniquement pour ce tour. Il ne réanalyse pas les tours d’historique plus anciens pour réinjecter les charges utiles d’image.

## Architecture des outils

### Pipeline des outils

1. **Outils de base** : les `codingTools` de pi (read, bash, edit, write)
2. **Remplacements personnalisés** : OpenClaw remplace bash par `exec`/`process`, personnalise read/edit/write pour le sandbox
3. **Outils OpenClaw** : messagerie, navigateur, canvas, sessions, cron, Gateway, etc.
4. **Outils de canal** : outils d’actions propres à Discord/Telegram/Slack/WhatsApp
5. **Filtrage par politique** : outils filtrés par profil, fournisseur, agent, groupe, politiques de sandbox
6. **Normalisation des schémas** : schémas nettoyés pour les particularités de Gemini/OpenAI
7. **Encapsulation AbortSignal** : outils encapsulés pour respecter les signaux d’abandon

### Adaptateur de définition d’outil

L’`AgentTool` de pi-agent-core a une signature `execute` différente de celle de `ToolDefinition` de pi-coding-agent. L’adaptateur dans `pi-tool-definition-adapter.ts` fait le lien :

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

### Stratégie de séparation des outils

`splitSdkTools()` transmet tous les outils via `customTools` :

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

Cela garantit que le filtrage des règles d’OpenClaw, l’intégration au bac à sable et l’ensemble d’outils étendu restent cohérents entre les fournisseurs.

## Construction du prompt système

Le prompt système est construit dans `buildAgentSystemPrompt()` (`system-prompt.ts`). Il assemble un prompt complet avec des sections comprenant l’outillage, le style d’appel d’outil, les garde-fous de sécurité, la référence de la CLI OpenClaw, Skills, la documentation, l’espace de travail, le bac à sable, la messagerie, les balises de réponse, la voix, les réponses silencieuses, les Heartbeats, les métadonnées d’exécution, ainsi que la mémoire et les réactions lorsqu’elles sont activées, et des fichiers de contexte facultatifs avec du contenu de prompt système supplémentaire. Les sections sont réduites pour le mode de prompt minimal utilisé par les sous-agents.

Le prompt est appliqué après la création de la session via `applySystemPromptOverrideToSession()` :

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gestion des sessions

### Fichiers de session

Les sessions sont des fichiers JSONL avec une structure arborescente (liaison id/parentId). Le `SessionManager` de Pi gère la persistance :

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw encapsule cela avec `guardSessionManager()` pour la sécurité des résultats d’outils.

### Mise en cache des sessions

`session-manager-cache.ts` met en cache les instances de SessionManager pour éviter l’analyse répétée des fichiers :

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitation de l’historique

`limitHistoryTurns()` réduit l’historique de conversation selon le type de canal (message privé ou groupe).

### Compaction

La Compaction automatique se déclenche en cas de débordement de contexte. Les signatures courantes de débordement incluent `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` et `ollama error: context length exceeded`. `compactEmbeddedPiSessionDirect()` gère la Compaction manuelle :

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Authentification et résolution du modèle

### Profils d’authentification

OpenClaw maintient un magasin de profils d’authentification avec plusieurs clés API par fournisseur :

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Les profils alternent en cas d’échec avec suivi du délai de récupération :

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Résolution du modèle

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

### Basculement

`FailoverError` déclenche le repli vers un autre modèle lorsque cela est configuré :

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

## Extensions Pi

OpenClaw charge des extensions pi personnalisées pour des comportements spécialisés :

### Protection de Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` ajoute des garde-fous à la Compaction, notamment une budgétisation adaptative des tokens ainsi que des résumés d’échecs d’outils et d’opérations sur les fichiers :

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Élagage du contexte

`src/agents/pi-hooks/context-pruning.ts` implémente l’élagage du contexte basé sur le TTL du cache :

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

## Streaming et réponses par blocs

### Découpage en blocs

`EmbeddedBlockChunker` gère le streaming du texte en blocs de réponse distincts :

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Suppression des balises de raisonnement et de finalisation

La sortie en streaming est traitée pour supprimer les blocs `<think>`/`<thinking>` et extraire le contenu `<final>` :

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Directives de réponse

Les directives de réponse comme `[[media:url]]`, `[[voice]]`, `[[reply:id]]` sont analysées et extraites :

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Gestion des erreurs

### Classification des erreurs

`pi-embedded-helpers.ts` classe les erreurs pour un traitement approprié :

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Repli du niveau de réflexion

Si un niveau de réflexion n’est pas pris en charge, il se replie :

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

## Intégration au bac à sable

Lorsque le mode bac à sable est activé, les outils et les chemins sont restreints :

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

## Gestion propre aux fournisseurs

### Anthropic

- Nettoyage de la chaîne magique de refus
- Validation des tours pour les rôles consécutifs
- Validation stricte en amont des paramètres d’outil Pi

### Google/Gemini

- Assainissement du schéma d’outil détenu par le Plugin

### OpenAI

- Outil `apply_patch` pour les modèles Codex
- Gestion de la rétrogradation du niveau de réflexion

## Intégration TUI

OpenClaw dispose aussi d’un mode TUI local qui utilise directement les composants pi-tui :

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Cela fournit l’expérience de terminal interactif similaire au mode natif de pi.

## Principales différences avec la CLI Pi

| Aspect          | CLI Pi                  | OpenClaw intégré                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Invocation      | Commande `pi` / RPC      | SDK via `createAgentSession()`                                                                 |
| Outils           | Outils de codage par défaut    | Suite d’outils OpenClaw personnalisée                                                                     |
| Prompt système   | AGENTS.md + prompts     | Dynamique par canal/contexte                                                                    |
| Stockage des sessions | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (ou `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Authentification            | Identifiant unique       | Multi-profils avec rotation                                                                    |
| Extensions      | Chargées depuis le disque        | Programmatique + chemins disque                                                                      |
| Gestion des événements  | Rendu TUI           | Basée sur des callbacks (onBlockReply, etc.)                                                            |

## Considérations futures

Axes de refonte potentiels :

1. **Alignement des signatures d’outils** : adaptation actuelle entre les signatures pi-agent-core et pi-coding-agent
2. **Encapsulation du gestionnaire de sessions** : `guardSessionManager` ajoute de la sécurité mais augmente la complexité
3. **Chargement des extensions** : pourrait utiliser plus directement le `ResourceLoader` de pi
4. **Complexité du gestionnaire de streaming** : `subscribeEmbeddedPiSession` est devenu volumineux
5. **Particularités des fournisseurs** : nombreux chemins de code propres aux fournisseurs que pi pourrait potentiellement gérer

## Tests

La couverture de l’intégration Pi couvre ces suites :

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

En direct / sur activation explicite :

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (activer `OPENCLAW_LIVE_TEST=1`)

Pour les commandes d’exécution actuelles, consultez [Workflow de développement Pi](/fr/pi-dev).

## Connexe

- [Workflow de développement Pi](/fr/pi-dev)
- [Vue d’ensemble de l’installation](/fr/install)
