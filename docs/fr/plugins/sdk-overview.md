---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK importer
    - Vous souhaitez disposer d’une référence pour toutes les méthodes d’enregistrement d’OpenClawPluginApi
    - Vous recherchez un export spécifique du SDK
sidebarTitle: Plugin SDK overview
summary: Carte d’importation, référence de l’API d’enregistrement et architecture du SDK
title: Présentation du SDK Plugin
x-i18n:
    generated_at: "2026-05-02T07:15:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5fa531e603fb6d87f84e3193ebd61be1431b57b8f284871ae15f34ca93fc69
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Le SDK de plugins est le contrat typé entre les plugins et le noyau. Cette page sert de
référence pour **ce qu’il faut importer** et **ce que vous pouvez enregistrer**.

<Note>
  Cette page s’adresse aux auteurs de plugins qui utilisent `openclaw/plugin-sdk/*` dans
  OpenClaw. Pour les applications externes, scripts, tableaux de bord, tâches CI et extensions IDE
  qui veulent exécuter des agents via le Gateway, utilisez plutôt le
  [SDK d’application OpenClaw](/fr/concepts/openclaw-sdk) et le package `@openclaw/sdk`.
</Note>

<Tip>
Vous cherchez plutôt un guide pratique ? Commencez par [Créer des plugins](/fr/plugins/building-plugins), utilisez [Plugins de canal](/fr/plugins/sdk-channel-plugins) pour les plugins de canal, [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) pour les plugins de fournisseur, et [Hooks de Plugin](/fr/plugins/hooks) pour les plugins de hook d’outil ou de cycle de vie.
</Tip>

## Convention d’importation

Importez toujours depuis un sous-chemin précis :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela accélère le démarrage et
évite les problèmes de dépendances circulaires. Pour les assistants d’entrée/de build
propres aux canaux, préférez `openclaw/plugin-sdk/channel-core`; réservez
`openclaw/plugin-sdk/core` à la surface d’ensemble plus large et aux assistants
partagés comme `buildChannelConfigSchema`.

Pour la configuration de canal, publiez le schéma JSON détenu par le canal via
`openclaw.plugin.json#channelConfigs`. Le sous-chemin `plugin-sdk/channel-config-schema`
est destiné aux primitives de schéma partagées et au générateur générique. Les
plugins fournis avec OpenClaw utilisent `plugin-sdk/bundled-channel-config-schema` pour conserver
les schémas des canaux fournis. Les exports de compatibilité obsolètes restent sur
`plugin-sdk/channel-config-schema-legacy`; aucun des sous-chemins de schéma fourni
n’est un modèle pour les nouveaux plugins.

