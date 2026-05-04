---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK effectuer l’import
    - Vous voulez une référence pour toutes les méthodes d’enregistrement d’OpenClawPluginApi
    - Vous recherchez une exportation spécifique du SDK
sidebarTitle: Plugin SDK overview
summary: Carte d’importation, référence de l’API d’enregistrement et architecture du SDK
title: Présentation du SDK Plugin
x-i18n:
    generated_at: "2026-05-04T18:24:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8187e7d4cfb9d6fb19bbdebfbaea0bb4d98fa5cea4742d0f82a765ae5bc60127
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Le SDK de plugins est le contrat typé entre les plugins et le cœur. Cette page est la
référence pour **ce qu’il faut importer** et **ce que vous pouvez enregistrer**.

<Note>
  Cette page s’adresse aux auteurs de plugins qui utilisent `openclaw/plugin-sdk/*` dans
  OpenClaw. Pour les applications externes, scripts, tableaux de bord, tâches CI et extensions IDE
  qui veulent exécuter des agents via le Gateway, utilisez plutôt le
  [SDK d’application OpenClaw](/fr/concepts/openclaw-sdk) et le package `@openclaw/sdk`.
</Note>

<Tip>
Vous cherchez plutôt un guide pratique ? Commencez par [Créer des plugins](/fr/plugins/building-plugins), utilisez [Plugins de canal](/fr/plugins/sdk-channel-plugins) pour les plugins de canal, [Plugins de provider](/fr/plugins/sdk-provider-plugins) pour les plugins de provider, et [Hooks de Plugin](/fr/plugins/hooks) pour les plugins de hooks d’outil ou de cycle de vie.
</Tip>

## Convention d’importation

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela garde le démarrage rapide et
évite les problèmes de dépendances circulaires. Pour les helpers d’entrée/de build propres à un canal,
préférez `openclaw/plugin-sdk/channel-core` ; gardez `openclaw/plugin-sdk/core` pour
la surface ombrelle plus large et les helpers partagés tels que
`buildChannelConfigSchema`.

Pour la configuration de canal, publiez le JSON Schema détenu par le canal via
`openclaw.plugin.json#channelConfigs`. Le sous-chemin `plugin-sdk/channel-config-schema`
sert aux primitives de schéma partagées et au builder générique. Les plugins
fournis avec OpenClaw utilisent `plugin-sdk/bundled-channel-config-schema` pour les schémas
de canaux groupés conservés. Les exports de compatibilité obsolètes restent sur
`plugin-sdk/channel-config-schema-legacy` ; aucun des sous-chemins de schéma groupés n’est un
modèle pour de nouveaux plugins.

