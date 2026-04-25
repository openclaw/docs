---
read_when:
    - Comprendre la conception de l’intégration du SDK Pi dans OpenClaw
    - Modifier le cycle de vie des sessions d’agent, l’outillage ou le câblage du fournisseur pour Pi
summary: Architecture de l’intégration de l’agent Pi embarqué d’OpenClaw et du cycle de vie des sessions
title: Architecture de l’intégration Pi embarquée d’OpenClaw
x-i18n:
    generated_at: "2026-04-25T13:50:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ec260fd3e2726190ed7aa60e249b739689f2d42d230f52fa93a43cbbf90ea06
    source_path: pi.md
    workflow: 15
---

Ce document décrit comment OpenClaw s’intègre avec [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) et ses packages frères (`pi-ai`, `pi-agent-core`, `pi-tui`) pour fournir ses capacités d’agent IA.

## Aperçu

OpenClaw utilise le SDK pi pour intégrer un agent de codage IA dans son architecture de Gateway de messagerie. Au lieu de lancer pi comme sous-processus ou d’utiliser le mode RPC, OpenClaw importe et instancie directement `AgentSession` de pi via `createAgentSession()`. Cette approche embarquée offre :

- Un contrôle total sur le cycle de vie des sessions et la gestion des événements
- Une injection d’outils personnalisée (messagerie, sandbox, actions spécifiques aux canaux)
- Une personnalisation du prompt système par canal/contexte
- Une persistance de session avec prise en charge du branching/de la Compaction
- Une rotation multi-comptes des profils d’authentification avec failover
- Un changement de modèle indépendant du fournisseur

## Dépendances de package

```json
{
  "@mariozechner/pi-agent-core": "0.70.2",
  "@mariozechner/pi-ai": "0.70.2",
  "@mariozechner/pi-coding-agent": "0.70.2",
  "@mariozechner/pi-tui": "0.70.2"
}
```

| Package           | Rôle                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Abstractions LLM de base : `Model`, `streamSimple`, types de messages, API de fournisseurs            |
| `pi-agent-core`   | Boucle d’agent, exécution d’outils, types `AgentMessage`                                               |
| `pi-coding-agent` | SDK de haut niveau : `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, outils intégrés |
| `pi-tui`          | Composants d’interface terminal (utilisés dans le mode TUI local d’OpenClaw)                          |

## Structure des fichiers

```
src/agents/
├── pi-embedded-runner.ts          # Réexportations depuis pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Point d’entrée principal : runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logique d’une seule tentative avec configuration de session
│   │   ├── params.ts              # Type RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Construction des charges utiles de réponse à partir des résultats d’exécution
│   │   ├── images.ts              # Injection d’images pour les modèles vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Détection des erreurs d’abandon
│   ├── cache-ttl.ts               # Suivi du TTL du cache pour l’élagage du contexte
│   ├── compact.ts                 # Logique de Compaction manuelle/automatique
│   ├── extensions.ts              # Chargement des extensions pi pour les exécutions embarquées
│   ├── extra-params.ts            # Paramètres de flux spécifiques aux fournisseurs
│   ├── google.ts                  # Correctifs d’ordonnancement de tours Google/Gemini
│   ├── history.ts                 # Limitation d’historique (messages privés vs groupe)
│   ├── lanes.ts                   # Voies de commandes de session/globales
│   ├── logger.ts                  # Logger du sous-système
│   ├── model.ts                   # Résolution du modèle via ModelRegistry
│   ├── runs.ts                    # Suivi des exécutions actives, abandon, file d’attente
│   ├── sandbox-info.ts            # Informations de sandbox pour le prompt système
│   ├── session-manager-cache.ts   # Mise en cache des instances SessionManager
│   ├── session-manager-init.ts    # Initialisation des fichiers de session
│   ├── system-prompt.ts           # Constructeur de prompt système
│   ├── tool-split.ts              # Séparation des outils en builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mappage ThinkLevel, description d’erreur
├── pi-embedded-subscribe.ts       # Abonnement/répartition des événements de session
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Fabrique de gestionnaires d’événements
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Segmentation de réponses streaming par blocs
├── pi-embedded-messaging.ts       # Suivi des envois de l’outil de messagerie
├── pi-embedded-helpers.ts         # Classification des erreurs, validation des tours
├── pi-embedded-helpers/           # Modules utilitaires
├── pi-embedded-utils.ts           # Utilitaires de formatage
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Encapsulation AbortSignal pour les outils
├── pi-tools.policy.ts             # Politique de liste d’autorisation/interdiction des outils
├── pi-tools.read.ts               # Personnalisations de l’outil read
├── pi-tools.schema.ts             # Normalisation des schémas d’outils
├── pi-tools.types.ts              # Alias de type AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adaptateur AgentTool -> ToolDefinition
├── pi-settings.ts                 # Remplacements de paramètres
├── pi-hooks/                      # Hooks pi personnalisés
│   ├── compaction-safeguard.ts    # Extension safeguard
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Extension d’élagage de contexte par cache TTL
│   └── context-pruning/
├── model-auth.ts                  # Résolution des profils d’authentification
├── auth-profiles.ts               # Stockage des profils, cooldown, failover
├── model-selection.ts             # Résolution du modèle par défaut
├── models-config.ts               # Génération de models.json
├── model-catalog.ts               # Cache du catalogue de modèles
├── context-window-guard.ts        # Validation de la fenêtre de contexte
├── failover-error.ts              # Classe FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Résolution des paramètres du prompt système
├── system-prompt-report.ts        # Génération de rapport de débogage
├── tool-summaries.ts              # Résumés des descriptions d’outils
├── tool-policy.ts                 # Résolution de politique d’outils
├── transcript-policy.ts           # Politique de validation des transcripts
├── skills.ts                      # Instantané de Skills/construction de prompt
├── skills/                        # Sous-système Skills
├── sandbox.ts                     # Résolution du contexte sandbox
├── sandbox/                       # Sous-système sandbox
├── channel-tools.ts               # Injection d’outils spécifiques aux canaux
├── openclaw-tools.ts              # Outils spécifiques à OpenClaw
├── bash-tools.ts                  # Outils exec/process
├── apply-patch.ts                 # Outil apply_patch (OpenAI)
├── tools/                         # Implémentations d’outils individuelles
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