<Warning>
  N’importez pas de raccords pratiques marqués par un fournisseur ou un canal (par exemple
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Les plugins fournis composent les sous-chemins génériques du SDK dans leurs propres barrels
  `api.ts` / `runtime-api.ts`; les consommateurs du noyau doivent soit utiliser ces barrels locaux au plugin,
  soit ajouter un contrat SDK générique étroit lorsqu’un besoin est réellement
  transversal aux canaux.

Un petit ensemble de raccords d’assistance pour plugins fournis apparaît encore dans la carte
d’exports générée lorsqu’ils ont un usage propriétaire suivi. Ils existent uniquement pour la
maintenance des plugins fournis et ne sont pas des chemins d’importation recommandés pour les nouveaux
plugins tiers.

`openclaw/plugin-sdk/discord` et `openclaw/plugin-sdk/telegram-account` sont
également conservés comme façades de compatibilité obsolètes pour des usages propriétaires suivis. Ne
copiez pas ces chemins d’importation dans de nouveaux plugins ; utilisez plutôt les assistants runtime injectés et
les sous-chemins SDK de canal génériques.
</Warning>

## Référence des sous-chemins

Le SDK de plugins est exposé sous forme d’un ensemble de sous-chemins étroits regroupés par domaine (entrée de plugin,
canal, fournisseur, authentification, runtime, capacité, mémoire et assistants réservés
aux plugins fournis). Pour le catalogue complet, regroupé et lié, consultez
[Sous-chemins du SDK de Plugin](/fr/plugins/sdk-subpaths).

La liste générée de plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json`.

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
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription en temps réel en streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales temps réel duplex    |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse d’image/audio/vidéo           |
| `api.registerImageGenerationProvider(...)`       | Génération d’images                   |
| `api.registerMusicGenerationProvider(...)`       | Génération de musique                 |
| `api.registerVideoGenerationProvider(...)`       | Génération de vidéo                   |
| `api.registerWebFetchProvider(...)`              | Fournisseur de récupération / scraping web |
| `api.registerWebSearchProvider(...)`             | Recherche web                         |

### Outils et commandes

| Méthode                         | Ce qu’elle enregistre                          |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Outil d’agent (obligatoire ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)      |

Les commandes de plugin peuvent définir `agentPromptGuidance` lorsque l’agent a besoin d’un court
indice de routage détenu par la commande. Gardez ce texte centré sur la commande elle-même ; n’ajoutez pas
de politique propre à un fournisseur ou à un plugin aux générateurs de prompts du noyau.

### Infrastructure

| Méthode                                        | Ce qu’elle enregistre                    |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook d’événement                        |
| `api.registerHttpRoute(params)`                | Point de terminaison HTTP du Gateway    |
| `api.registerGatewayMethod(name, handler)`     | Méthode RPC du Gateway                  |
| `api.registerGatewayDiscoveryService(service)` | Annonceur de découverte du Gateway local |
| `api.registerCli(registrar, opts?)`            | Sous-commande CLI                       |
| `api.registerService(service)`                 | Service en arrière-plan                 |
| `api.registerInteractiveHandler(registration)` | Gestionnaire interactif                 |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime de résultat d’outil  |
| `api.registerMemoryPromptSupplement(builder)`  | Section de prompt additive adjacente à la mémoire |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additif de recherche/lecture mémoire |

### Hooks hôte pour les plugins de workflow

Les hooks hôte sont les raccords SDK pour les plugins qui doivent participer au cycle de vie
de l’hôte au lieu de simplement ajouter un fournisseur, un canal ou un outil. Ce sont des
contrats génériques ; le mode Plan peut les utiliser, tout comme les workflows d’approbation,
les garde-fous de politique d’espace de travail, les moniteurs en arrière-plan, les assistants de configuration et les plugins compagnons d’UI.

| Méthode                                                                  | Contrat qu’elle détient                                                                                                            |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | État de session détenu par le plugin, compatible JSON, projeté via les sessions Gateway                                            |
| `api.enqueueNextTurnInjection(...)`                                      | Contexte durable exactement une fois injecté dans le prochain tour d’agent pour une session                                        |
| `api.registerTrustedToolPolicy(...)`                                     | Politique d’outil pré-plugin fournie/de confiance pouvant bloquer ou réécrire les paramètres d’outil                              |
| `api.registerToolMetadata(...)`                                          | Métadonnées d’affichage du catalogue d’outils sans modifier l’implémentation de l’outil                                            |
| `api.registerCommand(...)`                                               | Commandes de plugin limitées ; les résultats de commande peuvent définir `continueAgent: true` ; les commandes natives Discord prennent en charge `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Descripteurs de contribution Control UI pour les surfaces de session, d’outil, d’exécution ou de paramètres                       |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacks de nettoyage des ressources runtime détenues par le plugin sur les chemins de réinitialisation/suppression/rechargement |
| `api.registerAgentEventSubscription(...)`                                | Abonnements aux événements assainis pour l’état et les moniteurs de workflow                                                       |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | État de travail par exécution du plugin, effacé lors du cycle de vie terminal de l’exécution                                      |
| `api.registerSessionSchedulerJob(...)`                                   | Enregistrements de tâches de planificateur de session détenus par le plugin avec nettoyage déterministe                           |

Les contrats répartissent volontairement l’autorité :

- Les plugins externes peuvent détenir les extensions de session, les descripteurs d’UI, les commandes, les
  métadonnées d’outil, les injections au tour suivant et les hooks normaux.
- Les politiques d’outils de confiance s’exécutent avant les hooks ordinaires `before_tool_call` et sont
  réservées aux plugins fournis, car elles participent à la politique de sécurité de l’hôte.
- La propriété des commandes réservées est réservée aux plugins fournis. Les plugins externes doivent utiliser leurs
  propres noms de commande ou alias.
- `allowPromptInjection=false` désactive les hooks qui modifient le prompt, notamment
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  les champs de prompt de l’ancien `before_agent_start`, et
  `enqueueNextTurnInjection`.

Exemples de consommateurs hors Plan :

| Archétype de plugin          | Hooks utilisés                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow d’approbation       | Extension de session, continuation de commande, injection au tour suivant, descripteur d’UI                                           |
| Garde-fou de budget/espace de travail | Politique d’outil de confiance, métadonnées d’outil, projection de session                                                            |
| Moniteur de cycle de vie en arrière-plan | Nettoyage du cycle de vie runtime, abonnement aux événements d’agent, propriété/nettoyage du planificateur de session, contribution au prompt heartbeat, descripteur d’UI |
| Assistant de configuration ou d’onboarding | Extension de session, commandes limitées, descripteur Control UI                                                                      |

<Note>
  Les espaces de noms d’administration du noyau réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restent toujours `operator.admin`, même si un plugin tente d’attribuer une
  portée de méthode gateway plus étroite. Préférez des préfixes propres au plugin pour les
  méthodes détenues par le plugin.
</Note>

<Accordion title="Quand utiliser le middleware de résultat d’outil">
  Les plugins fournis peuvent utiliser `api.registerAgentToolResultMiddleware(...)` lorsqu’ils
  doivent réécrire un résultat d’outil après l’exécution et avant que le runtime
  ne renvoie ce résultat au modèle. C’est le raccord de confiance neutre vis-à-vis du runtime
  pour les réducteurs de sortie asynchrones comme tokenjuice.

Les plugins fournis doivent déclarer `contracts.agentToolResultMiddleware` pour chaque
runtime ciblé, par exemple `["pi", "codex"]`. Les plugins externes
ne peuvent pas enregistrer ce middleware ; gardez les hooks de plugin OpenClaw normaux pour le travail
qui n’a pas besoin d’un timing de résultat d’outil avant modèle. L’ancien chemin d’enregistrement de fabrique
d’extension intégrée propre à Pi a été supprimé.
</Accordion>

### Enregistrement de la découverte Gateway

`api.registerGatewayDiscoveryService(...)` permet à un plugin d’annoncer le Gateway actif
sur un transport de découverte local tel que mDNS/Bonjour. OpenClaw appelle le
service au démarrage du Gateway lorsque la découverte locale est activée, transmet les
ports actuels du Gateway et des données d’indice TXT non secrètes, puis appelle le
gestionnaire `stop` retourné lors de l’arrêt du Gateway.

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

Les plugins de découverte du Gateway ne doivent pas traiter les valeurs TXT annoncées comme des secrets ni comme
une authentification. La découverte est un indice de routage ; l’authentification du Gateway et l’épinglage TLS
restent responsables de la confiance.

### Métadonnées d’enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de premier niveau :

- `commands` : racines de commande explicites détenues par le registrar
- `descriptors` : descripteurs de commande au moment de l’analyse utilisés pour l’aide CLI racine,
  le routage et l’enregistrement CLI paresseux des plugins

Si vous voulez qu’une commande de plugin reste chargée paresseusement dans le chemin CLI racine normal,
fournissez des `descriptors` qui couvrent chaque racine de commande de premier niveau exposée par ce
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

Utilisez `commands` seul uniquement lorsque vous n’avez pas besoin de l’enregistrement CLI racine paresseux.
Ce chemin de compatibilité impatient reste pris en charge, mais il n’installe pas de
placeholders adossés à des descripteurs pour le chargement paresseux au moment de l’analyse.

### Enregistrement du backend CLI

`api.registerCliBackend(...)` permet à un plugin de détenir la configuration par défaut d’un backend CLI
d’IA local tel que `codex-cli`.

- L’`id` du backend devient le préfixe de fournisseur dans les références de modèle comme `codex-cli/gpt-5`.
- La `config` du backend utilise la même forme que `agents.defaults.cliBackends.<id>`.
- La configuration utilisateur reste prioritaire. OpenClaw fusionne `agents.defaults.cliBackends.<id>` par-dessus la
  valeur par défaut du plugin avant d’exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu’un backend a besoin de réécritures de compatibilité après la fusion
  (par exemple pour normaliser d’anciennes formes de flags).

### Emplacements exclusifs

| Méthode                                    | Ce qu’elle enregistre                                                                                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un seul actif à la fois). Le callback `assemble()` reçoit `availableTools` et `citationsMode` afin que le moteur puisse adapter les ajouts au prompt. |
| `api.registerMemoryCapability(capability)` | Capacité de mémoire unifiée                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | Constructeur de section de prompt de mémoire                                                                                                                    |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de vidage de mémoire                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur runtime de mémoire                                                                                                                                   |