<Warning>
  N’importez pas de seams de commodité marqués par provider ou canal (par exemple
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Les plugins fournis composent les sous-chemins SDK génériques dans leurs propres barrels `api.ts` /
  `runtime-api.ts` ; les consommateurs du cœur doivent soit utiliser ces barrels locaux au plugin,
  soit ajouter un contrat SDK générique étroit lorsque le besoin est réellement
  transversal aux canaux.

Un petit ensemble de seams helpers de plugins fournis apparaît encore dans la carte d’exports générée
lorsqu’un usage propriétaire suivi existe. Ils n’existent que pour la maintenance
des plugins fournis et ne sont pas des chemins d’importation recommandés pour les nouveaux plugins
tiers.

`openclaw/plugin-sdk/discord` et `openclaw/plugin-sdk/telegram-account` sont
également conservés comme façades de compatibilité obsolètes pour des usages propriétaires suivis. Ne
copiez pas ces chemins d’importation dans de nouveaux plugins ; utilisez plutôt les helpers runtime injectés et
les sous-chemins SDK de canal génériques.
</Warning>

## Référence des sous-chemins

Le SDK de plugins est exposé comme un ensemble de sous-chemins étroits regroupés par domaine (entrée de plugin,
canal, provider, auth, runtime, capability, memory, et helpers réservés aux
plugins fournis). Pour le catalogue complet — regroupé et lié — consultez
[Sous-chemins du SDK de plugins](/fr/plugins/sdk-subpaths).

La liste générée de plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json`.

## API d’enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement des capacités

| Méthode                                          | Ce qu’elle enregistre                  |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inférence de texte (LLM)               |
| `api.registerAgentHarness(...)`                  | Exécuteur d’agent bas niveau expérimental |
| `api.registerCliBackend(...)`                    | Backend d’inférence CLI local          |
| `api.registerChannel(...)`                       | Canal de messagerie                    |
| `api.registerSpeechProvider(...)`                | Synthèse text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription temps réel en streaming  |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales temps réel duplex     |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse image/audio/vidéo              |
| `api.registerImageGenerationProvider(...)`       | Génération d’images                    |
| `api.registerMusicGenerationProvider(...)`       | Génération de musique                  |
| `api.registerVideoGenerationProvider(...)`       | Génération de vidéos                   |
| `api.registerWebFetchProvider(...)`              | Provider de récupération / scraping web |
| `api.registerWebSearchProvider(...)`             | Recherche web                          |

### Outils et commandes

| Méthode                         | Ce qu’elle enregistre                         |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Outil d’agent (obligatoire ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)     |

Les commandes de plugin peuvent définir `agentPromptGuidance` lorsque l’agent a besoin d’un court
indice de routage propre à la commande. Gardez ce texte centré sur la commande elle-même ; n’ajoutez pas de
politique propre à un provider ou à un plugin dans les builders de prompt du cœur.

### Infrastructure

| Méthode                                        | Ce qu’elle enregistre                         |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook d’événement                              |
| `api.registerHttpRoute(params)`                | Endpoint HTTP du Gateway                      |
| `api.registerGatewayMethod(name, handler)`     | Méthode RPC du Gateway                        |
| `api.registerGatewayDiscoveryService(service)` | Annonceur de découverte du Gateway local      |
| `api.registerCli(registrar, opts?)`            | Sous-commande CLI                             |
| `api.registerService(service)`                 | Service d’arrière-plan                        |
| `api.registerInteractiveHandler(registration)` | Handler interactif                            |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime de résultat d’outil        |
| `api.registerMemoryPromptSupplement(builder)`  | Section de prompt additive adjacente à la mémoire |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additif de recherche/lecture mémoire   |

### Hooks hôte pour les plugins de workflow

Les hooks hôte sont les seams SDK pour les plugins qui doivent participer au cycle de vie
de l’hôte au lieu d’ajouter seulement un provider, un canal ou un outil. Ce sont des
contrats génériques ; le mode Plan peut les utiliser, mais aussi les workflows d’approbation,
les garde-fous de politique d’espace de travail, les moniteurs d’arrière-plan, les assistants de configuration et les plugins
compagnons UI.

| Méthode                                                                  | Contrat qu’elle possède                                                                                                           |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | État de session compatible JSON, détenu par le plugin et projeté via les sessions Gateway                                         |
| `api.enqueueNextTurnInjection(...)`                                      | Contexte durable exactement une fois injecté dans le prochain tour d’agent pour une session                                      |
| `api.registerTrustedToolPolicy(...)`                                     | Politique d’outil pré-plugin fournie/de confiance qui peut bloquer ou réécrire les paramètres d’outil                           |
| `api.registerToolMetadata(...)`                                          | Métadonnées d’affichage du catalogue d’outils sans modifier l’implémentation de l’outil                                           |
| `api.registerCommand(...)`                                               | Commandes de plugin délimitées ; les résultats de commande peuvent définir `continueAgent: true` ; les commandes natives Discord prennent en charge `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Descripteurs de contribution Control UI pour les surfaces de session, d’outil, d’exécution ou de paramètres                      |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacks de nettoyage pour les ressources runtime détenues par le plugin sur les chemins reset/delete/reload                    |
| `api.registerAgentEventSubscription(...)`                                | Abonnements à des événements assainis pour l’état de workflow et les moniteurs                                                   |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | État scratch de plugin par exécution, effacé au cycle de vie terminal de l’exécution                                             |
| `api.registerSessionSchedulerJob(...)`                                   | Enregistrements de tâches du planificateur de session détenus par le plugin avec nettoyage déterministe                          |

Les contrats séparent intentionnellement les autorités :

- Les plugins externes peuvent posséder des extensions de session, des descripteurs UI, des commandes, des métadonnées d’outil, des injections au tour suivant et des hooks normaux.
- Les politiques d’outils de confiance s’exécutent avant les hooks ordinaires `before_tool_call` et sont
  réservées aux plugins fournis, car elles participent à la politique de sécurité de l’hôte.
- La propriété des commandes réservées est réservée aux plugins fournis. Les plugins externes doivent utiliser leurs
  propres noms de commande ou alias.
- `allowPromptInjection=false` désactive les hooks qui modifient le prompt, notamment
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  les champs de prompt de l’ancien `before_agent_start`, et
  `enqueueNextTurnInjection`.

Exemples de consommateurs hors Plan :

| Archétype de plugin             | Hooks utilisés                                                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Workflow d’approbation          | Extension de session, continuation de commande, injection au tour suivant, descripteur UI                                           |
| Garde-fou de budget/politique d’espace de travail | Politique d’outil de confiance, métadonnées d’outil, projection de session                                                          |
| Moniteur de cycle de vie d’arrière-plan | Nettoyage du cycle de vie runtime, abonnement aux événements d’agent, propriété/nettoyage du planificateur de session, contribution au prompt heartbeat, descripteur UI |
| Assistant de configuration ou d’onboarding | Extension de session, commandes délimitées, descripteur Control UI                                                                  |

<Note>
  Les espaces de noms d’administration cœur réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restent toujours `operator.admin`, même si un plugin essaie d’attribuer une
  portée de méthode Gateway plus étroite. Préférez des préfixes propres au plugin pour les
  méthodes détenues par le plugin.
</Note>

<Accordion title="Quand utiliser un middleware de résultat d’outil">
  Les plugins fournis peuvent utiliser `api.registerAgentToolResultMiddleware(...)` lorsqu’ils
  doivent réécrire un résultat d’outil après l’exécution et avant que le runtime
  ne réinjecte ce résultat dans le modèle. C’est le seam de confiance neutre vis-à-vis du runtime
  pour les réducteurs de sortie asynchrones tels que tokenjuice.

Les plugins fournis doivent déclarer `contracts.agentToolResultMiddleware` pour chaque
runtime ciblé, par exemple `["pi", "codex"]`. Les plugins externes
ne peuvent pas enregistrer ce middleware ; gardez les hooks de plugin OpenClaw normaux pour le travail
qui n’a pas besoin du timing de résultat d’outil avant modèle. L’ancien chemin d’enregistrement de fabrique d’extension intégrée
propre à Pi a été supprimé.
</Accordion>

### Enregistrement de la découverte Gateway

`api.registerGatewayDiscoveryService(...)` permet à un plugin d’annoncer le
Gateway actif sur un transport de découverte local comme mDNS/Bonjour. OpenClaw appelle le
service pendant le démarrage du Gateway lorsque la découverte locale est activée, transmet les
ports actuels du Gateway et les données d’indice TXT non secrètes, puis appelle le gestionnaire
`stop` renvoyé pendant l’arrêt du Gateway.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Les plugins de découverte du Gateway ne doivent pas traiter les valeurs TXT annoncées comme des secrets ou
comme une authentification. La découverte est un indice de routage ; l’authentification du Gateway et l’épinglage TLS
restent responsables de la confiance.

### Métadonnées d’enregistrement de la CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de premier niveau :

- `commands` : racines de commande explicites possédées par le registraire
- `descriptors` : descripteurs de commande au moment de l’analyse utilisés pour l’aide de la CLI racine,
  le routage et l’enregistrement paresseux de la CLI du plugin

Si vous voulez qu’une commande de plugin reste chargée paresseusement dans le chemin normal de la CLI racine,
fournissez des `descriptors` qui couvrent chaque racine de commande de premier niveau exposée par ce
registraire.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Utilisez `commands` seul uniquement lorsque vous n’avez pas besoin d’un enregistrement paresseux de la CLI racine.
Ce chemin de compatibilité impatient reste pris en charge, mais il n’installe pas
d’espaces réservés adossés à des descripteurs pour le chargement paresseux au moment de l’analyse.

### Enregistrement du backend CLI

`api.registerCliBackend(...)` permet à un plugin de posséder la configuration par défaut d’un backend CLI
d’IA local comme `codex-cli`.

- L’`id` du backend devient le préfixe de fournisseur dans les références de modèle comme `codex-cli/gpt-5`.
- La `config` du backend utilise la même forme que `agents.defaults.cliBackends.<id>`.
- La configuration utilisateur reste prioritaire. OpenClaw fusionne `agents.defaults.cliBackends.<id>` par-dessus la
  valeur par défaut du plugin avant d’exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu’un backend a besoin de réécritures de compatibilité après la fusion
  (par exemple pour normaliser d’anciennes formes de flags).
- Utilisez `resolveExecutionArgs` pour les réécritures d’argv propres à la requête qui appartiennent
  au dialecte de la CLI, comme la correspondance entre les niveaux de réflexion d’OpenClaw et un flag d’effort
  natif.

### Emplacements exclusifs

| Méthode                                    | Ce qu’elle enregistre                                                                                                                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un seul actif à la fois). Le rappel `assemble()` reçoit `availableTools` et `citationsMode` afin que le moteur puisse adapter les ajouts au prompt. |
| `api.registerMemoryCapability(capability)` | Capacité de mémoire unifiée                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | Constructeur de section de prompt de mémoire                                                                                                                |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de vidage de mémoire                                                                                                                      |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur d’exécution de mémoire                                                                                                                           |

