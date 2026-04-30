---
read_when:
    - Comprendre la conception de l’intégration du SDK Pi dans OpenClaw
    - Modification du cycle de vie des sessions d’agent, de l’outillage ou du câblage des fournisseurs pour Pi
summary: Architecture de l’intégration de l’agent Pi embarqué d’OpenClaw et du cycle de vie des sessions
title: Architecture d’intégration de Pi
x-i18n:
    generated_at: "2026-04-30T07:35:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b155cd5296875f2f187c68c6929c48aba27cef047f0caad74f560bcde5533e5
    source_path: pi.md
    workflow: 16
---

OpenClaw s’intègre à [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) et à ses packages frères (`pi-ai`, `pi-agent-core`, `pi-tui`) pour alimenter ses capacités d’agent IA.

## Vue d’ensemble

OpenClaw utilise le SDK pi pour intégrer un agent de codage IA à son architecture de Gateway de messagerie. Au lieu de lancer pi comme sous-processus ou d’utiliser le mode RPC, OpenClaw importe et instancie directement l’`AgentSession` de pi via `createAgentSession()`. Cette approche intégrée offre :

- Contrôle complet du cycle de vie des sessions et de la gestion des événements
- Injection d’outils personnalisés (messagerie, sandbox, actions propres aux canaux)
- Personnalisation du prompt système par canal/contexte
- Persistance des sessions avec prise en charge des branches et de la Compaction
- Rotation des profils d’authentification multi-comptes avec basculement
- Changement de modèle indépendant du fournisseur

## Dépendances de packages

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Package           | Objectif                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Abstractions LLM principales : `Model`, `streamSimple`, types de messages, API de fournisseurs         |
| `pi-agent-core`   | Boucle d’agent, exécution d’outils, types `AgentMessage`                                               |
| `pi-coding-agent` | SDK haut niveau : `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, outils intégrés |
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

Les runtimes d’actions de messages propres aux canaux résident désormais dans les répertoires d’extension appartenant aux Plugins au lieu de `src/agents/tools`, par exemple :

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

Les événements gérés incluent :

- `message_start` / `message_end` / `message_update` (texte/réflexion en streaming)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `compaction_start` / `compaction_end`

### 4. Prompting

Après la configuration, un prompt est envoyé à la session :

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

Le SDK gère toute la boucle d’agent : envoi au LLM, exécution des appels d’outils, streaming des réponses.

L’injection d’images est locale au prompt : OpenClaw charge les références d’images depuis le prompt courant et les transmet via `images` uniquement pour ce tour. Il ne réanalyse pas les tours d’historique plus anciens pour réinjecter les charges utiles d’images.

## Architecture des outils

### Pipeline d’outils

1. **Outils de base** : les `codingTools` de pi (read, bash, edit, write)
2. **Remplacements personnalisés** : OpenClaw remplace bash par `exec`/`process`, personnalise read/edit/write pour le sandbox
3. **Outils OpenClaw** : messagerie, navigateur, canevas, sessions, Cron, Gateway, etc.
4. **Outils de canaux** : outils d’action propres à Discord/Telegram/Slack/WhatsApp
5. **Filtrage par politique** : outils filtrés par les politiques de profil, fournisseur, agent, groupe et sandbox
6. **Normalisation des schémas** : schémas nettoyés pour les particularités de Gemini/OpenAI
7. **Encapsulation AbortSignal** : outils encapsulés pour respecter les signaux d’abandon

### Adaptateur de définition d’outil

L’`AgentTool` de pi-agent-core possède une signature `execute` différente de celle du `ToolDefinition` de pi-coding-agent. L’adaptateur dans `pi-tool-definition-adapter.ts` fait le lien :

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

Cela garantit que le filtrage des politiques d’OpenClaw, l’intégration du bac à sable et l’ensemble d’outils étendu restent cohérents entre les fournisseurs.

## Construction du prompt système

Le prompt système est construit dans `buildAgentSystemPrompt()` (`system-prompt.ts`). Il assemble un prompt complet avec des sections incluant l’outillage, le style d’appel d’outil, les garde-fous de sécurité, la référence CLI d’OpenClaw, Skills, la documentation, l’espace de travail, le bac à sable, la messagerie, les balises de réponse, la voix, les réponses silencieuses, Heartbeat, les métadonnées d’exécution, ainsi que la mémoire et les réactions lorsqu’elles sont activées, et les fichiers de contexte facultatifs et le contenu supplémentaire du prompt système. Les sections sont réduites pour le mode de prompt minimal utilisé par les sous-agents.

Le prompt est appliqué après la création de session via `applySystemPromptOverrideToSession()` :

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

OpenClaw l’encapsule avec `guardSessionManager()` pour la sécurité des résultats d’outil.

### Mise en cache des sessions

`session-manager-cache.ts` met en cache les instances de SessionManager pour éviter l’analyse répétée des fichiers :

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitation de l’historique

`limitHistoryTurns()` réduit l’historique de conversation selon le type de canal (DM ou groupe).

### Compaction

L’auto-Compaction se déclenche lors d’un dépassement de contexte. Les signatures courantes de dépassement incluent `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` et `ollama error: context length exceeded`. `compactEmbeddedPiSessionDirect()` gère la Compaction manuelle :

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Authentification et résolution du modèle

### Profils d’authentification

OpenClaw maintient un magasin de profils d’authentification avec plusieurs clés d’API par fournisseur :

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Les profils effectuent une rotation en cas d’échecs, avec suivi du délai de récupération :

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

`FailoverError` déclenche le modèle de secours lorsqu’il est configuré :

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

OpenClaw charge des extensions Pi personnalisées pour des comportements spécialisés :

### Protection de Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` ajoute des garde-fous à la Compaction, notamment une budgétisation adaptative des tokens ainsi que des résumés d’échecs d’outil et d’opérations sur les fichiers :

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

