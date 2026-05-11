---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK importer
    - Vous souhaitez une référence pour toutes les méthodes d’enregistrement sur OpenClawPluginApi
    - Vous recherchez une exportation spécifique du SDK
sidebarTitle: Plugin SDK overview
summary: Carte d’importation, référence de l’API d’enregistrement et architecture du SDK
title: Vue d’ensemble du SDK Plugin
x-i18n:
    generated_at: "2026-05-11T20:49:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Le SDK de Plugin est le contrat typé entre les Plugins et le noyau. Cette page est la
référence pour **ce qu’il faut importer** et **ce que vous pouvez enregistrer**.

<Note>
  Cette page s’adresse aux auteurs de Plugins qui utilisent `openclaw/plugin-sdk/*` dans
  OpenClaw. Pour les applications externes, scripts, tableaux de bord, tâches CI et extensions IDE
  qui veulent exécuter des agents via le Gateway, utilisez plutôt le
  [SDK d’application OpenClaw](/fr/concepts/openclaw-sdk) et le package `@openclaw/sdk`.
</Note>

<Tip>
Vous cherchez plutôt un guide pratique ? Commencez par [Créer des Plugins](/fr/plugins/building-plugins), utilisez [Plugins de canal](/fr/plugins/sdk-channel-plugins) pour les Plugins de canal, [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) pour les Plugins de fournisseur, [Plugins de backend CLI](/fr/plugins/cli-backend-plugins) pour les backends CLI d’IA locaux, et [Hooks de Plugin](/fr/plugins/hooks) pour les Plugins de hooks d’outil ou de cycle de vie.
</Tip>

## Convention d’importation

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela accélère le démarrage et
évite les problèmes de dépendances circulaires. Pour les helpers d’entrée/de construction propres aux canaux,
préférez `openclaw/plugin-sdk/channel-core`; réservez `openclaw/plugin-sdk/core` à
la surface générale plus large et aux helpers partagés comme
`buildChannelConfigSchema`.

Pour la configuration de canal, publiez le schéma JSON détenu par le canal via
`openclaw.plugin.json#channelConfigs`. Le sous-chemin `plugin-sdk/channel-config-schema`
sert aux primitives de schéma partagées et au générateur générique. Les
Plugins intégrés d’OpenClaw utilisent `plugin-sdk/bundled-channel-config-schema` pour conserver
les schémas de canaux intégrés. Les exports de compatibilité obsolètes restent sur
`plugin-sdk/channel-config-schema-legacy`; aucun des sous-chemins de schéma intégrés n’est un
modèle pour les nouveaux Plugins.