Les runtimes d’action de message spécifiques aux canaux vivent désormais dans les répertoires d’extension appartenant aux plugins au lieu de `src/agents/tools`, par exemple :

- les fichiers runtime d’action du Plugin Discord
- le fichier runtime d’action du Plugin Slack
- le fichier runtime d’action du Plugin Telegram
- le fichier runtime d’action du Plugin WhatsApp

## Flux d’intégration principal

### 1. Exécuter un agent embarqué

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

À l’intérieur de `runEmbeddedAttempt()` (appelé par `runEmbeddedPiAgent()`), le SDK pi est utilisé :

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

Les événements pris en charge incluent :

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

Le SDK gère la boucle complète de l’agent : envoi au LLM, exécution des appels d’outils, streaming des réponses.

L’injection d’images est locale au prompt : OpenClaw charge les références d’images depuis le prompt courant et
les transmet via `images` pour ce tour uniquement. Il ne réanalyse pas les anciens tours d’historique
pour réinjecter les charges utiles d’image.

## Architecture des outils

### Pipeline d’outils

1. **Outils de base** : `codingTools` de pi (`read`, `bash`, `edit`, `write`)
2. **Remplacements personnalisés** : OpenClaw remplace bash par `exec`/`process`, personnalise read/edit/write pour le sandbox
3. **Outils OpenClaw** : messagerie, browser, canvas, sessions, Cron, Gateway, etc.
4. **Outils de canal** : outils d’action spécifiques à Discord/Telegram/Slack/WhatsApp
5. **Filtrage par politique** : outils filtrés par profil, fournisseur, agent, groupe, politiques sandbox
6. **Normalisation de schéma** : schémas nettoyés pour les particularités de Gemini/OpenAI
7. **Encapsulation AbortSignal** : outils encapsulés pour respecter les signaux d’abandon

### Adaptateur de définition d’outil

Le `AgentTool` de pi-agent-core possède une signature `execute` différente de `ToolDefinition` de pi-coding-agent. L’adaptateur dans `pi-tool-definition-adapter.ts` fait le lien :

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // la signature de pi-coding-agent diffère de celle de pi-agent-core
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
    builtInTools: [], // Vide. Nous remplaçons tout
    customTools: toToolDefinitions(options.tools),
  };
}
```

Cela garantit que le filtrage de politique d’OpenClaw, l’intégration sandbox et l’ensemble d’outils étendu restent cohérents entre les fournisseurs.

## Construction du prompt système

Le prompt système est construit dans `buildAgentSystemPrompt()` (`system-prompt.ts`). Il assemble un prompt complet avec des sections incluant Tooling, Tool Call Style, garde-fous Safety, référence CLI OpenClaw, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, métadonnées Runtime, ainsi que Memory et Reactions lorsqu’ils sont activés, et des fichiers de contexte ainsi qu’un contenu supplémentaire de prompt système en option. Les sections sont réduites pour le mode minimal de prompt utilisé par les sous-agents.

Le prompt est appliqué après la création de session via `applySystemPromptOverrideToSession()` :

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Gestion des sessions

### Fichiers de session

Les sessions sont des fichiers JSONL avec une structure en arbre (liaison `id`/`parentId`). Le `SessionManager` de Pi gère la persistance :

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw encapsule cela avec `guardSessionManager()` pour la sécurité des résultats d’outils.

### Mise en cache des sessions

`session-manager-cache.ts` met en cache les instances de SessionManager afin d’éviter des analyses répétées de fichiers :

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Limitation de l’historique

`limitHistoryTurns()` réduit l’historique de conversation selon le type de canal (message privé vs groupe).

### Compaction

La Compaction automatique se déclenche lors d’un dépassement de contexte. Les signatures courantes de dépassement
incluent `request_too_large`, `context length exceeded`, `input exceeds the
maximum number of tokens`, `input token count exceeds the maximum number of
input tokens`, `input is too long for the model`, et `ollama error: context
length exceeded`. `compactEmbeddedPiSessionDirect()` gère la Compaction
manuelle :

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Authentification et résolution des modèles

### Profils d’authentification

OpenClaw maintient un stockage de profils d’authentification avec plusieurs clés API par fournisseur :

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Les profils tournent en cas d’échec avec suivi de cooldown :

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

// Utilise ModelRegistry et AuthStorage de pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Failover

`FailoverError` déclenche le repli de modèle lorsqu’il est configuré :

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

### Safeguard de Compaction

`src/agents/pi-hooks/compaction-safeguard.ts` ajoute des garde-fous à la Compaction, y compris une budgétisation adaptative des jetons ainsi que des résumés des échecs d’outils et des opérations sur fichiers :

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

### Segmentation par blocs

`EmbeddedBlockChunker` gère le streaming du texte en blocs de réponse distincts :

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Suppression des balises Thinking/Final

La sortie streaming est traitée pour supprimer les blocs `<think>`/`<thinking>` et extraire le contenu `<final>` :

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Supprime le contenu <think>...</think>
  // Si enforceFinalTag, renvoie uniquement le contenu <final>...</final>
};
```