### Adaptateurs d’embedding de mémoire

| Méthode                                        | Ce qu’elle enregistre                              |
| ---------------------------------------------- | -------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’embedding de mémoire pour le plugin actif |

- `registerMemoryCapability` est l’API exclusive de plugin de mémoire préférée.
- `registerMemoryCapability` peut aussi exposer `publicArtifacts.listArtifacts(...)`
  afin que les plugins compagnons puissent consommer des artefacts de mémoire exportés via
  `openclaw/plugin-sdk/memory-host-core` au lieu d’accéder à la disposition privée d’un
  plugin de mémoire spécifique.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont des API exclusives de plugin de mémoire compatibles avec l’héritage.
- `MemoryFlushPlan.model` peut épingler le tour de vidage à une référence exacte `provider/model`,
  telle que `ollama/qwen3:8b`, sans hériter de la chaîne de repli active.
- `registerMemoryEmbeddingProvider` permet au plugin de mémoire actif d’enregistrer un
  ou plusieurs identifiants d’adaptateur d’embedding (par exemple `openai`, `gemini` ou un identifiant
  personnalisé défini par le plugin).
- La configuration utilisateur telle que `agents.defaults.memorySearch.provider` et
  `agents.defaults.memorySearch.fallback` se résout par rapport à ces identifiants
  d’adaptateur enregistrés.