### Adaptateurs d’embeddings de mémoire

| Méthode                                        | Ce qu’elle enregistre                                |
| ---------------------------------------------- | ---------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’embedding de mémoire pour le plugin actif |

- `registerMemoryCapability` est l’API exclusive recommandée pour les plugins de mémoire.
- `registerMemoryCapability` peut aussi exposer `publicArtifacts.listArtifacts(...)`
  afin que les plugins compagnons puissent consommer les artefacts de mémoire exportés via
  `openclaw/plugin-sdk/memory-host-core` au lieu d’accéder à l’agencement privé d’un
  plugin de mémoire spécifique.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont des API exclusives de plugin de mémoire compatibles avec l’ancien fonctionnement.
- `MemoryFlushPlan.model` peut épingler le tour de vidage à une référence exacte `provider/model`,
  comme `ollama/qwen3:8b`, sans hériter de la chaîne de secours active.
- `registerMemoryEmbeddingProvider` permet au plugin de mémoire actif d’enregistrer un
  ou plusieurs identifiants d’adaptateur d’embedding (par exemple `openai`, `gemini` ou un identifiant personnalisé
  défini par le plugin).
- La configuration utilisateur comme `agents.defaults.memorySearch.provider` et
  `agents.defaults.memorySearch.fallback` est résolue par rapport à ces identifiants
  d’adaptateur enregistrés.