### Directives de réponse

Les directives de réponse comme `[[media:url]]`, `[[voice]]`, `[[reply:id]]` sont analysées et extraites :

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Gestion des erreurs

### Classification des erreurs

`pi-embedded-helpers.ts` classe les erreurs pour une gestion appropriée :

```typescript
isContextOverflowError(errorText)     // Contexte trop grand
isCompactionFailureError(errorText)   // Échec de la Compaction
isAuthAssistantError(lastAssistant)   // Échec d’authentification
isRateLimitAssistantError(...)        // Limitation de débit
isFailoverAssistantError(...)         // Doit déclencher le failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Repli du niveau de réflexion

Si un niveau de réflexion n’est pas pris en charge, un repli est utilisé :

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

## Intégration sandbox

Lorsque le mode sandbox est activé, les outils et chemins sont contraints :

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Utilise des outils read/edit/write sandboxés
  // Exec s’exécute dans le conteneur
  // Browser utilise l’URL de pont
}
```

## Gestion spécifique aux fournisseurs

### Anthropic

- Nettoyage de la chaîne magique de refus
- Validation des tours pour rôles consécutifs
- Validation stricte en amont des paramètres d’outils Pi

### Google/Gemini

- Assainissement des schémas d’outils appartenant aux plugins

### OpenAI

- Outil `apply_patch` pour les modèles Codex
- Gestion du rétrogradage du niveau de réflexion

## Intégration TUI

OpenClaw dispose également d’un mode TUI local qui utilise directement les composants pi-tui :

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Cela fournit une expérience terminal interactive similaire au mode natif de pi.

## Différences clés par rapport à la CLI Pi

| Aspect          | CLI Pi                  | Embarqué OpenClaw                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Invocation      | commande `pi` / RPC     | SDK via `createAgentSession()`                                                                 |
| Outils          | Outils de codage par défaut | Suite d’outils OpenClaw personnalisée                                                         |
| Prompt système  | AGENTS.md + prompts     | Dynamique par canal/contexte                                                                   |
| Stockage de session | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (ou `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Authentification | Identifiant unique      | Multi-profils avec rotation                                                                    |
| Extensions      | Chargées depuis le disque | Chemins programmatiques + disque                                                              |
| Gestion des événements | Rendu TUI           | Basée sur callbacks (`onBlockReply`, etc.)                                                     |

## Considérations futures

Domaines susceptibles d’être retravaillés :

1. **Alignement des signatures d’outils** : adaptation actuelle entre les signatures pi-agent-core et pi-coding-agent
2. **Encapsulation du gestionnaire de session** : `guardSessionManager` ajoute de la sécurité mais augmente la complexité
3. **Chargement des extensions** : pourrait utiliser plus directement le `ResourceLoader` de pi
4. **Complexité du gestionnaire de streaming** : `subscribeEmbeddedPiSession` a beaucoup grossi
5. **Particularités des fournisseurs** : de nombreux chemins spécifiques aux fournisseurs que pi pourrait potentiellement gérer

## Tests

La couverture de l’intégration Pi s’étend à ces suites :

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

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (activez `OPENCLAW_LIVE_TEST=1`)

Pour les commandes d’exécution actuelles, voir [Flux de développement Pi](/fr/pi-dev).

## Liens associés

- [Flux de développement Pi](/fr/pi-dev)
- [Aperçu de l’installation](/fr/install)
