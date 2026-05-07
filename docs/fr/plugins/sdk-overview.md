---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK importer
    - Vous souhaitez une référence pour toutes les méthodes d’enregistrement d’OpenClawPluginApi
    - Vous recherchez une exportation spécifique du SDK
sidebarTitle: Plugin SDK overview
summary: Carte d’imports, référence de l’API d’enregistrement et architecture du SDK
title: Vue d’ensemble du SDK Plugin
x-i18n:
    generated_at: "2026-05-07T13:24:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Le SDK de Plugin est le contrat typé entre les plugins et le cœur. Cette page est la
référence pour **ce qu’il faut importer** et **ce que vous pouvez enregistrer**.

<Note>
  Cette page s’adresse aux auteurs de plugins qui utilisent `openclaw/plugin-sdk/*` dans
  OpenClaw. Pour les applications externes, scripts, tableaux de bord, tâches CI et extensions IDE
  qui veulent exécuter des agents via le Gateway, utilisez plutôt le
  [SDK d’application OpenClaw](/fr/concepts/openclaw-sdk) et le package `@openclaw/sdk`.
</Note>

<Tip>
Vous cherchez plutôt un guide pratique ? Commencez par [Créer des plugins](/fr/plugins/building-plugins), utilisez [Plugins de canal](/fr/plugins/sdk-channel-plugins) pour les plugins de canal, [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) pour les plugins de fournisseur, [Plugins backend CLI](/fr/plugins/cli-backend-plugins) pour les backends CLI d’IA locaux, et [Hooks de Plugin](/fr/plugins/hooks) pour les plugins de hook d’outil ou de cycle de vie.
</Tip>

## Convention d’import

Importez toujours depuis un sous-chemin précis :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela garde le démarrage rapide et
évite les problèmes de dépendances circulaires. Pour les helpers d’entrée/de construction propres aux canaux,
préférez `openclaw/plugin-sdk/channel-core` ; gardez `openclaw/plugin-sdk/core` pour
la surface ombrelle plus large et les helpers partagés comme
`buildChannelConfigSchema`.

Pour la configuration de canal, publiez le JSON Schema détenu par le canal via
`openclaw.plugin.json#channelConfigs`. Le sous-chemin `plugin-sdk/channel-config-schema`
sert aux primitives de schéma partagées et au générateur générique. Les plugins
intégrés d’OpenClaw utilisent `plugin-sdk/bundled-channel-config-schema` pour les schémas
de canaux intégrés conservés. Les exports de compatibilité obsolètes restent sur
`plugin-sdk/channel-config-schema-legacy` ; aucun des deux sous-chemins de schémas intégrés ne constitue un
modèle pour les nouveaux plugins.