`EmbeddedBlockChunker` gère le streaming de texte en blocs de réponse distincts :

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Suppression des balises Thinking/Final

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

`pi-embedded-helpers.ts` classifie les erreurs afin d’appliquer le traitement approprié :

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

## Intégration du bac à sable

Lorsque le mode bac à sable est activé, les outils et les chemins sont contraints :

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

## Gestion spécifique aux fournisseurs

### Anthropic

- Nettoyage de la chaîne magique de refus
- Validation des tours pour les rôles consécutifs
- Validation stricte en amont des paramètres d’outil Pi

### Google/Gemini

- Assainissement des schémas d’outil appartenant au Plugin

### OpenAI

- Outil `apply_patch` pour les modèles Codex
- Gestion de la rétrogradation du niveau de réflexion

## Intégration TUI

OpenClaw dispose également d’un mode TUI local qui utilise directement les composants pi-tui :

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Cela fournit une expérience de terminal interactive similaire au mode natif de Pi.

## Principales différences avec la CLI Pi

| Aspect              | CLI Pi                       | OpenClaw intégré                                                                                   |
| ------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| Invocation          | commande `pi` / RPC          | SDK via `createAgentSession()`                                                                     |
| Outils              | Outils de codage par défaut  | Suite d’outils OpenClaw personnalisée                                                              |
| Prompt système      | AGENTS.md + prompts          | Dynamique par canal/contexte                                                                       |
| Stockage de session | `~/.pi/agent/sessions/`      | `~/.openclaw/agents/<agentId>/sessions/` (ou `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`)     |
| Authentification    | Identifiant unique           | Profils multiples avec rotation                                                                    |
| Extensions          | Chargées depuis le disque    | Programmatique + chemins disque                                                                    |
| Gestion d’événements | Rendu TUI                   | Basée sur des callbacks (`onBlockReply`, etc.)                                                     |

## Considérations futures

Axes de refonte potentiels :

1. **Alignement des signatures d’outil** : adaptation actuelle entre les signatures pi-agent-core et pi-coding-agent
2. **Encapsulation du gestionnaire de sessions** : `guardSessionManager` ajoute de la sécurité mais accroît la complexité
3. **Chargement des extensions** : pourrait utiliser plus directement le `ResourceLoader` de Pi
4. **Complexité du gestionnaire de streaming** : `subscribeEmbeddedPiSession` est devenu volumineux
5. **Particularités des fournisseurs** : nombreux chemins de code spécifiques aux fournisseurs que Pi pourrait potentiellement gérer

## Tests

La couverture d’intégration Pi s’étend à ces suites :

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

Live/avec activation explicite :

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (activer `OPENCLAW_LIVE_TEST=1`)

Pour les commandes d’exécution actuelles, consultez [Flux de développement Pi](/fr/pi-dev).

## Connexe

- [Flux de développement Pi](/fr/pi-dev)
- [Vue d’ensemble de l’installation](/fr/install)