### Événements et cycle de vie

| Méthode                                      | Ce qu’elle fait                 |
| -------------------------------------------- | ------------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé       |
| `api.onConversationBindingResolved(handler)` | Callback de liaison de conversation |

Consultez [Hooks de plugin](/fr/plugins/hooks) pour des exemples, des noms de hooks courants et la
sémantique de garde.

### Sémantique de décision des hooks

- `before_tool_call` : retourner `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : retourner `{ block: false }` est traité comme une absence de décision (comme omettre `block`), et non comme un remplacement.
- `before_install` : retourner `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : retourner `{ block: false }` est traité comme une absence de décision (comme omettre `block`), et non comme un remplacement.
- `reply_dispatch` : retourner `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire revendique l’expédition, les gestionnaires de priorité inférieure et le chemin d’expédition par défaut du modèle sont ignorés.
- `message_sending` : retourner `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : retourner `{ cancel: false }` est traité comme une absence de décision (comme omettre `cancel`), et non comme un remplacement.
- `message_received` : utilisez le champ typé `threadId` lorsque vous avez besoin du routage de thread/sujet entrant. Réservez `metadata` aux extras propres au canal.
- `message_sending` : utilisez les champs de routage typés `replyToId` / `threadId` avant de vous rabattre sur les `metadata` propres au canal.
- `gateway_start` : utilisez `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour l’état de démarrage détenu par le Gateway au lieu de dépendre des hooks internes `gateway:startup`.
- `cron_changed` : observez les changements du cycle de vie Cron détenus par le Gateway. Utilisez `event.job?.state?.nextRunAtMs` et `ctx.getCron?.()` lors de la synchronisation de planificateurs de réveil externes, et conservez OpenClaw comme source de vérité pour les vérifications d’échéance et l’exécution.

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identifiant du plugin                                                                       |
| `api.name`               | `string`                  | Nom d’affichage                                                                             |
| `api.version`            | `string?`                 | Version du plugin (facultatif)                                                              |
| `api.description`        | `string?`                 | Description du plugin (facultatif)                                                          |
| `api.source`             | `string`                  | Chemin source du plugin                                                                      |
| `api.rootDir`            | `string?`                 | Répertoire racine du plugin (facultatif)                                                     |
| `api.config`             | `OpenClawConfig`          | Instantané de configuration actuel (instantané runtime en mémoire actif lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration propre au plugin depuis `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Assistants runtime](/fr/plugins/sdk-runtime)                                                   |
| `api.logger`             | `PluginLogger`            | Journaliseur limité au périmètre (`debug`, `info`, `warn`, `error`)                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résout un chemin relatif à la racine du plugin                                               |

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
  depuis le code de production. Faites passer les imports internes par `./api.ts` ou
  `./runtime-api.ts`. Le chemin SDK est uniquement le contrat externe.