### Événements et cycle de vie

| Méthode                                      | Ce qu’elle fait                    |
| -------------------------------------------- | ---------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé          |
| `api.onConversationBindingResolved(handler)` | Rappel de liaison de conversation |

Consultez [Hooks de plugin](/fr/plugins/hooks) pour des exemples, les noms de hooks courants et la
sémantique des gardes.

### Sémantique des décisions de hook

- `before_tool_call` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : renvoyer `{ block: false }` est traité comme une absence de décision (comme omettre `block`), et non comme une substitution.
- `before_install` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : renvoyer `{ block: false }` est traité comme une absence de décision (comme omettre `block`), et non comme une substitution.
- `reply_dispatch` : renvoyer `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire revendique l’envoi, les gestionnaires de priorité inférieure et le chemin d’envoi par défaut au modèle sont ignorés.
- `message_sending` : renvoyer `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : renvoyer `{ cancel: false }` est traité comme une absence de décision (comme omettre `cancel`), et non comme une substitution.
- `message_received` : utilisez le champ typé `threadId` lorsque vous avez besoin du routage entrant de fil/sujet. Réservez `metadata` aux compléments propres au canal.
- `message_sending` : utilisez les champs de routage typés `replyToId` / `threadId` avant de recourir à des `metadata` propres au canal.
- `gateway_start` : utilisez `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour l’état de démarrage possédé par le gateway au lieu de vous appuyer sur les hooks internes `gateway:startup`.
- `cron_changed` : observez les changements de cycle de vie cron possédés par le gateway. Utilisez `event.job?.state?.nextRunAtMs` et `ctx.getCron?.()` lors de la synchronisation de planificateurs de réveil externes, et gardez OpenClaw comme source de vérité pour les vérifications d’échéance et l’exécution.

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID du plugin                                                                                 |
| `api.name`               | `string`                  | Nom d’affichage                                                                              |
| `api.version`            | `string?`                 | Version du plugin (facultative)                                                              |
| `api.description`        | `string?`                 | Description du plugin (facultative)                                                          |
| `api.source`             | `string`                  | Chemin source du plugin                                                                      |
| `api.rootDir`            | `string?`                 | Répertoire racine du plugin (facultatif)                                                      |
| `api.config`             | `OpenClawConfig`          | Instantané de configuration actuel (instantané d’exécution en mémoire actif quand disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration propre au plugin provenant de `plugins.entries.<id>.config`                    |
| `api.runtime`            | `PluginRuntime`           | [Assistants d’exécution](/fr/plugins/sdk-runtime)                                               |
| `api.logger`             | `PluginLogger`            | Journaliseur limité au scope (`debug`, `info`, `warn`, `error`)                              |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résout le chemin relativement à la racine du plugin                                           |

## Convention de module interne

Dans votre plugin, utilisez des fichiers barrel locaux pour les imports internes :

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  N’importez jamais votre propre plugin via `openclaw/plugin-sdk/<your-plugin>`
  depuis du code de production. Faites passer les imports internes par `./api.ts` ou
  `./runtime-api.ts`. Le chemin SDK est uniquement le contrat externe.
</Warning>

Les surfaces publiques des plugins groupés chargées par façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` et fichiers d’entrée publics similaires) préfèrent
l’instantané de configuration d’exécution actif lorsqu’OpenClaw est déjà en cours d’exécution. Si aucun instantané d’exécution
n’existe encore, elles se rabattent sur le fichier de configuration résolu sur disque.
Les façades des plugins groupés empaquetés doivent être chargées via les chargeurs de façade de plugin
d’OpenClaw ; les imports directs depuis `dist/extensions/...` contournent le manifeste
et les vérifications du sidecar d’exécution que les installations empaquetées utilisent pour le code possédé par le plugin.