<Warning>
  N’importez pas de jonctions de commodité marquées par fournisseur ou par canal (par exemple
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Les plugins intégrés composent des sous-chemins SDK génériques dans leurs propres barrels `api.ts` /
  `runtime-api.ts` ; les consommateurs du cœur doivent soit utiliser ces barrels locaux au plugin,
  soit ajouter un contrat SDK générique étroit lorsqu’un besoin est réellement
  transversal aux canaux.

Un petit ensemble de jonctions d’aide de plugins intégrés apparaît encore dans la carte d’exports générée
lorsqu’elles ont un usage propriétaire suivi. Elles existent uniquement pour la maintenance des plugins intégrés
et ne sont pas des chemins d’import recommandés pour les nouveaux plugins tiers.

`openclaw/plugin-sdk/discord` et `openclaw/plugin-sdk/telegram-account` sont
également conservés comme façades de compatibilité obsolètes pour les usages propriétaires suivis. Ne
copiez pas ces chemins d’import dans de nouveaux plugins ; utilisez plutôt les helpers runtime injectés et
les sous-chemins SDK de canal génériques.
</Warning>

## Référence des sous-chemins

Le SDK de Plugin est exposé sous forme d’un ensemble de sous-chemins étroits regroupés par domaine (entrée de plugin,
canal, fournisseur, authentification, runtime, capacité, mémoire et helpers
réservés aux plugins intégrés). Pour le catalogue complet — regroupé et lié — consultez
[Sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).

La liste générée de plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json`.

## API d’enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement des capacités

| Méthode                                          | Ce qu’elle enregistre                              |
| ------------------------------------------------ | -------------------------------------------------- |
| `api.registerProvider(...)`                      | Inférence de texte (LLM)                           |
| `api.registerAgentHarness(...)`                  | Exécuteur d’agent expérimental de bas niveau       |
| `api.registerCliBackend(...)`                    | Backend local d’inférence CLI                      |
| `api.registerChannel(...)`                       | Canal de messagerie                                |
| `api.registerSpeechProvider(...)`                | Synthèse texte-parole / STT                        |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription temps réel en streaming              |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales temps réel duplex                 |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse d’images/audio/vidéo                       |
| `api.registerImageGenerationProvider(...)`       | Génération d’images                                |
| `api.registerMusicGenerationProvider(...)`       | Génération de musique                              |
| `api.registerVideoGenerationProvider(...)`       | Génération de vidéos                               |
| `api.registerWebFetchProvider(...)`              | Fournisseur de récupération / scraping Web         |
| `api.registerWebSearchProvider(...)`             | Recherche Web                                      |

### Outils et commandes

| Méthode                         | Ce qu’elle enregistre                                  |
| ------------------------------- | ------------------------------------------------------ |
| `api.registerTool(tool, opts?)` | Outil d’agent (obligatoire ou `{ optional: true }`)    |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)              |

Les commandes de Plugin peuvent définir `agentPromptGuidance` lorsque l’agent a besoin d’un court indice de routage
appartenant à la commande. Gardez ce texte centré sur la commande elle-même ; n’ajoutez pas
de politique propre à un fournisseur ou à un Plugin dans les générateurs de prompts du noyau.

### Infrastructure

| Méthode                                        | Ce qu’elle enregistre                                      |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook d’événement                                           |
| `api.registerHttpRoute(params)`                | Point de terminaison HTTP du Gateway                       |
| `api.registerGatewayMethod(name, handler)`     | Méthode RPC du Gateway                                     |
| `api.registerGatewayDiscoveryService(service)` | Annonceur local de découverte du Gateway                   |
| `api.registerCli(registrar, opts?)`            | Sous-commande CLI                                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI de fonctionnalité Node sous `openclaw nodes`           |
| `api.registerService(service)`                 | Service d’arrière-plan                                     |
| `api.registerInteractiveHandler(registration)` | Gestionnaire interactif                                    |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware d’exécution pour résultats d’outils             |
| `api.registerMemoryPromptSupplement(builder)`  | Section additive de prompt adjacente à la mémoire          |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additif de recherche/lecture mémoire                |

### Hooks hôtes pour les plugins de workflow

Les hooks hôtes sont les coutures du SDK pour les plugins qui doivent participer au cycle de vie de l’hôte
plutôt que seulement ajouter un fournisseur, un canal ou un outil. Ce sont
des contrats génériques ; le mode Plan peut les utiliser, tout comme les workflows d’approbation,
les barrières de politique d’espace de travail, les moniteurs d’arrière-plan, les assistants de configuration et les plugins compagnons d’UI.

| Méthode                                                                  | Contrat dont elle est propriétaire                                                                                                  |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | État de session appartenant au Plugin, compatible JSON, projeté à travers les sessions Gateway                                      |
| `api.enqueueNextTurnInjection(...)`                                      | Contexte durable exactement une fois injecté dans le prochain tour d’agent pour une session                                         |
| `api.registerTrustedToolPolicy(...)`                                     | Politique d’outil pré-Plugin groupée/de confiance pouvant bloquer ou réécrire les paramètres d’outil                                |
| `api.registerToolMetadata(...)`                                          | Métadonnées d’affichage du catalogue d’outils sans modifier l’implémentation de l’outil                                             |
| `api.registerCommand(...)`                                               | Commandes de Plugin limitées ; les résultats de commande peuvent définir `continueAgent: true` ; les commandes natives Discord prennent en charge `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Descripteurs de contribution à l’UI de contrôle pour les surfaces de session, d’outil, d’exécution ou de paramètres                 |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacks de nettoyage des ressources d’exécution appartenant au Plugin sur les chemins de réinitialisation/suppression/rechargement |
| `api.registerAgentEventSubscription(...)`                                | Abonnements aux événements assainis pour l’état de workflow et les moniteurs                                                        |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | État de travail de Plugin par exécution, effacé à la fin du cycle de vie terminal de l’exécution                                    |
| `api.registerSessionSchedulerJob(...)`                                   | Enregistrements de tâches planifiées de session appartenant au Plugin avec nettoyage déterministe                                   |

Les contrats séparent volontairement l’autorité :

- Les plugins externes peuvent posséder des extensions de session, des descripteurs d’UI, des commandes, des métadonnées d’outils, des injections au tour suivant et des hooks normaux.
- Les politiques d’outils de confiance s’exécutent avant les hooks ordinaires `before_tool_call` et sont réservées aux bundles, car elles participent à la politique de sécurité de l’hôte.
- La propriété des commandes réservées est réservée aux bundles. Les plugins externes doivent utiliser leurs propres noms de commande ou alias.
- `allowPromptInjection=false` désactive les hooks qui modifient le prompt, notamment `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, les champs de prompt de l’ancien `before_agent_start` et `enqueueNextTurnInjection`.

Exemples de consommateurs hors Plan :

| Archétype de Plugin              | Hooks utilisés                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow d’approbation           | Extension de session, continuation de commande, injection au tour suivant, descripteur d’UI                                           |
| Barrière de politique de budget/espace de travail | Politique d’outil de confiance, métadonnées d’outil, projection de session                                          |
| Moniteur de cycle de vie d’arrière-plan | Nettoyage du cycle de vie d’exécution, abonnement aux événements d’agent, propriété/nettoyage du planificateur de session, contribution de prompt Heartbeat, descripteur d’UI |
| Assistant de configuration ou d’onboarding | Extension de session, commandes limitées, descripteur d’UI de contrôle                                                        |

<Note>
  Les espaces de noms d’administration du noyau réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restent toujours `operator.admin`, même si un Plugin essaie d’attribuer une
  portée de méthode Gateway plus étroite. Préférez des préfixes propres au Plugin pour
  les méthodes appartenant au Plugin.
</Note>

<Accordion title="Quand utiliser le middleware de résultats d’outils">
  Les plugins groupés peuvent utiliser `api.registerAgentToolResultMiddleware(...)` lorsqu’ils
  doivent réécrire un résultat d’outil après l’exécution et avant que l’exécution
  ne réinjecte ce résultat dans le modèle. C’est la couture de confiance neutre vis-à-vis de l’exécution
  pour les réducteurs de sortie asynchrones tels que tokenjuice.

Les plugins intégrés doivent déclarer `contracts.agentToolResultMiddleware` pour chaque runtime ciblé, par exemple `["pi", "codex"]`. Les plugins externes ne peuvent pas enregistrer ce middleware ; conservez les hooks de plugin OpenClaw normaux pour le travail qui n’a pas besoin du timing des résultats d’outils avant modèle. L’ancien chemin d’enregistrement de fabrique d’extension intégrée propre à Pi a été supprimé.
</Accordion>

### Enregistrement de découverte Gateway

`api.registerGatewayDiscoveryService(...)` permet à un plugin d’annoncer le Gateway actif sur un transport de découverte local tel que mDNS/Bonjour. OpenClaw appelle le service au démarrage du Gateway lorsque la découverte locale est activée, transmet les ports Gateway actuels et les données d’indication TXT non secrètes, puis appelle le gestionnaire `stop` renvoyé lors de l’arrêt du Gateway.

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

Les plugins de découverte Gateway ne doivent pas traiter les valeurs TXT annoncées comme des secrets ou de l’authentification. La découverte est une indication de routage ; l’authentification du Gateway et l’épinglage TLS restent responsables de la confiance.

### Métadonnées d’enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de commande :

- `commands` : noms de commandes explicites possédés par le registrar
- `descriptors` : descripteurs de commande au moment de l’analyse utilisés pour l’aide CLI, le routage et l’enregistrement CLI paresseux des plugins
- `parentPath` : chemin de commande parent facultatif pour les groupes de commandes imbriqués, comme `["nodes"]`

Pour les fonctionnalités de nœuds appairés, préférez `api.registerNodeCliFeature(registrar, opts?)`. C’est un petit wrapper autour de `api.registerCli(..., { parentPath: ["nodes"] })` qui rend les commandes telles que `openclaw nodes canvas` explicites comme fonctionnalités de nœud possédées par un plugin.

Si vous voulez qu’une commande de plugin reste chargée paresseusement dans le chemin CLI racine normal, fournissez des `descriptors` qui couvrent chaque racine de commande de premier niveau exposée par ce registrar.

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

Les commandes imbriquées reçoivent la commande parent résolue comme `program` :

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

Utilisez `commands` seul uniquement lorsque vous n’avez pas besoin d’enregistrement CLI racine paresseux. Ce chemin de compatibilité empressé reste pris en charge, mais il n’installe pas d’espaces réservés adossés à des descripteurs pour le chargement paresseux au moment de l’analyse.

### Enregistrement du backend CLI

`api.registerCliBackend(...)` permet à un plugin de posséder la configuration par défaut d’un backend CLI d’IA local tel que `codex-cli`.

- L’`id` du backend devient le préfixe de fournisseur dans les références de modèles comme `codex-cli/gpt-5`.
- La `config` du backend utilise la même forme que `agents.defaults.cliBackends.<id>`.
- La configuration utilisateur reste prioritaire. OpenClaw fusionne `agents.defaults.cliBackends.<id>` par-dessus la valeur par défaut du plugin avant d’exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu’un backend a besoin de réécritures de compatibilité après fusion (par exemple, normaliser d’anciennes formes de flags).
- Utilisez `resolveExecutionArgs` pour les réécritures d’argv limitées à la requête qui appartiennent au dialecte CLI, comme la correspondance des niveaux de réflexion OpenClaw avec un flag d’effort natif.

Pour un guide de création de bout en bout, consultez [plugins de backend CLI](/fr/plugins/cli-backend-plugins).

### Slots exclusifs

| Méthode                                    | Ce qu’elle enregistre                                                                                                                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un actif à la fois). Le callback `assemble()` reçoit `availableTools` et `citationsMode` afin que le moteur puisse adapter les ajouts au prompt. |
| `api.registerMemoryCapability(capability)` | Capacité mémoire unifiée                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | Constructeur de section de prompt mémoire                                                                                                                    |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de flush mémoire                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur de runtime mémoire                                                                                                                                |

### Adaptateurs d’embeddings mémoire

| Méthode                                       | Ce qu’elle enregistre                           |
| --------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’embeddings mémoire pour le plugin actif |

- `registerMemoryCapability` est l’API exclusive de plugin mémoire à privilégier.
- `registerMemoryCapability` peut aussi exposer `publicArtifacts.listArtifacts(...)` afin que les plugins compagnons puissent consommer les artefacts mémoire exportés via `openclaw/plugin-sdk/memory-host-core` au lieu d’accéder à l’agencement privé d’un plugin mémoire précis.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et `registerMemoryRuntime` sont des API exclusives de plugin mémoire compatibles avec l’existant.
- `MemoryFlushPlan.model` peut épingler le tour de flush à une référence `provider/model` exacte, comme `ollama/qwen3:8b`, sans hériter de la chaîne de fallback active.
- `registerMemoryEmbeddingProvider` permet au plugin mémoire actif d’enregistrer un ou plusieurs identifiants d’adaptateur d’embeddings (par exemple `openai`, `gemini` ou un identifiant personnalisé défini par un plugin).
- La configuration utilisateur comme `agents.defaults.memorySearch.provider` et `agents.defaults.memorySearch.fallback` est résolue par rapport à ces identifiants d’adaptateur enregistrés.

### Événements et cycle de vie

| Méthode                                      | Ce qu’elle fait                |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé      |
| `api.onConversationBindingResolved(handler)` | Callback de liaison de conversation |

Consultez [Hooks de plugin](/fr/plugins/hooks) pour des exemples, les noms de hooks courants et la sémantique des gardes.

### Sémantique des décisions de hook

- `before_tool_call` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : renvoyer `{ block: false }` est traité comme une absence de décision (identique à l’omission de `block`), et non comme une substitution.
- `before_install` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : renvoyer `{ block: false }` est traité comme une absence de décision (identique à l’omission de `block`), et non comme une substitution.
- `reply_dispatch` : renvoyer `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire revendique l’envoi, les gestionnaires de priorité inférieure et le chemin d’envoi de modèle par défaut sont ignorés.
- `message_sending` : renvoyer `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : renvoyer `{ cancel: false }` est traité comme une absence de décision (identique à l’omission de `cancel`), et non comme une substitution.
- `message_received` : utilisez le champ typé `threadId` lorsque vous avez besoin de router les threads/sujets entrants. Gardez `metadata` pour les extras propres au canal.
- `message_sending` : utilisez les champs de routage typés `replyToId` / `threadId` avant de revenir aux `metadata` propres au canal.
- `gateway_start` : utilisez `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour l’état de démarrage possédé par le Gateway au lieu de dépendre de hooks internes `gateway:startup`.
- `cron_changed` : observez les changements de cycle de vie de cron possédés par le Gateway. Utilisez `event.job?.state?.nextRunAtMs` et `ctx.getCron?.()` lors de la synchronisation de planificateurs de réveil externes, et gardez OpenClaw comme source de vérité pour les vérifications d’échéance et l’exécution.

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identifiant de plugin                                                                        |
| `api.name`               | `string`                  | Nom d’affichage                                                                              |
| `api.version`            | `string?`                 | Version du plugin (facultatif)                                                               |
| `api.description`        | `string?`                 | Description du plugin (facultatif)                                                           |
| `api.source`             | `string`                  | Chemin source du plugin                                                                      |
| `api.rootDir`            | `string?`                 | Répertoire racine du plugin (facultatif)                                                     |
| `api.config`             | `OpenClawConfig`          | Snapshot de configuration actuel (snapshot de runtime en mémoire actif lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration propre au plugin depuis `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Helpers de runtime](/fr/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | Logger délimité (`debug`, `info`, `warn`, `error`)                                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résout un chemin relatif à la racine du plugin                                                |

## Convention des modules internes

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
  depuis le code de production. Faites passer les imports internes par `./api.ts` ou
  `./runtime-api.ts`. Le chemin SDK est uniquement le contrat externe.
</Warning>

Les surfaces publiques de plugin intégré chargées par façade (`api.ts`, `runtime-api.ts`, `index.ts`, `setup-entry.ts` et fichiers d’entrée publics similaires) préfèrent le snapshot de configuration de runtime actif quand OpenClaw est déjà en cours d’exécution. Si aucun snapshot de runtime n’existe encore, elles se rabattent sur le fichier de configuration résolu sur disque. Les façades de plugins intégrés packagés doivent être chargées via les chargeurs de façade de plugin d’OpenClaw ; les imports directs depuis `dist/extensions/...` contournent le manifeste et les vérifications de sidecar de runtime que les installations packagées utilisent pour le code possédé par le plugin.

Les Plugins fournisseurs peuvent exposer un barrel contractuel étroit et local au Plugin lorsqu’un
helper est intentionnellement spécifique au fournisseur et n’a pas encore sa place dans un sous-chemin SDK générique. Exemples intégrés :

- **Anthropic** : couture publique `api.ts` / `contract-api.ts` pour les helpers de flux
  d’en-tête bêta Claude et `service_tier`.
- **`@openclaw/openai-provider`** : `api.ts` exporte les constructeurs de fournisseur,
  les helpers de modèle par défaut et les constructeurs de fournisseur temps réel.
- **`@openclaw/openrouter-provider`** : `api.ts` exporte le constructeur de fournisseur
  ainsi que les helpers d’intégration/configuration.

<Warning>
  Le code de production des extensions doit également éviter les imports
  `openclaw/plugin-sdk/<other-plugin>`. Si un helper est réellement partagé, promouvez-le vers un sous-chemin SDK neutre
  tel que `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, ou une autre
  surface orientée capacité au lieu de coupler deux Plugins ensemble.
</Warning>

## Connexe

<CardGroup cols={2}>
  <Card title="Points d’entrée" icon="door-open" href="/fr/plugins/sdk-entrypoints">
    Options `definePluginEntry` et `defineChannelPluginEntry`.
  </Card>
  <Card title="Helpers d’exécution" icon="gears" href="/fr/plugins/sdk-runtime">
    Référence complète de l’espace de noms `api.runtime`.
  </Card>
  <Card title="Configuration et paramétrage" icon="sliders" href="/fr/plugins/sdk-setup">
    Packaging, manifestes et schémas de configuration.
  </Card>
  <Card title="Tests" icon="vial" href="/fr/plugins/sdk-testing">
    Utilitaires de test et règles de lint.
  </Card>
  <Card title="Migration du SDK" icon="arrows-turn-right" href="/fr/plugins/sdk-migration">
    Migration depuis les surfaces obsolètes.
  </Card>
  <Card title="Internes des Plugins" icon="diagram-project" href="/fr/plugins/architecture">
    Architecture approfondie et modèle de capacités.
  </Card>
</CardGroup>