</Warning>

Les surfaces publiques des plugins groupés chargées par façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` et fichiers d’entrée publics similaires) préfèrent l’
instantané de configuration runtime actif lorsqu’OpenClaw est déjà en cours d’exécution. Si aucun instantané runtime
n’existe encore, elles se rabattent sur le fichier de configuration résolu sur disque.
Les façades de plugins groupés empaquetés doivent être chargées via les chargeurs de façade de plugin
d’OpenClaw ; les imports directs depuis `dist/extensions/...` contournent les vérifications de manifeste
et de sidecar runtime que les installations empaquetées utilisent pour le code détenu par les plugins.

Les plugins de fournisseur peuvent exposer un barrel de contrat étroit, local au plugin, lorsqu’un
assistant est intentionnellement propre au fournisseur et n’a pas encore sa place dans un sous-chemin SDK générique.
Exemples groupés :

- **Anthropic** : jointure publique `api.ts` / `contract-api.ts` pour les assistants Claude
  beta-header et de flux `service_tier`.
- **`@openclaw/openai-provider`** : `api.ts` exporte des constructeurs de fournisseur,
  des assistants de modèle par défaut et des constructeurs de fournisseur realtime.
- **`@openclaw/openrouter-provider`** : `api.ts` exporte le constructeur de fournisseur
  ainsi que les assistants d’onboarding/configuration.

<Warning>
  Le code de production des extensions doit aussi éviter les imports `openclaw/plugin-sdk/<other-plugin>`.
  Si un assistant est réellement partagé, promouvez-le vers un sous-chemin SDK neutre
  tel que `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou une autre
  surface orientée capacité au lieu de coupler deux plugins ensemble.
</Warning>

## Associé

<CardGroup cols={2}>
  <Card title="Points d’entrée" icon="door-open" href="/fr/plugins/sdk-entrypoints">
    Options de `definePluginEntry` et `defineChannelPluginEntry`.
  </Card>
  <Card title="Assistants d’exécution" icon="gears" href="/fr/plugins/sdk-runtime">
    Référence complète de l’espace de noms `api.runtime`.
  </Card>
  <Card title="Installation et configuration" icon="sliders" href="/fr/plugins/sdk-setup">
    Packaging, manifestes et schémas de configuration.
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