<Warning>
  N’importez pas les interfaces pratiques marquées par fournisseur ou canal (par exemple
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Les Plugins intégrés composent les sous-chemins SDK génériques dans leurs propres barrels
  `api.ts` / `runtime-api.ts`; les consommateurs du noyau doivent soit utiliser ces barrels locaux au Plugin,
  soit ajouter un contrat SDK générique étroit lorsqu’un besoin est réellement
  transversal aux canaux.

Un petit ensemble d’interfaces helpers de Plugins intégrés apparaît encore dans la carte d’exports générée
lorsqu’elles ont un usage propriétaire suivi. Elles existent uniquement pour la
maintenance des Plugins intégrés et ne sont pas des chemins d’import recommandés pour les nouveaux Plugins
tiers.

`openclaw/plugin-sdk/discord` et `openclaw/plugin-sdk/telegram-account` sont
également conservés comme façades de compatibilité obsolètes pour des usages propriétaires suivis. Ne
copiez pas ces chemins d’import dans de nouveaux Plugins ; utilisez plutôt les helpers runtime injectés et
les sous-chemins SDK de canal génériques.
</Warning>

## Référence des sous-chemins

Le SDK de Plugin est exposé sous forme d’un ensemble de sous-chemins étroits regroupés par domaine (entrée de Plugin,
canal, fournisseur, authentification, runtime, capacité, mémoire et helpers réservés aux
Plugins intégrés). Pour le catalogue complet, regroupé et lié, consultez
[Sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).

L’inventaire des points d’entrée du compilateur se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json` ; les exports de package sont générés à partir
du sous-ensemble public après soustraction des sous-chemins de test/internes locaux au dépôt listés dans
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Exécutez
`pnpm plugin-sdk:surface` pour auditer le nombre d’exports publics. Les sous-chemins publics obsolètes
suffisamment anciens et inutilisés par le code de production des extensions intégrées sont
suivis dans `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` ; les barrels larges
de réexport obsolètes sont suivis dans
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API d’enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement des capacités

| Méthode                                          | Ce qu’elle enregistre                 |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inférence de texte (LLM)              |
| `api.registerAgentHarness(...)`                  | Exécuteur d’agent bas niveau expérimental |
| `api.registerCliBackend(...)`                    | Backend local d’inférence CLI         |
| `api.registerChannel(...)`                       | Canal de messagerie                   |
| `api.registerSpeechProvider(...)`                | Synthèse texte-parole / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription temps réel en streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales temps réel duplex    |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse image/audio/vidéo             |
| `api.registerImageGenerationProvider(...)`       | Génération d’images                   |
| `api.registerMusicGenerationProvider(...)`       | Génération de musique                 |
| `api.registerVideoGenerationProvider(...)`       | Génération de vidéo                   |
| `api.registerWebFetchProvider(...)`              | Fournisseur de récupération / extraction Web |
| `api.registerWebSearchProvider(...)`             | Recherche Web                         |

### Outils et commandes

| Méthode                         | Ce qu’elle enregistre                         |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Outil d’agent (obligatoire ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)     |

Les commandes de Plugin peuvent définir `agentPromptGuidance` lorsque l’agent a besoin d’un bref
indice de routage détenu par la commande. Gardez ce texte centré sur la commande elle-même ; n’ajoutez pas
de politique propre à un fournisseur ou à un Plugin aux constructeurs de prompts du noyau.

### Infrastructure

| Méthode                                       | Ce qu’elle enregistre                         |
| -------------------------------------------- | --------------------------------------------- |
| `api.registerHook(events, handler, opts?)`   | Hook d’événement                              |
| `api.registerHttpRoute(params)`              | Point de terminaison HTTP du Gateway          |
| `api.registerGatewayMethod(name, handler)`   | Méthode RPC du Gateway                        |
| `api.registerGatewayDiscoveryService(service)` | Annonceur de découverte du Gateway local    |
| `api.registerCli(registrar, opts?)`          | Sous-commande CLI                             |
| `api.registerNodeCliFeature(registrar, opts?)` | Fonctionnalité CLI Node sous `openclaw nodes` |
| `api.registerService(service)`               | Service d’arrière-plan                        |
| `api.registerInteractiveHandler(registration)` | Gestionnaire interactif                     |
| `api.registerAgentToolResultMiddleware(...)` | Middleware runtime de résultat d’outil        |
| `api.registerMemoryPromptSupplement(builder)` | Section de prompt additive adjacente à la mémoire |
| `api.registerMemoryCorpusSupplement(adapter)` | Corpus additif de recherche/lecture mémoire  |

### Hooks hôte pour les Plugins de workflow

Les hooks hôte sont les interfaces SDK pour les Plugins qui doivent participer au cycle de vie de l’hôte
plutôt que seulement ajouter un fournisseur, un canal ou un outil. Ce sont
des contrats génériques ; le Mode Plan peut les utiliser, mais aussi les workflows d’approbation,
les barrières de politique d’espace de travail, les moniteurs d’arrière-plan, les assistants de configuration et les Plugins compagnons d’interface.

| Méthode                                                                              | Contrat qu’elle détient                                                                                                           |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | État de session détenu par le Plugin, compatible JSON, projeté via les sessions Gateway                                           |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Contexte durable exactement une fois injecté dans le prochain tour d’agent pour une session                                       |
| `api.registerTrustedToolPolicy(...)`                                                 | Politique d’outil pré-Plugin intégrée/de confiance pouvant bloquer ou réécrire les paramètres d’outil                            |
| `api.registerToolMetadata(...)`                                                      | Métadonnées d’affichage du catalogue d’outils sans changer l’implémentation de l’outil                                            |
| `api.registerCommand(...)`                                                           | Commandes de Plugin délimitées ; les résultats de commande peuvent définir `continueAgent: true` ; les commandes natives Discord prennent en charge `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Descripteurs de contribution d’interface de contrôle pour les surfaces session, outil, exécution ou paramètres                    |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callbacks de nettoyage pour les ressources runtime détenues par le Plugin sur les chemins reset/delete/reload                     |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Abonnements d’événements assainis pour l’état de workflow et les moniteurs                                                        |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | État temporaire par exécution du Plugin effacé lors du cycle de vie terminal de l’exécution                                       |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Métadonnées de nettoyage pour les tâches de planificateur détenues par le Plugin ; ne planifie pas de travail et ne crée pas d’enregistrements de tâche |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Livraison de pièce jointe de fichier médiée par l’hôte, intégrée uniquement, vers la route de session directe sortante active      |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Tours de session planifiés adossés à Cron, intégrés uniquement, plus nettoyage par tag                                            |
| `api.session.controls.registerSessionAction(...)`                                    | Actions de session typées que les clients peuvent dispatcher via le Gateway                                                       |

Utilisez les espaces de noms groupés pour le nouveau code de Plugin :

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

Les méthodes plates équivalentes restent disponibles comme alias de compatibilité
obsolètes pour les Plugins existants. N’ajoutez pas de nouveau code de Plugin qui appelle
directement `api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` ou
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` est un raccourci limité à la session par-dessus le planificateur Gateway
Cron. Cron possède la temporisation et crée l’enregistrement de tâche en arrière-plan lorsque le
tour s’exécute ; le Plugin SDK ne contraint que la session cible, les noms appartenant au plugin
et le nettoyage. Utilisez `api.runtime.tasks.managedFlows` dans le tour planifié
lorsque le travail lui-même nécessite un état durable de flux de tâches en plusieurs étapes.

Les contrats séparent volontairement les responsabilités :

- Les plugins externes peuvent posséder les extensions de session, les descripteurs d’UI, les commandes, les
  métadonnées d’outils, les injections au tour suivant et les hooks normaux.
- Les politiques d’outils approuvées s’exécutent avant les hooks `before_tool_call` ordinaires et sont
  réservées aux éléments groupés, car elles participent à la politique de sécurité de l’hôte.
- La propriété des commandes réservées est réservée aux éléments groupés. Les plugins externes doivent utiliser leurs
  propres noms de commandes ou alias.
- `allowPromptInjection=false` désactive les hooks qui modifient le prompt, notamment
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  les champs de prompt de l’ancien `before_agent_start`, et
  `enqueueNextTurnInjection`.

Exemples de consommateurs non-Plan :

| Archétype de plugin          | Hooks utilisés                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow d’approbation       | Extension de session, continuation de commande, injection au tour suivant, descripteur d’UI                                           |
| Garde de politique budget/espace de travail | Politique d’outil approuvée, métadonnées d’outil, projection de session                                                            |
| Moniteur de cycle de vie en arrière-plan | Nettoyage du cycle de vie runtime, abonnement aux événements d’agent, propriété/nettoyage du planificateur de session, contribution au prompt Heartbeat, descripteur d’UI |
| Assistant de configuration ou d’onboarding | Extension de session, commandes limitées, descripteur d’UI de contrôle                                                              |

<Note>
  Les espaces de noms d’administration cœur réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restent toujours `operator.admin`, même si un plugin tente d’attribuer une
  portée de méthode gateway plus étroite. Préférez des préfixes propres au plugin pour les
  méthodes appartenant au plugin.
</Note>

<Accordion title="When to use tool-result middleware">
  Les plugins groupés peuvent utiliser `api.registerAgentToolResultMiddleware(...)` lorsqu’ils
  doivent réécrire un résultat d’outil après l’exécution et avant que le runtime
  réinjecte ce résultat dans le modèle. C’est le point d’extension approuvé et neutre vis-à-vis du runtime
  pour les réducteurs de sortie asynchrones comme tokenjuice.

Les plugins groupés doivent déclarer `contracts.agentToolResultMiddleware` pour chaque
runtime ciblé, par exemple `["pi", "codex"]`. Les plugins externes
ne peuvent pas enregistrer ce middleware ; gardez les hooks de plugin OpenClaw normaux pour le travail
qui ne nécessite pas une temporisation des résultats d’outils avant le modèle. L’ancien chemin d’enregistrement
de fabrique d’extension intégrée uniquement pour Pi a été supprimé.
</Accordion>

### Enregistrement de découverte Gateway

`api.registerGatewayDiscoveryService(...)` permet à un plugin d’annoncer le Gateway actif
sur un transport de découverte local comme mDNS/Bonjour. OpenClaw appelle le
service au démarrage du Gateway lorsque la découverte locale est activée, transmet les
ports Gateway actuels et les données d’indice TXT non secrètes, puis appelle le gestionnaire
`stop` retourné lors de l’arrêt du Gateway.

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

Les plugins de découverte Gateway ne doivent pas traiter les valeurs TXT annoncées comme des secrets ou
une authentification. La découverte est un indice de routage ; l’authentification Gateway et l’épinglage TLS
restent responsables de la confiance.

### Métadonnées d’enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de commande :

- `commands` : noms de commandes explicites appartenant au registrar
- `descriptors` : descripteurs de commande au moment de l’analyse utilisés pour l’aide CLI,
  le routage et l’enregistrement CLI paresseux des plugins
- `parentPath` : chemin de commande parent facultatif pour les groupes de commandes imbriqués, comme
  `["nodes"]`

Pour les fonctionnalités de nœuds appairés, préférez
`api.registerNodeCliFeature(registrar, opts?)`. C’est un petit wrapper autour de
`api.registerCli(..., { parentPath: ["nodes"] })` qui rend les commandes comme
`openclaw nodes canvas` explicites en tant que fonctionnalités de nœud appartenant au plugin.

Si vous voulez qu’une commande de plugin reste chargée paresseusement dans le chemin CLI racine normal,
fournissez des `descriptors` couvrant chaque racine de commande de premier niveau exposée par ce
registrar.

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

Utilisez `commands` seul uniquement lorsque vous n’avez pas besoin d’un enregistrement CLI racine paresseux.
Ce chemin de compatibilité anticipé reste pris en charge, mais il n’installe pas
d’espaces réservés adossés à des descripteurs pour le chargement paresseux au moment de l’analyse.

### Enregistrement du backend CLI

`api.registerCliBackend(...)` permet à un plugin de posséder la configuration par défaut d’un
backend CLI d’IA local comme `codex-cli`.

- Le `id` du backend devient le préfixe du fournisseur dans les références de modèle comme `codex-cli/gpt-5`.
- La `config` du backend utilise la même forme que `agents.defaults.cliBackends.<id>`.
- La configuration utilisateur prévaut toujours. OpenClaw fusionne `agents.defaults.cliBackends.<id>` par-dessus la
  valeur par défaut du plugin avant d’exécuter le CLI.
- Utilisez `normalizeConfig` lorsqu’un backend a besoin de réécritures de compatibilité après la fusion
  (par exemple pour normaliser d’anciennes formes de flags).
- Utilisez `resolveExecutionArgs` pour les réécritures d’argv limitées à la requête qui appartiennent au
  dialecte CLI, comme le mappage des niveaux de réflexion OpenClaw vers un flag d’effort natif.

Pour un guide de création de bout en bout, consultez
[plugins de backend CLI](/fr/plugins/cli-backend-plugins).

### Emplacements exclusifs

| Méthode                                    | Ce qu’elle enregistre                                                                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un seul actif à la fois). Le callback `assemble()` reçoit `availableTools` et `citationsMode` pour que le moteur puisse adapter les ajouts au prompt. |
| `api.registerMemoryCapability(capability)` | Capacité de mémoire unifiée                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | Constructeur de section de prompt de mémoire                                                                                                               |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de vidage de mémoire                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur de runtime de mémoire                                                                                                                           |

### Adaptateurs d’embedding de mémoire

| Méthode                                        | Ce qu’elle enregistre                         |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’embedding de mémoire pour le plugin actif |

- `registerMemoryCapability` est l’API exclusive de plugin de mémoire préférée.
- `registerMemoryCapability` peut aussi exposer `publicArtifacts.listArtifacts(...)`
  afin que les plugins compagnons puissent consommer les artefacts de mémoire exportés via
  `openclaw/plugin-sdk/memory-host-core` au lieu d’accéder à la disposition privée d’un
  plugin de mémoire spécifique.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont des API exclusives de plugin de mémoire compatibles avec l’ancien comportement.
- `MemoryFlushPlan.model` peut épingler le tour de vidage à une référence `provider/model`
  exacte, comme `ollama/qwen3:8b`, sans hériter de la chaîne de repli active.
- `registerMemoryEmbeddingProvider` permet au plugin de mémoire actif d’enregistrer un
  ou plusieurs ids d’adaptateur d’embedding (par exemple `openai`, `gemini` ou un id
  personnalisé défini par un plugin).
- La configuration utilisateur comme `agents.defaults.memorySearch.provider` et
  `agents.defaults.memorySearch.fallback` se résout par rapport à ces ids d’adaptateur
  enregistrés.

### Événements et cycle de vie

| Méthode                                      | Ce qu’elle fait               |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé     |
| `api.onConversationBindingResolved(handler)` | Callback de liaison de conversation |

Voir [Hooks de plugin](/fr/plugins/hooks) pour des exemples, des noms de hooks courants et la
sémantique des gardes.

### Sémantique de décision des hooks

- `before_tool_call` : retourner `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : retourner `{ block: false }` est traité comme une absence de décision (identique à l’omission de `block`), pas comme une surcharge.
- `before_install` : retourner `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : retourner `{ block: false }` est traité comme une absence de décision (identique à l’omission de `block`), pas comme une surcharge.
- `reply_dispatch` : retourner `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire revendique l’envoi, les gestionnaires de priorité inférieure et le chemin d’envoi au modèle par défaut sont ignorés.
- `message_sending` : retourner `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : retourner `{ cancel: false }` est traité comme une absence de décision (identique à l’omission de `cancel`), pas comme une surcharge.
- `message_received` : utilisez le champ typé `threadId` lorsque vous avez besoin du routage de thread/sujet entrant. Gardez `metadata` pour les compléments propres au canal.
- `message_sending` : utilisez les champs de routage typés `replyToId` / `threadId` avant de revenir à `metadata` propre au canal.
- `gateway_start` : utilisez `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour l’état de démarrage appartenant au gateway au lieu de vous appuyer sur les hooks internes `gateway:startup`.
- `cron_changed` : observez les changements de cycle de vie de cron appartenant au gateway. Utilisez `event.job?.state?.nextRunAtMs` et `ctx.getCron?.()` lors de la synchronisation de planificateurs de réveil externes, et gardez OpenClaw comme source de vérité pour les vérifications d’échéance et l’exécution.

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID du Plugin                                                                                |
| `api.name`               | `string`                  | Nom d’affichage                                                                             |
| `api.version`            | `string?`                 | Version du Plugin (facultatif)                                                             |
| `api.description`        | `string?`                 | Description du Plugin (facultatif)                                                         |
| `api.source`             | `string`                  | Chemin source du Plugin                                                                     |
| `api.rootDir`            | `string?`                 | Répertoire racine du Plugin (facultatif)                                                    |
| `api.config`             | `OpenClawConfig`          | Instantané de configuration actuel (instantané d’exécution actif en mémoire lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration propre au Plugin depuis `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Assistants d’exécution](/fr/plugins/sdk-runtime)                                              |
| `api.logger`             | `PluginLogger`            | Journaliseur à portée limitée (`debug`, `info`, `warn`, `error`)                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résoudre le chemin relatif à la racine du Plugin                                            |

## Convention de module interne

Dans votre Plugin, utilisez des fichiers barrel locaux pour les imports internes :

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  N’importez jamais votre propre Plugin via `openclaw/plugin-sdk/<your-plugin>`
  depuis le code de production. Faites passer les imports internes par `./api.ts` ou
  `./runtime-api.ts`. Le chemin SDK est uniquement le contrat externe.
</Warning>

Les surfaces publiques des Plugins groupés chargées via façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, et les fichiers d’entrée publics similaires) préfèrent
l’instantané de configuration d’exécution actif lorsque OpenClaw est déjà en cours d’exécution. Si aucun instantané
d’exécution n’existe encore, elles se rabattent sur le fichier de configuration résolu sur le disque.
Les façades des Plugins groupés empaquetés doivent être chargées via les chargeurs de façades de Plugins
d’OpenClaw ; les imports directs depuis `dist/extensions/...` contournent les vérifications du manifeste
et du sidecar d’exécution que les installations empaquetées utilisent pour le code détenu par le Plugin.

Les Plugins fournisseurs peuvent exposer un barrel de contrat étroit et local au Plugin lorsqu’un
assistant est volontairement propre au fournisseur et n’a pas encore sa place dans un sous-chemin SDK
générique. Exemples groupés :

- **Anthropic** : jointure publique `api.ts` / `contract-api.ts` pour Claude
  beta-header et les assistants de flux `service_tier`.
- **`@openclaw/openai-provider`** : `api.ts` exporte les constructeurs de fournisseur,
  les assistants de modèle par défaut et les constructeurs de fournisseur en temps réel.
- **`@openclaw/openrouter-provider`** : `api.ts` exporte le constructeur de fournisseur
  ainsi que les assistants d’intégration/configuration.

<Warning>
  Le code de production des Plugins doit également éviter les imports
  `openclaw/plugin-sdk/<other-plugin>`. Si un assistant est réellement partagé, promouvez-le vers un sous-chemin SDK neutre
  tel que `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, ou une autre
  surface orientée capacité au lieu de coupler deux Plugins.
</Warning>

## Connexe

<CardGroup cols={2}>
  <Card title="Points d’entrée" icon="door-open" href="/fr/plugins/sdk-entrypoints">
    Options `definePluginEntry` et `defineChannelPluginEntry`.
  </Card>
  <Card title="Assistants d’exécution" icon="gears" href="/fr/plugins/sdk-runtime">
    Référence complète de l’espace de noms `api.runtime`.
  </Card>
  <Card title="Configuration et paramétrage" icon="sliders" href="/fr/plugins/sdk-setup">
    Empaquetage, manifestes et schémas de configuration.
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