Les plugins de fournisseur peuvent exposer un barrel de contrat étroit et local au plugin lorsqu’un
assistant est intentionnellement propre au fournisseur et n’appartient pas encore à un sous-chemin SDK générique.
Exemples groupés :

- **Anthropic** : couture publique `api.ts` / `contract-api.ts` pour les assistants de flux
  beta-header et `service_tier` de Claude.
- **`@openclaw/openai-provider`** : `api.ts` exporte les constructeurs de fournisseur,
  les assistants de modèle par défaut et les constructeurs de fournisseur temps réel.
- **`@openclaw/openrouter-provider`** : `api.ts` exporte le constructeur de fournisseur
  ainsi que les assistants d’onboarding/configuration.

<Warning>
  Le code de production des extensions doit aussi éviter les imports `openclaw/plugin-sdk/<other-plugin>`.
  Si un assistant est réellement partagé, promouvez-le vers un sous-chemin SDK neutre
  comme `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou une autre
  surface orientée capacité au lieu de coupler deux plugins ensemble.
</Warning>

## Associé

<CardGroup cols={2}>
  <Card title="Points d’entrée" icon="door-open" href="/fr/plugins/sdk-entrypoints">
    Options `definePluginEntry` et `defineChannelPluginEntry`.
  </Card>
  <Card title="Assistants d’exécution" icon="gears" href="/fr/plugins/sdk-runtime">
    Référence complète de l’espace de noms `api.runtime`.
  </Card>
  <Card title="Installation et configuration" icon="sliders" href="/fr/plugins/sdk-setup">
    Paquetage, manifestes et schémas de configuration.
  </Card>
  <Card title="Tests" icon="vial" href="/fr/plugins/sdk-testing">
    Utilitaires de test et règles de lint.
  </Card>
  <Card title="Migration du SDK" icon="arrows-turn-right" href="/fr/plugins/sdk-migration">
    Migration depuis les surfaces obsolètes.
  </Card>
  <Card title="Fonctionnement interne du Plugin" icon="diagram-project" href="/fr/plugins/architecture">
    Architecture approfondie et modèle de capacités.
  </Card>
</CardGroup>
